// frontend/src/components/quiz/QuestionDisplay.jsx
import React from 'react';
import { difficultyUtils } from '../../utils/difficultyUtils'; // Assuming this path is correct
import { highlightWord } from '../../utils/textUtils'; // Assuming this path is correct

const QuestionDisplay = ({ currentQuestion }) => {
  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="card-elevated mb-8"> {/* .card-elevated already has dark styles from index.css */}
      {currentQuestion.difficulty && (
        <div className="flex justify-end mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentQuestion.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
            currentQuestion.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100' :
            currentQuestion.difficulty === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' :
            'bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-gray-300' // Fallback for other difficulties
          }`}>
            {difficultyUtils.getDisplayName(currentQuestion.difficulty)}
          </span>
        </div>
      )}
      {currentQuestion.paragraph && currentQuestion.word && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 dark:from-slate-700 dark:to-slate-600 dark:border-slate-500">
            <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-2 dark:text-blue-300">Context</div>
            <p
              className="text-gray-700 leading-relaxed italic dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: `"${highlightWord(currentQuestion.paragraph, currentQuestion.word)}"` }}
            />
          </div>
        </div>
      )}
      {currentQuestion.question_text && currentQuestion.word && (
        <div className="mb-8">
          <h2
            className="text-xl sm:text-2xl text-gray-900 leading-relaxed dark:text-gray-100" /* font-semibold removed */
            dangerouslySetInnerHTML={{ __html: highlightWord(currentQuestion.question_text, currentQuestion.word) }}
          />
        </div>
      )}
      {/* Fallback if word is not available for highlighting but text is */}
      {currentQuestion.paragraph && !currentQuestion.word && (
        <div className="mb-6"><div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 dark:from-slate-700 dark:to-slate-600 dark:border-slate-500"><div className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-2 dark:text-blue-300">Context</div><p className="text-gray-700 leading-relaxed italic dark:text-gray-300">"{currentQuestion.paragraph}"</p></div></div>
      )}
      {currentQuestion.question_text && !currentQuestion.word && (
        <div className="mb-8"><h2 className="text-xl sm:text-2xl text-gray-900 leading-relaxed dark:text-gray-100">{currentQuestion.question_text}</h2></div> /* font-semibold removed */
      )}
    </div>
  );
};

export default QuestionDisplay;