// frontend/src/pages/QuizPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionsAPI, userStatsAPI } from '../services/api'; // Removed utils
import { difficultyUtils } from '../utils/difficultyUtils'; // Added import
import { courseUtils } from '../utils/courseUtils'; // Added import
import { questionUtils } from '../utils/questionUtils'; // Added import
import LoadingSpinner from '../components/LoadingSpinner';
import ReportModal from '../components/quiz/ReportModal';
import QuestionActionsMenu from '../components/quiz/QuestionActionsMenu';
import QuizHeader from '../components/quiz/QuizHeader'; // Import QuizHeader
import QuestionDisplay from '../components/quiz/QuestionDisplay'; // Import QuestionDisplay
import QuestionOptions from '../components/quiz/QuestionOptions'; // Import QuestionOptions
import AnswerResult from '../components/quiz/AnswerResult'; // Import AnswerResult
import { useQuizCore } from '../hooks/useQuizCore';
import { useWeaknessManagement } from '../hooks/useWeaknessManagement';
import { escapeRegExp, highlightWord } from '../utils/textUtils'; // Import helper functions

// Helper function to escape special characters for regex
// function escapeRegExp(string) { ... } // Moved to textUtils.js

// Helper function to highlight a word in a text
// function highlightWord(text, wordToHighlight) { ... } // Moved to textUtils.js

