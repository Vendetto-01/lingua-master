// frontend/src/components/quiz/QuestionActionsMenu.jsx
import React, { useState, useEffect, useRef } from 'react';

const QuestionActionsMenu = ({
  currentQuestion,
  isReportedQuestionsCourse,
  isWeaknessTrainingCourse,
  onOpenReportModal,
  onAddWeaknessItem,
  onRemoveWeaknessItem,
  onDismissReportItem,
  disabled // General disabled state for all buttons (e.g., while parent is submitting)
}) => {
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="relative mt-6 mb-4 text-center sm:text-right" ref={actionsMenuRef}>
      <button
        onClick={() => setIsActionsMenuOpen(prev => !prev)}
        className="inline-flex items-center justify-center p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-800"
        title="More actions"
        disabled={disabled}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
        <span className="sr-only">Open actions menu</span>
      </button>

      {isActionsMenuOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 dark:bg-slate-700 dark:ring-white dark:ring-opacity-20">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {!isReportedQuestionsCourse && (
              <button
                onClick={() => { onOpenReportModal(); setIsActionsMenuOpen(false); }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-slate-600 dark:hover:text-white"
                role="menuitem"
                disabled={disabled}
              >
                ⚠️ Report Question
              </button>
            )}
            {!isWeaknessTrainingCourse && !isReportedQuestionsCourse && (
              <button
                onClick={() => { onAddWeaknessItem(); setIsActionsMenuOpen(false); }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-slate-600 dark:hover:text-white"
                role="menuitem"
                disabled={disabled}
              >
                ➕ Add to Weakness Training
              </button>
            )}
            {isWeaknessTrainingCourse && (
              <button
                onClick={() => { onRemoveWeaknessItem(); setIsActionsMenuOpen(false); }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-slate-600 dark:hover:text-white"
                role="menuitem"
                disabled={disabled}
              >
                ➖ Remove from Weakness Training
              </button>
            )}
            {isReportedQuestionsCourse && currentQuestion.report_id && (
              <button
                onClick={() => { onDismissReportItem(); setIsActionsMenuOpen(false); }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-slate-600 dark:hover:text-white"
                role="menuitem"
                disabled={disabled}
              >
                ➖ Dismiss from List
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionActionsMenu;