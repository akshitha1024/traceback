// Privacy and timing utilities for found items

/**
 * Check if a found item should be public based on the privacy period
 * @param {Object} item - The found item
 * @returns {boolean} - True if item should be public
 */
export const isItemPublic = (item) => {
  if (item.type !== 'FOUND') return true; // Lost items are always public
  
  // Use backend's privacy determination if available
  if (item.is_currently_private !== undefined) {
    console.log(`🎯 ${item.title} -> ${item.is_currently_private ? 'PRIVATE' : 'PUBLIC'} (backend determined)`);
    return !item.is_currently_private;
  }
  
  // Fallback to client-side calculation
  console.log(`🔍 Privacy check for ${item.title}:`, {
    type: item.type,
    isPrivate: item.isPrivate,
    privacy_expires_at: item.privacy_expires_at,
    privacy_expires: item.privacy_expires,
    created_at: item.created_at
  });
  
  // If the item is not marked as private, it's public
  if (!item.isPrivate) {
    console.log(`📢 ${item.title} -> PUBLIC (not marked private)`);
    return true;
  }
  
  // Check if privacy period has expired using privacy_expires_at or privacy_expires
  const expiresAt = item.privacy_expires_at || item.privacy_expires;
  if (!expiresAt) {
    // If no expiry date set, use creation date + 30 days as fallback
    const createdAt = new Date(item.created_at || item.date);
    const thirtyDaysLater = new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000));
    const isExpired = new Date() >= thirtyDaysLater;
    console.log(`📅 ${item.title} -> ${isExpired ? 'PUBLIC' : 'PRIVATE'} (fallback: created ${createdAt.toDateString()}, expires ${thirtyDaysLater.toDateString()})`);
    return isExpired;
  }
  
  const expiryDate = new Date(expiresAt);
  const isExpired = new Date() >= expiryDate;
  console.log(`📅 ${item.title} -> ${isExpired ? 'PUBLIC' : 'PRIVATE'} (expires ${expiryDate.toDateString()})`);
  return isExpired;
};

/**
 * Get privacy-filtered item data for display
 * @param {Object} item - The found item
 * @returns {Object} - Item with privacy filters applied
 */
export const getPrivateItemData = (item) => {
  if (item.type !== 'FOUND' || isItemPublic(item)) {
    return item; // Return full data for public items
  }
  
  // Return data with only name and category visible for private items
  return {
    ...item,
    title: item.title, // Keep original title/name
    category: item.category, // Keep original category
    description: "Details hidden for privacy protection",
    reportedBy: "Anonymous",
    location: "Hidden", 
    color: null,
    size: null,
    date: "Hidden",
    ago: null,
    isPrivate: true,
    canClaim: false
  };
};

/**
 * Check if an item can be claimed by users
 * @param {Object} item - The found item
 * @returns {boolean} - True if item can be claimed
 */
export const canClaimItem = (item) => {
  if (item.type !== 'FOUND') return false;
  return isItemPublic(item) && !item.is_claimed;
};

/**
 * Get the number of days until an item becomes public
 * @param {Object} item - The found item
 * @returns {number} - Days remaining until public
 */
export const getDaysUntilPublic = (item) => {
  if (item.type !== 'FOUND' || isItemPublic(item)) return 0;
  
  const expiresAt = item.privacy_expires_at || item.privacy_expires;
  if (!expiresAt) {
    // If no expiry date set, use creation date + 30 days as fallback
    const createdAt = new Date(item.created_at || item.date);
    const thirtyDaysLater = new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000));
    const diffTime = thirtyDaysLater.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  
  const expiryDate = new Date(expiresAt);
  const diffTime = expiryDate.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

/**
 * Format the privacy status message for display
 * @param {Object} item - The found item
 * @returns {string} - Privacy status message
 */
export const getPrivacyStatusMessage = (item) => {
  if (item.type !== 'FOUND') return '';
  
  if (isItemPublic(item)) {
    return '🌐 Public - Details available, can be claimed';
  }
  
  const daysRemaining = getDaysUntilPublic(item);
  return `🔒 Private - Details hidden for ${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''}`;
};