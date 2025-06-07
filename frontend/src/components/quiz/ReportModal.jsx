// frontend/src/components/quiz/ReportModal.jsx
import React, { useState, useEffect } from 'react';

const REPORT_OPTIONS_DEFAULT = [
  { value: 'question_incorrect', label: 'Regenerate Question 🔄' },
  { value: 'delete_question', label: 'Delete the question 🚮' }
];

const ReportModal = ({
  isOpen,
  onClose,
  currentQuestion,
  reportOptions = REPORT_OPTIONS_DEFAULT,
  onSubmitReport: onSubmitReportProp, // Renamed to avoid conflict with internal handler
  onDeleteQuestion: onDeleteQuestionProp, // Renamed
  onActionComplete // Callback for when report/delete is done, to allow parent to update
}) => {
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccessMessage, setReportSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSelectedReportReason(reportOptions[0]?.value || '');
      setReportError('');
      setReportSuccessMessage('');
      setReportSubmitting(false);
    }
  }, [isOpen, reportOptions]);

  if (!isOpen || !currentQuestion) {
    return null;
  }

  const handleReportReasonChange = (event) => {
    setSelectedReportReason(event.target.value);
  };

  const internalHandleClose = () => {
    if (reportSubmitting) return; // Don't close if submitting
    setReportError('');
    setReportSuccessMessage('');
    onClose(); // Call parent's close handler
  };
  
  const handleSubmit = async () => {
    if (!selectedReportReason || !currentQuestion) return;

    setReportSubmitting(true);
    setReportError('');
    setReportSuccessMessage('');

    try {
      let response;
      if (selectedReportReason === 'delete_question') {
        response = await onDeleteQuestionProp(currentQuestion.id);
        if (response.success) {
          setReportSuccessMessage('Question has been deleted successfully.');
          setTimeout(() => {
            internalHandleClose();
            if (onActionComplete) onActionComplete({ type: 'delete', questionId: currentQuestion.id });
          }, 2000);
        } else {
          setReportError(response.message || 'Failed to delete question.');
        }
      } else {
        response = await onSubmitReportProp({
          word_id: currentQuestion.id,
          report_reason: selectedReportReason,
        });
        if (response.success) {
          setReportSuccessMessage('Your report has been submitted successfully.');
          setTimeout(() => {
            internalHandleClose();
            if (onActionComplete) onActionComplete({ type: 'report', questionId: currentQuestion.id });
          }, 2000);
        } else {
          setReportError(response.message || 'Failed to submit report.');
        }
      }
    } catch (err) {
      console.error('Error in report/delete action:', err);
      setReportError(err.message || 'An error occurred.');
    } finally {
      setReportSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-black dark:bg-opacity-60 transition-opacity z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl p-5 sm:p-6 w-full max-w-lg transform transition-all dark:bg-slate-800">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100" id="modal-title">
            Report Question
          </h3>
          <button
            type="button"
            onClick={internalHandleClose}
            disabled={reportSubmitting}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:text-gray-500 dark:hover:bg-slate-700 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            <span className="sr-only">Close</span>
          </button>
        </div>

        {reportError && <div className="mb-3 p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-md text-sm dark:bg-danger-900 dark:bg-opacity-30 dark:border-danger-700 dark:text-danger-300">{reportError}</div>}
        {reportSuccessMessage && <div className="mb-3 p-3 bg-success-50 border border-success-200 text-success-700 rounded-md text-sm dark:bg-success-900 dark:bg-opacity-30 dark:border-success-700 dark:text-success-300">{reportSuccessMessage}</div>}

        {!reportSuccessMessage && (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-1 dark:text-gray-300"><strong>Question:</strong></p>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border max-h-24 overflow-y-auto dark:text-gray-400 dark:bg-slate-700 dark:border-slate-600"><em>"{currentQuestion.question_text}"</em></p>
            </div>
            
            <p className="text-sm font-medium text-gray-800 mb-2 dark:text-gray-200">Please select a reason for your report:</p>
            <div className="space-y-3 mb-6">
              {reportOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer has-[:checked]:bg-primary-50 has-[:checked]:border-primary-300 dark:border-slate-600 dark:hover:bg-slate-700 dark:has-[:checked]:bg-primary-700 dark:has-[:checked]:border-primary-500">
                  <input
                    type="radio"
                    name="reportReason"
                    value={option.value}
                    checked={selectedReportReason === option.value}
                    onChange={handleReportReasonChange}
                    className="form-radio h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500 dark:text-primary-500 dark:border-slate-500 dark:focus:ring-offset-slate-800"
                    disabled={reportSubmitting}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={internalHandleClose}
                disabled={reportSubmitting}
                className="btn-secondary py-2 px-4 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedReportReason || reportSubmitting}
                className="btn-danger py-2 px-4 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {reportSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Submitting...</>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        )}
         {reportSuccessMessage && (
            <div className="mt-4 text-right">
                 <button
                    type="button"
                    onClick={internalHandleClose}
                    className="btn-primary py-2 px-4"
                >
                    Close
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;