// backend/controllers/weaknessController.js
const supabase = require('../config/supabase');

// Helper function to shuffle array (wordsController.js'den kopyalandı)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

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
    const shuffledWordsDetails = shuffleArray(wordsDetails); // Önce tüm kelimeleri karıştır
    const limitedWords = shuffledWordsDetails.slice(0, limit); // Sonra limitle

    const formattedQuestions = limitedWords.map(q => {
      // Seçenekleri oluştur ve doğrula
      const optionsSource = [
        { text: q.option_a, originalLetter: 'A' }, // Kural: option_a her zaman doğru cevabın metnini içerir
        { text: q.option_b, originalLetter: 'B' },
        { text: q.option_c, originalLetter: 'C' },
        { text: q.option_d, originalLetter: 'D' }
      ];

      const validOptions = optionsSource.filter(opt => opt && typeof opt.text === 'string' && opt.text.trim() !== '');

      // Eğer geçerli seçenek sayısı (özellikle doğru cevap olan A dahil) yetersizse bu soruyu atla
      if (validOptions.length < 2 || !validOptions.find(opt => opt.originalLetter === 'A')) {
        console.warn(`Word ID ${q.id} ("${q.word}") does not have enough valid options or missing correct option A. Skipping for weakness training.`);
        return null; // Bu soru kullanılamaz
      }

      const shuffledOptions = shuffleArray(validOptions);
      const questionText = q.question_text || `What does the word "${q.word}" mean?`;

      return {
        id: q.id,
        word: q.word,
        part_of_speech: q.part_of_speech,
        definition: q.definition,
        difficulty_level: q.difficulty_level,
        example_sentence: q.example_sentence,
        question_text: questionText,
        options: shuffledOptions, // Karıştırılmış ve doğrulanmış seçenekler
        correct_answer_letter_from_db: 'A', // Kural: Orijinal 'A' seçeneği her zaman doğrudur
        explanation: q.definition, // wordsController ile tutarlı
        // Frontend'in ihtiyaç duyabileceği diğer alanlar (QuizPage.jsx'deki formatQuestion'a bakılabilir)
        paragraph: q.example_sentence,
        difficulty: q.difficulty_level
      };
    }).filter(q => q !== null); // Geçersiz formatlanmış soruları (null olanları) filtrele

    if (formattedQuestions.length === 0 && limitedWords.length > 0) {
        // Bu durum, tüm çekilen kelimelerin formatlama sırasında (örn: yetersiz seçenek) elendiği anlamına gelir.
        return res.status(200).json({ success: true, questions: [], message: 'Found items in your study list, but they could not be formatted into valid questions at this time.' });
    }
    
    res.status(200).json({ success: true, questions: formattedQuestions });

  } catch (err) {
    console.error('Server error in getWeaknessTrainingQuestions:', err);
    res.status(500).json({ success: false, message: 'An unexpected server error occurred fetching weakness questions.', details: err.message });
  }
};

// Kullanıcının zayıflık listesindeki aktif kelime sayısını getirir
exports.getWeaknessItemsCount = async (req, res) => {
  const user_id = req.user?.user_id || req.user?.id;

  if (!user_id) {
    return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }

  try {
    const { count, error } = await supabase
      .from('user_weakness_items')
      .select('*', { count: 'exact', head: true }) // Sadece sayıyı almak için head: true
      .eq('user_id', user_id)
      .neq('status', 'removed_manual'); // Manuel olarak çıkarılmamış olanlar

    if (error) {
      console.error('Error fetching weakness items count:', error);
      throw error;
    }

    res.status(200).json({ success: true, count: count || 0 });

  } catch (err) {
    console.error('Server error in getWeaknessItemsCount:', err);
    res.status(500).json({ success: false, message: 'Failed to get weakness items count.', details: err.message });
  }
};