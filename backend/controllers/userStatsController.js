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
    // DEBUG: User bilgisini logla
    console.log('🔍 Record Quiz Session Request:', {
        user: req.user,
        user_id: req.user?.user_id,
        id: req.user?.id
    });

    const user_id = req.user?.user_id || req.user?.id; // Fallback ekle
    
    if (!user_id) {
        console.error('❌ No user_id found in record quiz session request');
        return res.status(400).json({ 
            error: 'User ID not found',
            message: 'Authentication failed - no user ID in request'
        });
    }

    const { course_type, score_correct, score_total, duration_seconds, questions_answered_details } = req.body;

    if (typeof score_correct !== 'number' || typeof score_total !== 'number' || !course_type || !questions_answered_details) {
        return res.status(400).json({ error: 'Missing required fields for recording quiz session.' });
    }

    try {
        console.log(`📝 Recording quiz session for user: ${user_id}`);

        // 1. quiz_sessions tablosuna kaydet
        const { data: sessionData, error: sessionError } = await supabase
            .from('quiz_sessions')
            .insert({ user_id, course_type, score_correct, score_total, duration_seconds })
            .select()
            .single();

        if (sessionError) {
            console.error('Session insert error:', sessionError);
            throw sessionError;
        }

        console.log('✅ Quiz session created:', sessionData.session_id);

        // 2. user_Youtubes tablosuna detayları kaydet
        if (questions_answered_details && questions_answered_details.length > 0) {
            const answersToInsert = questions_answered_details.map(answer => ({
                session_id: sessionData.session_id,
                user_id,
                question_id: answer.question_id,
                selected_original_letter: answer.selected_original_letter,
                is_correct: answer.is_correct
            }));
            
            const { error: answersError } = await supabase
                .from('user_Youtubes')
                .insert(answersToInsert);

            if (answersError) {
                console.error('Answers insert error:', answersError);
                throw answersError;
            }

            console.log('✅ Quiz answers recorded:', answersToInsert.length);
        }

        // 3. user_profiles güncelle (total_points, streak_days, last_activity_date)
        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('total_points, streak_days, last_activity_date')
            .eq('user_id', user_id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            
            // Eğer profile yoksa oluştur
            if (profileError.code === 'PGRST116') {
                console.log('🔧 Creating user profile during quiz session...');
                const todayISO = new Date().toISOString().split('T')[0];
                
                const { data: newProfile, error: createError } = await supabase
                    .from('user_profiles')
                    .insert({
                        user_id,
                        total_points: score_correct,
                        streak_days: 1,
                        last_activity_date: todayISO
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Create profile error:', createError);
                    throw createError;
                }
                
                console.log('✅ User profile created with quiz data');
            } else {
                throw profileError;
            }
        } else {
            // Profile var, güncelle
            const newPoints = (userProfile.total_points || 0) + score_correct; // Sadece doğru cevap sayısı kadar puan
            const newStreak = calculateStreak(userProfile.streak_days || 0, userProfile.last_activity_date);
            const todayISO = new Date().toISOString().split('T')[0];

            const { error: updateProfileError } = await supabase
                .from('user_profiles')
                .update({
                    total_points: newPoints,
                    streak_days: newStreak,
                    last_activity_date: todayISO
                })
                .eq('user_id', user_id);

            if (updateProfileError) {
                console.error('Profile update error:', updateProfileError);
                throw updateProfileError;
            }

            console.log('✅ User profile updated');
        }

        // 4. course_progress güncelle
        const { data: courseProgress, error: courseProgressError } = await supabase
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
            
            const { error: updateCourseError } = await supabase
                .from('course_progress')
                .update({
                    total_questions_attempted: newTotalAttempted,
                    total_correct_answers: newTotalCorrect,
                    highest_accuracy: Math.max(courseProgress.highest_accuracy || 0, currentAccuracy),
                    times_completed: (courseProgress.times_completed || 0) + 1,
                    last_played_at: new Date().toISOString()
                })
                .eq('progress_id', courseProgress.progress_id);
                
            if (updateCourseError) {
                console.error('Course progress update error:', updateCourseError);
                throw updateCourseError;
            }

            console.log('✅ Course progress updated');
        } else {
            const { error: insertCourseError } = await supabase
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
                
            if (insertCourseError) {
                console.error('Course progress insert error:', insertCourseError);
                throw insertCourseError;
            }

            console.log('✅ Course progress created');
        }

        // 5. daily_stats güncelle
        const todayISO = new Date().toISOString().split('T')[0];
        
        const { data: dailyStat, error: dailyStatError } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('user_id', user_id)
            .eq('stat_date', todayISO)
            .single();

        if (dailyStatError && dailyStatError.code !== 'PGRST116') {
             throw dailyStatError;
        }

        if (dailyStat) {
            const { error: updateDailyError } = await supabase
                .from('daily_stats')
                .update({
                    questions_answered_today: (dailyStat.questions_answered_today || 0) + score_total,
                    correct_answers_today: (dailyStat.correct_answers_today || 0) + score_correct,
                    completed_quiz_today: true
                })
                .eq('stat_id', dailyStat.stat_id);
                
            if (updateDailyError) {
                console.error('Daily stats update error:', updateDailyError);
                throw updateDailyError;
            }

            console.log('✅ Daily stats updated');
        } else {
            const { error: insertDailyError } = await supabase
                .from('daily_stats')
                .insert({
                    user_id,
                    stat_date: todayISO,
                    questions_answered_today: score_total,
                    correct_answers_today: score_correct,
                    completed_quiz_today: true
                });
                
            if (insertDailyError) {
                console.error('Daily stats insert error:', insertDailyError);
                throw insertDailyError;
            }

            console.log('✅ Daily stats created');
        }

        res.status(200).json({ 
            success: true, 
            message: 'Quiz session recorded successfully', 
            session_id: sessionData.session_id 
        });

    } catch (error) {
        console.error('❌ Error recording quiz session:', error);
        res.status(500).json({ 
            error: 'Failed to record quiz session', 
            details: error.message,
            user_id_debug: user_id
        });
    }
};

