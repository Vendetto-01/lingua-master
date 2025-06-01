import React from 'react'
import { difficultyUtils } from '../services/api'

const CourseCard = ({
  course,
  onStartCourse,
  className = ''
}) => {
  const {
    id,
    title,
    description,
    icon,
    buttonText,
    buttonColor,
    isActive,
    difficulty,
    questionsCount,
    difficultyLevel, // New: actual difficulty level for API
    features = [],
    stats = null
  } = course

  // EMOJI FIX: Eğer course.icon çince karakter ise, difficultyLevel'a göre düzelt
  const getFixedIcon = () => {
    // Eğer icon çince/japonca karakter ise ve difficultyLevel varsa
    if (difficultyLevel && (icon.includes('口') || icon.includes('識') || icon.includes('櫨') || icon.includes('決'))) {
      return difficultyUtils.getIcon(difficultyLevel);
    }
    // Manuel olarak bilinen bozuk iconları düzelt
    if (icon === '口識' || icon === '識') return '🎯'; // Intermediate
    if (icon === '口櫨' || icon === '櫨') return '🚀'; // Advanced
    if (icon === '決') return '🌈'; // Mixed
    if (icon === '験') return '🌱'; // Beginner
    
    // Normal emoji ise olduğu gibi döndür
    return icon;
  }

  const displayIcon = getFixedIcon();

  return (
    <div
      className={`card-elevated transition-all duration-300 relative ${
        isActive 
          ? 'hover:shadow-xl hover:-translate-y-2 cursor-pointer' 
          : 'opacity-75'
      } ${className}`}
      onClick={() => isActive && onStartCourse(id)}
    >
      {/* Coming Soon Badge */}
      {!isActive && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
          {questionsCount === 'Your History' || questionsCount === 'Mistakes Only' ? 'Coming Soon' : 'No Questions'}
        </div>
      )}

      {/* Course Icon and Title */}
      <div className="text-center mb-6">
        <div className={`text-6xl mb-4 transition-transform duration-300 ${
          isActive ? 'hover:scale-110' : ''
        }`}>
          {displayIcon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>

      {/* Course Stats */}
      {stats && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.completed || 0}</div>
              <div className="text-xs text-blue-600 uppercase tracking-wide">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.accuracy || '0%'}</div>
              <div className="text-xs text-green-600 uppercase tracking-wide">Accuracy</div>
            </div>
          </div>
        </div>
      )}

      {/* Course Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Difficulty:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            difficultyLevel ? difficultyUtils.getColorClass(difficultyLevel) :
            difficulty === 'Mixed' || difficulty === 'Mixed Levels' ? 'bg-purple-100 text-purple-700' :
            difficulty === 'Your Level' ? 'bg-green-100 text-green-700' :
            difficulty === 'Challenging' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {difficulty}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Questions:</span>
          <span className="font-medium text-gray-700">{questionsCount}</span>
        </div>

        {/* Progress bar for active courses */}
        {isActive && stats && stats.progress !== undefined && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{stats.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.progress || 0}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Features List */}
      {isActive && features.length > 0 && (
        <div className="mb-6">
          <ul className="space-y-2 text-sm text-gray-600">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Default Features for Legacy Support */}
      {isActive && features.length === 0 && (
        <div className="mb-6">
          <ul className="space-y-2 text-sm text-gray-600">
            {id === 'general' && (
              <>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Randomized questions
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Instant feedback
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Multiple difficulty levels
                </li>
              </>
            )}
            {id.startsWith('difficulty-') && (
              <>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Focused difficulty level
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Targeted learning
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Progressive skill building
                </li>
              </>
            )}
            {id === 'previous' && (
              <>
                <li className="flex items-center text-gray-400">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Track your history
                </li>
                <li className="flex items-center text-gray-400">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Review past answers
                </li>
              </>
            )}
            {id === 'incorrect' && (
              <>
                <li className="flex items-center text-gray-400">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Focus on mistakes
                </li>
                <li className="flex items-center text-gray-400">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Improve weak areas
                </li>
              </>
            )}
          </ul>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          isActive && onStartCourse(id)
        }}
        disabled={!isActive}
        className={`w-full ${buttonColor} transition-all duration-200 ${
          !isActive ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
        }`}
      >
        <span className="flex items-center justify-center space-x-2">
          <span>{buttonText}</span>
          {isActive && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </span>
      </button>

      {/* Motivational Quotes */}
      {isActive && (
        <div className="mt-4 text-center">
          {id === 'general' && (
            <p className="text-xs text-gray-500 italic">
              "Every question is a step towards mastery! 🚀"
            </p>
          )}
          {id.startsWith('difficulty-') && difficultyLevel === 'beginner' && (
            <p className="text-xs text-gray-500 italic">
              "Great choice for building foundations! 🌱"
            </p>
          )}
          {id.startsWith('difficulty-') && difficultyLevel === 'intermediate' && (
            <p className="text-xs text-gray-500 italic">
              "Perfect for advancing your skills! 🎯"
            </p>
          )}
          {id.startsWith('difficulty-') && difficultyLevel === 'advanced' && (
            <p className="text-xs text-gray-500 italic">
              "Ready for the challenge? Let's go! 🚀"
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default CourseCard