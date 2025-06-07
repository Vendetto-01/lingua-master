// frontend/src/hooks/useReportedItemsManagement.js
import { useState } from 'react';
import { questionsAPI } from '../services/api';

export const useReportedItemsManagement = () => {
  const [dismissingReportItem, setDismissingReportItem] = useState(false);
  const [dismissReportItemMessage, setDismissReportItemMessage] = useState('');

  const handleDismissReportItem = async (reportId) => {
    if (!reportId || dismissingReportItem) return;
    setDismissingReportItem(true);
    setDismissReportItemMessage('');
    try {
      const response = await questionsAPI.dismissUserReport(reportId);
      if (response.success) {
        setDismissReportItemMessage('Report dismissed from your list.');
        // Note: Original QuizPage had commented-out logic to remove question from view.
        // This hook currently doesn't handle that UI update directly.
        // The parent component (QuizPage) would need to manage that if desired,
        // possibly by calling a callback provided to this hook or by re-fetching questions.
      } else {
        setDismissReportItemMessage(response.message || 'Could not dismiss report.');
      }
    } catch (error) {
      setDismissReportItemMessage(error.message || 'Error dismissing report.');
    } finally {
      setDismissingReportItem(false);
      setTimeout(() => setDismissReportItemMessage(''), 3000);
    }
  };

  return {
    dismissingReportItem,
    dismissReportItemMessage,
    handleDismissReportItem,
  };
};