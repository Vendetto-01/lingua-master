// backend/controllers/reportController.js
const supabase = require('../config/supabase');

exports.submitQuestionReport = async (req, res) => {
  const { word_id, report_reason, report_details } = req.body;
  // const user_id = req.user?.id; // Eğer JWT ile kullanıcı doğrulaması varsa ve req.user populate ediliyorsa

  if (!word_id || !report_reason) {
    return res.status(400).json({
      success: false,
      message: 'Word ID and report reason are required.',
    });
  }

  try {
    const reportData = {
      word_id,
      report_reason,
      // user_id, // Eğer kullanıcı ID'si varsa eklenecek
    };

    if (report_details) {
      reportData.report_details = report_details;
    }
    
    // Eğer auth.js middleware'i kullanılıyorsa ve kullanıcı bilgisi req.user'a ekleniyorsa:
    if (req.user && req.user.id) {
        reportData.user_id = req.user.id;
    }


    const { data, error } = await supabase
      .from('reports')
      .insert([reportData])
      .select()
      .single(); // .single() ekledik, böylece tek bir obje döner veya hata verir

    if (error) {
      console.error('Supabase error submitting report:', error);
      // Daha detaylı hata loglaması
      if (error.details) console.error('Supabase error details:', error.details);
      if (error.hint) console.error('Supabase error hint:', error.hint);
      
      // Foreign key constraint hatasını kontrol et
      if (error.code === '23503' && error.constraint === 'reports_word_id_fkey') {
        return res.status(400).json({
          success: false,
          message: `Invalid word_id: ${word_id}. This word does not exist.`,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to submit report. ' + error.message,
      });
    }

    if (!data) {
        // Bu durum .single() ile pek olası değil ama yine de kontrol edelim
        console.error('Supabase returned no data after insert, though no error was thrown.');
        return res.status(500).json({
            success: false,
            message: 'Failed to submit report. No data returned after insert.',
        });
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully.',
      report_id: data.id,
      report: data
    });

  } catch (err) {
    console.error('Server error submitting report:', err);
    res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred.',
      error: err.message
    });
  }
};

// Kullanıcının bir raporu kendi "Reported Questions" listesinden gizlemesini sağlar
exports.dismissReportForUser = async (req, res) => {
  const user_id = req.user?.user_id || req.user?.id;
  const { report_id } = req.params;

  if (!user_id) {
    return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }
  if (!report_id || isNaN(parseInt(report_id))) {
    return res.status(400).json({ success: false, message: 'Valid Report ID is required.' });
  }

  try {
    // Check if the report actually belongs to the user, although not strictly necessary
    // if we only show users their own reports. But good for direct API calls.
    const { data: report, error: fetchError } = await supabase
        .from('reports')
        .select('id, user_id')
        .eq('id', parseInt(report_id))
        .eq('user_id', user_id) // Ensure the user is dismissing their own report
        .single();

    if (fetchError || !report) {
        // If report not found or doesn't belong to user, PGRST116 or other error
        console.warn(`Dismiss attempt: Report ${report_id} not found for user ${user_id} or error:`, fetchError?.message);
        return res.status(404).json({ success: false, message: 'Report not found or you cannot dismiss it.' });
    }

    const { data: dismissData, error: dismissError } = await supabase
      .from('user_dismissed_reports')
      .insert({
        user_id,
        report_id: parseInt(report_id),
      })
      .select()
      .single();

    if (dismissError) {
      // Handle unique constraint violation (already dismissed) gracefully
      if (dismissError.code === '23505') { // unique_violation
        return res.status(200).json({ success: true, message: 'Report already dismissed by user.' });
      }
      console.error('Error dismissing report:', dismissError);
      return res.status(500).json({ success: false, message: 'Failed to dismiss report.', details: dismissError.message });
    }

    res.status(200).json({ success: true, message: 'Report dismissed from your list.', dismissed_record: dismissData });

  } catch (err) {
    console.error('Server error in dismissReportForUser:', err);
    res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
  }
};

