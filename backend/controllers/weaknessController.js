// backend/controllers/weaknessController.js
const supabase = require('../config/supabase');

// Bir kelimeyi kullanıcının zayıflık listesine ekler veya mevcutsa durumunu günceller
exports.addOrUpdateWeaknessItem = async (req, res) => {
  const user_id = req.user?.user_id || req.user?.id;
  const { word_id } = req.body;

  if (!user_id) {
    return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }
  if (!word_id) {
    return res.status(400).json({ success: false, message: 'Word ID is required.' });
  }

  try {
    // UNIQUE constraint (user_id, word_id) sayesinde ON CONFLICT kullanılabilir.
    // Eğer kayıt varsa ve status 'removed_manual' ise 'active_manual_add' yap, değilse 'active_manual_add' olarak ekle/güncelle.
    const { data, error } = await supabase
      .from('user_weakness_items')
      .upsert(
        {
          user_id,
          word_id,
          status: 'active_manual_add', // Kullanıcı manuel eklediği için
          updated_at: new Date().toISOString(), // updated_at'i manuel olarak ayarlıyoruz upsert için
        },
        {
          onConflict: 'user_id, word_id',
          // ignoreDuplicates: false, // upsert varsayılan olarak false'tur, yani günceller
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error adding/updating weakness item:', error);
      return res.status(500).json({ success: false, message: 'Failed to add item to weakness training.', details: error.message });
    }

    res.status(200).json({ success: true, message: 'Item added/updated in weakness training.', item: data });

  } catch (err) {
    console.error('Server error in addOrUpdateWeaknessItem:', err);
    res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
  }
};

// Bir kelimeyi kullanıcının zayıflık listesinden manuel olarak çıkarır (status'u günceller)
exports.removeWeaknessItem = async (req, res) => {
  const user_id = req.user?.user_id || req.user?.id;
  const { word_id } = req.params; // word_id'yi URL parametresinden alıyoruz

  if (!user_id) {
    return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }
  if (!word_id) {
    return res.status(400).json({ success: false, message: 'Word ID is required in URL parameters.' });
  }

  try {
    const { data, error } = await supabase
      .from('user_weakness_items')
      .update({
        status: 'removed_manual',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user_id)
      .eq('word_id', word_id)
      .select()
      .single(); // Güncellenen kaydı döndür

    if (error) {
      // Eğer kayıt bulunamazsa (PGRST116), bu bir hata değil, işlem başarılı sayılabilir.
      if (error.code === 'PGRST116') {
        return res.status(200).json({ success: true, message: 'Item not found in weakness list or already removed.' });
      }
      console.error('Error removing weakness item:', error);
      return res.status(500).json({ success: false, message: 'Failed to remove item from weakness training.', details: error.message });
    }
    
    if (!data) { // Kayıt bulunamadı ama PGRST116 hatası da gelmediyse (pek olası değil update ile)
        return res.status(404).json({ success: false, message: 'Item not found in weakness list for this user.' });
    }

    res.status(200).json({ success: true, message: 'Item marked as removed from weakness training.', item: data });

  } catch (err) {
    console.error('Server error in removeWeaknessItem:', err);
    res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
  }
};

// Kullanıcının zayıflık listesindeki aktif kelimelerden quiz soruları getirir
exports.getWeaknessTrainingQuestions = async (req, res) => {
  const user_id = req.user?.user_id || req.user?.id;
  const limit = parseInt(req.query.limit) || 10; // Varsayılan olarak 10 soru

  if (!user_id) {
    return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }

  try {
    // 1. Kullanıcının aktif zayıflık listesindeki word_id'leri çek
    const { data: weaknessItems, error: itemsError } = await supabase
      .from('user_weakness_items')
      .select('word_id')
      .eq('user_id', user_id)
      .neq('status', 'removed_manual'); // Manuel olarak çıkarılmamış olanlar

    if (itemsError) {
      console.error('Error fetching weakness item IDs:', itemsError);
      throw itemsError;
    }

    if (!weaknessItems || weaknessItems.length === 0) {
      return res.status(200).json({ success: true, questions: [], message: 'No items in your weakness training list.' });
    }

    const wordIds = weaknessItems.map(item => item.word_id);

    // 2. Bu word_id'lere karşılık gelen kelime/soru detaylarını 'words' tablosundan çek
    // Rastgele sıralama ve limit uygulama
    // Supabase'de doğrudan rastgele N eleman çekmek için RPC veya view gerekebilir.
    // Şimdilik tüm eşleşenleri çekip uygulamada rastgele seçip limitleyeceğiz.
    // Daha verimli bir yöntem için: https://supabase.com/docs/guides/database/functions (örneğin, TABLESAMPLE BERNOULLI kullanmak)
    
    const { data: wordsDetails, error: wordsError } = await supabase
      .from('words')
      .select('*') // Tüm gerekli sütunları seçin
      .in('id', wordIds);

    if (wordsError) {
      console.error('Error fetching word details for weakness training:', wordsError);
      throw wordsError;
    }

    if (!wordsDetails || wordsDetails.length === 0) {
        return res.status(200).json({ success: true, questions: [], message: 'Could not find details for items in your weakness training list.' });
    }

    // Soruları rastgele karıştır ve limitle
    const shuffledQuestions = wordsDetails.sort(() => 0.5 - Math.random());
    const limitedQuestions = shuffledQuestions.slice(0, limit);
    
    // Frontend'in beklediği formatta (questionUtils.formatQuestion benzeri) formatla
    // Bu formatlama questionsController.js'deki getRandomQuestions ile tutarlı olmalı
    const formattedQuestions = limitedQuestions.map(q => ({
        id: q.id,
        question_text: q.question_text || `What is the definition of "${q.word}"?`, // question_text yoksa varsayılan oluştur
        word: q.word,
        part_of_speech: q.part_of_speech,
        definition: q.definition,
        difficulty_level: q.difficulty_level,
        example_sentence: q.example_sentence,
        // Seçenekler burada oluşturulmalı. questionsController'daki gibi bir mantıkla.
        // Şimdilik sadece kelime bilgisini döndürüyoruz, seçenek oluşturma daha karmaşık.
        // Basitlik adına, seçenekleri frontend'de veya bu endpoint'te oluşturmak gerekebilir.
        // VEYA words tablosunda option_a,b,c,d varsa onları kullanabiliriz.
        options: [ // Bu kısım words tablonuzdaki option_a,b,c,d'ye göre düzenlenmeli
            { text: q.option_a, originalLetter: 'A' },
            { text: q.option_b, originalLetter: 'B' },
            { text: q.option_c, originalLetter: 'C' },
            { text: q.option_d, originalLetter: 'D' }
        ].filter(opt => opt.text), // Sadece metni olan seçenekleri al
        correct_answer_letter_from_db: q.correct_answer_letter, // words tablonuzda böyle bir sütun varsa
        explanation: q.explanation // words tablonuzda böyle bir sütun varsa
    }));


    res.status(200).json({ success: true, questions: formattedQuestions });

  } catch (err) {
    console.error('Server error in getWeaknessTrainingQuestions:', err);
    res.status(500).json({ success: false, message: 'An unexpected server error occurred fetching weakness questions.', details: err.message });
  }
};