
"use client";
import { useState, useEffect } from "react";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ItemCard from "@/components/ItemCard";
import PotentialMatchCard from "@/components/PotentialMatchCard";
import { findPotentialMatches } from "@/utils/matching";
import apiService from "@/utils/apiService";

export default function Dashboard() {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load recent items and stats in parallel
      const [lostResponse, foundResponse, statsResponse] = await Promise.all([
        apiService.getFormattedLostItems({ limit: 6 }),
        apiService.getFormattedFoundItems({ limit: 6 }),
        apiService.getStats().catch(() => ({})) // Don't fail if stats unavailable
      ]);

      setLostItems(lostResponse.items || []);
      setFoundItems(foundResponse.items || []);
      setStats(statsResponse || {});

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Find potential matches for all lost items
  const allPotentialMatches = lostItems.flatMap(lostItem => {
    const matches = findPotentialMatches(lostItem, foundItems, 40); // 40% minimum threshold
    return matches.map(match => ({
      ...match,
      lostItemId: lostItem.id,
      lostItemTitle: lostItem.title
    }));
  }).sort((a, b) => b.matchScore - a.matchScore);

  if (loading) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </main>
        </div>
      </Protected>
    );
  }

  if (error) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="text-center py-12">
              <div className="text-red-500 text-xl mb-4">⚠️ Connection Error</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={loadDashboardData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Try Again
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Make sure the MySQL backend is running on port 5000
              </p>
            </div>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              {Object.keys(stats).length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {stats.active_lost_items || 0} active lost items • {stats.unclaimed_found_items || 0} unclaimed found items
                </p>
              )}
            </div>
            <div className="flex gap-3 items-center">
              <a href="/lost" className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                Report Lost Item
              </a>
              <a href="/found" className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Report Found Item
              </a>
            </div>
          </div>



          {/* Potential Matches */}
          {allPotentialMatches.length > 0 && (
            <section className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Potential Matches Found</div>
                  <div className="text-sm text-gray-600">Found items that might match your lost items</div>
                </div>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                  {allPotentialMatches.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allPotentialMatches.slice(0, 6).map((match, index) => (
                  <PotentialMatchCard 
                    key={`${match.id}-${match.lostItemId}-${index}`}
                    foundItem={match}
                    matchScore={match.matchScore}
                    lostItemId={match.lostItemId}
                  />
                ))}
              </div>
              {allPotentialMatches.length > 6 && (
                <div className="mt-4 text-center">
                  <button className="text-amber-700 hover:text-amber-800 font-medium text-sm">
                    View {allPotentialMatches.length - 6} more matches →
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Stats Overview */}
          {Object.keys(stats).length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
                <div className="text-2xl font-bold text-red-600">{stats.active_lost_items || 0}</div>
                <div className="text-sm text-gray-600">Active Lost Items</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
                <div className="text-2xl font-bold text-green-600">{stats.unclaimed_found_items || 0}</div>
                <div className="text-sm text-gray-600">Unclaimed Found</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.recent_lost_items || 0}</div>
                <div className="text-sm text-gray-600">Lost This Week</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
                <div className="text-2xl font-bold text-purple-600">{stats.recent_found_items || 0}</div>
                <div className="text-sm text-gray-600">Found This Week</div>
              </div>
            </div>
          )}

          {/* Recent */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Lost Items</h2>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  {lostItems.length}
                </span>
              </div>
              {lostItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {lostItems.map((i) => <ItemCard key={i.id} item={{...i, type: 'LOST'}} />)}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>No lost items yet</p>
                  <p className="text-sm">Be the first to report a lost item!</p>
                </div>
              )}
            </section>

            <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Found Items</h2>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {foundItems.length}
                </span>
              </div>
              {foundItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {foundItems.map((i) => <ItemCard key={i.id} item={{...i, type: 'FOUND'}} />)}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎯</div>
                  <p>No found items yet</p>
                  <p className="text-sm">Help someone by reporting found items!</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </Protected>
  );
}
