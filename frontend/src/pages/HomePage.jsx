import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { questionsAPI, userStatsAPI, difficultyUtils } from '../services/api'; // Removed courseUtils
import { courseUtils } from '../utils/courseUtils'; // Added courseUtils import
import LoadingSpinner from '../components/LoadingSpinner';
import CourseCard from '../components/CourseCard';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // State management
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    streak_days: 0,
    completed_today: 0,
    total_points: 0,
    total_questions_available: 0
  });
  const [userCourseStats, setUserCourseStats] = useState([]);
  const [weaknessCourseActive, setWeaknessCourseActive] = useState(false); // State for Weakness Training
  const [reportedQuestionsCourseActive, setReportedQuestionsCourseActive] = useState(false); // State for Reported Questions

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();

    // Handle quiz completion results from navigation state
    if (location.state?.quizCompleted && location.state?.score) {
      setQuizResults(location.state.score);
      setShowQuizResults(true);
      // Clean up navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');

    try {
      // Parallel API calls for better performance
      const [
        difficultyResponse,
        dashboardResponse,
        userCoursesResponse,
        weaknessCountResponse,
        userReportedQuestionsResponse // Fetch user's reported questions (check for availability)
      ] = await Promise.all([
        questionsAPI.getDifficultyLevels(),
        userStatsAPI.getUserDashboardStats(),
        userStatsAPI.getUserCourseStats(),
        questionsAPI.getWeaknessItemsCount(),
        questionsAPI.getUserReportedQuestions({ limit: 1 }) // Fetch 1 to check if any exist
      ]);

      // Handle difficulty levels
      if (difficultyResponse.success) {
        setDifficultyLevels(difficultyResponse.difficulties || []);
      } else {
        console.warn('Failed to load difficulty levels:', difficultyResponse.message);
        setDifficultyLevels([]);
      }

      // Handle dashboard stats
      if (dashboardResponse.success) {
        setDashboardStats({
          streak_days: dashboardResponse.streak_days || 0,
          completed_today: dashboardResponse.completed_today || 0,
          total_points: dashboardResponse.total_points || 0,
          total_questions_available: dashboardResponse.total_questions_available || 0
        });
      } else {
        console.warn('Failed to load dashboard stats:', dashboardResponse.message);
      }

      // Handle course stats
      if (userCoursesResponse.success) {
        setUserCourseStats(userCoursesResponse.course_stats || []);
      } else {
        console.warn('Failed to load user course stats:', userCoursesResponse.message);
      }

      // Handle weakness items count
      if (weaknessCountResponse.success && weaknessCountResponse.count > 0) {
        setWeaknessCourseActive(true);
      } else {
        setWeaknessCourseActive(false);
        if (!weaknessCountResponse.success) {
            console.warn('Failed to load weakness items count:', weaknessCountResponse.message);
        }
      }
      
      // Handle reported questions course activation
      if (userReportedQuestionsResponse.success && userReportedQuestionsResponse.questions && userReportedQuestionsResponse.questions.length > 0) {
        setReportedQuestionsCourseActive(true);
      } else {
        setReportedQuestionsCourseActive(false);
        if (!userReportedQuestionsResponse.success) {
            console.warn('Failed to load user reported questions for count:', userReportedQuestionsResponse.message);
        }
      }

    } catch (err) { // Added missing opening brace
      console.error('Error loading homepage data:', err);
      setError(err.message || 'Failed to load essential data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = (courseId) => {
    setShowQuizResults(false);
    
    if (courseId === 'learning-history') {
      navigate('/learning-history');
    } else if (courseId === 'weakness-training' && weaknessCourseActive) { // Check if active
      navigate('/quiz/weakness-training');
    } else if (courseId === 'reported-questions' && reportedQuestionsCourseActive) { // Check if active
      navigate('/quiz/reported-questions');
    } else if (courseId !== 'weakness-training' && courseId !== 'reported-questions') { // For other courses
      navigate(`/quiz/${courseId}`);
    }
    // If weakness or reported course is clicked but not active, do nothing or show a message (handled by button disabled state)
  };

  // Removed the erroneous duplicate/empty dismissResults definition that was here

  const dismissResults = () => {
    setShowQuizResults(false);
    setQuizResults(null);
  };

  // Helper functions
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Ready to expand your vocabulary today? 📚",
      "Every word you learn is a step towards fluency! 🚀",
      "Let's make today a learning adventure! ⭐",
      "Your English journey continues here! 🌟",
      "Time to unlock new words and meanings! 🔓"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Course configuration
  const totalQuestionsInSystem = dashboardStats.total_questions_available;

  const baseCourses = [{
    id: 'general',
    title: 'Mixed Challenge',
    description: 'Test your knowledge with questions from all difficulty levels - the perfect way to challenge yourself!',
    icon: '🎯', // Emoji değiştirildi
    buttonText: 'Start Mixed Quiz',
    buttonColor: 'btn-primary',
    isActive: totalQuestionsInSystem > 0,
    difficulty: 'Mixed Levels',
    questionsCount: totalQuestionsInSystem > 0 ? `${totalQuestionsInSystem} total` : 'No questions',
    features: [
      'Questions from all difficulty levels',
      'Randomized selection for variety',
      'Comprehensive vocabulary practice',
      'Perfect for general improvement'
    ],
  }];

  const difficultyCourses = difficultyLevels
    .filter(diff => diff.count > 0)
    .map(diff => ({
      id: courseUtils.generateCourseType(diff.level),
      title: `${difficultyUtils.getDisplayName(diff.level)} Path`,
      description: `${difficultyUtils.getDescription(diff.level)} - ${diff.count} carefully selected questions await you.`,
      icon: difficultyUtils.getIcon(diff.level),
      buttonText: `Start ${difficultyUtils.getDisplayName(diff.level)}`,
      buttonColor: diff.level === 'beginner' ? 'btn-success' : 
                   diff.level === 'advanced' ? 'bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200' : 
                   'btn-primary',
      isActive: true,
      difficulty: difficultyUtils.getDisplayName(diff.level),
      questionsCount: `${diff.count} questions`,
      difficultyLevel: diff.level,
      features: [
        `${diff.count} handpicked questions`,
        `${difficultyUtils.getDisplayName(diff.level)}-level vocabulary`,
        'Focused learning experience',
        'Track your progress'
      ],
    }));

  const otherCourses = [
    {
      id: 'learning-history',
      title: 'Learning History',
      description: 'Review your past questions and track your learning journey over time.',
      icon: '📈',
      buttonText: 'View History',
      buttonColor: 'bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200',
      isActive: true,
      difficulty: 'Review',
      questionsCount: 'Your History',
      features: [
        'See all your answered questions',
        'Check your previous answers',
        'Review explanations again'
      ]
    },
    {
      id: 'weakness-training',
      title: 'Weakness Training',
      description: 'Focus on questions you struggled with or manually added to turn weaknesses into strengths.',
      icon: '💪', // Updated icon
      buttonText: weaknessCourseActive ? 'Start Training' : 'No Items Yet',
      buttonColor: weaknessCourseActive ? 'bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200' : 'btn-disabled', // Use a specific color for active, and a disabled style
      isActive: weaknessCourseActive,
      difficulty: 'Personalized', // Updated difficulty
      questionsCount: weaknessCourseActive ? 'Your Focus List' : 'Empty', // Dynamic count/text
      features: [
        'Practice your incorrect answers',
        'Reinforce challenging vocabulary',
        'Personalized learning experience'
      ]
    },
    {
      id: 'reported-questions',
      title: 'My Reported Questions',
      description: 'Review questions you have previously reported and see their status or re-evaluate them.',
      icon: '🚩',
      buttonText: reportedQuestionsCourseActive ? 'Review Reported' : 'No Reported Yet',
      buttonColor: reportedQuestionsCourseActive ? 'btn-danger' : 'btn-disabled', // btn-info -> btn-danger olarak değiştirildi
      isActive: reportedQuestionsCourseActive,
      difficulty: 'Review',
      questionsCount: reportedQuestionsCourseActive ? 'Your Reports' : 'Empty',
      features: [
        'See questions you reported',
        'Re-evaluate or dismiss from this list',
        'Helps track issue resolution (future)'
      ]
    },
  ];

  // Combine all courses with user stats
  const allCourses = [...baseCourses, ...difficultyCourses, ...otherCourses].map(course => {
    const stats = userCourseStats.find(s => s.courseType === course.id);
    return {
      ...course,
      stats: stats ? { 
        completed: stats.completed, 
        accuracy: `${stats.accuracy}%`, 
        progress: 0 
      } : { 
        completed: 0, 
        accuracy: '0%', 
        progress: 0 
      }
    };
  });

  const personalCourseIds = ['learning-history', 'weakness-training', 'reported-questions'];
  const personalCourses = allCourses.filter(course => personalCourseIds.includes(course.id));
  const generalCourses = allCourses.filter(course => !personalCourseIds.includes(course.id));

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner size="large" text="Loading your learning dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Quiz Results Modal */}
      {showQuizResults && quizResults && (
        <div className="fixed inset-0 bg-black bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-slide-up dark:bg-slate-800">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {quizResults.correct / quizResults.total >= 0.8 ? '🎉' :
                 quizResults.correct / quizResults.total >= 0.6 ? '👏' : '💪'}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100">Quiz Complete!</h3>
              <p className="text-gray-600 mb-6 dark:text-gray-300">
                {quizResults.displayName} Level - Great job on completing the quiz!
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 dark:bg-blue-900 dark:bg-opacity-50">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{quizResults.correct}/{quizResults.total}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Score</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 dark:bg-green-900 dark:bg-opacity-50">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                    {quizResults.total > 0 ? Math.round((quizResults.correct / quizResults.total) * 100) : 0}%
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Accuracy</div>
                </div>
              </div>
              <button onClick={dismissResults} className="btn-primary w-full">
                Continue Learning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 dark:text-gray-100">
          {getGreeting()}, {user?.email?.split('@')[0] || 'Learner'}! 👋
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6 dark:text-gray-300">
          {getMotivationalMessage()}
        </p>
        <div className="flex justify-center items-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <span className="text-primary-500 dark:text-primary-400">📚</span>
            <span>{dashboardStats.total_questions_available} questions available</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-green-500 dark:text-green-400">🎯</span>
            <span>{difficultyLevels.length} difficulty levels</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500 dark:text-yellow-400">🏆</span>
            <span>{dashboardStats.total_points} total points</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900 dark:bg-opacity-30 dark:border-red-700">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3 dark:text-red-400">⚠️</span>
            <div>
              <p className="text-red-700 font-medium dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Stats Cards - .card class from index.css handles dark mode bg/border */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card text-center group hover:shadow-lg transition-all duration-200 dark:hover:shadow-primary-500/20">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
          <div className="text-2xl font-bold text-primary-600 mb-2 dark:text-primary-400">
            {dashboardStats.total_questions_available || '-'}
          </div>
          <div className="text-sm text-gray-600 uppercase tracking-wide dark:text-gray-300">Total Questions</div>
          <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">Ready to practice</div>
        </div>
        
        <div className="card text-center group hover:shadow-lg transition-all duration-200 dark:hover:shadow-success-500/20">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎯</div>
          <div className="text-2xl font-bold text-success-600 mb-2 dark:text-success-400">
            {dashboardStats.completed_today || 0}
          </div>
          <div className="text-sm text-gray-600 uppercase tracking-wide dark:text-gray-300">Answered Today</div>
          <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">Keep it up!</div>
        </div>
        
        <div className="card text-center group hover:shadow-lg transition-all duration-200 dark:hover:shadow-orange-500/20">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🔥</div>
          <div className="text-2xl font-bold text-orange-600 mb-2 dark:text-orange-400">
            {dashboardStats.streak_days || 0}
          </div>
          <div className="text-sm text-gray-600 uppercase tracking-wide dark:text-gray-300">Day Streak</div>
          <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">Keep learning daily</div>
        </div>
      </div>

      {/* Learning Paths Section */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-gray-100">
            Choose Your Learning Path 🛤️
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto dark:text-gray-300">
            Every expert was once a beginner. Pick the path that matches your current level or challenge yourself with mixed questions.
            Your journey to English mastery starts with a single question!
          </p>
        </div>

        {/* General Courses Section */}
        {generalCourses.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3 pl-2 border-l-4 border-green-500 dark:text-gray-200 dark:border-green-400">
              Genel Pratik Alanları 🌍
            </h3>
            <p className="text-gray-600 mb-6 ml-3 dark:text-gray-300">
              Farklı zorluk seviyelerinde pratik yaparak kelime dağarcığınızı genişletin.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generalCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onStartCourse={handleStartCourse}
                  className="h-full" // Ensure cards stretch if needed
                />
              ))}
            </div>
          </div>
        )}

        {/* Personal Courses Section */}
        {personalCourses.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3 pl-2 border-l-4 border-sky-500 dark:text-gray-200 dark:border-sky-400">
              Kişisel Gelişim Alanınız 🚀
            </h3>
            <p className="text-gray-600 mb-6 ml-3 dark:text-gray-300">
              Öğrenme geçmişinizi takip edin ve zayıf yönlerinizi güçlendirin.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onStartCourse={handleStartCourse}
                  className="h-full" // Ensure cards stretch if needed
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;