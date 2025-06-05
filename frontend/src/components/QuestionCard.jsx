// frontend/src/components/QuestionCard.jsx (FIXED - Clean Display)
import React from 'react'
import { difficultyUtils, questionUtils } from '../services/api'

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

  // Extract word-specific information
  const wordInfo = question.wordDetails || {
    word: question.word,
    partOfSpeech: question.part_of_speech,
    definition: question.definition,
    difficultyLevel: question.difficulty_level,
    exampleSentence: question.example_sentence
  };

  // Helper to highlight word in example sentence with bold and underline
  const highlightWordInSentence = (sentence, word) => {
    if (!sentence || !word) return sentence;
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return sentence.split(regex).map((part, index, array) => {
      if (index < array.length - 1) {
        return (
          <React.Fragment key={index}>
            {part}
            <strong className="text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded-md font-bold underline decoration-2 decoration-primary-600 dark:text-primary-300 dark:bg-primary-700 dark:bg-opacity-40 dark:decoration-primary-500">
              {word}
            </strong>
          </React.Fragment>
        );
      }
      return part;
    });
  };

  // Generate clean question text without example sentence and part of speech
  const generateCleanQuestionText = (word) => {
    return `What does the word "${word}" mean?`;
  };

  // Get CEFR level info
  const cefrInfo = wordInfo.difficultyLevel ? 
    difficultyUtils.getCEFRInfo(wordInfo.difficultyLevel) : null;

  return (
    <div className="card-elevated"> {/* .card-elevated has dark styles from index.css */}
      {/* Question Progress */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Word {currentIndex + 1} of {totalQuestions}
        </div>
        <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
          {Math.round(((currentIndex + 1) / totalQuestions) * 100)}% Complete
        </div>
      </div>

      {/* Word Information Header */}
      {wordInfo.word && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl font-bold text-gray-900 flex items-center dark:text-gray-100">
                {wordInfo.word}
                {wordInfo.partOfSpeech && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full ml-3 font-normal dark:text-gray-300 dark:bg-slate-700">
                    {wordInfo.partOfSpeech}
                  </span>
                )}
              </div>
            </div>
            {wordInfo.difficultyLevel && (
              <div className="flex flex-col items-end">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    wordInfo.difficultyLevel === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' :
                    wordInfo.difficultyLevel === 'intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' :
                    wordInfo.difficultyLevel === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200' :
                    'bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-gray-300'
                }`}>
                  {wordInfo.difficultyLevel}
                </span>
                {cefrInfo && (
                  <span className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                    {cefrInfo.name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Example Sentence Context - WITH HIGHLIGHTED WORD */}
      {wordInfo.exampleSentence && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 relative dark:from-slate-700 dark:to-slate-600 dark:border-slate-500">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold flex items-center dark:text-blue-300">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Example Sentence
              </div>
              <div className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded-full dark:text-blue-300 dark:bg-blue-700 dark:bg-opacity-40">
                Context Clue
              </div>
            </div>
            <p className="text-gray-800 leading-relaxed text-lg font-medium dark:text-gray-200">
              "{highlightWordInSentence(wordInfo.exampleSentence, wordInfo.word)}"
            </p>
          </div>
        </div>
      )}

      {/* LEGACY: Support old paragraph format for backward compatibility */}
      {question.paragraph && !wordInfo.exampleSentence && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 dark:from-slate-700 dark:to-slate-600 dark:border-slate-500">
            <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-2 dark:text-blue-300">
              Context
            </div>
            <p className="text-gray-700 leading-relaxed italic dark:text-gray-300">
              "{question.paragraph}"
            </p>
          </div>
        </div>
      )}

      {/* CLEAN Main Question */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-medium text-gray-900 leading-relaxed mb-3 dark:text-gray-100">
          {generateCleanQuestionText(wordInfo.word)}
        </h2>
        
        {wordInfo.word && (
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500 dark:bg-slate-700 dark:border-primary-500">
            <p className="text-gray-700 font-medium dark:text-gray-300">
              💭 Look at how "<strong className="text-primary-600 dark:text-primary-400">{wordInfo.word}</strong>" is used in the sentence above.
            </p>
          </div>
        )}
      </div>

      {/* Answer Options */}
      <div className="space-y-3 mb-8">
        {question.options.map((option, index) => {
          let optionClass = 'quiz-option text-left group hover:shadow-md transition-all duration-200' // .quiz-option has dark styles
          let iconClass = 'w-7 h-7 mr-4 flex-shrink-0 transition-all duration-200'
          let icon = null

          if (showResult) {
            if (index === correctAnswerIndex) {
              optionClass += ' quiz-option-correct ring-2 ring-success-200 dark:ring-success-500' // .quiz-option-correct has dark styles
              icon = (
                <div className={`${iconClass} bg-success-500 rounded-full flex items-center justify-center shadow-lg`}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )
            } else if (index === selectedAnswer && !isCorrect) {
              optionClass += ' quiz-option-incorrect ring-2 ring-danger-200 dark:ring-danger-500' // .quiz-option-incorrect has dark styles
              icon = (
                <div className={`${iconClass} bg-danger-500 rounded-full flex items-center justify-center shadow-lg`}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )
            } else { 
              icon = (
                <div className={`${iconClass} bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center`}>
                  <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
              )
            }
          } else { 
            if (selectedAnswer === index) {
              optionClass += ' quiz-option-selected ring-2 ring-primary-300 shadow-md dark:ring-primary-500' // .quiz-option-selected has dark styles
              icon = (
                <div className={`${iconClass} bg-primary-500 dark:bg-primary-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105`}>
                  <span className="text-white text-sm font-semibold">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
              )
            } else { 
              icon = (
                <div className={`${iconClass} bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center hover:bg-primary-100 dark:hover:bg-slate-500 group-hover:scale-105`}>
                  <span className="text-gray-600 dark:text-gray-300 text-sm font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400">
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
                <span className="flex-1 text-left font-medium">{option.text || option}</span> {/* Text color handled by .quiz-option dark:text-gray-200 */}
              </div>
            </button>
          )
        })}
      </div>

      {/* Enhanced Result Feedback */}
      {showResult && (
        <div className={`mb-6 p-5 rounded-xl animate-fade-in border-2 ${
          isCorrect 
            ? 'bg-success-50 border-success-200 dark:bg-success-900 dark:bg-opacity-30 dark:border-success-700' 
            : 'bg-danger-50 border-danger-200 dark:bg-danger-900 dark:bg-opacity-30 dark:border-danger-700'
        }`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {isCorrect ? (
                <div className="w-10 h-10 bg-success-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 bg-danger-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className={`font-bold text-xl mb-2 ${
                isCorrect ? 'text-success-800 dark:text-success-200' : 'text-danger-800 dark:text-danger-200'
              }`}>
                {isCorrect ? '🎉 Excellent!' : '📚 Learning Opportunity!'}
              </p>
              <p className={`text-sm mb-3 ${
                isCorrect ? 'text-success-700 dark:text-success-300' : 'text-danger-700 dark:text-danger-300'
              }`}>
                {isCorrect 
                  ? `Perfect! You understand how "${wordInfo.word}" is used.` 
                  : `The correct answer is: ${correctAnswerText || question.options[correctAnswerIndex]?.text}`
                }
              </p>
              
              {wordInfo.difficultyLevel && (
                <div className="mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    isCorrect ? 'bg-success-100 text-success-700 dark:bg-success-700 dark:text-success-100' : 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100'
                  }`}>
                    {isCorrect ? '✅' : '📖'} {wordInfo.difficultyLevel} Level Word
                    {cefrInfo && ` • ${cefrInfo.name}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {explanation && explanation.trim().length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-200 dark:border-slate-600">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm dark:bg-slate-700 dark:border-slate-600">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-700 dark:bg-opacity-40">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center dark:text-gray-100">
                      📚 Word Definition
                      {wordInfo.difficultyLevel && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full dark:bg-blue-700 dark:text-blue-100">
                          {wordInfo.difficultyLevel}
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3 dark:text-gray-300">
                      {explanation}
                    </p>
                    
                    {wordInfo.word && wordInfo.partOfSpeech && (
                      <div className="bg-gray-50 rounded-md p-3 border dark:bg-slate-600 dark:border-slate-500">
                        <div className="text-xs text-gray-600 mb-1 dark:text-gray-400">Word Analysis:</div>
                        <div className="text-sm">
                          <strong className="text-primary-600 dark:text-primary-400">{wordInfo.word}</strong>
                          <span className="text-gray-500 dark:text-gray-400"> ({wordInfo.partOfSpeech})</span>
                          {wordInfo.difficultyLevel && (
                            <span className="text-gray-500 dark:text-gray-400"> • {wordInfo.difficultyLevel} level</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200 dark:from-slate-700 dark:to-slate-600 dark:border-yellow-700">
            <div className="flex items-center text-sm text-yellow-800 dark:text-yellow-300">
              <svg className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <strong className="dark:text-yellow-200">Learning Tip:</strong>
              <span className="ml-1">
                {isCorrect 
                  ? `Great job! Try using "${wordInfo.word}" in your own sentence.`
                  : `Study tip: Remember that "${wordInfo.word}" means "${wordInfo.definition}"`
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - .btn-primary has dark styles */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!showResult ? (
          <button
            onClick={onSubmitAnswer}
            disabled={selectedAnswer === null || submitting}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg"
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
            className="flex-1 btn-primary flex items-center justify-center space-x-2 py-4 text-lg"
          >
            <span>
              {currentIndex < totalQuestions - 1 ? 'Next Word' : 'Complete Quiz'}
            </span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        )}
      </div>

      {/* Enhanced Help Text - This section was commented out in the original file, if re-enabled, it needs dark styles */}
      {/* {!showResult && selectedAnswer === null && (
        <div className="mt-6 text-center">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 dark:bg-slate-700 dark:border-blue-700">
            <p className="text-sm text-blue-700 font-medium mb-2 dark:text-blue-300">
              💡 How to Answer
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Look at the highlighted word in the sentence above, then select the definition that best matches its meaning.
            </p>
          </div>
        </div>
      )} */}
      
      {/* Enhanced Study Motivation */}
      {showResult && explanation && (
        <div className="mt-6 text-center">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 dark:from-slate-700 dark:to-slate-600 dark:border-purple-700">
            <p className="text-sm text-purple-700 font-medium mb-1 dark:text-purple-300">
              🎯 Keep Learning!
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              {isCorrect 
                ? `You're building strong vocabulary! ${wordInfo.difficultyLevel} level words are getting easier for you.`
                : `Every mistake is a step forward. Review "${wordInfo.word}" and you'll remember it next time!`
              }
            </p>
          </div>
        </div>
      )}

      {/* Word Learning Progress Indicator */}
      {wordInfo.difficultyLevel && (
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <span className="font-medium dark:text-gray-300">Learning:</span>
              <span className="text-primary-600 font-semibold dark:text-primary-400">{wordInfo.word}</span>
              <span className="dark:text-gray-400">({wordInfo.partOfSpeech})</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="dark:text-gray-300">Level:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    wordInfo.difficultyLevel === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' :
                    wordInfo.difficultyLevel === 'intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' :
                    wordInfo.difficultyLevel === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200' :
                    'bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-gray-300'
                }`}>
                {wordInfo.difficultyLevel}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionCard