"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ReportButton from "@/components/ReportButton";
import { lostItems, foundItems } from "@/data/mock";

// Matching algorithm that calculates similarity scores
const calculateMatchScore = (item1, item2) => {
  let score = 0;
  let maxScore = 0;

  // Title similarity (40% weight)
  const titleWeight = 40;
  const titleSimilarity = calculateTextSimilarity(item1.title, item2.title);
  score += titleSimilarity * titleWeight;
  maxScore += titleWeight;

  // Category exact match (25% weight)
  const categoryWeight = 25;
  if (item1.category === item2.category) {
    score += categoryWeight;
  }
  maxScore += categoryWeight;

  // Location proximity (20% weight)
  const locationWeight = 20;
  const locationSimilarity = calculateLocationSimilarity(item1.location, item2.location);
  score += locationSimilarity * locationWeight;
  maxScore += locationWeight;

  // Description similarity (10% weight)
  const descriptionWeight = 10;
  if (item1.description && item2.description) {
    const descSimilarity = calculateTextSimilarity(item1.description, item2.description);
    score += descSimilarity * descriptionWeight;
  }
  maxScore += descriptionWeight;

  // Color similarity (5% weight)
  const colorWeight = 5;
  if (item1.color && item2.color) {
    const colorSimilarity = calculateTextSimilarity(item1.color, item2.color);
    score += colorSimilarity * colorWeight;
  }
  maxScore += colorWeight;

  return Math.round((score / maxScore) * 100);
};

// Calculate text similarity using simple word matching
const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  let matches = 0;
  const totalWords = Math.max(words1.length, words2.length);
  
  words1.forEach(word => {
    if (words2.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  });
  
  return matches / totalWords;
};

// Calculate location similarity
const calculateLocationSimilarity = (loc1, loc2) => {
  if (!loc1 || !loc2) return 0;
  
  // Extract building names
  const building1 = loc1.toLowerCase().split(' ')[0];
  const building2 = loc2.toLowerCase().split(' ')[0];
  
  if (building1 === building2) return 1;
  
  // Check for partial matches
  if (building1.includes(building2) || building2.includes(building1)) return 0.7;
  
  // Check for similar words (library, lab, etc.)
  const similarBuildings = [
    ['library', 'lib'],
    ['laboratory', 'lab'],
    ['building', 'bldg'],
    ['center', 'centre'],
    ['math', 'mathematics'],
    ['science', 'sci']
  ];
  
  for (const group of similarBuildings) {
    if (group.includes(building1) && group.includes(building2)) {
      return 0.5;
    }
  }
  
  return 0;
};

// Find matches for a given item
const findMatches = (targetItem, searchInItems) => {
  const matches = searchInItems
    .filter(item => item.id !== targetItem.id)
    .map(item => ({
      ...item,
      matchScore: calculateMatchScore(targetItem, item),
      matchReasons: getMatchReasons(targetItem, item)
    }))
    .filter(item => item.matchScore > 15) // Only show matches above 15%
    .sort((a, b) => b.matchScore - a.matchScore);
  
  return matches;
};

// Get reasons why items match
const getMatchReasons = (item1, item2) => {
  const reasons = [];
  
  if (item1.category === item2.category) {
    reasons.push(`Same category: ${item1.category}`);
  }
  
  if (calculateLocationSimilarity(item1.location, item2.location) > 0.5) {
    reasons.push(`Similar location: ${item2.location}`);
  }
  
  if (item1.color && item2.color && calculateTextSimilarity(item1.color, item2.color) > 0.5) {
    reasons.push(`Similar color: ${item2.color}`);
  }
  
  const titleSim = calculateTextSimilarity(item1.title, item2.title);
  if (titleSim > 0.3) {
    reasons.push("Similar description");
  }
  
  return reasons;
};

