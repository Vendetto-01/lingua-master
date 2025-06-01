// backend/controllers/historyController.js
const supabase = require('../config/supabase');

// Helper function to get the text of a specific option (A, B, C, D)
const getOptionText = (question, letter) => {
  if (!question || !letter) return null;
  switch (letter.toUpperCase()) {
    case 'A': return question.option_a;
    case 'B': return question.option_b;
    case 'C': return question.option_c;
    case 'D': return question.option_d;
    default: return null;
  }
};

const getLearningHistory = async (req, res) => {
  const { user_id } = req.user; // authenticateUser middleware'inden gelir
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sortBy = req.query.sortBy || 'date_desc'; // 'date_asc', 'correctness_desc', 'correctness_asc'
  const offset = (page - 1) * limit;

  try {
    // user_Youtubes (veya doğru tablo adınız) tablosundan kullanıcının cevaplarını çekiyoruz
    // ve questions tablosuyla join yapıyoruz.
    // DİKKAT: 'user_Youtubes' tablo adı büyük ihtimalle bir yazım hatası.
    // Lütfen bunu kendi veritabanı şemanızdaki doğru tablo adıyla (örn: user_answers) değiştirin.
    let query = supabase
      .from('user_Youtubes') // <--- BURAYI KONTROL ET VE GEREKİRSE DEĞİŞTİR
      .select(`
        id,
        selected_original_letter,
        is_correct,
        answered_at:created_at, 
        questions (
          id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          explanation
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
      return res.status(500).json({ success: false, error: 'Failed to fetch learning history', details: error.message });
    }

    if (!historyData) {
      return res.status(404).json({ success: true, message: 'No learning history found for this user.', data: [], totalItems: 0, totalPages: 0, currentPage: page });
    }

    const formattedHistory = historyData.map(item => {
      if (!item.questions) {
        // Bu durum, question_id ile eşleşen bir soru bulunamadığında oluşabilir.
        // Belki soru silinmiştir veya bir veri tutarsızlığı vardır.
        console.warn(`Learning history item (id: ${item.id}) is missing question details. Skipping.`);
        return null; // Bu öğeyi atla
      }
      const questionDetails = item.questions;
      const selectedOptionText = getOptionText(questionDetails, item.selected_original_letter);
      const correctOptionText = getOptionText(questionDetails, questionDetails.correct_answer);

      return {
        history_id: item.id, // user_Youtubes (veya benzeri) tablosundaki ID
        question_id: questionDetails.id,
        question_text: questionDetails.question_text,
        selected_option_letter: item.selected_original_letter,
        selected_option_text: selectedOptionText,
        is_correct: item.is_correct,
        correct_option_letter: questionDetails.correct_answer,
        correct_option_text: correctOptionText,
        explanation: questionDetails.explanation,
        answered_at: item.answered_at,
      };
    }).filter(item => item !== null); // Null olanları (soru detayı olmayanlar) filtrele

    // Gerçek sayıyı almak için (count direkt toplam satır sayısını vermeyebilir ilişkili sorgularda)
    // Eğer count null ise veya beklenen gibi değilse, ayrı bir count sorgusu gerekebilir.
    // Supabase postgREST normalde ana tablodaki count'u doğru verir, bu yüzden şimdilik buna güveniyoruz.
    // Ancak, daha karmaşık joinlerde veya view'lerde `count: 'exact'` ile ayrı bir sorgu daha güvenilir olabilir.
    const { count: totalCount } = await supabase
      .from('user_Youtubes') // <--- BURAYI KONTROL ET VE GEREKİRSE DEĞİŞTİR
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
      }
    });

  } catch (error) {
    console.error('Server error in getLearningHistory:', error);
    res.status(500).json({ success: false, error: 'An unexpected server error occurred.', details: error.message });
  }
};

module.exports = {
  getLearningHistory,
};