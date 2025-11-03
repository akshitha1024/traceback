import Link from "next/link";
import Badge from "./Badge";
import ReportButton from "./ReportButton";
import SecurityVerification from "./SecurityVerification";
import FounderDetails from "./FounderDetails";
import { useState } from "react";
import { getPrivateItemData, getPrivacyStatusMessage, canClaimItem, isItemPublic } from "@/utils/privacy";

export default function ItemCard({ item, type, id, title, location, date, ago, category }) {
  const [showVerification, setShowVerification] = useState(false);
  const [showFounderDetails, setShowFounderDetails] = useState(false);
  const [founderInfo, setFounderInfo] = useState(null);
  
  // Handle both old prop format (individual props) and new format (item object)
  const itemData = item || { id, type, title, location, date, ago, category };
  
  // Use the type from the item data (which should now be correctly set in Dashboard)
  const finalType = itemData.type || type || 'LOST';
  
  console.log(`🔍 ItemCard: ${itemData.title} -> Final type: ${finalType}`);
  
  // Create corrected item data with proper type
  const correctedItemData = { ...itemData, type: finalType };
  
  // Apply privacy filtering
  const displayItem = getPrivateItemData(correctedItemData);
  const privacyStatus = getPrivacyStatusMessage(correctedItemData);
  const isClaimable = canClaimItem(correctedItemData);
  const isPrivate = finalType === 'FOUND' && !isItemPublic(correctedItemData);

  const handleVerificationSuccess = (details) => {
    setShowVerification(false);
    setFounderInfo(details);
    setShowFounderDetails(true);
  };

  const handleVerifyOwnership = () => {
    setShowVerification(true);
  };

  return (
    <div className={`bg-white/60 backdrop-blur-sm rounded-xl p-5 border shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 ${
      isPrivate ? 'border-amber-200 bg-amber-50/60' : 'border-white/20'
    }`}>
      <div className="mb-4 flex items-center gap-2">
        <Badge type={finalType} />
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isPrivate ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {displayItem.category}
        </span>
        {!isPrivate && displayItem.ago && (
          <span className="ml-auto text-xs text-gray-500 font-medium">{displayItem.ago}</span>
        )}
        {isPrivate && (
          <span className="ml-auto text-xs text-amber-600 font-medium">Private</span>
        )}
      </div>
      
      {/* Privacy Status Indicator */}
      {itemData.type === 'FOUND' && (
        <div className="mb-3">
          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
            isPrivate ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
          }`}>
            {privacyStatus}
          </div>
        </div>
      )}
      
      <div className={`mb-4 aspect-[4/3] rounded-lg border border-gray-200 overflow-hidden ${
        isPrivate 
          ? 'bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center'
          : 'bg-gradient-to-br from-gray-100 to-gray-200'
      }`}>
        {isPrivate ? (
          <div className="text-center text-amber-700">
            <div className="text-2xl mb-1">📦</div>
            <div className="text-xs font-medium">Private Item</div>
          </div>
        ) : displayItem.image_url ? (
          <img 
            src={displayItem.image_url} 
            alt={displayItem.image_alt_text || `Photo of ${displayItem.title}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient background if image fails to load
              e.target.style.display = 'none';
              e.target.parentNode.classList.add('flex', 'items-center', 'justify-center');
              e.target.parentNode.innerHTML = `
                <div class="text-center text-gray-500">
                  <div class="text-2xl mb-1">📷</div>
                  <div class="text-xs">Image not available</div>
                </div>
              `;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-1">📷</div>
              <div className="text-xs">No image available</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="font-semibold text-gray-900 mb-2">{displayItem.title}</div>
      {isPrivate ? (
        <div className="text-sm text-amber-700 mb-4 bg-amber-50 p-2 rounded">
          📍 Location: Hidden • 📅 Date: Hidden
        </div>
      ) : (
        <div className="text-sm text-gray-600 mb-4">
          {displayItem.location} • {displayItem.date}
        </div>
      )}
      
      {/* Description */}
      <div className={`text-sm mb-4 ${isPrivate ? 'text-amber-700 bg-amber-50 p-2 rounded-lg' : 'text-gray-600'}`}>
        {displayItem.description}
      </div>
      
      <div className="flex items-center justify-between gap-3">
        {isPrivate ? (
          <button
            onClick={handleVerifyOwnership}
            className="inline-flex px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            🔐 VERIFY OWNERSHIP
          </button>
        ) : (
          <Link
            href={`/items/${displayItem.id}`}
            className="inline-flex px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-gray-900 hover:bg-black text-white"
          >
            VIEW DETAILS
          </Link>
        )}
        
        {isClaimable && (
          <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200">
            CLAIM ITEM
          </button>
        )}
        
        <ReportButton type="item" targetId={displayItem.id} size="small" style="text" />
      </div>

      {/* Security Verification Modal */}
      {showVerification && (
        <SecurityVerification
          foundItem={itemData}
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
