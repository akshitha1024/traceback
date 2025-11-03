// Matching utilities for lost and found items

/**
 * Calculate match score between a lost item and found item
 * @param {Object} lostItem - The lost item
 * @param {Object} foundItem - The found item
 * @returns {number} - Match score as percentage (0-100)
 */
export function calculateMatchScore(lostItem, foundItem) {
  let score = 0;
  let totalFactors = 0;

  // Category match (highest weight)
  if (lostItem.category && foundItem.category) {
    totalFactors += 3;
    if (lostItem.category.toLowerCase() === foundItem.category.toLowerCase()) {
      score += 3;
    }
  }

  // Title/name similarity (high weight)
  if (lostItem.title && foundItem.title) {
    totalFactors += 2;
    const lostWords = lostItem.title.toLowerCase().split(' ');
    const foundWords = foundItem.title.toLowerCase().split(' ');
    
    let commonWords = 0;
    lostWords.forEach(word => {
      if (foundWords.some(fWord => fWord.includes(word) || word.includes(fWord))) {
        commonWords++;
      }
    });
    
    const wordSimilarity = (commonWords / Math.max(lostWords.length, foundWords.length)) * 2;
    score += wordSimilarity;
  }

  // Color match (medium weight)
  if (lostItem.color && foundItem.color) {
    totalFactors += 1;
    if (lostItem.color.toLowerCase().includes(foundItem.color.toLowerCase()) ||
        foundItem.color.toLowerCase().includes(lostItem.color.toLowerCase())) {
      score += 1;
    }
  }

  // Size match (medium weight)
  if (lostItem.size && foundItem.size) {
    totalFactors += 1;
    if (lostItem.size.toLowerCase() === foundItem.size.toLowerCase()) {
      score += 1;
    }
  }

  // Location proximity (lower weight)
  if (lostItem.location && foundItem.location) {
    totalFactors += 0.5;
    const lostLoc = lostItem.location.toLowerCase();
    const foundLoc = foundItem.location.toLowerCase();
    
    if (lostLoc === foundLoc) {
      score += 0.5;
    } else if (lostLoc.includes(foundLoc) || foundLoc.includes(lostLoc)) {
      score += 0.25;
    }
  }

  // Convert to percentage
  return totalFactors > 0 ? Math.round((score / totalFactors) * 100) : 0;
}

/**
 * Find potential matches for a lost item
 * @param {Object} lostItem - The lost item to find matches for
 * @param {Array} foundItems - Array of found items to search through
 * @param {number} minScore - Minimum match score threshold (default: 30)
 * @returns {Array} - Array of potential matches with scores
 */
export function findPotentialMatches(lostItem, foundItems, minScore = 30) {
  const matches = foundItems
    .map(foundItem => ({
      ...foundItem,
      matchScore: calculateMatchScore(lostItem, foundItem)
    }))
    .filter(match => match.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by highest score first

  return matches;
}

/**
 * Get match strength label based on score
 * @param {number} score - Match score (0-100)
 * @returns {string} - Match strength label
 */
export function getMatchStrength(score) {
  if (score >= 80) return 'Excellent Match';
  if (score >= 65) return 'Good Match';
  if (score >= 45) return 'Fair Match';
  if (score >= 30) return 'Possible Match';
  return 'Poor Match';
}

/**
 * Get match color based on score
 * @param {number} score - Match score (0-100)
 * @returns {string} - CSS color class
 */
export function getMatchColor(score) {
  if (score >= 80) return 'text-green-700 bg-green-100';
  if (score >= 65) return 'text-blue-700 bg-blue-100';
  if (score >= 45) return 'text-yellow-700 bg-yellow-100';
  if (score >= 30) return 'text-orange-700 bg-orange-100';
  return 'text-gray-700 bg-gray-100';
}