// frontend/src/hooks/useWeaknessManagement.js
import { useState } from 'react';
import { questionsAPI } from '../services/api';

export const useWeaknessManagement = () => {
  const [weaknessSubmitting, setWeaknessSubmitting] = useState(false);
  const [weaknessStatusMessage, setWeaknessStatusMessage] = useState('');

  const handleAddWeaknessItem = async (currentQuestionId) => {
    if (!currentQuestionId || weaknessSubmitting) return;
    setWeaknessSubmitting(true);
    setWeaknessStatusMessage('');
    try {
      const response = await questionsAPI.addWeaknessItem(currentQuestionId);
      if (response.success) {
        setWeaknessStatusMessage('Added to your Study List!');
      } else {
        setWeaknessStatusMessage(response.message || 'Could not add to Study List.');
      }
    } catch (error) {
      setWeaknessStatusMessage(error.message || 'Error adding to Study List.');
    } finally {
      setWeaknessSubmitting(false);
      setTimeout(() => setWeaknessStatusMessage(''), 3000);
    }
  };

  const handleRemoveWeaknessItem = async (currentQuestionId) => {
    if (!currentQuestionId || weaknessSubmitting) return;
    setWeaknessSubmitting(true);
    setWeaknessStatusMessage('');
    try {
      const response = await questionsAPI.removeWeaknessItem(currentQuestionId);
      if (response.success) {
        setWeaknessStatusMessage('Removed from your Study List.');
        // Note: Original QuizPage had commented-out logic to remove question from view.
        // This hook currently doesn't handle that UI update directly.
        // The parent component (QuizPage) would need to manage that if desired.
      } else {
        setWeaknessStatusMessage(response.message || 'Could not remove from Study List.');
      }
    } catch (error) {
      setWeaknessStatusMessage(error.message || 'Error removing from Study List.');
    } finally {
      setWeaknessSubmitting(false);
      setTimeout(() => setWeaknessStatusMessage(''), 3000);
    }
  };

  return {
    weaknessSubmitting,
    weaknessStatusMessage,
    handleAddWeaknessItem,
    handleRemoveWeaknessItem,
  };
};