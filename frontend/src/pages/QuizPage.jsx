import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { questionsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const QuizPage = () => {
  const { courseType } = useParams()
  const navigate = useNavigate()

  // State management
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })

  // Get current question
  const currentQuestion = questions[currentQuestionIndex]

  // Load questions on component mount
  useEffect(() => {
    loadQuestions()
  }, [courseType])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      setError('')

      if (courseType === 'general') {
        const response = await questionsAPI.getRandomQuestions(10)
        if (response.success && response.questions) {
          setQuestions(response.questions)
        } else {
          setError('Failed to load questions')
        }
      } else {
        // Handle other course types (placeholder)
        setError('This course type is not yet available')
      }
    } catch (err) {
      console.error('Error loading questions:', err)
      setError(err.message || 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex) => {
    if (showResult) return // Prevent changing answer after submission
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return

    try {
      setSubmitting(true)
      const response = await questionsAPI.checkAnswer(
        currentQuestion.id,
        selectedAnswer
      )

      if (response.success) {
        setIsCorrect(response.isCorrect)
        setCorrectAnswerIndex(response.correctAnswerIndex)
        setShowResult(true)

        // Update score
        setScore(prev => ({
          correct: prev.correct + (response.isCorrect ? 1 : 0),
          total: prev.total + 1
        }))
      } else {
        setError('Failed to check answer')
      }
    } catch (err) {
      console.error('Error checking answer:', err)
      setError(err.message || 'Failed to check answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setIsCorrect(false)
      setCorrectAnswerIndex(null)
    } else {
      // Quiz finished
      navigate('/', { 
        state: { 
          quizCompleted: true, 
          score: { ...score, correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 }
        } 
      })
    }
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading questions..." />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={handleBackToHome} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  // No questions state
  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Questions Available</h2>
          <p className="text-gray-600 mb-6">There are no questions available for this course type.</p>
          <button onClick={handleBackToHome} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBackToHome}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Home
          </button>
          <div className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Score */}
        <div className="text-center mt-4">
          <span className="text-sm text-gray-600">
            Score: {score.correct}/{score.total}
            {score.total > 0 && (
              <span className="ml-2">
                ({Math.round((score.correct / score.total) * 100)}%)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="card-elevated mb-8">
        {/* Paragraph (if exists) */}
        {currentQuestion.paragraph && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 leading-relaxed">
              {currentQuestion.paragraph}
            </p>
          </div>
        )}

        {/* Question */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
            {currentQuestion.question_text}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option, index) => {
            let optionClass = 'quiz-option'
            
            if (showResult) {
              if (index === correctAnswerIndex) {
                optionClass += ' quiz-option-correct'
              } else if (index === selectedAnswer && !isCorrect) {
                optionClass += ' quiz-option-incorrect'
              }
            } else if (selectedAnswer === index) {
              optionClass += ' quiz-option-selected'
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={optionClass}
              >
                <div className="flex items-center">
                  <span className="font-medium text-gray-500 mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="text-left">{option}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!showResult ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null || submitting}
              className="flex-1 btn-primary flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Checking...</span>
                </>
              ) : (
                <span>Submit Answer</span>
              )}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="flex-1 btn-primary"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          )}
        </div>

        {/* Result Message */}
        {showResult && (
          <div className={`mt-6 p-4 rounded-lg ${
            isCorrect 
              ? 'bg-success-50 border border-success-200' 
              : 'bg-danger-50 border border-danger-200'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">
                {isCorrect ? '✅' : '❌'}
              </span>
              <div>
                <p className={`font-medium ${
                  isCorrect ? 'text-success-800' : 'text-danger-800'
                }`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-gray-600 mt-1">
                    The correct answer was: {currentQuestion.options[correctAnswerIndex]}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizPage