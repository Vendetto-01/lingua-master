import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { questionsAPI, difficultyUtils, courseUtils } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import CourseCard from '../components/CourseCard'

const HomePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [difficultyLevels, setDifficultyLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showQuizResults, setShowQuizResults] = useState(false)
  const [quizResults, setQuizResults] = useState(null)

  // Load difficulty levels on component mount
  useEffect(() => {
    loadDifficultyLevels()
    
    // Check if we have quiz results from navigation state
    if (location.state?.quizCompleted && location.state?.score) {
      setQuizResults(location.state.score)
      setShowQuizResults(true)
      
      // Clear the navigation state to prevent showing results on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const loadDifficultyLevels = async () => {
    try {
      setLoading(true)
      const response = await questionsAPI.getDifficultyLevels()
      if (response.success) {
        setDifficultyLevels(response.difficulties)
      }
    } catch (err) {
      console.error('Error loading difficulty levels:', err)
      setError('Failed to load difficulty levels')
    } finally {
      setLoading(false)
    }
  }

  const handleStartQuiz = (courseType) => {
    setShowQuizResults(false) // Hide results when starting new quiz
    navigate(`/quiz/${courseType}`)
  }

  const dismissResults = () => {
    setShowQuizResults(false)
    setQuizResults(null)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const getMotivationalMessage = () => {
    const messages = [
      "Ready to expand your vocabulary today? 📚",
      "Every word you learn is a step towards fluency! 🚀",
      "Let's make today a learning adventure! ⭐",
      "Your English journey continues here! 🌟",
      "Time to unlock new words and meanings! 🔓"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  // Calculate total questions available
  const totalQuestionsAvailable = difficultyLevels.reduce((sum, level) => sum + level.count, 0)

  // Base courses - always available
  const baseCourses = [
    {
      id: 'general',
      title: 'Mixed Challenge',
      description: 'Test your knowledge with questions from all difficulty levels - the perfect way to challenge yourself!',
      icon: '🌈',
      buttonText: 'Start Mixed Quiz',
      buttonColor: 'btn-primary',
      isActive: totalQuestionsAvailable > 0,
      difficulty: 'Mixed Levels',
      questionsCount: totalQuestionsAvailable > 0 ? `${totalQuestionsAvailable} total` : 'No questions',
      features: [
        'Questions from all difficulty levels',
        'Randomized selection for variety',
        'Comprehensive vocabulary practice',
        'Perfect for general improvement'
      ],
      stats: {
        completed: 0, // This would come from user data
        accuracy: '-%',
        progress: 0
      }
    }
  ]

  // Generate difficulty-based courses
  const difficultyCourses = difficultyLevels
    .filter(diff => diff.count > 0) // Only show levels with questions
    .map(diff => ({
      id: courseUtils.generateCourseType(diff.level),
      title: `${difficultyUtils.getDisplayName(diff.level)} Path`,
      description: `${difficultyUtils.getDescription(diff.level)} - ${diff.count} carefully selected questions await you.`,
      icon: difficultyUtils.getIcon(diff.level),
      buttonText: `Start ${difficultyUtils.getDisplayName(diff.level)}`,
      buttonColor: diff.level === 'beginner' ? 'btn-success' : diff.level === 'advanced' ? 'bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200' : 'btn-primary',
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
      stats: {
        completed: 0, // This would come from user data
        accuracy: '-%',
        progress: 0
      }
    }))

  // Future feature courses
  const futureCourses = [
    {
      id: 'previous',
      title: 'Learning History',
      description: 'Review your past questions and track your learning journey over time.',
      icon: '📈',
      buttonText: 'Coming Soon',
      buttonColor: 'btn-secondary',
      isActive: false,
      difficulty: 'Adaptive',
      questionsCount: 'Your History',
      features: [
        'Complete question history',
        'Performance analytics',
        'Learning patterns insights',
        'Progress over time'
      ]
    },
    {
      id: 'incorrect',
      title: 'Weakness Training',
      description: 'Focus on questions you struggled with to turn weaknesses into strengths.',
      icon: '🎯',
      buttonText: 'Coming Soon',
      buttonColor: 'btn-secondary',
      isActive: false,
      difficulty: 'Targeted',
      questionsCount: 'Smart Selection',
      features: [
        'AI-powered weakness detection',
        'Targeted practice sessions',
        'Confidence building exercises',
        'Spaced repetition system'
      ]
    },
    {
      id: 'daily',
      title: 'Daily Challenge',
      description: 'Start your day with a curated set of questions tailored to your level.',
      icon: '☀️',
      buttonText: 'Coming Soon',
      buttonColor: 'btn-secondary',
      isActive: false,
      difficulty: 'Daily Mix',
      questionsCount: '10 per day',
      features: [
        'Fresh questions daily',
        'Streak tracking',
        'Achievement badges',
        'Leaderboard competition'
      ]
    }
  ]

  // Combine all courses
  const allCourses = [...baseCourses, ...difficultyCourses, ...futureCourses]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner size="large" text="Loading your learning dashboard..." />
      </div>
    )
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
                    {Math.round((quizResults.correct / quizResults.total) * 100)}%
                  </div>
                  <div className="text-sm text-green-600">Accuracy</div>
                </div>
              </div>

              <button
                onClick={dismissResults}
                className="btn-primary w-full"
              >
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
        
        {/* Quick Stats Row */}
        <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="text-primary-500">📚</span>
            <span>{totalQuestionsAvailable} questions available</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-green-500">🎯</span>
            <span>{difficultyLevels.length} difficulty levels</span>
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
              <button 
                onClick={loadDifficultyLevels}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card text-center group hover:shadow-lg transition-all duration-200">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
          <div className="text-2xl font-bold text-primary-600 mb-2">
            {totalQuestionsAvailable || '-'}
          </div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Total Questions</div>
          <div className="text-xs text-gray-500 mt-1">Ready to practice</div>
        </div>
        
        <div className="card text-center group hover:shadow-lg transition-all duration-200">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎯</div>
          <div className="text-2xl font-bold text-success-600 mb-2">0</div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Completed Today</div>
          <div className="text-xs text-gray-500 mt-1">Start your streak!</div>
        </div>
        
        <div className="card text-center group hover:shadow-lg transition-all duration-200">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🔥</div>
          <div className="text-2xl font-bold text-orange-600 mb-2">0</div>
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
              onStartCourse={handleStartQuiz}
              className="h-full"
            />
          ))}
        </div>
      </div>

      {/* No Questions Available Warning */}
      {totalQuestionsAvailable === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <span className="text-yellow-500 text-2xl mr-4">⚠️</span>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Questions Available</h3>
              <p className="text-yellow-700">
                It looks like there are no questions in the database yet. Please contact your administrator to add some questions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Section */}
      {totalQuestionsAvailable > 0 && (
        <div className="text-center bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-2xl p-8 border border-primary-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            🚀 Ready for a Quick Challenge?
          </h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Consistent practice is the secret to vocabulary mastery. Whether you have 5 minutes or an hour, 
            every question brings you closer to fluency. Start where you feel comfortable and grow from there!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => handleStartQuiz('general')}
              className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 group"
              disabled={totalQuestionsAvailable === 0}
            >
              <span>🌈 Start Mixed Quiz</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            
            {difficultyCourses.length > 0 && (
              <button
                onClick={() => handleStartQuiz(difficultyCourses[0].id)}
                className="btn-secondary text-lg px-8 py-4 flex items-center space-x-2"
              >
                <span>{difficultyCourses[0].icon} Try {difficultyUtils.getDisplayName(difficultyCourses[0].difficultyLevel)}</span>
              </button>
            )}
          </div>
          
          {/* Learning Tip */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 text-xl">💡</span>
              <div className="text-left">
                <h4 className="font-semibold text-blue-900 mb-1">Pro Tip</h4>
                <p className="text-blue-800 text-sm">
                  Start with your comfort level and gradually increase difficulty. The best learning happens 
                  when you're challenged but not overwhelmed. Aim for 70-80% accuracy for optimal growth!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Inspiration */}
      <div className="text-center mt-12 p-6 bg-gray-50 rounded-xl">
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-600 italic mb-2">
            "The limits of my language mean the limits of my world." - Ludwig Wittgenstein
          </p>
          <p className="text-sm text-gray-500">
            Every new word opens up new possibilities. Keep learning, keep growing! 🌱
          </p>
        </div>
      </div>
    </div>
  )
}

export default HomePage