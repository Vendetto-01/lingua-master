// frontend/src/components/quiz/QuestionOptions.jsx
import React from 'react';

const QuestionOptions = ({
  options,
  showResult,
  selectedAnswerIndex,
  isCorrect, // Needed to determine incorrect styling
  displayCorrectOptionIndex,
  handleAnswerSelect,
  submitting,
}) => {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-8">
      {options.map((option, index) => {
        let optionClass = 'quiz-option text-left'; // .quiz-option has dark styles from index.css
        let iconClass = 'w-6 h-6 mr-3 flex-shrink-0';
        let iconLetter = String.fromCharCode(65 + index);
        let icon = null;

        if (showResult) {
          if (index === displayCorrectOptionIndex) {
            optionClass += ' quiz-option-correct'; // Has dark styles
            icon = <div className={`${iconClass} bg-success-500 rounded-full flex items-center justify-center`}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>;
          } else if (index === selectedAnswerIndex && !isCorrect) { // Check if this option was selected AND it's incorrect
            optionClass += ' quiz-option-incorrect'; // Has dark styles
            icon = <div className={`${iconClass} bg-danger-500 rounded-full flex items-center justify-center`}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div>;
          } else {
            icon = <div className={`${iconClass} bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center`}><span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{iconLetter}</span></div>;
          }
        } else {
          if (selectedAnswerIndex === index) {
            optionClass += ' quiz-option-selected'; // Has dark styles
            icon = <div className={`${iconClass} bg-primary-500 dark:bg-primary-600 rounded-full flex items-center justify-center`}><span className="text-white text-sm font-medium">{iconLetter}</span></div>;
          } else {
            icon = <div className={`${iconClass} bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors`}><span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{iconLetter}</span></div>;
          }
        }

        return (
          <button key={index} onClick={() => handleAnswerSelect(index)} disabled={showResult || submitting} className={optionClass}>
            <div className="flex items-center">
              {icon}
              <span className="flex-1">{option.text}</span> {/* Text color handled by .quiz-option's dark:text-gray-200 */}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default QuestionOptions;