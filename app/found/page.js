"use client";



import Link from "next/link";
import { useState, useEffect } from "react";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ItemCard from "@/components/ItemCard";

export default function FoundPage() {
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false
  });

  const fetchFoundItems = async (page = 1) => {
    try {
      setLoading(true);
      // Get current user for matching private items
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userEmail = user.email || '';
      
      // Fetch found items - will only show items >3 days old OR items with >80% match to user's lost items
      const response = await fetch(`http://localhost:5000/api/found-items?limit=25&page=${page}&user_email=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFoundItems(data.items || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error('Error fetching found items:', err);
      setError('Failed to load found items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoundItems(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchFoundItems(newPage);
    }
  };

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    const pages = [];
    const current = pagination.page;
    const total = pagination.pages;
    
    // Show first page
    if (current > 3) {
      pages.push(1);
      if (current > 4) pages.push('...');
    }
    
    // Show pages around current
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }
    
    // Show last page
    if (current < total - 2) {
      if (current < total - 3) pages.push('...');
      pages.push(total);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(current - 1)}
          disabled={!pagination.has_prev}
          className="px-4 py-2 rounded-lg bg-white/90 hover:bg-white text-gray-900 font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            disabled={page === '...' || page === current}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              page === current
                ? 'bg-gray-900 text-white shadow-lg'
                : page === '...'
                ? 'cursor-default text-gray-500'
                : 'bg-white/90 hover:bg-white text-gray-900 shadow-lg hover:shadow-xl'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(current + 1)}
          disabled={!pagination.has_next}
          className="px-4 py-2 rounded-lg bg-white/90 hover:bg-white text-gray-900 font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Found Items</h1>
              <Link 
                href="/report" 
                className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Report Found Item
              </Link>
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading found items...</p>
              </div>
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
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Found Items</h1>
              <Link 
                href="/report" 
                className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Report Found Item
              </Link>
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-red-600">{error}</div>
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Found Items</h1>
              <Link 
                href="/report" 
                className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Report Found Item
              </Link>
            </div>
            
            {/* Privacy Policy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-xl">🔒</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">3-Day Privacy Period</h3>
                  <p className="text-sm text-blue-800">
                    <strong>New found items are private for the first 3 days</strong> and only visible to users who reported matching lost items (&gt;80% similarity). After 3 days, items become public showing limited details: name, category, location, and date. This gives priority to people who actually lost items while protecting privacy and preventing false claims.
                  </p>
                  <p className="text-xs text-blue-700 mt-2 italic">
                    💡 Tip: If you lost something, report it on your dashboard to get matched with found items during the private period!
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
            <div>
              Showing {foundItems.length} of {pagination.total?.toLocaleString()} found items 
              (Page {pagination.page} of {pagination.pages})
            </div>
            <div>
              <b><i>Showing: name, category, location, date • 25 per page</i>
              </b>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {foundItems.map((item) => (
              <ItemCard 
                key={item.id}
                item={{
                  ...item,
                  type: 'FOUND',
                  location: item.location_name || item.location,
                  date: item.created_at,
                  category: item.category_name || item.category
                }}
              />
            ))}
          </div>
          
          {foundItems.length === 0 && !loading && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">No Found Items Yet</div>
              <p className="text-gray-600 mb-4">
                Be the first to report a found item! Or report your lost item to get matched with finds.
              </p>
              <Link 
                href="/report" 
                className="inline-block bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Report Item
              </Link>
            </div>
          )}

          {renderPagination()}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm">
            <Link href="/about" className="hover:text-gray-300 transition-colors">About</Link>
            <Link href="/how-it-works" className="hover:text-gray-300 transition-colors">How It Works</Link>
            <Link href="/faq" className="hover:text-gray-300 transition-colors">FAQ</Link>
            <Link href="/report-bug" className="hover:text-gray-300 transition-colors">Report Bug / Issue</Link>
            <Link href="/contact" className="hover:text-gray-300 transition-colors">Contact</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
          </div>
          <div className="mt-4 text-gray-400 text-xs">
            © 2025 TraceBack — Made for campus communities. Built by Team Bravo (Fall 2025), Kent State University.
          </div>
        </div>
      </footer>
    </Protected>
  );
}