// Helper function to shuffle array (wordsController.js'den kopyalandı)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Kullanıcının raporladığı ve gizlemediği soruları getirir
exports.getUserReportedQuestions = async (req, res) => {
  const user_id = req.user?.user_id || req.user?.id;
  const limit = parseInt(req.query.limit) || 10;

  if (!user_id) {
    return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }

  try {
    // 1. Kullanıcının gizlediği rapor ID'lerini çek
    const { data: dismissedReportIdsData, error: dismissedError } = await supabase
      .from('user_dismissed_reports')
      .select('report_id')
      .eq('user_id', user_id);

    if (dismissedError) {
      console.error('Error fetching dismissed reports:', dismissedError);
      throw dismissedError;
    }
    const dismissedReportIds = dismissedReportIdsData.map(item => item.report_id);

    // 2. Kullanıcının raporladığı, henüz gizlemediği raporları ve ilişkili word_id'leri çek
    // Aynı word_id için birden fazla rapor varsa, en sonuncusunu (veya herhangi birini) almak yeterli olabilir.
    // Şimdilik, farklı word_id'leri olan raporları alalım.
    // Ve her word_id için bir report_id'yi de alalım ki frontend'de dismiss edilebilsin.

    let reportsQuery = supabase
      .from('reports')
      .select('id, word_id') // report_id as id
      .eq('user_id', user_id); // Kullanıcının kendi raporları

    if (dismissedReportIds.length > 0) {
      reportsQuery = reportsQuery.not('id', 'in', `(${dismissedReportIds.join(',')})`); // Gizlenmemiş olanlar
    }

    const { data: userReports, error: reportsError } = await reportsQuery;

    if (reportsError) {
      console.error('Error fetching user reports:', reportsError); // Bu log şimdi hatanın kaynağını gösterecek
      throw reportsError;
    }

    if (!userReports || userReports.length === 0) {
      return res.status(200).json({ success: true, questions: [], message: 'No active reported questions found for you.' });
    }

    // Her word_id için bir report_id tutacak şekilde map oluşturalım (birden fazla rapor varsa ilkini alırız)
    const wordToReportMap = new Map();
    userReports.forEach(report => {
        if (!wordToReportMap.has(report.word_id)) {
            wordToReportMap.set(report.word_id, report.id);
        }
    });
    
    const uniqueWordIds = Array.from(wordToReportMap.keys());

    if (uniqueWordIds.length === 0) {
        return res.status(200).json({ success: true, questions: [], message: 'No unique words found in your active reported questions.' });
    }

    // 3. Bu word_id'lere karşılık gelen kelime/soru detaylarını 'words' tablosundan çek
    const { data: wordsDetails, error: wordsError } = await supabase
      .from('words')
      .select('*')
      .in('id', uniqueWordIds);

    if (wordsError) {
      console.error('Error fetching word details for reported questions:', wordsError);
      throw wordsError;
    }

    if (!wordsDetails || wordsDetails.length === 0) {
      return res.status(200).json({ success: true, questions: [], message: 'Could not find details for your reported questions.' });
    }

    // Soruları rastgele karıştır ve limitle
    const shuffledWordsDetails = shuffleArray(wordsDetails);
    const limitedWords = shuffledWordsDetails.slice(0, limit);

    // Soruları formatla (weaknessController'daki gibi)
    const formattedQuestions = limitedWords.map(q => {
      const optionsSource = [
        { text: q.option_a, originalLetter: 'A' },
        { text: q.option_b, originalLetter: 'B' },
        { text: q.option_c, originalLetter: 'C' },
        { text: q.option_d, originalLetter: 'D' }
      ];
      const validOptions = optionsSource.filter(opt => opt && typeof opt.text === 'string' && opt.text.trim() !== '');

      if (validOptions.length < 2 || !validOptions.find(opt => opt.originalLetter === 'A')) {
        console.warn(`Reported Question (Word ID ${q.id}): Not enough valid options or missing correct option A. Skipping.`);
        return null;
      }
      const shuffledOptions = shuffleArray(validOptions);
      const questionText = q.question_text || `What does the word "${q.word}" mean?`;
      const associated_report_id = wordToReportMap.get(q.id); // İlgili report_id'yi al

      return {
        id: q.id, // Bu word_id'dir
        report_id: associated_report_id, // Bu, frontend'in dismiss için kullanacağı report.id
        question_text: questionText,
        word: q.word,
        part_of_speech: q.part_of_speech,
        definition: q.definition,
        difficulty_level: q.difficulty_level,
        example_sentence: q.example_sentence,
        options: shuffledOptions,
        correct_answer_letter_from_db: 'A',
        explanation: q.definition,
        paragraph: q.example_sentence,
        difficulty: q.difficulty_level
      };
    }).filter(q => q !== null);
    
    if (formattedQuestions.length === 0 && limitedWords.length > 0) {
        return res.status(200).json({ success: true, questions: [], message: 'Found reported items, but they could not be formatted into valid questions.' });
    }

    res.status(200).json({ success: true, questions: formattedQuestions });

  } catch (err) {
    console.error('Server error in getUserReportedQuestions:', err);
    res.status(500).json({ success: false, message: 'An unexpected server error occurred fetching reported questions.', details: err.message });
  }
};