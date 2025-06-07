// frontend/src/components/quiz/AnswerResult.jsx
import React from 'react';

const AnswerResult = ({ showResult, isCorrect, answerDetails }) => {
  if (!showResult) {
    return null;
  }

  return (
    <div className={`mb-6 p-4 rounded-lg animate-fade-in ${isCorrect ? 'bg-success-50 border-success-200 dark:bg-success-900 dark:bg-opacity-30 dark:border-success-700' : 'bg-danger-50 border-danger-200 dark:bg-danger-900 dark:bg-opacity-30 dark:border-danger-700'}`}>
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
          <p className={`font-semibold text-lg ${isCorrect ? 'text-success-800 dark:text-success-200' : 'text-danger-800 dark:text-danger-200'}`}>
            {isCorrect ? '🎉 Excellent!' : '❌ Not quite right'}
          </p>
          <p className={`text-sm mt-1 ${isCorrect ? 'text-success-700 dark:text-success-300' : 'text-danger-700 dark:text-danger-300'}`}>
            {isCorrect ? 'Great job! You got it right.' : `The correct answer is: ${answerDetails.correctAnswerText}`}
          </p>
          {answerDetails.hasExplanation && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 dark:bg-slate-700 dark:border-slate-600">
              <div className="flex items-start space-x-2">
                <div className="text-blue-500 mt-0.5 dark:text-blue-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-1 dark:text-blue-300">Explanation</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{answerDetails.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerResult;