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

// Helper function to shuffle options and track correct answer
const shuffleOptions = (question) => {
  const options = [
    { text: question.option_a, isCorrect: true },
    { text: question.option_b, isCorrect: false },
    { text: question.option_c, isCorrect: false },
    { text: question.option_d, isCorrect: false }
  ];

  const shuffledOptions = shuffleArray(options);
  
  // Find which position the correct answer is in after shuffle
  const correctIndex = shuffledOptions.findIndex(option => option.isCorrect);

  return {
    id: question.id,
    word_id: question.word_id,
    paragraph: question.paragraph,
    question_text: question.question_text,
    options: shuffledOptions.map(option => option.text),
    correct_answer_index: correctIndex,
    created_at: question.created_at,
    updated_at: question.updated_at
  };
};

// Get random questions for general quiz
const getRandomQuestions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get random questions from Supabase
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .order('id', { ascending: false }) // This will be randomized better later
      .limit(parseInt(limit));

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
        message: 'No questions available in the database' 
      });
    }

    // Shuffle the questions array and shuffle options for each question
    const shuffledQuestions = shuffleArray(questions);
    const processedQuestions = shuffledQuestions.map(shuffleOptions);

    res.json({
      success: true,
      count: processedQuestions.length,
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

// Check answer for a specific question
const checkAnswer = async (req, res) => {
  try {
    const { questionId, selectedIndex } = req.body;

    if (!questionId || selectedIndex === undefined) {
      return res.status(400).json({ 
        error: 'Missing data',
        message: 'Question ID and selected answer index are required' 
      });
    }

    // Get the original question to verify correct answer
    const { data: question, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error || !question) {
      return res.status(404).json({ 
        error: 'Question not found',
        message: 'The specified question could not be found' 
      });
    }

    // Process the question to get the shuffled version
    const processedQuestion = shuffleOptions(question);
    const isCorrect = selectedIndex === processedQuestion.correct_answer_index;

    res.json({
      success: true,
      isCorrect,
      correctAnswerIndex: processedQuestion.correct_answer_index,
      correctAnswerText: processedQuestion.options[processedQuestion.correct_answer_index]
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
  checkAnswer
};