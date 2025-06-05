import React, { useState, useEffect, useCallback } from 'react';
import { historyAPI } from '../services/api'; // Ensure this path is correct
import QuestionCard from '../components/QuestionCard'; // Assuming QuestionCard can display history items
import LoadingSpinner from '../components/LoadingSpinner'; // Assuming you have a LoadingSpinner component
import { Link } from 'react-router-dom'; // For a back button or other navigation

const LearningHistoryPage = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
  });

  const fetchHistory = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await historyAPI.getLearningHistory(page, pagination.pageSize);
      if (response.success && response.data) {
        // Assuming response.data is an array of question-like objects
        // The backend historyController.js formats items with:
        // history_id, question_id, word, part_of_speech, definition, difficulty_level,
        // example_sentence, question_text, selected_option_letter, selected_option_text,
        // is_correct, correct_option_letter, correct_option_text, explanation, answered_at
        // We need to adapt these to what QuestionCard expects, or adapt QuestionCard.
        // For now, let's assume QuestionCard can handle these or we'll map them.

        const formattedQuestions = response.data.map(item => ({
          id: item.question_id, // QuestionCard likely expects 'id'
          question_text: item.question_text,
          // Options might need to be reconstructed if QuestionCard expects a specific format
          // For history, we might display the question, user's answer, and correct answer directly
          // rather than interactive options.
          options: [ // This is a placeholder, QuestionCard might need actual options
            { text: item.selected_option_text || 'N/A', originalLetter: item.selected_option_letter || '' },
            // Add other options if available/needed, or simplify QuestionCard for history
          ],
          correct_answer_letter_from_db: item.correct_option_letter, // Or however QuestionCard gets the correct answer
          explanation: item.explanation,
          difficulty_level: item.difficulty_level,
          // Add any other fields QuestionCard might need
          // Fields specific to history:
          user_selected_letter: item.selected_option_letter,
          user_selected_text: item.selected_option_text,
          user_was_correct: item.is_correct,
          answered_at: item.answered_at,
          correct_answer_text: item.correct_option_text, // To display the correct answer text
        }));
        setHistoryItems(formattedQuestions);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            currentPage: response.pagination.currentPage,
            totalPages: response.pagination.totalPages,
            totalItems: response.pagination.totalItems,
          }));
        }
      } else {
        setError(response.message || 'Failed to load learning history.');
        setHistoryItems([]);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching learning history.');
      setHistoryItems([]);
      console.error("Fetch history error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageSize]);

  useEffect(() => {
    fetchHistory(pagination.currentPage);
  }, [fetchHistory, pagination.currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  if (isLoading) {
    // LoadingSpinner's background should be transparent or adapt to the page's dark bg
    return <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center"><LoadingSpinner text="Loading history..." /></div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center py-10">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold mb-4 text-red-500 dark:text-red-400">Error</h1>
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <Link to="/" className="mt-6 inline-block bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center py-10">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Learning History</h1>
          <p className="text-gray-600 dark:text-gray-300">You haven't answered any questions yet. Start a quiz to build your history!</p>
          <Link to="/" className="mt-6 inline-block bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Explore Quizzes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-700 dark:text-gray-200">My Learning History</h1>
      <div className="space-y-6">
        {historyItems.map((item, index) => (
          <QuestionCard
            key={item.history_id || (item.id + '-' + index)} // Use history_id if available from backend
            question={item} // Pass the whole item, QuestionCard will destructure
            // Props below are for QuestionCard's internal logic if it's used for active quiz
            // For history view, QuestionCard should primarily use the `question` prop's fields
            // like item.is_correct, item.selected_option_text etc.
            // Ensure QuestionCard is designed to show this information directly.
            // The `isHistoryView` prop is a good way to toggle display modes in QuestionCard.
            isHistoryView={true}
            // These props might be redundant if QuestionCard directly uses `item.is_correct` etc.
            // when isHistoryView is true.
            showResult={true} // In history, result is always shown
            isCorrect={item.is_correct}
            selectedAnswer={item.selected_option_letter} // Or map to index if QuestionCard expects index
            correctAnswerText={item.correct_option_text}
            explanation={item.explanation}
            // Dummy props if QuestionCard expects them but they are not used in history view
            onAnswerSelect={() => {}}
            onSubmitAnswer={() => {}}
            onNextQuestion={() => {}}
            submitting={false}
            currentIndex={index + (pagination.currentPage - 1) * pagination.pageSize}
            totalQuestions={pagination.totalItems}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-gray-200 dark:disabled:opacity-50 dark:disabled:text-gray-400"
          >
            Previous
          </button>
          <span className="text-gray-700 dark:text-gray-300">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-gray-200 dark:disabled:opacity-50 dark:disabled:text-gray-400"
          >
            Next
          </button>
        </div>
      )}
       <div className="mt-8 text-center">
        <Link to="/" className="text-blue-500 hover:text-blue-700 font-semibold dark:text-blue-400 dark:hover:text-blue-300">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
};

export default LearningHistoryPage;