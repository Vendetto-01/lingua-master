// frontend/src/components/quiz/QuizHeader.jsx
import React from 'react';

const QuizHeader = ({
  quizInfo,
  currentQuestionIndex,
  questionsLength,
  score,
  handleBackToHome,
  getAccuracyColor,
}) => {
  const currentAccuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handleBackToHome} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Home
        </button>
        <div className="text-sm text-gray-600 flex items-center space-x-2 dark:text-gray-300">
          <span>{quizInfo.icon}</span>
          <span>{quizInfo.displayName} Quiz</span>
        </div>
      </div>
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100">{quizInfo.icon} {quizInfo.displayName} Quiz</h1>
        <p className="text-gray-600 dark:text-gray-300">Question {currentQuestionIndex + 1} of {questionsLength}</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4 dark:bg-slate-700">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / questionsLength) * 100}%` }}></div>
      </div>
      <div className="flex justify-center space-x-6 text-sm">
        <div className="text-center"><div className="font-bold text-gray-900 dark:text-gray-100">{score.correct}/{score.total}</div><div className="text-gray-500 dark:text-gray-400">Score</div></div>
        {score.total > 0 && (<div className="text-center"><div className={`font-bold ${getAccuracyColor(currentAccuracy)} dark:${getAccuracyColor(currentAccuracy).replace('text-','text-dark-')}`}>{currentAccuracy}%</div><div className="text-gray-500 dark:text-gray-400">Accuracy</div></div>)}
        <div className="text-center"><div className="font-bold text-gray-900 dark:text-gray-100">{questionsLength - (currentQuestionIndex + 1)}</div><div className="text-gray-500 dark:text-gray-400">Remaining</div></div>
      </div>
    </div>
  );
};

export default QuizHeader;