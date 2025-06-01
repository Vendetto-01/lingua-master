const supabase = require('../config/supabase');

// Helper function to calculate streak
const calculateStreak = (currentStreak, lastActivityDateStr) => {
    if (!lastActivityDateStr) return 1; // İlk aktivite ise 1 gün seri

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bugünün başlangıcı

    const lastActivityDate = new Date(lastActivityDateStr);
    lastActivityDate.setHours(0, 0, 0, 0); // Son aktivite gününün başlangıcı

    const diffTime = today - lastActivityDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return currentStreak + 1; // Seri devam ediyor
    } else if (diffDays === 0) {
        return currentStreak; // Aynı gün içinde birden fazla aktivite, seri değişmez
    } else {
        return 1; // Seri bozulmuş, yeni seri başlıyor
    }
};

const recordQuizSession = async (req, res) => {
    const { user_id } = req.user; // authenticateUser middleware'inden gelir
    const { course_type, score_correct, score_total, duration_seconds, questions_answered_details } = req.body;

    if (typeof score_correct !== 'number' || typeof score_total !== 'number' || !course_type || !questions_answered_details) {
        return res.status(400).json({ error: 'Missing required fields for recording quiz session.' });
    }

    const client = await supabase.getClient(); // Transaction için client
    try {
        await client.query('BEGIN');

        // 1. quiz_sessions tablosuna kaydet
        const { data: sessionData, error: sessionError } = await client
            .from('quiz_sessions')
            .insert({ user_id, course_type, score_correct, score_total, duration_seconds })
            .select()
            .single();

        if (sessionError) throw sessionError;

        // 2. user_Youtubes tablosuna detayları kaydet
        if (questions_answered_details && questions_answered_details.length > 0) {
            const answersToInsert = questions_answered_details.map(answer => ({
                session_id: sessionData.session_id,
                user_id,
                question_id: answer.question_id,
                selected_original_letter: answer.selected_original_letter,
                is_correct: answer.is_correct
            }));
            const { error: answersError } = await client
                .from('user_Youtubes')
                .insert(answersToInsert);

            if (answersError) throw answersError;
        }

        // 3. user_profiles güncelle (total_points, streak_days, last_activity_date)
        const { data: userProfile, error: profileError } = await client
            .from('user_profiles')
            .select('total_points, streak_days, last_activity_date')
            .eq('user_id', user_id)
            .single();

        if (profileError) throw profileError;
        if (!userProfile) return res.status(404).json({ error: "User profile not found" });


        const newPoints = (userProfile.total_points || 0) + score_correct; // Sadece doğru cevap sayısı kadar puan
        const newStreak = calculateStreak(userProfile.streak_days || 0, userProfile.last_activity_date);
        const todayISO = new Date().toISOString().split('T')[0];


        const { error: updateProfileError } = await client
            .from('user_profiles')
            .update({
                total_points: newPoints,
                streak_days: newStreak,
                last_activity_date: todayISO
            })
            .eq('user_id', user_id);

        if (updateProfileError) throw updateProfileError;

        // 4. course_progress güncelle
        const { data: courseProgress, error: courseProgressError } = await client
            .from('course_progress')
            .select('*')
            .eq('user_id', user_id)
            .eq('course_type', course_type)
            .single();

        if (courseProgressError && courseProgressError.code !== 'PGRST116') { // PGRST116: no rows found
            throw courseProgressError;
        }

        const currentAccuracy = score_total > 0 ? score_correct / score_total : 0;

        if (courseProgress) {
            const newTotalAttempted = (courseProgress.total_questions_attempted || 0) + score_total;
            const newTotalCorrect = (courseProgress.total_correct_answers || 0) + score_correct;
            const { error: updateCourseError } = await client
                .from('course_progress')
                .update({
                    total_questions_attempted: newTotalAttempted,
                    total_correct_answers: newTotalCorrect,
                    highest_accuracy: Math.max(courseProgress.highest_accuracy || 0, currentAccuracy),
                    times_completed: (courseProgress.times_completed || 0) + 1,
                    last_played_at: new Date().toISOString()
                })
                .eq('progress_id', courseProgress.progress_id);
            if (updateCourseError) throw updateCourseError;
        } else {
            const { error: insertCourseError } = await client
                .from('course_progress')
                .insert({
                    user_id,
                    course_type,
                    total_questions_attempted: score_total,
                    total_correct_answers: score_correct,
                    highest_accuracy: currentAccuracy,
                    times_completed: 1,
                    last_played_at: new Date().toISOString()
                });
            if (insertCourseError) throw insertCourseError;
        }

        // 5. daily_stats güncelle
        const { data: dailyStat, error: dailyStatError } = await client
            .from('daily_stats')
            .select('*')
            .eq('user_id', user_id)
            .eq('stat_date', todayISO)
            .single();

        if (dailyStatError && dailyStatError.code !== 'PGRST116') {
             throw dailyStatError;
        }

        if (dailyStat) {
            const { error: updateDailyError } = await client
                .from('daily_stats')
                .update({
                    questions_answered_today: (dailyStat.questions_answered_today || 0) + score_total,
                    correct_answers_today: (dailyStat.correct_answers_today || 0) + score_correct,
                    completed_quiz_today: true
                })
                .eq('stat_id', dailyStat.stat_id);
            if (updateDailyError) throw updateDailyError;
        } else {
            const { error: insertDailyError } = await client
                .from('daily_stats')
                .insert({
                    user_id,
                    stat_date: todayISO,
                    questions_answered_today: score_total,
                    correct_answers_today: score_correct,
                    completed_quiz_today: true
                });
            if (insertDailyError) throw insertDailyError;
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Quiz session recorded successfully', session_id: sessionData.session_id });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error recording quiz session:', error);
        res.status(500).json({ error: 'Failed to record quiz session', details: error.message });
    }
};


