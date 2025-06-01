import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { questionsAPI, userStatsAPI, difficultyUtils, courseUtils } from '../services/api';
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
      const [difficultyResponse, dashboardResponse, userCoursesResponse] = await Promise.all([
        questionsAPI.getDifficultyLevels(),
        userStatsAPI.getUserDashboardStats(),
        userStatsAPI.getUserCourseStats()
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

    } catch (err) {
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
    } else if (courseId === 'weakness-training') {
      navigate('/quiz/weakness-training');
    } else {
      navigate(`/quiz/${courseId}`);
    }
  };

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
    icon: '🌈',
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
      buttonColor: 'btn-secondary',
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
      description: 'Focus on questions you struggled with to turn weaknesses into strengths.',
      icon: '🎯',
      buttonText: 'Coming Soon',
      buttonColor: 'btn-secondary',
      isActive: false,
      difficulty: 'Targeted',
      questionsCount: 'Smart Selection',
      features: [
        'Practice your incorrect answers',
        'Reinforce challenging vocabulary',
        'Personalized learning experience'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {quizResults.correct / quizResults.total >= 0.8 ? '🎉' :
                 quizResults.correct / quizResults.total >= 0.6 ? '👏' : '💪'}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>
              <p className="text-gray-600 mb-6">
                {quizResults.displayName} Level - Great job on completing the quiz!
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{quizResults.correct}/{quizResults.total}</div>
                  <div className="text-sm text-blue-600">Score</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {quizResults.total > 0 ? Math.round((quizResults.correct / quizResults.total) * 100) : 0}%
                  </div>
                  <div className="text-sm text-green-600">Accuracy</div>
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
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {getGreeting()}, {user?.email?.split('@')[0] || 'Learner'}! 👋
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
          {getMotivationalMessage()}
        </p>
        <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="text-primary-500">📚</span>
            <span>{dashboardStats.total_questions_available} questions available</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-green-500">🎯</span>
            <span>{difficultyLevels.length} difficulty levels</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500">🏆</span>
            <span>{dashboardStats.total_points} total points</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card text-center group hover:shadow-lg transition-all duration-200">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
          <div className="text-2xl font-bold text-primary-600 mb-2">
            {dashboardStats.total_questions_available || '-'}
          </div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Total Questions</div>
          <div className="text-xs text-gray-500 mt-1">Ready to practice</div>
        </div>
        
        <div className="card text-center group hover:shadow-lg transition-all duration-200">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎯</div>
          <div className="text-2xl font-bold text-success-600 mb-2">
            {dashboardStats.completed_today || 0}
          </div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Answered Today</div>
          <div className="text-xs text-gray-500 mt-1">Keep it up!</div>
        </div>
        
        <div className="card text-center group hover:shadow-lg transition-all duration-200">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🔥</div>
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {dashboardStats.streak_days || 0}
          </div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Day Streak</div>
          <div className="text-xs text-gray-500 mt-1">Keep learning daily</div>
        </div>
      </div>

      {/* Learning Paths Section */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Learning Path 🛤️
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Every expert was once a beginner. Pick the path that matches your current level or challenge yourself with mixed questions.
            Your journey to English mastery starts with a single question!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onStartCourse={handleStartCourse}
              className="h-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;