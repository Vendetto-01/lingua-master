import React from 'react'

const QuestionCard = ({
  question,
  selectedAnswer,
  showResult,
  isCorrect,
  correctAnswerIndex,
  correctAnswerText, // 🆕 NEW: From API response
  explanation, // 🆕 NEW: From API response
  onAnswerSelect,
  onSubmitAnswer,
  onNextQuestion,
  submitting,
  currentIndex,
  totalQuestions
}) => {
  if (!question) return null

  return (
    <div className="card-elevated">
      {/* Question Progress */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          Question {currentIndex + 1} of {totalQuestions}
        </div>
        <div className="text-sm font-medium text-primary-600">
          {Math.round(((currentIndex + 1) / totalQuestions) * 100)}% Complete
        </div>
      </div>

      {/* Paragraph Context (if exists) */}
      {question.paragraph && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-2">
              Context
            </div>
            <p className="text-gray-700 leading-relaxed italic">
              "{question.paragraph}"
            </p>
          </div>
        </div>
      )}

      {/* Main Question */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-relaxed">
          {question.question_text}
        </h2>
      </div>

      {/* Answer Options */}
      <div className="space-y-3 mb-8">
        {question.options.map((option, index) => {
          let optionClass = 'quiz-option text-left'
          let iconClass = 'w-6 h-6 mr-3 flex-shrink-0'
          let icon = null

          if (showResult) {
            if (index === correctAnswerIndex) {
              optionClass += ' quiz-option-correct'
              icon = (
                <div className={`${iconClass} bg-success-500 rounded-full flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )
            } else if (index === selectedAnswer && !isCorrect) {
              optionClass += ' quiz-option-incorrect'
              icon = (
                <div className={`${iconClass} bg-danger-500 rounded-full flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )
            } else {
              icon = (
                <div className={`${iconClass} bg-gray-200 rounded-full flex items-center justify-center`}>
                  <span className="text-gray-600 text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
              )
            }
          } else {
            if (selectedAnswer === index) {
              optionClass += ' quiz-option-selected'
              icon = (
                <div className={`${iconClass} bg-primary-500 rounded-full flex items-center justify-center`}>
                  <span className="text-white text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
              )
            } else {
              icon = (
                <div className={`${iconClass} bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors`}>
                  <span className="text-gray-600 text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
              )
            }
          }

          return (
            <button
              key={index}
              onClick={() => onAnswerSelect(index)}
              disabled={showResult}
              className={optionClass}
            >
              <div className="flex items-center">
                {icon}
                <span className="flex-1">{option}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Result Feedback */}
      {showResult && (
        <div className={`mb-6 p-4 rounded-lg animate-fade-in ${
          isCorrect 
            ? 'bg-success-50 border border-success-200' 
            : 'bg-danger-50 border border-danger-200'
        }`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {isCorrect ? (
                <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 bg-danger-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-lg ${
                isCorrect ? 'text-success-800' : 'text-danger-800'
              }`}>
                {isCorrect ? '🎉 Excellent!' : '💡 Not quite right'}
              </p>
              <p className={`text-sm mt-1 ${
                isCorrect ? 'text-success-700' : 'text-danger-700'
              }`}>
                {isCorrect 
                  ? 'Great job! You got it right.' 
                  : `The correct answer is: ${correctAnswerText || question.options[correctAnswerIndex]}`
                }
              </p>
            </div>
          </div>

          {/* 🆕 NEW: Explanation Section */}
          {explanation && explanation.trim().length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">
                    💡 Explanation:
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!showResult ? (
          <button
            onClick={onSubmitAnswer}
            disabled={selectedAnswer === null || submitting}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Checking Answer...</span>
              </>
            ) : (
              <>
                <span>Submit Answer</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onNextQuestion}
            className="flex-1 btn-primary flex items-center justify-center space-x-2"
          >
            <span>
              {currentIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Quiz'}
            </span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        )}
      </div>

      {/* Tip */}
      {!showResult && selectedAnswer === null && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            💡 Select an answer and click Submit to continue
          </p>
        </div>
      )}

      {/* 🆕 NEW: Study Tip for explanations */}
      {showResult && explanation && explanation.trim().length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 italic">
            📚 Study tip: Read the explanation above to strengthen your understanding!
          </p>
        </div>
      )}
    </div>
  )
}

export default QuestionCard