const getUserDashboardStats = async (req, res) => {
    const { user_id } = req.user;
    const todayISO = new Date().toISOString().split('T')[0];

    try {
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('streak_days, total_points')
            .eq('user_id', user_id)
            .single();

        if (profileError) throw profileError;
        if (!profile) return res.status(404).json({ error: "User profile not found for dashboard stats" });


        const { data: dailyStat, error: dailyStatError } = await supabase
            .from('daily_stats')
            .select('questions_answered_today')
            .eq('user_id', user_id)
            .eq('stat_date', todayISO)
            .single();

        // dailyStatError'u yok sayıyoruz (PGRST116), çünkü o gün için kayıt olmayabilir, bu normal.
        if (dailyStatError && dailyStatError.code !== 'PGRST116') {
            throw dailyStatError;
        }

        // Toplam soru sayısını questions tablosundan alalım
        const { count: totalQuestionsAvailable, error: countError } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        if (countError) throw countError;

        res.status(200).json({
            success: true,
            streak_days: profile.streak_days || 0,
            completed_today: dailyStat?.questions_answered_today || 0,
            total_points: profile.total_points || 0,
            total_questions_available: totalQuestionsAvailable || 0
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
    }
};

const getUserCourseStats = async (req, res) => {
    const { user_id } = req.user;

    try {
        const { data: courseStats, error: courseStatsError } = await supabase
            .from('course_progress')
            .select('course_type, total_questions_attempted, total_correct_answers, times_completed, highest_accuracy')
            .eq('user_id', user_id);

        if (courseStatsError) throw courseStatsError;

        const formattedStats = courseStats.map(stat => ({
            courseType: stat.course_type,
            completed: stat.times_completed || 0,
            accuracy: stat.total_questions_attempted > 0
                ? Math.round((stat.total_correct_answers / stat.total_questions_attempted) * 100)
                : 0,
            // İsterseniz daha fazla detay ekleyebilirsiniz
        }));

        res.status(200).json({
            success: true,
            course_stats: formattedStats
        });

    } catch (error) {
        console.error('Error fetching course stats:', error);
        res.status(500).json({ error: 'Failed to fetch course stats', details: error.message });
    }
};


module.exports = {
    recordQuizSession,
    getUserDashboardStats,
    getUserCourseStats
};