export default function Matches() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get('item');
  const [targetItem, setTargetItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (itemId) {
      // Find matches for specific item
      const allItems = [...lostItems, ...foundItems];
      const item = allItems.find(i => i.id === itemId);
      
      if (item) {
        setTargetItem(item);
        const searchIn = item.type === 'LOST' ? foundItems : lostItems;
        const foundMatches = findMatches(item, searchIn);
        setMatches(foundMatches);
      }
    } else {
      // Find all potential matches for user's items (demo: use first few lost items as "user's items")
      const userItems = lostItems.slice(0, 3); // Simulate user's reported items
      const allPotentialMatches = [];
      
      userItems.forEach(userItem => {
        const searchIn = userItem.type === 'LOST' ? foundItems : lostItems;
        const itemMatches = findMatches(userItem, searchIn);
        
        itemMatches.forEach(match => {
          allPotentialMatches.push({
            ...match,
            forItem: userItem,
            matchScore: match.matchScore
          });
        });
      });
      
      // Sort by match score and remove duplicates
      const uniqueMatches = allPotentialMatches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10); // Show top 10 matches
      
      setAllMatches(uniqueMatches);
    }
    setLoading(false);
  }, [itemId]);

  if (loading) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Finding matches...</p>
              </div>
            </div>
          </main>
        </div>
      </Protected>
    );
  }

  if (!targetItem && itemId) {
    // Specific item not found
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Item Not Found</h1>
              <p className="text-gray-600 mb-6">The item you're looking for doesn't exist.</p>
              <Link href="/dashboard" className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200">
                Back to Dashboard
              </Link>
            </div>
          </main>
        </div>
      </Protected>
    );
  }

  if (!targetItem && !itemId) {
    // General matches view - show all potential matches
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Potential Matches</h1>
                <p className="text-gray-600">Top potential matches for your reported items</p>
              </div>
              <Link href="/report" className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                Report New Item
              </Link>
            </div>

            {allMatches.length === 0 ? (
              <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Matches Yet</h2>
                <p className="text-gray-600 mb-6">Report some items to start finding matches!</p>
                <div className="flex justify-center gap-4">
                  <Link href="/report" className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200">
                    Report Lost Item
                  </Link>
                  <Link href="/dashboard" className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200">
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {allMatches.map((match, index) => (
                  <div key={`${match.id}-${match.forItem.id}`} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Your Item */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Your {match.forItem.type} Item</h3>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              match.forItem.type === 'LOST' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {match.forItem.type}
                            </span>
                            <span className="text-xs text-gray-600">{match.forItem.category}</span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{match.forItem.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{match.forItem.description}</p>
                          <p className="text-xs text-gray-500">📍 {match.forItem.location}</p>
                        </div>
                      </div>

                      {/* Potential Match */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Potential Match</h3>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            match.matchScore >= 80 ? 'bg-green-100 text-green-800' :
                            match.matchScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            <span>⚡</span>
                            <span>{match.matchScore}% Match</span>
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              match.type === 'LOST' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {match.type}
                            </span>
                            <span className="text-xs text-gray-600">{match.category}</span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{match.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{match.description}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">📍 {match.location}</p>
                            <p className="text-xs text-gray-500">👤 {match.reportedBy}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Link 
                            href={`/matches?item=${match.forItem.id}`}
                            className="flex-1 bg-gray-900 hover:bg-black text-white px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 text-center"
                          >
                            View All Matches
                          </Link>
                          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200">
                            Contact Owner
                          </button>
                          <ReportButton type="item" targetId={match.id} size="small" style="icon" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <Navbar />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Similar Matches</h1>
              <p className="text-gray-600">Found {matches.length} potential matches for your item</p>
            </div>
            <Link href="/dashboard" className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
              Back to Dashboard
            </Link>
          </div>

          {/* Target Item */}
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your {targetItem.type} Item</h2>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      targetItem.type === 'LOST' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {targetItem.type}
                    </span>
                    <span className="text-sm text-gray-600">{targetItem.category}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{targetItem.title}</h3>
                  <p className="text-gray-700 mb-3">{targetItem.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>📍 {targetItem.location}</span>
                    <span>📅 {targetItem.date}</span>
                    <span>👤 {targetItem.reportedBy}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Matches */}
          {matches.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Matches Found</h2>
              <p className="text-gray-600 mb-6">We couldn't find any similar items at the moment. Check back later!</p>
              <div className="flex justify-center gap-4">
                <Link href="/dashboard" className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200">
                  Back to Dashboard
                </Link>
                <Link href="/report" className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200">
                  Report New Item
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Potential Matches (Ordered by Similarity)
              </h2>
              
              {matches.map((match, index) => (
                <div key={match.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                          #{index + 1} Match
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          match.type === 'LOST' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {match.type}
                        </span>
                        <span className="text-sm text-gray-600">{match.category}</span>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          match.matchScore >= 80 ? 'bg-green-100 text-green-800' :
                          match.matchScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          <span>⚡</span>
                          <span>{match.matchScore}% Match</span>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{match.title}</h3>
                      <p className="text-gray-700 mb-3">{match.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>📍</span>
                            <span>{match.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>📅</span>
                            <span>{match.date} ({match.ago})</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>👤</span>
                            <span>Reported by {match.reportedBy}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-700 mb-1">Why this matches:</div>
                          {match.matchReasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Link 
                        href={`/items/${match.id}`}
                        className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 text-center"
                      >
                        View Details
                      </Link>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200">
                        Contact Owner
                      </button>
                      <ReportButton type="item" targetId={match.id} size="small" style="button" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Matching Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Higher match percentages indicate stronger similarity</li>
              <li>• Matches are ranked by overall similarity score</li>
              <li>• Contact item owners directly to verify if it's your item</li>
              <li>• Check back regularly as new items are reported daily</li>
            </ul>
          </div>
        </main>
      </div>
    </Protected>
  );
}