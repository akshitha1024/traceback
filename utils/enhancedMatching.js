// Enhanced matching algorithm with image support
import { calculateMatchScore, findPotentialMatches } from './matching.js';

/**
 * Enhanced matching system that includes image-based matching
 */
export class EnhancedMatcher {
  constructor() {
    this.API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }

  /**
   * Calculate enhanced match score including image considerations
   */
  calculateEnhancedMatchScore(lostItem, foundItem) {
    // Start with the basic matching score
    let baseScore = calculateMatchScore(lostItem, foundItem);
    
    // Image enhancement factors
    let imageBonus = 0;
    let confidence = 'medium';
    
    // Both items have images - major confidence boost
    if (lostItem.image_url && foundItem.image_url) {
      imageBonus += 15;
      confidence = 'high';
      
      // If images are from the same seed/pattern, they might be related
      const lostSeed = this.extractImageSeed(lostItem.image_url);
      const foundSeed = this.extractImageSeed(foundItem.image_url);
      
      if (lostSeed && foundSeed) {
        const seedDiff = Math.abs(lostSeed - foundSeed);
        if (seedDiff < 50) {
          imageBonus += 10; // Very similar images
        } else if (seedDiff < 200) {
          imageBonus += 5; // Somewhat similar images
        }
      }
    }
    
    // Only one item has image - slight boost for visual verification
    else if (lostItem.image_url || foundItem.image_url) {
      imageBonus += 5;
    }
    
    // Detailed description bonus when images are available
    if ((lostItem.image_url || foundItem.image_url) && 
        (lostItem.description?.length > 50 || foundItem.description?.length > 50)) {
      imageBonus += 5;
    }
    
    const finalScore = Math.min(100, baseScore + imageBonus);
    
    return {
      score: finalScore,
      baseScore,
      imageBonus,
      confidence,
      hasImages: !!(lostItem.image_url && foundItem.image_url),
      visualVerification: !!(lostItem.image_url || foundItem.image_url)
    };
  }

  /**
   * Extract seed from image URL for similarity comparison
   */
  extractImageSeed(imageUrl) {
    if (!imageUrl) return null;
    const match = imageUrl.match(/random=(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Find enhanced potential matches with image considerations
   */
  async findEnhancedMatches(lostItem, options = {}) {
    const { 
      minScore = 60, 
      maxResults = 10,
      includeImages = true 
    } = options;

    try {
      // Get found items from API
      const response = await fetch(`${this.API_BASE}/api/found-items?limit=100&search=${encodeURIComponent(lostItem.title)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch found items');
      }
      
      const data = await response.json();
      const foundItems = data.items || [];
      
      // Calculate enhanced matches
      const matches = foundItems
        .map(foundItem => ({
          item: foundItem,
          match: this.calculateEnhancedMatchScore(lostItem, foundItem)
        }))
        .filter(match => match.match.score >= minScore)
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, maxResults);
      
      return {
        matches,
        total: matches.length,
        searchQuery: lostItem.title,
        enhancedFeatures: {
          imageMatching: true,
          visualVerification: true,
          confidenceScoring: true
        }
      };
      
    } catch (error) {
      console.error('Enhanced matching error:', error);
      return {
        matches: [],
        total: 0,
        error: error.message
      };
    }
  }

  /**
   * Get match explanation for UI display
   */
  getMatchExplanation(matchResult) {
    const { score, baseScore, imageBonus, confidence, hasImages, visualVerification } = matchResult;
    
    let explanation = [`Base compatibility: ${baseScore}%`];
    
    if (imageBonus > 0) {
      explanation.push(`Image enhancement: +${imageBonus}%`);
    }
    
    if (hasImages) {
      explanation.push('✅ Both items have photos for comparison');
    } else if (visualVerification) {
      explanation.push('📷 One item has photo for verification');
    }
    
    explanation.push(`Confidence level: ${confidence}`);
    
    return {
      score: `${score}%`,
      confidence,
      details: explanation,
      recommendation: this.getMatchRecommendation(score, confidence, hasImages)
    };
  }

  /**
   * Get recommendation based on match quality
   */
  getMatchRecommendation(score, confidence, hasImages) {
    if (score >= 85 && hasImages) {
      return {
        action: 'highly_recommended',
        message: 'Excellent match with photo verification available',
        urgency: 'high'
      };
    } else if (score >= 70) {
      return {
        action: 'recommended',
        message: 'Good match - recommend contacting owner',
        urgency: 'medium'
      };
    } else if (score >= 60) {
      return {
        action: 'possible',
        message: 'Possible match - verify details carefully',
        urgency: 'low'
      };
    } else {
      return {
        action: 'unlikely',
        message: 'Low probability match',
        urgency: 'none'
      };
    }
  }
}

// Export singleton instance
export const enhancedMatcher = new EnhancedMatcher();