/**
 * API Service for TrackeBack MySQL Backend
 * Handles all API calls to the Flask backend with MySQL database
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('trackeback_token');
    }
  }

  // Helper method to make HTTP requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add auth token if available
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${response.status}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth methods
  async login(credentials) {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (response.token) {
        this.token = response.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('trackeback_token', response.token);
        }
      }

      return response;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async logout() {
    try {
      await this.makeRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear token regardless of API response
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('trackeback_token');
      }
    }
  }

  // Categories and locations
  async getCategories() {
    return await this.makeRequest('/api/categories');
  }

  async getLocations() {
    return await this.makeRequest('/api/locations');
  }

  // Lost items
  async getLostItems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/lost-items${queryString ? `?${queryString}` : ''}`;
    return await this.makeRequest(endpoint);
  }

  // Found items
  async getFoundItems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/found-items${queryString ? `?${queryString}` : ''}`;
    return await this.makeRequest(endpoint);
  }

  // Security questions
  async getSecurityQuestions(foundItemId) {
    return await this.makeRequest(`/api/security-questions/${foundItemId}`);
  }

  // Ownership verification
  async verifyOwnership(foundItemId, answers) {
    return await this.makeRequest('/api/verify-ownership', {
      method: 'POST',
      body: JSON.stringify({
        found_item_id: foundItemId,
        answers: answers
      })
    });
  }

  // Search
  async searchItems(query, type = 'all') {
    const params = new URLSearchParams({ q: query, type });
    return await this.makeRequest(`/api/search?${params}`);
  }

  // Statistics
  async getStats() {
    return await this.makeRequest('/api/stats');
  }

  // Health check
  async healthCheck() {
    return await this.makeRequest('/health');
  }

  // Helper methods for converting data format
  formatItemForDisplay(item, itemType = null) {
    // Determine item type based on which endpoint called this or explicit type
    let type = itemType;
    if (!type) {
      // If no explicit type, try to determine from context
      // Found items have finder_name, lost items have user_name
      if (item.finder_name || item.finder_email) {
        type = 'FOUND';
      } else if (item.user_name || item.user_email) {
        type = 'LOST';
      } else {
        // Fallback - this shouldn't happen with proper API usage
        type = item.type || 'UNKNOWN';
      }
    }
    
    // Debug logging
    console.log(`🔍 formatItemForDisplay: ${item.title} -> type: ${type} (explicit: ${itemType})`);
    console.log(`   finder_name: ${item.finder_name}, user_name: ${item.user_name}`);
    
    return {
      id: item.id,
      type: type,
      title: item.title,
      description: item.description,
      location: item.location_name || item.location,
      date: item.date_found || item.date_lost || item.created_at,
      ago: this.timeAgo(item.created_at),
      category: item.category_name || item.category,
      color: item.color,
      size: item.size,
      reportedBy: item.user_name || item.finder_name,
      reportedByEmail: item.user_email || item.finder_email,
      reportedByPhone: item.user_phone || item.finder_phone,
      isPrivate: item.is_private || item.is_currently_private,
      canClaim: !item.is_claimed,
      currentLocation: item.current_location,
      finderNotes: item.finder_notes,
      // Privacy-related fields
      privacy_expires_at: item.privacy_expires_at,
      privacy_expires: item.privacy_expires,
      is_claimed: item.is_claimed,
      created_at: item.created_at,
      is_currently_private: item.is_currently_private
    };
  }

  // Convert database items to frontend format
  async getFormattedLostItems(params = {}) {
    try {
      const response = await this.getLostItems(params);
      console.log('🔴 getFormattedLostItems: Processing', response.items?.length, 'items as LOST');
      return {
        items: response.items.map(item => this.formatItemForDisplay(item, 'LOST')),
        ...response
      };
    } catch (error) {
      console.error('Failed to get lost items:', error);
      return { items: [], total: 0 };
    }
  }

  async getFormattedFoundItems(params = {}) {
    try {
      const response = await this.getFoundItems(params);
      console.log('🟢 getFormattedFoundItems: Processing', response.items?.length, 'items as FOUND');
      return {
        items: response.items.map(item => this.formatItemForDisplay(item, 'FOUND')),
        ...response
      };
    } catch (error) {
      console.error('Failed to get found items:', error);
      return { items: [], total: 0 };
    }
  }

  // Utility function to calculate time ago
  timeAgo(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  // Format date for display
  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Export specific methods for easier imports
export const {
  login,
  logout,
  getCategories,
  getLocations,
  getLostItems,
  getFoundItems,
  getFormattedLostItems,
  getFormattedFoundItems,
  getSecurityQuestions,
  verifyOwnership,
  searchItems,
  getStats,
  healthCheck
} = apiService;