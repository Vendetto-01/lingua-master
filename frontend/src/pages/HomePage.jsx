import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const HomePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleStartQuiz = (courseType) => {
    navigate(`/quiz/${courseType}`)
  }

  const courses = [
    {
      id: 'general',
      title: 'General Quiz',
      description: 'Random questions to test your English vocabulary knowledge',
      icon: '🎯',
      buttonText: 'Start Quiz',
      buttonColor: 'btn-primary',
      isActive: true,
      difficulty: 'Mixed',
      questionsCount: 'Unlimited'
    },
    {
      id: 'previous',
      title: 'Previous Questions',
      description: 'Review questions you have answered before',
      icon: '📚',
      buttonText: 'Coming Soon',
      buttonColor: 'btn-secondary',
      isActive: false,
      difficulty: 'Your Level',
      questionsCount: 'Your History'
    },
    {
      id: 'incorrect',
      title: 'Incorrect Questions',
      description: 'Practice questions you got wrong to improve',
      icon: '🎯',
      buttonText: 'Coming Soon',
      buttonColor: 'btn-secondary',
      isActive: false,
      difficulty: 'Challenging',
      questionsCount: 'Mistakes Only'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome back, {user?.email?.split('@')[0] || 'Student'}! 👋
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Ready to improve your English vocabulary? Choose a course below and start learning!
        </p>
      </div>

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
          {courses.map((course) => (
            <div
              key={course.id}
              className={`card-elevated transition-all duration-200 ${
                course.isActive 
                  ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' 
                  : 'opacity-75'
              }`}
            >
              {/* Course Icon */}
              <div className="text-center mb-4">
                <div className="text-6xl mb-3">{course.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
              </div>

              {/* Course Details */}
              <div className="space-y-3 mb-6">
                <p className="text-gray-600 text-center">{course.description}</p>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Difficulty:</span>
                  <span className="font-medium text-gray-700">{course.difficulty}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Questions:</span>
                  <span className="font-medium text-gray-700">{course.questionsCount}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => course.isActive && handleStartQuiz(course.id)}
                disabled={!course.isActive}
                className={`w-full ${course.buttonColor} ${
                  !course.isActive ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {course.buttonText}
              </button>

              {/* Coming Soon Badge */}
              {!course.isActive && (
                <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  Coming Soon
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Motivation Section */}
      <div className="text-center bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          💪 Ready to Challenge Yourself?
        </h3>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          Consistent practice is the key to mastering English vocabulary. 
          Start with the General Quiz and build your confidence one question at a time!
        </p>
        <button
          onClick={() => handleStartQuiz('general')}
          className="btn-primary text-lg px-8 py-4"
        >
          Start Learning Now! 🚀
        </button>
      </div>

      {/* Footer Note */}
      <div className="text-center mt-12 text-gray-500">
        <p className="text-sm">
          💡 Tip: Regular practice for just 10 minutes a day can significantly improve your vocabulary!
        </p>
      </div>
    </div>
  )
}

export default HomePage