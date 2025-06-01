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
    default:
      // Eğer bir hata varsa veya bilinmeyen bir değerse, loglayıp null dönebiliriz.
      console.error(`Invalid correct_answer: ${question.correct_answer} for question ID: ${question.id}`);
      return null;
  }
};

// Helper function to process options for frontend
// Options are shuffled and include their original letter
const processOptionsForFrontend = (question) => {
  const options = [
    { text: question.option_a, originalLetter: 'A' },
    { text: question.option_b, originalLetter: 'B' },
    { text: question.option_c, originalLetter: 'C' },
    { text: question.option_d, originalLetter: 'D' }
  ];

  // Seçeneklerden herhangi biri null veya undefined ise hata logla veya varsayılan bir değer ata
  options.forEach(opt => {
    if (opt.text === null || typeof opt.text === 'undefined') {
      console.warn(`Warning: Option text for question ID ${question.id}, letter ${opt.originalLetter} is null or undefined. Setting to empty string.`);
      opt.text = ''; // Veya uygun bir varsayılan değer
    }
  });


  const shuffledFullOptions = shuffleArray(options);

  // Determine the text of the correct answer based on the 'correct_answer' field (A, B, C, D)
  const correctAnswerText = getCorrectAnswerText(question);
  if (correctAnswerText === null) {
      // Bu durum getCorrectAnswerText içinde zaten loglandı, burada ek bir işlem yapılabilir.
      // Örneğin, bu soruyu listeye dahil etmeyebilir veya bir hata durumu oluşturabilirsiniz.
      console.error(`Could not determine correct answer text for question ID: ${question.id}. Skipping this question or marking as invalid.`);
      // Bu fonksiyonun çağrıldığı yerde bu durumu ele almak üzere null dönebiliriz.
      return null;
  }


  // Find the index of the correct answer object within the shuffledFullOptions array
  const correctIndexInShuffled = shuffledFullOptions.findIndex(option => option.text === correctAnswerText);

  if (correctIndexInShuffled === -1) {
    // Bu durum, correctAnswerText ile shuffledFullOptions arasında bir uyumsuzluk olduğunu gösterir.
    // Genellikle seçenek metinlerinde veya correctAnswerText üretiminde bir sorun varsa oluşur.
    console.error(`Critical: Correct answer text "${correctAnswerText}" not found in shuffled options for question ID: ${question.id}.`);
    // Bu soruyu atlayabilir veya hata olarak işaretleyebilirsiniz.
    return null;
  }

  return {
    id: question.id,
    word_id: question.word_id,
    paragraph: question.paragraph,
    question_text: question.question_text,
    options: shuffledFullOptions.map(opt => ({ text: opt.text, originalLetter: opt.originalLetter })), // Send objects with text and originalLetter
    correct_answer_index_for_initial_display: correctIndexInShuffled, // Index in the shuffled array (useful for frontend if it needs it for some reason)
    correct_answer_letter_from_db: question.correct_answer, // The actual correct letter from DB (A,B,C,D)
    explanation: question.explanation,
    difficulty: question.difficulty,
    created_at: question.created_at,
    updated_at: question.updated_at
  };
};

// Get random questions for general quiz or by difficulty
const getRandomQuestions = async (req, res) => {
  try {
    const { limit = 10, difficulty } = req.query;

    let query = supabase
      .from('questions')
      .select(`
        id, word_id, paragraph, question_text,
        option_a, option_b, option_c, option_d,
        correct_answer, explanation,
        difficulty, is_active, created_at, updated_at
      `)
      .eq('is_active', true);

    if (difficulty && difficulty !== 'mixed') {
      query = query.eq('difficulty', difficulty);
    }

    // Performans için ORDER BY RANDOM() yerine, ID'leri alıp sonra rastgele seçme yöntemi
    // Veya daha basit bir yaklaşım olarak, büyük bir limit ile çekip sonra uygulama tarafında rastgele seçme.
    // Şimdilik mevcut limit ile devam edelim, ancak büyük veri setlerinde bu optimize edilebilir.
    // Rastgeleliği artırmak için, önce tüm uygun ID'leri çekip, sonra rastgele ID'ler seçip,
    // o ID'lere göre soruları çekmek daha iyi olabilir. Şimdilik basit bir shuffle ile devam ediyoruz.
    const { data: allQuestions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Database error (fetching all questions):', fetchError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch questions from database'
      });
    }

    if (!allQuestions || allQuestions.length === 0) {
      return res.status(404).json({
        error: 'No questions found',
        message: `No ${difficulty ? difficulty + ' difficulty' : ''} questions available in the database`
      });
    }

    const shuffledAllQuestions = shuffleArray(allQuestions);
    const questionsToServe = shuffledAllQuestions.slice(0, parseInt(limit));


    const invalidQuestions = questionsToServe.filter(q => !q.correct_answer || !['A', 'B', 'C', 'D'].includes(q.correct_answer));
    if (invalidQuestions.length > 0) {
      console.error('Invalid questions found in selection:', invalidQuestions.map(q => ({ id: q.id, correct_answer: q.correct_answer })));
      // Hatalı soruları filtreleyebilir veya hata döndürebilirsiniz. Şimdilik logluyoruz.
    }

    const processedQuestions = questionsToServe
        .map(processOptionsForFrontend)
        .filter(q => q !== null); // processOptionsForFrontend'dan null dönenleri filtrele


    if (processedQuestions.length === 0 && questionsToServe.length > 0) {
        // Bu, tüm soruların işlenirken bir sorunla karşılaştığı anlamına gelir.
        return res.status(500).json({
            error: 'Question processing error',
            message: 'All fetched questions had issues during processing.'
        });
    }


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

// Check answer for a specific question
const checkAnswer = async (req, res) => {
  try {
    // Frontend'den artık 'selectedOriginalLetter' gelecek, 'selectedIndex' değil.
    const { questionId, selectedOriginalLetter } = req.body;

    if (!questionId || !selectedOriginalLetter) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'Question ID and selected original letter are required'
      });
    }

    const { data: question, error } = await supabase
      .from('questions')
      .select(`
        id, option_a, option_b, option_c, option_d,
        correct_answer, explanation, difficulty
      `)
      .eq('id', questionId)
      .eq('is_active', true)
      .single();

    if (error || !question) {
      return res.status(404).json({
        error: 'Question not found',
        message: 'The specified question could not be found or is not active'
      });
    }

    if (!question.correct_answer || !['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
      console.error('Invalid question correct_answer in DB:', { id: question.id, correct_answer: question.correct_answer });
      return res.status(500).json({
        error: 'Data integrity error',
        message: 'Question has invalid correct_answer value in database'
      });
    }

    const isCorrect = question.correct_answer === selectedOriginalLetter;
    const correctAnswerText = getCorrectAnswerText(question);

    if (correctAnswerText === null) {
        return res.status(500).json({
            error: 'Internal error',
            message: 'Could not determine correct answer text for the question.'
        });
    }


    res.json({
      success: true,
      isCorrect,
      correctOriginalLetter: question.correct_answer, // Veritabanındaki doğru şıkkın harfi (A,B,C,D)
      correctAnswerText,                           // Doğru şıkkın metni
      explanation: question.explanation,
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