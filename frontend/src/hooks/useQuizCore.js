// frontend/src/hooks/useQuizCore.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionsAPI, userStatsAPI } from '../services/api';
import { difficultyUtils } from '../utils/difficultyUtils';
import { questionUtils } from '../utils/questionUtils';

export const useQuizCore = (courseType, initialParsedCourseInfo) => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const [answerDetails, setAnswerDetails] = useState({
    correctAnswerText: '',
    correctOriginalLetter: '',
    explanation: '',
    hasExplanation: false,
  });

  const [quizInfo, setQuizInfo] = useState({
    difficulty: initialParsedCourseInfo.difficulty,
    displayName: difficultyUtils.getDisplayName(initialParsedCourseInfo.difficulty),
    icon: difficultyUtils.getIcon(initialParsedCourseInfo.difficulty),
  });

  const answeredQuestionsDetailsRef = useRef([]);
  const quizStartTimeRef = useRef(null);

  const isWeaknessTrainingCourse = courseType === 'weakness-training';
  const isReportedQuestionsCourse = courseType === 'reported-questions';

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setScore({ correct: 0, total: 0 });
      setShowResult(false);
      setSelectedAnswerIndex(null);
      // Reset other messages if they were part of this hook, e.g. weaknessStatusMessage
      // For now, those are separate.

      const questionLimit = 10;
      let response;

      if (isWeaknessTrainingCourse) {
        setQuizInfo({
          difficulty: 'custom',
          displayName: 'Weakness Training',
          icon: '💪',
        });
        response = await questionsAPI.getWeaknessTrainingQuestions(questionLimit);
      } else if (isReportedQuestionsCourse) {
        setQuizInfo({
          difficulty: 'review',
          displayName: 'My Reported Questions',
          icon: '🗒️',
        });
        response = await questionsAPI.getUserReportedQuestions(questionLimit);
      } else {
        setQuizInfo({
          difficulty: initialParsedCourseInfo.difficulty,
          displayName: difficultyUtils.getDisplayName(initialParsedCourseInfo.difficulty),
          icon: difficultyUtils.getIcon(initialParsedCourseInfo.difficulty),
        });
        if (initialParsedCourseInfo.isGeneral || initialParsedCourseInfo.difficulty === 'mixed') {
          response = await questionsAPI.getRandomQuestions(questionLimit, 'mixed');
        } else if (initialParsedCourseInfo.type === 'difficulty') {
          response = await questionsAPI.getRandomQuestions(questionLimit, initialParsedCourseInfo.difficulty);
        } else {
          setError('This course type is not yet available');
          setLoading(false);
          return;
        }
      }

      if (response.success && response.questions && response.questions.length > 0) {
        const validQuestions = response.questions.filter(questionUtils.validateQuestion);
        if (validQuestions.length !== response.questions.length) {
          console.warn(`${response.questions.length - validQuestions.length} invalid questions filtered out`);
        }
        if (validQuestions.length === 0) {
          setError('No valid questions available for this level.');
          setQuestions([]);
        } else {
          setQuestions(validQuestions.map(q => questionUtils.formatQuestion(q)));
        }
      } else {
        let courseNameForError = quizInfo.displayName;
        if(isWeaknessTrainingCourse) courseNameForError = 'Weakness Training';
        if(isReportedQuestionsCourse) courseNameForError = 'My Reported Questions';
        setError(response.message || `No questions available for ${courseNameForError}.`);
        setQuestions([]);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError(err.message || 'Failed to load questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [courseType, initialParsedCourseInfo, isWeaknessTrainingCourse, isReportedQuestionsCourse, quizInfo.displayName]); // quizInfo.displayName might cause re-runs if not stable

  useEffect(() => {
    loadQuestions();
    quizStartTimeRef.current = Date.now();
    answeredQuestionsDetailsRef.current = [];
  }, [loadQuestions]); // loadQuestions is now memoized with useCallback

  const handleAnswerSelect = (answerIndex) => {
    if (showResult) return;
    setSelectedAnswerIndex(answerIndex);
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleSubmitAnswer = async () => {
    if (selectedAnswerIndex === null || !currentQuestion || !currentQuestion.options) return;

    const selectedOption = currentQuestion.options[selectedAnswerIndex];
    if (!selectedOption || !selectedOption.originalLetter) {
      console.error("Selected option or its originalLetter is undefined", selectedOption);
      setError("Could not process your answer. Please try again.");
      return;
    }
    const selectedOriginalLetter = selectedOption.originalLetter;

    try {
      setSubmitting(true);
      const response = await questionsAPI.checkAnswer(
        currentQuestion.id,
        selectedOriginalLetter
      );

      if (response.success) {
        setIsCorrect(response.isCorrect);
        setAnswerDetails({
          correctAnswerText: response.correctAnswerText,
          correctOriginalLetter: response.correctOriginalLetter,
          explanation: response.explanation || '',
          hasExplanation: !!(response.explanation && response.explanation.trim()),
        });
        setShowResult(true);
        setScore(prev => ({
          correct: prev.correct + (response.isCorrect ? 1 : 0),
          total: prev.total + 1,
        }));

        answeredQuestionsDetailsRef.current.push({
          question_id: currentQuestion.id,
          selected_original_letter: selectedOriginalLetter,
          is_correct: response.isCorrect,
        });
      } else {
        setError(response.message || 'Failed to check answer');
      }
    } catch (err) {
      console.error('Error checking answer:', err);
      setError(err.message || 'Failed to check answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswerIndex(null);
      setShowResult(false);
      setIsCorrect(false);
      setAnswerDetails({
        correctAnswerText: '',
        correctOriginalLetter: '',
        explanation: '',
        hasExplanation: false,
      });
    } else {
      setSubmitting(true);
      try {
        const quizEndTime = Date.now();
        const durationInSeconds = Math.round((quizEndTime - (quizStartTimeRef.current || quizEndTime)) / 1000);

        const sessionDetails = {
          course_type: courseType,
          score_correct: score.correct,
          score_total: score.total,
          duration_seconds: durationInSeconds,
          questions_answered_details: answeredQuestionsDetailsRef.current,
        };
        await userStatsAPI.recordQuizSession(sessionDetails);
        const finalScoreForState = {
          correct: score.correct,
          total: score.total,
          difficulty: quizInfo.difficulty,
          displayName: quizInfo.displayName,
        };
        navigate('/', { state: { quizCompleted: true, score: finalScoreForState } });
      } catch (saveError) {
        console.error("Error saving quiz session:", saveError);
        setError(saveError.message || "Failed to save your quiz results. Please try again or contact support.");
      } finally {
        setSubmitting(false);
      }
    }
  };
  
  // Function to update questions from outside (e.g., after deletion)
  const updateQuestions = (newQuestions) => {
    setQuestions(newQuestions);
  };

  return {
    questions,
    currentQuestionIndex,
    currentQuestion,
    selectedAnswerIndex,
    showResult,
    isCorrect,
    loading,
    submitting,
    error,
    score,
    answerDetails,
    quizInfo,
    loadQuestions, // Expose for manual reload if needed
    handleAnswerSelect,
    handleSubmitAnswer,
    handleNextQuestion,
    updateQuestions, // Expose to allow QuizPage to update questions after deletion
    setCurrentQuestionIndex // Expose to allow QuizPage to adjust index after deletion
  };
};