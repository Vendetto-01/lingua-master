// frontend/src/utils/questionUtils.js
import { difficultyUtils } from './difficultyUtils'; // Import from the same directory

export const questionUtils = {
  validateQuestion: (question) => {
    const requiredFields = [
      'id', 'word', 'definition', 'example_sentence', 'question_text', 
      'options', 'correct_answer_letter_from_db'
    ];
    
    if (!requiredFields.every(field => question[field] !== undefined)) {
      console.warn('Question missing required fields:', requiredFields.filter(field => !question[field]));
      return false;
    }
    
    if (!Array.isArray(question.options) || 
        question.options.some(opt => typeof opt !== 'object' || !opt.text || !opt.originalLetter)) {
      console.warn('Question has invalid options format');
      return false;
    }
    
    return true;
  },

  getCorrectAnswerTextFromProcessedQuestion: (question) => {
    if (!question?.options || !question.correct_answer_letter_from_db) {
      return null;
    }
    const correctOption = question.options.find(opt => 
      opt.originalLetter === question.correct_answer_letter_from_db
    );
    return correctOption?.text || null;
  },

  hasExplanation: (question) => {
    return question.explanation && question.explanation.trim().length > 0;
  },

  formatQuestion: (question) => {
    return {
      ...question,
      hasContext: !!question.example_sentence,
      hasExplanation: questionUtils.hasExplanation(question), // Relies on its own method
      isWordBased: true,
      wordDetails: {
        word: question.word,
        partOfSpeech: question.part_of_speech,
        definition: question.definition,
        difficultyLevel: question.difficulty_level,
        exampleSentence: question.example_sentence
      }
    };
  },

  // NEW: Word-specific utilities
  generateQuestionPreview: (word, partOfSpeech, exampleSentence) => {
    if (!word || !exampleSentence) return 'Question preview unavailable';
    return `What does "${word}" (${partOfSpeech}) mean in this context?`;
  },

  highlightWordInSentence: (sentence, word) => {
    if (!sentence || !word) return sentence;
    return sentence.replace(new RegExp(`\\b${word}\\b`, 'gi'), `**${word}**`);
  },

  // NEW: Extract learning insights
  getWordLearningInsight: (question, isCorrect) => {
    if (!question.wordDetails) return null;
    
    const { word, partOfSpeech, difficultyLevel } = question.wordDetails;
    // Uses imported difficultyUtils
    const cefrInfo = difficultyUtils.getCEFRInfo(difficultyLevel); 
    
    return {
      word,
      partOfSpeech,
      difficultyLevel,
      cefrName: cefrInfo.name,
      learningTip: isCorrect 
        ? `Great! You've mastered "${word}" at ${difficultyLevel} level.`
        : `Keep practicing "${word}" - it's a ${difficultyLevel} (${cefrInfo.name}) level word.`
    };
  }
};