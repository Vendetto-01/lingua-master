// frontend/src/utils/courseUtils.js

export const courseUtils = {
  parseCourseType: (courseType) => {
    if (courseType.startsWith('difficulty-')) {
      return {
        type: 'difficulty',
        difficulty: courseType.replace('difficulty-', ''),
        isGeneral: false
      };
    }
    return {
      type: 'general',
      difficulty: 'mixed',
      isGeneral: true
    };
  },
  
  generateCourseType: (difficulty) => {
    if (difficulty === 'mixed' || difficulty === 'Mixed Levels') {
      return 'general';
    }
    return `difficulty-${difficulty}`;
  }
};