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
    // NOTE: Foreign key ilişkisini kontrol etmek için önce test sorgusu yapıyoruz
    let query = supabase
      .from('user_Youtubes')
      .select(`
        id,
        selected_original_letter,
        is_correct,
        answered_at:created_at,
        question_id,
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
      
      // If join failed, might be foreign key issue - try fallback query
      if (error.message && error.message.includes('foreign key')) {
        console.warn('Foreign key join failed, trying manual join...');
        
        // Fallback: Manual join by getting user answers first, then words separately
        const { data: userAnswers, error: answersError } = await supabase
          .from('user_Youtubes')
          .select('id, selected_original_letter, is_correct, created_at, question_id')
          .eq('user_id', user_id)
          .order('created_at', { ascending: sortBy === 'date_asc' })
          .range(offset, offset + limit - 1);

        if (answersError) {
          throw answersError;
        }

        if (!userAnswers || userAnswers.length === 0) {
          return res.status(200).json({
            success: true,
            message: 'No learning history found for this user.',
            data: [],
            pagination: { totalItems: 0, totalPages: 0, currentPage: page, pageSize: limit }
          });
        }

        // Get word details for each answer
        const wordIds = userAnswers.map(answer => answer.question_id).filter(id => id);
        const { data: wordsData, error: wordsError } = await supabase
          .from('words')
          .select('id, word, part_of_speech, definition, difficulty_level, example_sentence, option_a, option_b, option_c, option_d')
          .in('id', wordIds);

        if (wordsError) {
          throw wordsError;
        }

        // Combine data manually
        const combinedData = userAnswers.map(answer => {
          const wordData = wordsData.find(word => word.id === answer.question_id);
          return {
            ...answer,
            answered_at: answer.created_at,
            words: wordData || null
          };
        });

        // Process the manually joined data
        return processHistoryData(combinedData, user_id, page, limit, res);
      }
      
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch learning history', 
        details: error.message 
      });
    }

    return processHistoryData(historyData, user_id, page, limit, res);

  } catch (error) {
    console.error('Server error in getLearningHistory:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An unexpected server error occurred.', 
      details: error.message 
    });
  }
};

// Helper function to process history data
const processHistoryData = async (historyData, user_id, page, limit, res) => {
  if (!historyData || historyData.length === 0) {
    return res.status(200).json({ 
      success: true, 
      message: 'No learning history found for this user.', 
      data: [], 
      pagination: { totalItems: 0, totalPages: 0, currentPage: page, pageSize: limit }
    });
  }

  const formattedHistory = historyData.map(item => {
    if (!item.words) {
      console.warn(`Learning history item (id: ${item.id}) is missing word details. Question ID: ${item.question_id}`);
      return {
        history_id: item.id,
        question_id: item.question_id,
        word_id: item.question_id,
        word: 'Unknown word',
        part_of_speech: 'unknown',
        definition: 'Word details not available',
        difficulty_level: 'unknown',
        example_sentence: 'Example not available',
        question_text: 'Question text unavailable due to missing word data',
        selected_option_letter: item.selected_original_letter,
      selected_option_text: selectedOptionText,
      is_correct: item.is_correct,
      correct_option_letter: 'A', // Always A in words table
      correct_option_text: correctOptionText,
      explanation: `"${wordDetails.word}" (${wordDetails.part_of_speech}): ${wordDetails.definition}`,
      answered_at: item.answered_at,
      data_status: 'complete'
    };
  }).filter(item => item !== null);

  // Get total count for pagination
  const { count: totalCount, error: countError } = await supabase
    .from('user_Youtubes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user_id);

  if (countError) {
    console.warn('Error getting total count:', countError);
  }
    
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
      dynamic_question_generation: true,
      complete_records: formattedHistory.filter(item => item.data_status === 'complete').length,
      incomplete_records: formattedHistory.filter(item => item.data_status === 'incomplete').length
    }
  });
};

module.exports = {
  getLearningHistory,
};d_original_letter,
        selected_option_text: 'Option text unavailable',
        is_correct: item.is_correct,
        correct_option_letter: 'A',
        correct_option_text: 'Correct answer unavailable',
        explanation: 'Explanation unavailable - word data missing',
        answered_at: item.answered_at,
        data_status: 'incomplete'
      };
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
      question_id: wordDetails.id,
      word_id: wordDetails.id, // Explicit word_id
      word: wordDetails.word,
      part_of_speech: wordDetails.part_of_speech,
      definition: wordDetails.definition,
      difficulty_level: wordDetails.difficulty_level,
      example_sentence: wordDetails.example_sentence,
      question_text: questionText,
      selected_option_letter: item.selecte