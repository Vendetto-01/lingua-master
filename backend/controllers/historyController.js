// backend/controllers/historyController.js (UPDATED for words table)
const supabase = require('../config/supabase');

// Helper function to get the text of a specific option (A, B, C, D)
const getOptionText = (word, letter) => {
  if (!word || !letter) return null;
  switch (letter.toUpperCase()) {
    case 'A': return word.option_a;
    case 'B': return word.option_b;
    case 'C': return word.option_c;
    case 'D': return word.option_d;
    default: return null;
  }
};

// Helper function to generate question text for history display
const generateHistoryQuestionText = (word, partOfSpeech, exampleSentence) => {
  if (!word || !exampleSentence) return 'Question text unavailable';
  
  const highlightedSentence = exampleSentence.replace(
    new RegExp(`\\b${word}\\b`, 'gi'), 
    `**${word}**`
  );
  
  return `In the sentence: "${highlightedSentence}" - What does the word "${word}" (${partOfSpeech || 'unknown'}) mean?`;
};

const getLearningHistory = async (req, res) => {
  const { user_id } = req.user;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sortBy = req.query.sortBy || 'date_desc';
  const offset = (page - 1) * limit;

  try {
    // UPDATED: Join with words table instead of questions table
    let query = supabase
      .from('user_Youtubes') // Consider renaming this table to 'user_answers'
      .select(`
        id,
        selected_original_letter,
        is_correct,
        answered_at:created_at, 
        words!user_Youtubes_question_id_fkey (
          id,
          word,
          part_of_speech,
          definition,
          difficulty_level,
          example_sentence,
          option_a,
          option_b,
          option_c,
          option_d
        )
      `)
      .eq('user_id', user_id);

    // Sorting
    if (sortBy === 'date_asc') {
      query = query.order('created_at', { ascending: true });
    } else if (sortBy === 'correctness_desc') {
      query = query.order('is_correct', { ascending: false }).order('created_at', { ascending: false });
    } else if (sortBy === 'correctness_asc') {
      query = query.order('is_correct', { ascending: true }).order('created_at', { ascending: false });
    } else { // date_desc (default)
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: historyData, error, count } = await query;

    if (error) {
      console.error('Error fetching learning history:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch learning history', 
        details: error.message 
      });
    }

    if (!historyData) {
      return res.status(404).json({ 
        success: true, 
        message: 'No learning history found for this user.', 
        data: [], 
        totalItems: 0, 
        totalPages: 0, 
        currentPage: page 
      });
    }

    const formattedHistory = historyData.map(item => {
      if (!item.words) {
        console.warn(`Learning history item (id: ${item.id}) is missing word details. Skipping.`);
        return null;
      }

      const wordDetails = item.words;
      const selectedOptionText = getOptionText(wordDetails, item.selected_original_letter);
      const correctOptionText = wordDetails.option_a; // In words table, option_a is always correct
      
      // Generate the question text dynamically
      const questionText = generateHistoryQuestionText(
        wordDetails.word, 
        wordDetails.part_of_speech, 
        wordDetails.example_sentence
      );

      return {
        history_id: item.id,
        question_id: wordDetails.id, // This is actually word_id
        word_id: wordDetails.id, // NEW: Explicit word_id
        word: wordDetails.word, // NEW: The actual word
        part_of_speech: wordDetails.part_of_speech, // NEW: Part of speech
        definition: wordDetails.definition, // NEW: Word definition
        difficulty_level: wordDetails.difficulty_level, // NEW: CEFR level
        example_sentence: wordDetails.example_sentence, // NEW: Context sentence
        question_text: questionText, // Generated dynamically
        selected_option_letter: item.selected_original_letter,
        selected_option_text: selectedOptionText,
        is_correct: item.is_correct,
        correct_option_letter: 'A', // Always A in words table
        correct_option_text: correctOptionText,
        explanation: `"${wordDetails.word}" (${wordDetails.part_of_speech}): ${wordDetails.definition}`, // Enhanced explanation
        answered_at: item.answered_at,
      };
    }).filter(item => item !== null);

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('user_Youtubes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id);
      
    res.status(200).json({
      success: true,
      data: formattedHistory,
      pagination: {
        totalItems: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        currentPage: page,
        pageSize: limit
      },
      metadata: {
        schema_version: 'words_v2',
        includes_word_details: true,
        dynamic_question_generation: true
      }
    });

  } catch (error) {
    console.error('Server error in getLearningHistory:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An unexpected server error occurred.', 
      details: error.message 
    });
  }
};

module.exports = {
  getLearningHistory,
};