"use client";
import { useState, useEffect } from "react";

export default function SearchAndFilter({ 
  items = [], 
  onFilterChange,
  onFilteredResults, 
  showTypeFilter = true,
  defaultType = "all",
  compact = false,
  initialQuery = ""
}) {
  const [searchTerm, setSearchTerm] = useState(initialQuery || "");
  const [selectedType, setSelectedType] = useState(defaultType);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showAdvanced, setShowAdvanced] = useState(!compact);

  // Extract unique values for filter options
  const categories = [...new Set(items.map(item => item.category))].sort();
  const locations = [...new Set(items.map(item => {
    // Extract building name from location
    const building = item.location.split(' ')[0];
    return building;
  }))].sort();

  // Search and filter logic
  useEffect(() => {
    let filtered = [...items];

    // Text search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.reportedBy?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter(item => 
        item.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Date range filter
    if (selectedDateRange !== "all") {
      const now = new Date();
      const itemDate = new Date(item.date);
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const daysDiff = (now - itemDate) / (1000 * 60 * 60 * 24);
        
        switch (selectedDateRange) {
          case "today": return daysDiff < 1;
          case "week": return daysDiff < 7;
          case "month": return daysDiff < 30;
          case "3months": return daysDiff < 90;
          default: return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date) - new Date(a.date);
        case "oldest":
          return new Date(a.date) - new Date(b.date);
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "location":
          return a.location.localeCompare(b.location);
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    // Pass results to parent component
    if (onFilterChange) {
      onFilterChange(filtered);
    }
    if (onFilteredResults) {
      onFilteredResults(filtered);
    }
  }, [searchTerm, selectedType, selectedCategory, selectedLocation, selectedDateRange, sortBy, items, onFilterChange, onFilteredResults]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType(defaultType);
    setSelectedCategory("all");
    setSelectedLocation("all");
    setSelectedDateRange("all");
    setSortBy("newest");
  };

  const hasActiveFilters = searchTerm || selectedType !== defaultType || selectedCategory !== "all" || 
                         selectedLocation !== "all" || selectedDateRange !== "all";

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 ${compact ? 'mb-0' : 'mb-6'}`}>
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400 text-lg">🔍</span>
        </div>
        <input
          type="text"
          placeholder="Search items by title, description, location, or reporter..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white transition-all duration-200"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {showTypeFilter && (
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 bg-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="LOST">Lost Items</option>
            <option value="FOUND">Found Items</option>
          </select>
        )}

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 bg-white text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 bg-white text-sm"
        >
          <option value="all">All Locations</option>
          {locations.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
        >
          {showAdvanced ? "Hide" : "More"} Filters
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-all duration-200"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 bg-white text-sm"
              >
                <option value="all">Any Time</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="3months">Past 3 Months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 bg-white text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="location">By Location</option>
                <option value="category">By Category</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedType("LOST");
                    setSelectedDateRange("week");
                  }}
                  className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Recent Lost
                </button>
                <button
                  onClick={() => {
                    setSelectedType("FOUND");
                    setSelectedDateRange("week");
                  }}
                  className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Recent Found
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Active filters:</span>
            
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm("")} className="hover:text-blue-900">✕</button>
              </span>
            )}
            
            {selectedType !== defaultType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                Type: {selectedType}
                <button onClick={() => setSelectedType(defaultType)} className="hover:text-purple-900">✕</button>
              </span>
            )}
            
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory("all")} className="hover:text-green-900">✕</button>
              </span>
            )}
            
            {selectedLocation !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                Location: {selectedLocation}
                <button onClick={() => setSelectedLocation("all")} className="hover:text-yellow-900">✕</button>
              </span>
            )}
            
            {selectedDateRange !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                Date: {selectedDateRange}
                <button onClick={() => setSelectedDateRange("all")} className="hover:text-orange-900">✕</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}