const getUserDashboardStats = async (req, res) => {
    // DEBUG: User bilgisini logla
    console.log('🔍 Dashboard Stats Request:', {
        user: req.user,
        user_id: req.user?.user_id,
        id: req.user?.id
    });

    const user_id = req.user?.user_id || req.user?.id; // Fallback ekle
    
    if (!user_id) {
        console.error('❌ No user_id found in dashboard stats request');
        return res.status(400).json({ 
            error: 'User ID not found',
            message: 'Authentication failed - no user ID in request'
        });
    }

    const todayISO = new Date().toISOString().split('T')[0];

    try {
        console.log(`📊 Fetching dashboard stats for user: ${user_id}`);

        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('streak_days, total_points')
            .eq('user_id', user_id)
            .single();

        if (profileError) {
            console.error('Profile error:', profileError);
            
            // Eğer profile yoksa oluştur
            if (profileError.code === 'PGRST116') {
                console.log('🔧 Creating user profile for dashboard...');
                const { data: newProfile, error: createError } = await supabase
                    .from('user_profiles')
                    .insert({ 
                        user_id, 
                        streak_days: 0, 
                        total_points: 0,
                        last_activity_date: todayISO 
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Create profile error:', createError);
                    throw createError;
                }
                
                console.log('✅ User profile created for dashboard:', newProfile);
                
                // Yeni oluşturulan profille devam et
                const profile = newProfile;
            } else {
                throw profileError;
            }
        }

        if (!profile) {
            console.error('❌ Profile is null after creation attempt');
            return res.status(500).json({ error: "Failed to create or fetch user profile" });
        }

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

        if (countError) {
            console.error('Questions count error:', countError);
            throw countError;
        }

        const result = {
            success: true,
            streak_days: profile.streak_days || 0,
            completed_today: dailyStat?.questions_answered_today || 0,
            total_points: profile.total_points || 0,
            total_questions_available: totalQuestionsAvailable || 0
        };

        console.log('✅ Dashboard stats fetched:', result);

        res.status(200).json(result);

    } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch dashboard stats', 
            details: error.message,
            user_id_debug: user_id
        });
    }
};

const getUserCourseStats = async (req, res) => {
    // DEBUG: User bilgisini logla
    console.log('🔍 Course Stats Request:', {
        user: req.user,
        user_id: req.user?.user_id,
        id: req.user?.id
    });

    const user_id = req.user?.user_id || req.user?.id; // Fallback ekle
    
    if (!user_id) {
        console.error('❌ No user_id found in course stats request');
        return res.status(400).json({ 
            error: 'User ID not found',
            message: 'Authentication failed - no user ID in request'
        });
    }

    try {
        console.log(`📈 Fetching course stats for user: ${user_id}`);

        const { data: courseStats, error: courseStatsError } = await supabase
            .from('course_progress')
            .select('course_type, total_questions_attempted, total_correct_answers, times_completed, highest_accuracy')
            .eq('user_id', user_id);

        if (courseStatsError) {
            console.error('Course stats error:', courseStatsError);
            throw courseStatsError;
        }

        const formattedStats = courseStats.map(stat => ({
            courseType: stat.course_type,
            completed: stat.times_completed || 0,
            accuracy: stat.total_questions_attempted > 0
                ? Math.round((stat.total_correct_answers / stat.total_questions_attempted) * 100)
                : 0,
        }));

        const result = {
            success: true,
            course_stats: formattedStats
        };

        console.log('✅ Course stats fetched:', result);

        res.status(200).json(result);

    } catch (error) {
        console.error('❌ Error fetching course stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch course stats', 
            details: error.message,
            user_id_debug: user_id
        });
    }
};

module.exports = {
    recordQuizSession,
    getUserDashboardStats,
    getUserCourseStats
};