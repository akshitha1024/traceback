import { useState } from 'react';
import { getMatchStrength, getMatchColor } from '../utils/matching';
import SecurityVerification from './SecurityVerification';
import FounderDetails from './FounderDetails';
import { foundItems } from '../data/mock';

export default function PotentialMatchCard({ foundItem, matchScore, lostItemId }) {
  const [showVerification, setShowVerification] = useState(false);
  const [showFounderDetails, setShowFounderDetails] = useState(false);
  const [founderInfo, setFounderInfo] = useState(null);
  
  const matchStrength = getMatchStrength(matchScore);
  const matchColorClass = getMatchColor(matchScore);

  // Get full item data with security questions
  const fullItemData = foundItems.find(item => item.id === foundItem.id);

  const handleVerificationSuccess = (details) => {
    setShowVerification(false);
    setFounderInfo(details);
    setShowFounderDetails(true);
  };

  const handleVerifyOwnership = () => {
    setShowVerification(true);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-amber-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            FOUND
          </span>
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
            {foundItem.category}
          </span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${matchColorClass}`}>
          {matchScore}% Match
        </div>
      </div>

      <div className="mb-3">
        <div className="font-semibold text-gray-900 mb-1">{foundItem.title}</div>
        <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
          📍 Location: Hidden • 📅 Date: Hidden
        </div>
      </div>

      <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded mb-4">
        Details hidden for privacy protection. This item becomes public on{' '}
        {new Date(foundItem.publicAt).toLocaleDateString()}.
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className={`text-xs font-medium px-2 py-1 rounded ${matchColorClass}`}>
          {matchStrength}
        </div>
        <button
          onClick={handleVerifyOwnership}
          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        >
          🔐 VERIFY OWNERSHIP
        </button>
      </div>

      {/* Security Verification Modal */}
      {showVerification && fullItemData && (
        <SecurityVerification
          foundItem={fullItemData}
          onSuccess={handleVerificationSuccess}
          onCancel={() => setShowVerification(false)}
        />
      )}

      {/* Founder Details Modal */}
      {showFounderDetails && (
        <FounderDetails
          founderInfo={founderInfo}
          onClose={() => setShowFounderDetails(false)}
        />
      )}
    </div>
  );
}