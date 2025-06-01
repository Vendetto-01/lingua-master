const supabase = require('../config/supabase');

// Helper function to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to get correct answer text from question object
const getCorrectAnswerText = (question) => {
  switch(question.correct_answer) {
    case 'A': return question.option_a;
    case 'B': return question.option_b;
    case 'C': return question.option_c;
    case 'D': return question.option_d;
    default: throw new Error(`Invalid correct_answer: ${question.correct_answer}`);
  }
};

// Helper function to convert correct_answer letter to index (for frontend compatibility)
const getCorrectAnswerIndex = (question, shuffledOptions) => {
  const correctText = getCorrectAnswerText(question);
  return shuffledOptions.findIndex(option => option.text === correctText);
};

// Helper function to shuffle options and track correct answer
const shuffleOptions = (question) => {
  const options = [
    { text: question.option_a, letter: 'A' },
    { text: question.option_b, letter: 'B' },
    { text: question.option_c, letter: 'C' },
    { text: question.option_d, letter: 'D' }
  ];

  const shuffledOptions = shuffleArray(options);
  
  // Find which position the correct answer is in after shuffle
  const correctAnswerText = getCorrectAnswerText(question);
  const correctIndex = shuffledOptions.findIndex(option => option.text === correctAnswerText);

  return {
    id: question.id,
    word_id: question.word_id,
    paragraph: question.paragraph,
    question_text: question.question_text,
    options: shuffledOptions.map(option => option.text),
    correct_answer_index: correctIndex,
    correct_answer_letter: question.correct_answer, // Keep original letter for backend reference
    explanation: question.explanation, // 🆕 NEW: Add explanation
    difficulty: question.difficulty,
    created_at: question.created_at,
    updated_at: question.updated_at
  };
};

// Get random questions for general quiz or by difficulty
const getRandomQuestions = async (req, res) => {
  try {
    const { limit = 10, difficulty } = req.query;
    
    // Build query with filters - 🆕 IMPORTANT: Include correct_answer and explanation
    let query = supabase
      .from('questions')
      .select(`
        id, word_id, paragraph, question_text,
        option_a, option_b, option_c, option_d,
        correct_answer, explanation,
        difficulty, is_active, created_at, updated_at
      `)
      .eq('is_active', true); // Only get active questions
    
    // Add difficulty filter if specified
    if (difficulty && difficulty !== 'mixed') {
      query = query.eq('difficulty', difficulty);
    }
    
    // Add random ordering and limit
    query = query
      .order('id', { ascending: false }) // This will be improved with true randomization
      .limit(parseInt(limit));

    const { data: questions, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to fetch questions from database' 
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({ 
        error: 'No questions found',
        message: `No ${difficulty ? difficulty + ' difficulty' : ''} questions available in the database` 
      });
    }

    // 🔍 VALIDATION: Check if questions have correct_answer field
    const invalidQuestions = questions.filter(q => !q.correct_answer || !['A', 'B', 'C', 'D'].includes(q.correct_answer));
    if (invalidQuestions.length > 0) {
      console.error('Invalid questions found:', invalidQuestions.map(q => ({ id: q.id, correct_answer: q.correct_answer })));
      return res.status(500).json({
        error: 'Data integrity error',
        message: 'Some questions have invalid correct_answer values'
      });
    }

    // Shuffle the questions array and shuffle options for each question
    const shuffledQuestions = shuffleArray(questions);
    const processedQuestions = shuffledQuestions.map(shuffleOptions);

    res.json({
      success: true,
      count: processedQuestions.length,
      difficulty: difficulty || 'mixed',
      questions: processedQuestions
    });

  } catch (error) {
    console.error('Get random questions error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An unexpected error occurred while fetching questions' 
    });
  }
};

// Get available difficulty levels
const getDifficultyLevels = async (req, res) => {
  try {
    const { data: difficulties, error } = await supabase
      .from('questions')
      .select('difficulty')
      .eq('is_active', true)
      .not('difficulty', 'is', null);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to fetch difficulty levels' 
      });
    }

    // Get unique difficulty levels and count questions for each
    const uniqueDifficulties = [...new Set(difficulties.map(d => d.difficulty))];
    
    const difficultyStats = await Promise.all(
      uniqueDifficulties.map(async (difficulty) => {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('difficulty', difficulty);
        
        return {
          level: difficulty,
          count: count || 0
        };
      })
    );

    res.json({
      success: true,
      difficulties: difficultyStats
    });

  } catch (error) {
    console.error('Get difficulty levels error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An unexpected error occurred while fetching difficulty levels' 
    });
  }
};

// Check answer for a specific question - 🚨 MAJOR UPDATE REQUIRED
const checkAnswer = async (req, res) => {
  try {
    const { questionId, selectedIndex } = req.body;

    if (!questionId || selectedIndex === undefined) {
      return res.status(400).json({ 
        error: 'Missing data',
        message: 'Question ID and selected answer index are required' 
      });
    }

    // Get the original question to verify correct answer - 🆕 Include correct_answer and explanation
    const { data: question, error } = await supabase
      .from('questions')
      .select(`
        id, word_id, paragraph, question_text,
        option_a, option_b, option_c, option_d,
        correct_answer, explanation,
        difficulty, is_active, created_at, updated_at
      `)
      .eq('id', questionId)
      .eq('is_active', true) // Only check active questions
      .single();

    if (error || !question) {
      return res.status(404).json({ 
        error: 'Question not found',
        message: 'The specified question could not be found or is not active' 
      });
    }

    // 🔍 VALIDATION: Check if question has valid correct_answer
    if (!question.correct_answer || !['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
      console.error('Invalid question correct_answer:', { id: question.id, correct_answer: question.correct_answer });
      return res.status(500).json({
        error: 'Data integrity error',
        message: 'Question has invalid correct_answer value'
      });
    }

    // Process the question to get the shuffled version (same logic as when serving questions)
    const processedQuestion = shuffleOptions(question);
    
    // Check if the selected index matches the correct answer index
    const isCorrect = selectedIndex === processedQuestion.correct_answer_index;
    
    // Get the text of the correct answer
    const correctAnswerText = getCorrectAnswerText(question);

    res.json({
      success: true,
      isCorrect,
      correctAnswerIndex: processedQuestion.correct_answer_index,
      correctAnswerText,
      correctAnswerLetter: question.correct_answer, // 🆕 NEW: Original letter
      explanation: question.explanation, // 🆕 NEW: Explanation if available
      difficulty: question.difficulty
    });

  } catch (error) {
    console.error('Check answer error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An unexpected error occurred while checking the answer' 
    });
  }
};

module.exports = {
  getRandomQuestions,
  getDifficultyLevels,
  checkAnswer
};