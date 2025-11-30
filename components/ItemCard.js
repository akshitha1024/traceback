import Link from "next/link";
import Badge from "./Badge";
import ReportButton from "./ReportButton";
import SecurityVerification from "./SecurityVerification";
import FounderDetails from "./FounderDetails";
import { useState, useEffect } from "react";
import { getPrivateItemData, getPrivacyStatusMessage, canClaimItem, isItemPublic } from "@/utils/privacy";

export default function ItemCard({ item, type, id, title, location, date, ago, category, showClaimed = false }) {
  const [showVerification, setShowVerification] = useState(false);
  const [showFounderDetails, setShowFounderDetails] = useState(false);
  const [founderInfo, setFounderInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Handle both old prop format (individual props) and new format (item object)
  const itemData = item || { id, type, title, location, date, ago, category };
  
  // Use the type from the item data (which should now be correctly set in Dashboard)
  const finalType = itemData.type || type || 'LOST';
  
  // Check if this is a private item (from API flag)
  const isPrivate = itemData.is_currently_private === true || itemData.isPrivate === true;
  
  // Check if this item is claimed
  const isClaimed = itemData.status === 'CLAIMED' || itemData.is_claimed === 1;
  
  // Get current user from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(user);
    }
  }, []);
  
  // Check if current user is the owner/reporter of this item (works for both found and lost)
  const isMyItem = currentUser && (
    (itemData.finder_email && currentUser.email?.toLowerCase() === itemData.finder_email.toLowerCase()) ||
    (itemData.user_email && currentUser.email?.toLowerCase() === itemData.user_email.toLowerCase())
  );
  
  // Debug logging for image visibility
  if (itemData.image_filename) {
    console.log('🖼️ IMAGE DEBUG:', {
      title: itemData.title,
      type: finalType,
      image_filename: itemData.image_filename,
      currentUserEmail: currentUser?.email,
      finder_email: itemData.finder_email,
      user_email: itemData.user_email,
      isMyItem: isMyItem,
      willShowImage: !!(itemData.image_filename && isMyItem)
    });
  }
  
  // CRITICAL: Do NOT render private items
  // Only hide claimed items if showClaimed is false (browse views)
  // In dashboard (showClaimed=true), show claimed items to the finder
  if (isPrivate) {
    return null;
  }
  
  if (isClaimed && !showClaimed) {
    return null;
  }
  
  console.log(`ItemCard Debug (PUBLIC):`, {
    title: itemData.title,
    type: finalType,
    is_currently_private: itemData.is_currently_private,
    created_at: itemData.created_at,
    has_location_name: !!itemData.location_name
  });
  
  // Create corrected item data with proper type
  const correctedItemData = { ...itemData, type: finalType };
  
  // For display purposes, use the item data as-is
  const displayItem = correctedItemData;

  const handleVerificationSuccess = (details) => {
    setShowVerification(false);
    setFounderInfo(details);
    setShowFounderDetails(true);
  };

  const handleVerifyOwnership = () => {
    setShowVerification(true);
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border-white/20">
      <div className="mb-4 flex items-center gap-2">
        <Badge type={finalType} />
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {displayItem.category}
        </span>
        {isClaimed && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
            ✓ CLAIMED
          </span>
        )}
        {displayItem.ago && (
          <span className="ml-auto text-xs text-gray-500 font-medium">{displayItem.ago}</span>
        )}
      </div>
      
      <div className="font-semibold text-gray-900 mb-2">{displayItem.title}</div>
      
      {/* Display image only if user is the owner/reporter of this item */}
      {displayItem.image_filename && isMyItem && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <img 
            src={`http://localhost:5000/api/uploads/${displayItem.image_filename}`}
            alt={displayItem.title}
            loading="lazy"
            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.target.style.display = 'none';
              console.error('Failed to load image:', displayItem.image_filename);
            }}
          />
        </div>
      )}
      
      <div className="text-sm text-gray-600 mb-2">
        {displayItem.location_name || displayItem.location} • {displayItem.date_found || displayItem.date}{displayItem.time_found && ` at ${displayItem.time_found}`}
      </div>
      
      {/* Display when the item was reported (created_at in ET) */}
      {displayItem.created_at && (
        <div className="text-xs text-gray-500 mb-2">
          Reported: {new Date(displayItem.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/New_York'
          })} ET
        </div>
      )}
      
      {displayItem.description && (
        <div className="text-sm text-gray-600 mb-4">
          {displayItem.description}
        </div>
      )}
      
      <div className="flex items-center justify-between gap-3">
        {isMyItem ? (
          <div className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 border-2 border-blue-300 text-blue-800 text-center">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              You reported this item
            </div>
          </div>
        ) : isClaimed ? (
          <div className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 border-2 border-gray-300 text-gray-500 text-center cursor-not-allowed">
            Item Already Claimed
          </div>
        ) : (
          <Link
            href={`/verify/${displayItem.id}`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl bg-green-600 hover:bg-green-700 text-white"
          >
            Claim Item
          </Link>
        )}
        
        {/* Don't show report button if user is the finder (for found items) */}
        {!isMyItem && (
          <ReportButton type="item" targetId={displayItem.id} size="small" style="text" />
        )}
      </div>

      {showVerification && (
        <SecurityVerification
          foundItem={itemData}
          onSuccess={handleVerificationSuccess}
          onCancel={() => setShowVerification(false)}
        />
      )}

      {showFounderDetails && (
        <FounderDetails
          founderInfo={founderInfo}
          onClose={() => setShowFounderDetails(false)}
        />
      )}
    </div>
  );
}
