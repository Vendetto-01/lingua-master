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