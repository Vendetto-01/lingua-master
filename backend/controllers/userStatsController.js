// backend/controllers/userStatsController.js (UPDATED for words table)
const supabase = require('../config/supabase');

// Helper function to calculate streak
const calculateStreak = (currentStreak, lastActivityDateStr) => {
    if (!lastActivityDateStr) return 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivityDate = new Date(lastActivityDateStr);
    lastActivityDate.setHours(0, 0, 0, 0);

    const diffTime = today - lastActivityDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return currentStreak + 1;
    } else if (diffDays === 0) {
        return currentStreak;
    } else {
        return 1;
    }
};

const recordQuizSession = async (req, res) => {
    console.log('🔍 Record Quiz Session Request:', {
        user: req.user,
        user_id: req.user?.user_id,
        id: req.user?.id
    });

    const user_id = req.user?.user_id || req.user?.id;
    
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
        // NOTE: Bu tablo artık words.id'leri referans ediyor
        if (questions_answered_details && questions_answered_details.length > 0) {
            const answersToInsert = questions_answered_details.map(answer => ({
                session_id: sessionData.session_id,
                user_id,
                question_id: answer.question_id, // Bu artık word_id'yi temsil ediyor
                selected_original_letter: answer.selected_original_letter,
                is_correct: answer.is_correct
            }));
            
            const { error: answersError } = await supabase
                .from('question_attempts')
                .insert(answersToInsert);

            if (answersError) {
                console.error('Answers insert error:', answersError);
                throw answersError;
            }

            console.log('✅ Quiz answers recorded:', answersToInsert.length);

            // OTOMATİK ZAYIFLIK LİSTESİNE EKLEME (YANLIŞ CEVAPLAR İÇİN)
            for (const answer of questions_answered_details) {
                if (!answer.is_correct) {
                    const word_id = answer.question_id;

                    // word_id'nin null veya undefined olmadığını kontrol et
                    if (word_id == null) { // Hem null hem de undefined kontrolü yapar
                        console.warn(`Skipping weakness item processing for user ${user_id} due to null/undefined word_id. Answer details:`, answer);
                        continue; // Bu cevabı atla, sonrakiyle devam et
                    }

                    // Önce mevcut kaydı kontrol et (manuel olarak çıkarılmış mı diye)
                    const { data: existingItem, error: fetchError } = await supabase
                        .from('user_weakness_items')
                        .select('status')
                        .eq('user_id', user_id)
                        .eq('word_id', word_id)
                        .single();

                    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
                        console.error(`Error fetching weakness item for user ${user_id}, word ${word_id}:`, fetchError);
                        // Bu hatayı ana hataya atmadan devam et, quiz kaydını engellemesin
                        continue;
                    }

                    if (existingItem && existingItem.status === 'removed_manual') {
                        // Kullanıcı manuel olarak çıkardıysa, dokunma
                        console.log(`User ${user_id} manually removed word ${word_id}, not auto-adding.`);
                        continue;
                    }

                    // Kayıt yoksa veya manuel çıkarılmamışsa ekle/güncelle (status: active_auto)
                    const { error: upsertError } = await supabase
                        .from('user_weakness_items')
                        .upsert(
                            {
                                user_id,
                                word_id,
                                status: 'active_auto',
                                updated_at: new Date().toISOString(),
                                // added_at: upsert bunu otomatik yönetir (eğer yeni kayıt ise) veya mevcut kalır.
                                // Supabase upsert'te added_at'i sadece yeni kayıtta set etmek için özel bir şey yapmaya gerek yok,
                                // eğer sütun tanımında DEFAULT now() varsa ve insert ise alır, update ise dokunulmaz (eğer explicit verilmezse).
                                // Biz burada updated_at'i veriyoruz, added_at'i vermiyoruz, böylece yeni ise default'u alır.
                            },
                            {
                                onConflict: 'user_id, word_id',
                            }
                        );

                    if (upsertError) {
                        console.error(`Error upserting auto weakness item for user ${user_id}, word ${word_id}:`, upsertError);
                        // Bu hatayı da ana hataya atmadan devam et
                    } else {
                        console.log(`Word ${word_id} auto-added/updated to weakness list for user ${user_id}.`);
                    }
                }
            }
        }

        // 3. user_profiles güncelle
        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('total_points, streak_days, last_activity_date')
            .eq('user_id', user_id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            
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
            const newPoints = (userProfile.total_points || 0) + score_correct;
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

        if (courseProgressError && courseProgressError.code !== 'PGRST116') {
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
    console.log('🔍 Dashboard Stats Request:', {
        user: req.user,
        user_id: req.user?.user_id,
        id: req.user?.id
    });

    const user_id = req.user?.user_id || req.user?.id;
    
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
            } else {
                throw profileError;
            }
        }

        const { data: dailyStat, error: dailyStatError } = await supabase
            .from('daily_stats')
            .select('questions_answered_today')
            .eq('user_id', user_id)
            .eq('stat_date', todayISO)
            .single();

        if (dailyStatError && dailyStatError.code !== 'PGRST116') {
            throw dailyStatError;
        }

        // UPDATED: Get total word count from words table instead of questions
        const { count: totalWordsAvailable, error: countError } = await supabase
            .from('words')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Words count error:', countError);
            throw countError;
        }

        const result = {
            success: true,
            streak_days: profile?.streak_days || 0,
            completed_today: dailyStat?.questions_answered_today || 0,
            total_points: profile?.total_points || 0,
            total_questions_available: totalWordsAvailable || 0, // Now based on words count
            total_words_available: totalWordsAvailable || 0 // NEW: Add explicit words count
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
    console.log('🔍 Course Stats Request:', {
        user: req.user,
        user_id: req.user?.user_id,
        id: req.user?.id
    });

    const user_id = req.user?.user_id || req.user?.id;
    
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