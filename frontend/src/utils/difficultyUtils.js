// frontend/src/utils/difficultyUtils.js

export const difficultyUtils = {
  getDisplayName: (difficulty) => {
    const names = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate', 
      'advanced': 'Advanced',
      'mixed': 'Mixed Levels',
      // CEFR levels
      'A1': 'Beginner (A1)',
      'A2': 'Elementary (A2)',
      'B1': 'Intermediate (B1)',
      'B2': 'Upper-Intermediate (B2)',
      'C1': 'Advanced (C1)',
      'C2': 'Proficiency (C2)'
    };
    return names[difficulty] || difficulty;
  },
  
  getIcon: (difficulty) => {
    const icons = {
      'beginner': '🌱',
      'intermediate': '🎯',
      'advanced': '🚀',
      'mixed': '🌈',
      // CEFR levels
      'A1': '🌱',
      'A2': '🌿',
      'B1': '🎯',
      'B2': '🏹',
      'C1': '🚀',
      'C2': '🌟'
    };
    return icons[difficulty] || '📚';
  },
  
  getColorClass: (difficulty) => {
    const colors = {
      'beginner': 'text-green-600 bg-green-100',
      'intermediate': 'text-blue-600 bg-blue-100',
      'advanced': 'text-red-600 bg-red-100',
      'mixed': 'text-purple-600 bg-purple-100',
      // CEFR levels
      'A1': 'text-green-500 bg-green-50',
      'A2': 'text-green-600 bg-green-100',
      'B1': 'text-blue-500 bg-blue-50',
      'B2': 'text-blue-600 bg-blue-100',
      'C1': 'text-red-500 bg-red-50',
      'C2': 'text-red-600 bg-red-100'
    };
    return colors[difficulty] || 'text-gray-600 bg-gray-100';
  },
  
  getDescription: (difficulty) => {
    const descriptions = {
      'beginner': 'Perfect for learning basic vocabulary',
      'intermediate': 'Good for building stronger language skills',
      'advanced': 'Challenge yourself with complex vocabulary',
      'mixed': 'Words from all difficulty levels',
      // CEFR levels
      'A1': 'Basic vocabulary for everyday situations',
      'A2': 'Elementary words for common topics',
      'B1': 'Intermediate vocabulary for work and study',
      'B2': 'Upper-intermediate words for complex topics',
      'C1': 'Advanced vocabulary for professional contexts',
      'C2': 'Mastery-level words for academic and literary texts'
    };
    return descriptions[difficulty] || 'Vocabulary words';
  },

  // NEW: Map CEFR levels to our categories
  getCategoryFromCEFR: (cefrLevel) => {
    const mapping = {
      'A1': 'beginner',
      'A2': 'beginner',
      'B1': 'intermediate',
      'B2': 'intermediate',
      'C1': 'advanced',
      'C2': 'advanced'
    };
    return mapping[cefrLevel] || 'mixed';
  },

  // NEW: Get CEFR level info
  getCEFRInfo: (level) => {
    const info = {
      'A1': { name: 'Breakthrough', description: 'Can understand and use familiar everyday expressions' },
      'A2': { name: 'Waystage', description: 'Can understand sentences and frequently used expressions' },
      'B1': { name: 'Threshold', description: 'Can understand main points of clear standard input' },
      'B2': { name: 'Vantage', description: 'Can understand complex texts on abstract topics' },
      'C1': { name: 'Proficiency', description: 'Can understand virtually everything heard or read' },
      'C2': { name: 'Mastery', description: 'Can understand with ease virtually everything' }
    };
    return info[level] || { name: 'Unknown', description: 'Unknown CEFR level' };
  }
};