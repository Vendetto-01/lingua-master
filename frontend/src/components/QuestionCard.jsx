// frontend/src/components/QuestionCard.jsx (UPDATED for words)
import React from 'react'

const QuestionCard = ({
  question,
  selectedAnswer,
  showResult,
  isCorrect,
  correctAnswerIndex,
  correctAnswerText,
  explanation,
  onAnswerSelect,
  onSubmitAnswer,
  onNextQuestion,
  submitting,
  currentIndex,
  totalQuestions
}) => {
  if (!question) return null

  // NEW: Extract word-specific information
  const wordInfo = question.wordDetails || {
    word: question.word,
    partOfSpeech: question.part_of_speech,
    definition: question.definition,
    difficultyLevel: question.difficulty_level
  };

  // NEW: Helper to highlight word in example sentence
  const highlightWordInSentence = (sentence, word) => {
    if (!sentence || !word) return sentence;
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return sentence.split(regex).map((part, index, array) => {
      if (index < array.length - 1) {
        return (
          <React.Fragment key={index}>
            {part}
            <strong className="text-primary-600 bg-primary-50 px-1 rounded">{word}</strong>
          </React.Fragment>
        );
      }
      return part;
    });
  };

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

      {/* NEW: Word Information Header */}
      {wordInfo.word && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-gray-900">
                {wordInfo.word}
              </div>
              {wordInfo.partOfSpeech && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  {wordInfo.partOfSpeech}
                </span>
              )}
            </div>
            {wordInfo.difficultyLevel && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {wordInfo.difficultyLevel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Example Sentence Context */}
      {question.example_sentence && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-2">
              Example Sentence
            </div>
            <p className="text-gray-700 leading-relaxed italic text-lg">
              "{highlightWordInSentence(question.example_sentence, wordInfo.word)}"
            </p>
          </div>
        </div>
      )}

      {/* LEGACY: Support old paragraph format for backward compatibility */}
      {question.paragraph && !question.example_sentence && (
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
        
        {/* NEW: Additional context for word-based questions */}
        {wordInfo.word && !question.question_text.includes('What does') && (
          <p className="text-gray-600 mt-2">
            What does the word "<strong>{wordInfo.word}</strong>" mean in this context?
          </p>
        )}
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
                <span className="flex-1 text-left">{option.text || option}</span>
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
                  : `The correct answer is: ${correctAnswerText || question.options[correctAnswerIndex]?.text || question.options[correctAnswerIndex]}`
                }
              </p>
            </div>
          </div>

          {/* Enhanced Explanation Section for Words */}
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
                  <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    📚 Word Definition:
                    {wordInfo.difficultyLevel && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {wordInfo.difficultyLevel}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {explanation}
                  </p>
                  
                  {/* NEW: Additional word information */}
                  {wordInfo.word && wordInfo.partOfSpeech && (
                    <div className="mt-3 text-xs text-gray-500">
                      <strong>{wordInfo.word}</strong> ({wordInfo.partOfSpeech})
                      {wordInfo.difficultyLevel && ` • ${wordInfo.difficultyLevel} level`}
                    </div>
                  )}
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
              {currentIndex < totalQuestions - 1 ? 'Next Word' : 'Finish Quiz'}
            </span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        )}
      </div>

      {/* Tips and Study Notes */}
      {!showResult && selectedAnswer === null && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            💡 Select the definition that best matches the word's meaning in the sentence
          </p>
        </div>
      )}

      {/* Enhanced Study Tip for Word Learning */}
      {showResult && explanation && explanation.trim().length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 italic">
            📚 Study tip: Try using "{wordInfo.word}" in your own sentence to reinforce learning!
          </p>
        </div>
      )}

      {/* NEW: Word Learning Progress Indicator */}
      {wordInfo.difficultyLevel && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Learning: {wordInfo.word}</span>
            <span>Level: {wordInfo.difficultyLevel}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionCard