// backend/controllers/wordsController.js (FIXED - Clean Question Generation)
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

// UPDATED: Generate clean question text - no example sentence, no part of speech
const generateQuestionText = (word) => {
  return `What does the word "${word}" mean?`;
};

// Helper function to process words for frontend
const processWordForFrontend = (word) => {
  const options = [
    { text: word.option_a, originalLetter: 'A' }, // Always correct
    { text: word.option_b, originalLetter: 'B' },
    { text: word.option_c, originalLetter: 'C' },
    { text: word.option_d, originalLetter: 'D' }
  ];

  // Validate options
  options.forEach(opt => {
    if (opt.text === null || typeof opt.text === 'undefined') {
      console.warn(`Warning: Option ${opt.originalLetter} for word ID ${word.id} is null or undefined.`);
      opt.text = '';
    }
  });

  const shuffledOptions = shuffleArray(options);
  
  // Find correct answer index in shuffled array
  const correctAnswerIndex = shuffledOptions.findIndex(option => option.originalLetter === 'A');
  
  if (correctAnswerIndex === -1) {
    console.error(`Critical: Correct answer not found in shuffled options for word ID: ${word.id}`);
    return null;
  }

  // Generate CLEAN question text - just asks what the word means
  const questionText = generateQuestionText(word.word);

  return {
    id: word.id,
    word: word.word,
    part_of_speech: word.part_of_speech,
    definition: word.definition,
    difficulty_level: word.difficulty_level,
    example_sentence: word.example_sentence,
    question_text: questionText, // CLEAN: No example sentence, no part of speech
    paragraph: word.example_sentence, // Keep for backward compatibility
    options: shuffledOptions.map(opt => ({ text: opt.text, originalLetter: opt.originalLetter })),
    correct_answer_index_for_initial_display: correctAnswerIndex,
    correct_answer_letter_from_db: 'A', // Always A since option_a is always correct
    explanation: word.definition, // Use definition as explanation
    difficulty: word.difficulty_level,
    created_at: word.created_at,
    updated_at: word.updated_at
  };
};

// Get random words for quiz
const getRandomWords = async (req, res) => {
  try {
    const { limit = 10, difficulty } = req.query;

    let query = supabase
      .from('words')
      .select(`
        id, word, part_of_speech, definition, difficulty_level,
        example_sentence, option_a, option_b, option_c, option_d,
        created_at, updated_at
      `);

    // Filter by difficulty if specified
    if (difficulty && difficulty !== 'mixed') {
      // Map frontend difficulty names to database values
      const difficultyMap = {
        'beginner': ['A1', 'A2'],
        'intermediate': ['B1', 'B2'],
        'advanced': ['C1', 'C2']
      };
      
      if (difficultyMap[difficulty]) {
        query = query.in('difficulty_level', difficultyMap[difficulty]);
      } else {
        // If exact match, use it directly
        query = query.eq('difficulty_level', difficulty);
      }
    }

    const { data: allWords, error: fetchError } = await query;

    if (fetchError) {
      console.error('Database error (fetching words):', fetchError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch words from database'
      });
    }

    if (!allWords || allWords.length === 0) {
      return res.status(404).json({
        error: 'No words found',
        message: `No ${difficulty ? difficulty + ' difficulty' : ''} words available in the database`
      });
    }

    // Shuffle and limit
    const shuffledWords = shuffleArray(allWords);
    const wordsToServe = shuffledWords.slice(0, parseInt(limit));

    // Validate words
    const invalidWords = wordsToServe.filter(w => 
      !w.option_a || !w.word || !w.example_sentence || !w.definition
    );
    
    if (invalidWords.length > 0) {
      console.error('Invalid words found:', invalidWords.map(w => ({ id: w.id, word: w.word })));
    }

    // Process words for frontend
    const processedWords = wordsToServe
      .map(processWordForFrontend)
      .filter(w => w !== null);

    if (processedWords.length === 0 && wordsToServe.length > 0) {
      return res.status(500).json({
        error: 'Word processing error',
        message: 'All fetched words had issues during processing.'
      });
    }

    res.json({
      success: true,
      count: processedWords.length,
      difficulty: difficulty || 'mixed',
      questions: processedWords // Keep 'questions' key for frontend compatibility
    });

  } catch (error) {
    console.error('Get random words error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred while fetching words'
    });
  }
};

