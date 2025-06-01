// frontend/src/pages/QuizPage.jsx
import React, { useState, useEffect, useRef } from 'react'; // useRef eklendi
import { useParams, useNavigate } from 'react-router-dom'; // Grom -> from olarak düzeltildi
import { questionsAPI, userStatsAPI, difficultyUtils, courseUtils, questionUtils } from '../services/api'; // userStatsAPI eklendi
import LoadingSpinner from '../components/LoadingSpinner'; //

const QuizPage = () => {
  const { courseType } = useParams(); //
  const navigate = useNavigate(); //

  const parsedCourseInfo = courseUtils.parseCourseType(courseType); //

  const [questions, setQuestions] = useState([]); //
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); //
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null); //
  const [showResult, setShowResult] = useState(false); //
  const [isCorrect, setIsCorrect] = useState(false); //
  const [loading, setLoading] = useState(true); //
  const [submitting, setSubmitting] = useState(false); //
  const [error, setError] = useState(''); //
  const [score, setScore] = useState({ correct: 0, total: 0 }); //

  const [answerDetails, setAnswerDetails] = useState({ //
    correctAnswerText: '',
    correctOriginalLetter: '',
    explanation: '',
    hasExplanation: false
  });

  const [quizInfo, setQuizInfo] = useState({ //
    difficulty: parsedCourseInfo.difficulty,
    displayName: difficultyUtils.getDisplayName(parsedCourseInfo.difficulty),
    icon: difficultyUtils.getIcon(parsedCourseInfo.difficulty)
  });

  const answeredQuestionsDetailsRef = useRef([]); //
  const quizStartTimeRef = useRef(null); //

  const currentQuestion = questions[currentQuestionIndex]; //

  useEffect(() => {
    loadQuestions(); //
    quizStartTimeRef.current = Date.now(); //
    answeredQuestionsDetailsRef.current = []; //
  }, [courseType]); //

  const loadQuestions = async () => { //
    try {
      setLoading(true); //
      setError(''); //
      const questionLimit = 10; 
      let response;

      setQuizInfo({ //
          difficulty: parsedCourseInfo.difficulty,
          displayName: difficultyUtils.getDisplayName(parsedCourseInfo.difficulty),
          icon: difficultyUtils.getIcon(parsedCourseInfo.difficulty)
      });

      if (parsedCourseInfo.isGeneral || parsedCourseInfo.difficulty === 'mixed') { //
        response = await questionsAPI.getRandomQuestions(questionLimit, 'mixed'); //
      } else if (parsedCourseInfo.type === 'difficulty') { //
        response = await questionsAPI.getRandomQuestions(questionLimit, parsedCourseInfo.difficulty); //
      } else {
        setError('This course type is not yet available'); //
        setLoading(false); //
        return;
      }

      if (response.success && response.questions && response.questions.length > 0) { //
        const validQuestions = response.questions.filter(questionUtils.validateQuestion); //
        if (validQuestions.length !== response.questions.length) { //
          console.warn(`${response.questions.length - validQuestions.length} invalid questions filtered out`); //
        }
        if (validQuestions.length === 0) { //
          setError('No valid questions available for this level.'); //
          setQuestions([]); //
        } else {
          setQuestions(validQuestions.map(q => questionUtils.formatQuestion(q))); //
        }
      } else {
        setError(`No questions available for ${quizInfo.displayName} level. Message: ${response.message || ''}`); //
        setQuestions([]); //
      }
    } catch (err) {
      console.error('Error loading questions:', err); //
      setError(err.message || 'Failed to load questions'); //
      setQuestions([]); //
    } finally {
      setLoading(false); //
    }
  };

  const handleAnswerSelect = (answerIndex) => { //
    if (showResult) return; //
    setSelectedAnswerIndex(answerIndex); //
  };

  const handleSubmitAnswer = async () => { //
    if (selectedAnswerIndex === null || !currentQuestion || !currentQuestion.options) return; //

    const selectedOption = currentQuestion.options[selectedAnswerIndex]; //
    if (!selectedOption || !selectedOption.originalLetter) { //
        console.error("Selected option or its originalLetter is undefined", selectedOption); //
        setError("Could not process your answer. Please try again."); //
        return;
    }
    const selectedOriginalLetter = selectedOption.originalLetter; //

    try {
      setSubmitting(true); //
      const response = await questionsAPI.checkAnswer( //
        currentQuestion.id,
        selectedOriginalLetter
      );

      if (response.success) { //
        setIsCorrect(response.isCorrect); //
        setAnswerDetails({ //
          correctAnswerText: response.correctAnswerText,
          correctOriginalLetter: response.correctOriginalLetter,
          explanation: response.explanation || '',
          hasExplanation: !!(response.explanation && response.explanation.trim())
        });
        setShowResult(true); //
        setScore(prev => ({ //
          correct: prev.correct + (response.isCorrect ? 1 : 0),
          total: prev.total + 1
        }));

        answeredQuestionsDetailsRef.current.push({ //
            question_id: currentQuestion.id,
            selected_original_letter: selectedOriginalLetter,
            is_correct: response.isCorrect
        });

      } else {
        setError(response.message || 'Failed to check answer'); //
      }
    } catch (err) {
      console.error('Error checking answer:', err); //
      setError(err.message || 'Failed to check answer'); //
    } finally {
      setSubmitting(false); //
    }
  };

  const handleNextQuestion = async () => { //
    if (currentQuestionIndex < questions.length - 1) { //
      setCurrentQuestionIndex(currentQuestionIndex + 1); //
      setSelectedAnswerIndex(null); //
      setShowResult(false); //
      setIsCorrect(false); //
      setAnswerDetails({ //
        correctAnswerText: '',
        correctOriginalLetter: '',
        explanation: '',
        hasExplanation: false
      });
    } else {
      setSubmitting(true); //
      try {
        const quizEndTime = Date.now(); //
        const durationInSeconds = Math.round((quizEndTime - quizStartTimeRef.current) / 1000); //

        const sessionDetails = { //
            course_type: courseType,
            score_correct: score.correct,
            score_total: score.total,
            duration_seconds: durationInSeconds,
            questions_answered_details: answeredQuestionsDetailsRef.current
        };
        await userStatsAPI.recordQuizSession(sessionDetails); //
        const finalScoreForState = { //
            correct: score.correct,
            total: score.total,
            difficulty: quizInfo.difficulty,
            displayName: quizInfo.displayName,
        };
        navigate('/', { state: { quizCompleted: true, score: finalScoreForState } }); //

      } catch (saveError) {
          console.error("Error saving quiz session:", saveError); //
          setError(saveError.message || "Failed to save your quiz results. Please try again or contact support."); //
      } finally {
          setSubmitting(false); //
      }
    }
  };

  const handleBackToHome = () => navigate('/'); //
  const getAccuracyColor = (accuracy) => { //
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="large" text={`Loading ${quizInfo.displayName} questions...`} /></div>; //
  if (error && !questions.length) return ( //
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">�</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="space-y-3">
          <button onClick={loadQuestions} className="btn-primary w-full">Try Again</button>
          <button onClick={handleBackToHome} className="btn-secondary w-full">Back to Home</button>
        </div>
      </div>
    </div>
  );
  if (!questions.length && !loading) return ( //
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">統</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Questions Available</h2>
        <p className="text-gray-600 mb-6">There are no questions available for the {quizInfo.displayName} level.</p>
        <button onClick={handleBackToHome} className="btn-primary">Back to Home</button>
      </div>
    </div>
  );
  if (!currentQuestion && questions.length > 0) { //
    return <div className="min-h-screen flex items-center justify-center"><p>Error: Current question is not available but questions list is populated. Please refresh.</p></div>;
  }

  const currentAccuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0; //
  const displayCorrectOptionIndex = showResult && currentQuestion && currentQuestion.options //
    ? currentQuestion.options.findIndex(opt => opt.originalLetter === answerDetails.correctOriginalLetter)
    : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handleBackToHome} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Home
          </button>
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <span>{quizInfo.icon}</span>
            <span>{quizInfo.displayName} Quiz</span>
          </div>
        </div>
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{quizInfo.icon} {quizInfo.displayName} Quiz</h1>
          <p className="text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
        </div>
        <div className="flex justify-center space-x-6 text-sm">
          <div className="text-center"><div className="font-bold text-gray-900">{score.correct}/{score.total}</div><div className="text-gray-500">Score</div></div>
          {score.total > 0 && (<div className="text-center"><div className={`font-bold ${getAccuracyColor(currentAccuracy)}`}>{currentAccuracy}%</div><div className="text-gray-500">Accuracy</div></div>)}
          <div className="text-center"><div className="font-bold text-gray-900">{questions.length - (currentQuestionIndex + 1)}</div><div className="text-gray-500">Remaining</div></div>
        </div>
      </div>

      {error && questions.length > 0 && ( //
           <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
               {error}
           </div>
       )}

      {currentQuestion && ( //
        <div className="card-elevated mb-8">
            {currentQuestion.difficulty && ( //
            <div className="flex justify-end mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyUtils.getColorClass(currentQuestion.difficulty)}`}>
                {difficultyUtils.getDisplayName(currentQuestion.difficulty)}
                </span>
            </div>
            )}
            {currentQuestion.paragraph && ( //
            <div className="mb-6"><div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100"><div className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-2">Context</div><p className="text-gray-700 leading-relaxed italic">"{currentQuestion.paragraph}"</p></div></div>
            )}
            <div className="mb-8"><h2 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-relaxed">{currentQuestion.question_text}</h2></div>

            <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => { //
                let optionClass = 'quiz-option text-left'; //
                let iconClass = 'w-6 h-6 mr-3 flex-shrink-0'; //
                let iconLetter = String.fromCharCode(65 + index); //
                let icon = null; //

                if (showResult) { //
                if (index === displayCorrectOptionIndex) { //
                    optionClass += ' quiz-option-correct'; //
                    icon = <div className={`${iconClass} bg-success-500 rounded-full flex items-center justify-center`}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>; //
                } else if (index === selectedAnswerIndex && !isCorrect) { //
                    optionClass += ' quiz-option-incorrect'; //
                    icon = <div className={`${iconClass} bg-danger-500 rounded-full flex items-center justify-center`}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div>; //
                } else {
                    icon = <div className={`${iconClass} bg-gray-200 rounded-full flex items-center justify-center`}><span className="text-gray-600 text-sm font-medium">{iconLetter}</span></div>; //
                }
                } else {
                if (selectedAnswerIndex === index) { //
                    optionClass += ' quiz-option-selected'; //
                    icon = <div className={`${iconClass} bg-primary-500 rounded-full flex items-center justify-center`}><span className="text-white text-sm font-medium">{iconLetter}</span></div>; //
                } else {
                    icon = <div className={`${iconClass} bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors`}><span className="text-gray-600 text-sm font-medium">{iconLetter}</span></div>; //
                }
                }

                return (
                <button key={index} onClick={() => handleAnswerSelect(index)} disabled={showResult || submitting} className={optionClass}>
                    <div className="flex items-center">
                    {icon}
                    <span className="flex-1">{option.text}</span>
                    </div>
                </button>
                );
            })}
            </div>

            {showResult && ( //
            <div className={`mb-6 p-4 rounded-lg animate-fade-in ${isCorrect ? 'bg-success-50 border border-success-200' : 'bg-danger-50 border border-danger-200'}`}>
                <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    {isCorrect ? <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div> //
                            : <div className="w-8 h-8 bg-danger-500 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div>}
                </div>
                <div className="flex-1">
                    <p className={`font-semibold text-lg ${isCorrect ? 'text-success-800' : 'text-danger-800'}`}>{isCorrect ? '脂 Excellent!' : '庁 Not quite right'}</p>
                    <p className={`text-sm mt-1 ${isCorrect ? 'text-success-700' : 'text-danger-700'}`}>
                    {isCorrect ? 'Great job! You got it right.' : `The correct answer is: ${answerDetails.correctAnswerText}`}
                    </p>
                    {answerDetails.hasExplanation && ( //
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-2">
                        <div className="text-blue-500 mt-0.5"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg></div>
                        <div>
                            <p className="text-xs font-medium text-blue-600 mb-1">Explanation</p>
                            <p className="text-sm text-gray-700">{answerDetails.explanation}</p>
                        </div>
                        </div>
                    </div>
                    )}
                </div>
                </div>
            </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
            {!showResult ? ( //
                <button onClick={handleSubmitAnswer} disabled={selectedAnswerIndex === null || submitting} className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Checking...</span></>) //
                                : (<><span>Submit Answer</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>)}
                </button>
            ) : (
                <button onClick={handleNextQuestion} disabled={submitting} className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                 {submitting ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Finishing...</span></>) //
                                : (<><span>{currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz & Save Results'}</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>)}
                </button>
            )}
            </div>
            {!showResult && selectedAnswerIndex === null && (<div className="mt-4 text-center"><p className="text-sm text-gray-500">庁 Select an answer and click Submit to continue</p></div>)}
        </div>
      )}
    </div>
  );
};

export default QuizPage;