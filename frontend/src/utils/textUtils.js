// frontend/src/utils/textUtils.js

// Helper function to escape special characters for regex
export function escapeRegExp(string) {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
}

// Helper function to highlight a word in a text
// Returns a string with HTML for highlighting (e.g., for dangerouslySetInnerHTML)
export function highlightWord(text, wordToHighlight) {
  if (typeof text !== 'string' || typeof wordToHighlight !== 'string' || !wordToHighlight.trim()) {
    return text;
  }
  const escapedWord = escapeRegExp(wordToHighlight);
  const regex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');
  return text.replace(regex, '<strong><u>$1</u></strong>');
}