// Get available difficulty levels - UNCHANGED
const getDifficultyLevels = async (req, res) => {
  try {
    const { data: difficulties, error } = await supabase
      .from('words')
      .select('difficulty_level')
      .not('difficulty_level', 'is', null);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch difficulty levels'
      });
    }

    // Get unique difficulty levels and group them
    const uniqueDifficulties = [...new Set(difficulties.map(d => d.difficulty_level))];
    
    // Group CEFR levels into our categories
    const difficultyGroups = {
      'beginner': ['A1', 'A2'],
      'intermediate': ['B1', 'B2'], 
      'advanced': ['C1', 'C2']
    };

    const difficultyStats = await Promise.all(
      Object.entries(difficultyGroups).map(async ([groupName, levels]) => {
        const levelsInDb = levels.filter(level => uniqueDifficulties.includes(level));
        
        if (levelsInDb.length === 0) return null;
        
        const { count } = await supabase
          .from('words')
          .select('*', { count: 'exact', head: true })
          .in('difficulty_level', levelsInDb);

        return {
          level: groupName,
          count: count || 0,
          cefr_levels: levelsInDb
        };
      })
    );

    // Filter out null results
    const validStats = difficultyStats.filter(stat => stat && stat.count > 0);

    res.json({
      success: true,
      difficulties: validStats
    });

  } catch (error) {
    console.error('Get difficulty levels error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred while fetching difficulty levels'
    });
  }
};

// Check answer for a specific word - UNCHANGED
const checkAnswer = async (req, res) => {
  try {
    const { questionId, selectedOriginalLetter } = req.body;

    if (!questionId || !selectedOriginalLetter) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'Question ID and selected original letter are required'
      });
    }

    const { data: word, error } = await supabase
      .from('words')
      .select(`
        id, word, part_of_speech, definition, option_a, option_b, option_c, option_d,
        difficulty_level, example_sentence
      `)
      .eq('id', questionId)
      .single();

    if (error || !word) {
      return res.status(404).json({
        error: 'Word not found',
        message: 'The specified word could not be found'
      });
    }

    // In new system, option_a is always correct
    const isCorrect = selectedOriginalLetter === 'A';
    const correctAnswerText = word.option_a;

    if (!correctAnswerText) {
      return res.status(500).json({
        error: 'Data integrity error',
        message: 'Word has invalid correct answer in database'
      });
    }

    // Enhanced explanation including word info
    const enhancedExplanation = `"${word.word}" (${word.part_of_speech}): ${word.definition}`;

    res.json({
      success: true,
      isCorrect,
      correctOriginalLetter: 'A', // Always A in new system
      correctAnswerText,
      explanation: enhancedExplanation,
      difficulty: word.difficulty_level,
      word_info: {
        word: word.word,
        part_of_speech: word.part_of_speech,
        definition: word.definition,
        example_sentence: word.example_sentence
      }
    });

  } catch (error) {
    console.error('Check answer error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred while checking the answer'
    });
  }
};

// Delete a word
const deleteWord = async (req, res) => {
  try {
    const { wordId } = req.params;
    const userId = req.user?.id; // Assuming user ID is available from auth middleware

    if (!wordId) {
      return res.status(400).json({
        success: false,
        error: 'Missing data',
        message: 'Word ID is required'
      });
    }

    // Optional: Check if the user has permission to delete or if it's an admin action.
    // For now, we'll assume any authenticated user can trigger this if they selected the report option.
    // A more robust system might involve checking roles or if the user originally reported it for deletion.

    const { data, error } = await supabase
      .from('words')
      .delete()
      .match({ id: wordId });

    if (error) {
      console.error('Database error (deleting word):', error);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete word from database'
      });
    }

    // `data` might be an empty array if the delete was successful but nothing matched,
    // or an array of deleted items. Supabase delete doesn't always return the deleted items by default.
    // The `error` object being null is the primary indicator of success.
    // We can also check `count` if returned by Supabase, or assume success if no error.

    // Let's check if anything was actually deleted by trying to select it again (or rely on count if available)
    // For simplicity, if no error, assume deletion was processed.
    // If you need to confirm deletion, you might check the 'count' property if your Supabase client version returns it,
    // or if the 'data' array returned by delete has items.

    // If we want to be more precise about "not found" vs "deleted":
    // const { data: deletedItem, error: selectError } = await supabase.from('words').select('id').eq('id', wordId).single();
    // if (selectError && selectError.code === 'PGRST116') { // PostgREST code for "Not Found"
    //    // This means it was successfully deleted or never existed.
    // }

    // For now, if no error, we assume it's done.
    console.log(`Word with ID: ${wordId} delete request processed. User ID: ${userId || 'N/A'}`);
    res.json({
      success: true,
      message: `Word with ID ${wordId} has been deleted.`
    });

  } catch (error) {
    console.error('Delete word error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while deleting the word'
    });
  }
};

module.exports = {
  getRandomWords,
  getDifficultyLevels,
  checkAnswer,
  deleteWord // Added deleteWord
};