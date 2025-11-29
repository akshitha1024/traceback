"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import PotentialMatchCard from "@/components/PotentialMatchCard";
import { findPotentialMatches } from "@/utils/matching";

export default function LostItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id;

  const [lostItem, setLostItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadItemDetails();
  }, [itemId]);

  const loadItemDetails = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user.email) {
        setError('Please log in to view this item');
        setLoading(false);
        return;
      }

      // Fetch the specific lost item with ML matches
      const lostResponse = await fetch(
        `http://localhost:5000/api/lost-items?user_email=${encodeURIComponent(user.email)}&include_matches=true`
      );

      if (lostResponse.ok) {
        const lostData = await lostResponse.json();
        const item = lostData.items.find(i => i.id === parseInt(itemId));
        
        if (!item) {
          setError('Item not found or you do not have permission to view it');
          setLoading(false);
          return;
        }

        setLostItem(item);

        // Use ML matches from backend (already filtered for >=70% threshold)
        if (item.ml_matches && item.ml_matches.length > 0) {
          const mlMatches = item.ml_matches.map(match => ({
            id: match.id,
            title: match.title,
            description: match.description,
            color: match.color,
            size: match.size,
            date_found: match.date_found,
            time_found: match.time_found,
            image_filename: match.image_filename,
            finder_name: match.finder_name,
            finder_email: match.finder_email,
            finder_phone: match.finder_phone,
            current_location: match.current_location,
            is_claimed: match.is_claimed,
            status: match.status,
            category: match.category_name,
            category_name: match.category_name,
            location: match.location_name,
            location_name: match.location_name,
            matchScore: match.match_score * 100, // Convert to percentage
            matchDetails: {
              description: 0,
              image: 0,
              location: 0,
              category: 0,
              color: 0,
              date: 0
            }
          }));
          setMatches(mlMatches.sort((a, b) => b.matchScore - a.matchScore));
        }
      } else {
        setError('Failed to load item details');
      }
    } catch (err) {
      console.error('Error loading item details:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLostItem = async () => {
    if (!confirm('Are you sure you want to delete this lost item? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch(
        `http://localhost:5000/api/lost-items/${itemId}?user_email=${encodeURIComponent(user.email)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        alert('✅ Lost item deleted successfully!');
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to delete: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting lost item:', err);
      alert('❌ Failed to delete item');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading item details...</p>
            </div>
          </main>
        </div>
      </Protected>
    );
  }

  if (error || !lostItem) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error || 'Item not found'}
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Dashboard
            </button>
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
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          {/* Lost Item Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 border-b-2 border-red-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-red-500 text-white rounded-lg flex items-center justify-center font-bold text-3xl">
                    {lostItem.title.charAt(0)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">LOST</span>
                    <span className="bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded">{lostItem.category}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{lostItem.title}</h1>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <span className="font-semibold">Lost on:</span> {new Date(lostItem.date_lost).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}{lostItem.time_lost && ` at ${lostItem.time_lost}`}
                    </div>
                    <div>
                      <span className="font-semibold">Location:</span> {lostItem.location_name || lostItem.location}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={handleDeleteLostItem}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {deleteLoading ? 'Deleting...' : 'Found it? Delete'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Owner-only image display */}
              {lostItem.image_filename && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Photo</h3>
                  <div className="rounded-lg overflow-hidden w-64">
                    <img
                      src={`http://localhost:5000/api/uploads/${lostItem.image_filename}`}
                      alt={lostItem.title}
                      loading="lazy"
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                      onError={(e) => { e.target.style.display = 'none'; console.error('Failed to load image:', lostItem.image_filename); }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 italic">Only visible to you</p>
                </div>
              )}
              
              {lostItem.description && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{lostItem.description}</p>
                </div>
              )}
              
              {lostItem.color && (
                <div className="mb-2">
                  <span className="font-semibold text-gray-900">Color:</span> <span className="text-gray-700">{lostItem.color}</span>
                </div>
              )}
              
              {lostItem.size && (
                <div className="mb-2">
                  <span className="font-semibold text-gray-900">Size:</span> <span className="text-gray-700">{lostItem.size}</span>
                </div>
              )}
            </div>
          </div>

          {/* Matches Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Matching Found Items ({matches.length})
            </h2>
            
            {matches.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Found</h3>
                <p className="text-gray-600">
                  No found items match your lost item yet. Check back later!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {matches.map((match, idx) => (
                  <PotentialMatchCard
                    key={`${match.id}-${idx}`}
                    foundItem={match}
                    matchScore={match.matchScore}
                    lostItemId={lostItem.id}
                  />
                ))}
              </div>
            )}
          </div>
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