const QuizPage = () => {
  const { courseType } = useParams();
  const navigate = useNavigate();

  const parsedCourseInfo = courseUtils.parseCourseType(courseType);

  const {
    questions,
    currentQuestionIndex,
    currentQuestion, // Get currentQuestion from the hook
    selectedAnswerIndex,
    showResult,
    isCorrect,
    loading,
    submitting,
    error,
    score,
    answerDetails,
    quizInfo,
    loadQuestions, // Expose loadQuestions from the hook
    handleAnswerSelect,
    handleSubmitAnswer,
    handleNextQuestion,
    updateQuestions, // For updating questions list after deletion
    setCurrentQuestionIndex // For updating index after deletion
  } = useQuizCore(courseType, parsedCourseInfo);

  // Raporlama state'leri
  const [showReportModal, setShowReportModal] = useState(false);
  // selectedReportReason, reportSubmitting, reportError, reportSuccessMessage are now managed by ReportModal.jsx

  const {
    weaknessSubmitting,
    weaknessStatusMessage,
    handleAddWeaknessItem,
    handleRemoveWeaknessItem,
  } = useWeaknessManagement();

  // Reported Questions state and handlers are now from useReportedItemsManagement
  const {
    dismissingReportItem,
    dismissReportItemMessage,
    handleDismissReportItem,
  } = useReportedItemsManagement();
  // isActionsMenuOpen and actionsMenuRef are now managed by QuestionActionsMenu.jsx

  // State like answerDetails, quizInfo, questions, currentQuestionIndex, etc.,
  // and refs like answeredQuestionsDetailsRef, quizStartTimeRef are now managed by useQuizCore

  // useEffect for loading questions is now inside useQuizCore

  const isWeaknessTrainingCourse = courseType === 'weakness-training';
  const isReportedQuestionsCourse = courseType === 'reported-questions';

  // loadQuestions, handleAnswerSelect, handleSubmitAnswer, handleNextQuestion
  // are now part of useQuizCore hook.

  const handleBackToHome = () => navigate('/');
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // REPORT_OPTIONS is now in ReportModal.jsx

  const handleOpenReportModal = () => {
    if (!currentQuestion) return;
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
  };

  // handleReportReasonChange and handleSubmitReport are now managed by ReportModal.jsx
  // handleAddWeaknessItem and handleRemoveWeaknessItem are now part of useWeaknessManagement hook

  const handleReportActionCompleted = ({ type, questionId }) => {
    if (type === 'delete' && questionId === currentQuestion?.id) {
      const newQuestionsList = questions.filter(q => q.id !== questionId);
      updateQuestions(newQuestionsList); // Use the updater from the hook

      if (newQuestionsList.length === 0) {
        handleBackToHome();
      } else if (currentQuestionIndex >= newQuestionsList.length) {
        // If deleted was last, new index should be last of new list
        setCurrentQuestionIndex(Math.max(0, newQuestionsList.length - 1));
        // If the list became empty, handleNextQuestion might try to finish quiz with no questions.
        // The newQuestionsList.length === 0 check above should prevent this.
        // If it was the last of many, handleNextQuestion will correctly finish the quiz.
         handleNextQuestion(); // This will either go to next or finish quiz
      }
      // If not the last question, currentQuestionIndex might still be valid,
      // or if it was the current one, currentQuestion will update due to questions list change.
    }
    // No specific action needed for 'report' type in QuizPage itself, modal handles feedback.
  };

  // const handleDismissReportItem = async () => { ... }; // This function is now in useReportedItemsManagement.js


  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900"><LoadingSpinner size="large" text={`Loading ${quizInfo.displayName} questions...`} /></div>;
  if (error && !questions.length) return (
    <div className="min-h-screen flex items-center justify-center p-4 dark:bg-slate-900">
      <div className="text-center max-w-md bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl">
        <div className="text-6xl mb-4">😔</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-gray-100">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-6 dark:text-gray-300">{error}</p>
        <div className="space-y-3">
          {/* loadQuestions is now primarily managed by the hook's useEffect,
              but can be exposed if a manual "Try Again" is desired.
              For now, assuming initial load is sufficient or error state handles it.
              If manual reload is needed, the hook should expose `loadQuestions`.
              Let's assume the hook's `loadQuestions` is exposed for this button.
          */}
          <button onClick={loadQuestions} className="btn-primary w-full">Try Again</button>
          <button onClick={handleBackToHome} className="btn-secondary w-full">Back to Home</button>
        </div>
      </div>
    </div>
  );
  if (!questions.length && !loading) return (
    <div className="min-h-screen flex items-center justify-center p-4 dark:bg-slate-900">
      <div className="text-center max-w-md bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-gray-100">No Questions Available</h2>
        <p className="text-gray-600 mb-6 dark:text-gray-300">{error || `There are currently no questions available for the ${quizInfo.displayName} level.`}</p>
        <button onClick={handleBackToHome} className="btn-primary">Back to Home</button>
      </div>
    </div>
  );
  if (!currentQuestion && questions.length > 0) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900"><p className="dark:text-gray-200">Error: Current question is not available but questions list is populated. Please refresh.</p></div>;
  }

  const currentAccuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const displayCorrectOptionIndex = showResult && currentQuestion && currentQuestion.options
    ? currentQuestion.options.findIndex(opt => opt.originalLetter === answerDetails.correctOriginalLetter)
    : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <QuizHeader
        quizInfo={quizInfo}
        currentQuestionIndex={currentQuestionIndex}
        questionsLength={questions.length}
        score={score}
        handleBackToHome={handleBackToHome}
        getAccuracyColor={getAccuracyColor}
      />

      {error && questions.length > 0 && (
           <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 dark:bg-danger-900 dark:bg-opacity-30 dark:border-danger-700 dark:text-danger-300">
               {error}
           </div>
       )}

      {currentQuestion && (
        <div className="card-elevated mb-8">
          <QuestionDisplay currentQuestion={currentQuestion} />
          <QuestionOptions
            options={currentQuestion.options}
            showResult={showResult}
            selectedAnswerIndex={selectedAnswerIndex}
            isCorrect={isCorrect}
            displayCorrectOptionIndex={displayCorrectOptionIndex}
            handleAnswerSelect={handleAnswerSelect}
            submitting={submitting}
          />
          {/* Action Buttons Area - New Actions Menu */}
          {currentQuestion && ( // This check might be redundant if parent currentQuestion check is sufficient
              <QuestionActionsMenu
                currentQuestion={currentQuestion}
                isReportedQuestionsCourse={isReportedQuestionsCourse}
                isWeaknessTrainingCourse={isWeaknessTrainingCourse}
                onOpenReportModal={handleOpenReportModal}
                onAddWeaknessItem={() => handleAddWeaknessItem(currentQuestion?.id)}
                onRemoveWeaknessItem={() => handleRemoveWeaknessItem(currentQuestion?.id)}
                onDismissReportItem={() => handleDismissReportItem(currentQuestion?.report_id)}
                disabled={submitting || weaknessSubmitting || dismissingReportItem}
              />
            )}
            {weaknessStatusMessage && (
                <div className="my-2 text-sm text-center text-blue-700 dark:text-blue-300">{weaknessStatusMessage}</div>
            )}
            {dismissReportItemMessage && (
                <div className="my-2 text-sm text-center text-gray-700 dark:text-gray-300">{dismissReportItemMessage}</div>
            )}

            <AnswerResult
                showResult={showResult}
                isCorrect={isCorrect}
                answerDetails={answerDetails}
            />

            <div className="flex flex-col sm:flex-row gap-3">
            {/* .btn-primary already has dark styles from index.css */}
            {!showResult ? (
                <button onClick={handleSubmitAnswer} disabled={selectedAnswerIndex === null || submitting} className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Checking...</span></>)
                                : (<><span>Submit Answer</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>)}
                </button>
            ) : (
                <button onClick={handleNextQuestion} disabled={submitting} className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                 {submitting ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Finishing...</span></>)
                                : (<><span>{currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz & Save Results'}</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>)}
                </button>
            )}
            </div>
            {!showResult && selectedAnswerIndex === null && (<div className="mt-4 text-center"><p className="text-sm text-gray-500 dark:text-gray-400">💡 Select an answer and click Submit to continue</p></div>)}
        </div>
      )}
      {/* The extra div that was here (previously line 442) is now removed. */}
      <ReportModal
        isOpen={showReportModal}
        onClose={handleCloseReportModal}
        currentQuestion={currentQuestion}
        // reportOptions prop can be omitted if default is fine
        onSubmitReport={questionsAPI.submitReportQuestion}
        onDeleteQuestion={questionsAPI.deleteQuestion}
        onActionComplete={handleReportActionCompleted}
      />
    </div>
  );
};

export default QuizPage;