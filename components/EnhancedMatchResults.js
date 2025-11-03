import { useState, useEffect } from 'react';
import { enhancedMatcher } from '@/utils/enhancedMatching';

export default function EnhancedMatchResults({ lostItem, onClose }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lostItem) {
      findMatches();
    }
  }, [lostItem]);

  const findMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await enhancedMatcher.findEnhancedMatches(lostItem, {
        minScore: 50,
        maxResults: 5
      });
      
      if (result.error) {
        setError(result.error);
      } else {
        setMatches(result.matches);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const MatchCard = ({ match }) => {
    const { item, match: matchData } = match;
    const explanation = enhancedMatcher.getMatchExplanation(matchData);
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-4 border border-gray-200">
        {/* Match Score Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
              matchData.score >= 85 ? 'bg-green-100 text-green-800' :
              matchData.score >= 70 ? 'bg-blue-100 text-blue-800' :
              matchData.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {explanation.score} Match
            </div>
            <div className={`px-2 py-1 rounded text-xs ${
              explanation.confidence === 'high' ? 'bg-green-50 text-green-700' :
              explanation.confidence === 'medium' ? 'bg-blue-50 text-blue-700' :
              'bg-gray-50 text-gray-700'
            }`}>
              {explanation.confidence} confidence
            </div>
          </div>
          <div className={`text-xs px-2 py-1 rounded ${
            explanation.recommendation.urgency === 'high' ? 'bg-red-100 text-red-700' :
            explanation.recommendation.urgency === 'medium' ? 'bg-orange-100 text-orange-700' :
            explanation.recommendation.urgency === 'low' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {explanation.recommendation.message}
          </div>
        </div>

        {/* Image Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-4">
          {/* Lost Item */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Lost Item</h4>
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border">
              {lostItem.image_url ? (
                <img 
                  src={lostItem.image_url} 
                  alt={lostItem.image_alt_text || 'Lost item photo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📷</div>
                    <div className="text-xs">No image</div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-sm">
              <div className="font-medium">{lostItem.title}</div>
              <div className="text-gray-600 text-xs">{lostItem.description}</div>
            </div>
          </div>

          {/* Found Item */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Potential Match</h4>
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.image_alt_text || 'Found item photo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📷</div>
                    <div className="text-xs">No image</div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-sm">
              <div className="font-medium">{item.title}</div>
              <div className="text-gray-600 text-xs">{item.description}</div>
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Match Analysis</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            {explanation.details.map((detail, index) => (
              <li key={index}>• {detail}</li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Contact Finder
          </button>
          <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            View Details
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Finding Matches</h3>
            <p className="text-gray-600 text-sm">Using enhanced AI matching with image analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Enhanced Match Results</h3>
              <p className="text-gray-600 text-sm mt-1">
                {matches.length > 0 
                  ? `Found ${matches.length} potential match${matches.length !== 1 ? 'es' : ''} with image analysis`
                  : 'No matches found'
                }
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-red-800 font-medium">Error finding matches</div>
              <div className="text-red-600 text-sm mt-1">{error}</div>
              <button 
                onClick={findMatches}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-3">🔍</div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No Matches Found</h4>
              <p className="text-gray-500 text-sm">
                We couldn't find any items that closely match your description. 
                Try checking back later or contact campus security.
              </p>
            </div>
          ) : (
            <div>
              {matches.map((match, index) => (
                <MatchCard key={match.item.id || index} match={match} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}