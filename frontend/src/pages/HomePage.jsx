import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { questionsAPI, difficultyUtils, courseUtils } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const HomePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [difficultyLevels, setDifficultyLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load difficulty levels on component mount
  useEffect(() => {
    loadDifficultyLevels()
  }, [])

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
    navigate(`/quiz/${courseType}`)
  }

  // Base courses - always available
  const baseCourses = [
    {
      id: 'general',
      title: 'General Quiz',
      description: 'Random questions from all difficulty levels to test your overall knowledge',
      icon: '🌈',
      buttonText: 'Start Mixed Quiz',
      buttonColor: 'btn-primary',
      isActive: true,
      difficulty: 'Mixed Levels',
      questionsCount: 'Unlimited',
      features: [
        'Questions from all levels',
        'Randomized difficulty',
        'Comprehensive learning'
      ]
    }
  ]

  // Generate difficulty-based courses
  const difficultyCourses = difficultyLevels.map(diff => ({
    id: courseUtils.generateCourseType(diff.level),
    title: `${difficultyUtils.getDisplayName(diff.level)} Level`,
    description: difficultyUtils.getDescription(diff.level),
    icon: difficultyUtils.getIcon(diff.level),
    buttonText: `Start ${difficultyUtils.getDisplayName(diff.level)}`,
    buttonColor: 'btn-primary',
    isActive: diff.count > 0,
    difficulty: difficultyUtils.getDisplayName(diff.level),
    questionsCount: `${diff.count} questions`,
    difficultyLevel: diff.level,
    features: [
      `${diff.count} available questions`,
      `${difficultyUtils.getDisplayName(diff.level)} difficulty level`,
      'Focused learning experience'
    ]
  }))

  // Future feature courses
  const futureCourses = [
    {
      id: 'previous',
      title: 'Previous Questions',
      description: 'Review questions you have answered before to reinforce your learning',
      icon: '📚',
      buttonText: 'Coming Soon',
      buttonColor: 'btn-secondary',
      isActive: false,
      difficulty: 'Your Level',
      questionsCount: 'Your History',
      features: [
        'Track your progress',
        'Review past answers',
        'Identify patterns'
      ]
    },
    {
      id: 'incorrect',
      title: 'Incorrect Questions',
      description: 'Practice questions you got wrong to improve your weak areas',
      icon: '🎯',
      buttonText: 'Coming Soon',
      buttonColor: 'btn-secondary',
      isActive: false,
      difficulty: 'Challenging',
      questionsCount: 'Mistakes Only',
      features: [
        'Focus on mistakes',
        'Targeted improvement',
        'Build confidence'
      ]
    }
  ]

  // Combine all courses
  const allCourses = [...baseCourses, ...difficultyCourses, ...futureCourses]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner size="large" text="Loading courses..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome back, {user?.email?.split('@')[0] || 'Student'}! 👋
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Ready to improve your English vocabulary? Choose your preferred difficulty level and start learning!
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadDifficultyLevels}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Stats Section (Placeholder for future) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">-</div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Questions Answered</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-success-600 mb-2">-</div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Correct Answers</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">-</div>
          <div className="text-sm text-gray-600 uppercase tracking-wide">Accuracy Rate</div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Choose Your Learning Path
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCourses.map((course) => (
            <div
              key={course.id}
              className={`card-elevated transition-all duration-200 relative ${
                course.isActive 
                  ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' 
                  : 'opacity-75'
              }`}
              onClick={() => course.isActive && handleStartQuiz(course.id)}
            >
              {/* Coming Soon Badge */}
              {!course.isActive && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                  {course.questionsCount === 'Your History' || course.questionsCount === 'Mistakes Only' ? 'Coming Soon' : 'No Questions'}
                </div>
              )}

              {/* Course Icon and Title */}
              <div className="text-center mb-6">
                <div className={`text-6xl mb-4 transition-transform duration-300 ${
                  course.isActive ? 'hover:scale-110' : ''
                }`}>
                  {course.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-600 leading-relaxed">{course.description}</p>
              </div>

              {/* Course Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Difficulty:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.difficultyLevel ? difficultyUtils.getColorClass(course.difficultyLevel) :
                    course.difficulty === 'Mixed Levels' ? 'bg-purple-100 text-purple-700' :
                    course.difficulty === 'Your Level' ? 'bg-green-100 text-green-700' :
                    course.difficulty === 'Challenging' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {course.difficulty}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Questions:</span>
                  <span className="font-medium text-gray-700">{course.questionsCount}</span>
                </div>
              </div>

              {/* Features List */}
              {course.features && (
                <div className="mb-6">
                  <ul className="space-y-2 text-sm text-gray-600">
                    {course.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className={`w-4 h-4 mr-2 ${course.isActive ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className={course.isActive ? '' : 'text-gray-400'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  course.isActive && handleStartQuiz(course.id)
                }}
                disabled={!course.isActive}
                className={`w-full ${course.buttonColor} transition-all duration-200 ${
                  !course.isActive ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>{course.buttonText}</span>
                  {course.isActive && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </span>
              </button>

              {/* Motivational Quote for Active Cards */}
              {course.isActive && course.id === 'general' && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 italic">
                    "Every question is a step towards mastery! 🚀"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="text-center bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          💪 Ready to Challenge Yourself?
        </h3>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          Consistent practice is the key to mastering English vocabulary. 
          Start with any difficulty level and build your confidence one question at a time!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => handleStartQuiz('general')}
            className="btn-primary text-lg px-8 py-4"
          >
            Start Mixed Quiz 🌈
          </button>
          {difficultyCourses.length > 0 && difficultyCourses[0].isActive && (
            <button
              onClick={() => handleStartQuiz(difficultyCourses[0].id)}
              className="btn-secondary text-lg px-8 py-4"
            >
              Try {difficultyUtils.getDisplayName(difficultyCourses[0].difficultyLevel)} {difficultyCourses[0].icon}
            </button>
          )}
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center mt-12 text-gray-500">
        <p className="text-sm">
          💡 Tip: Start with your comfort level and gradually increase difficulty for the best learning experience!
        </p>
      </div>
    </div>
  )
}

export default HomePage