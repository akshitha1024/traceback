"use client";


import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function ClaimsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const claimType = searchParams.get('type') || 'claimer';
  
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, claimed, not_claimed

  useEffect(() => {
    loadClaims();
  }, [claimType]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.email) return;

      const response = await fetch(`http://localhost:5000/api/claims?user_email=${encodeURIComponent(user.email)}&type=${claimType}`);
      const data = await response.json();
      
      if (response.ok) {
        setClaims(data.claims || []);
      }
    } catch (error) {
      console.error('Failed to load claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimStatusUpdate = async (claimId, newStatus, claim) => {
    if (newStatus === 'NOT_CLAIMED') {
      const confirmed = window.confirm(
        `Are you sure you want to mark this as NOT CLAIMED?\n\nThis will automatically report it as a false claim.`
      );
      
      if (!confirmed) return;
    } else if (newStatus === 'CLAIMED') {
      const confirmed = window.confirm(
        `Confirm that this item has been ${claimType === 'finder' ? 'returned to the owner' : 'claimed'}?`
      );
      
      if (!confirmed) return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/claims/${claimId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimed_status: newStatus
        })
      });

      if (response.ok) {
        if (newStatus === 'NOT_CLAIMED') {
          await fetch('http://localhost:5000/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              report_type: 'false_claim',
              item_id: claim.item_id,
              item_title: claim.item_title,
              description: `False claim reported for item: ${claim.item_title}. Claimer: ${claim.claimer_name} (${claim.claimer_email})`,
              reporter_email: claim.finder_email || 'system',
              severity: 'high'
            })
          });
          
          alert('✅ Claim marked as NOT CLAIMED and automatically reported as false claim.');
        } else if (newStatus === 'CLAIMED') {
          alert('✅ Item marked as claimed! You can leave a review in the dashboard.');
        }
        
        loadClaims();
      } else {
        alert('Failed to update claim status');
      }
    } catch (error) {
      console.error('Error updating claim:', error);
      alert('Failed to update claim status');
    }
  };

  const startConversation = async (otherUserId, otherUserName, otherUserEmail, itemId, itemType, itemTitle) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user.id) {
        alert('Please log in to send messages');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          sender_name: user.name,
          sender_email: user.email,
          receiver_id: otherUserId || 0,
          receiver_name: otherUserName,
          receiver_email: otherUserEmail,
          message_text: `Hi, I'm contacting you about: ${itemTitle}`,
          item_id: itemId,
          item_type: itemType,
          item_title: itemTitle
        })
      });

      if (response.ok) {
        router.push('/messages');
      } else {
        const data = await response.json();
        alert(`Failed to start conversation: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation');
    }
  };

  const filteredClaims = claims.filter(claim => {
    if (filter === 'all') return true;
    return claim.claimed_status === filter.toUpperCase();
  });

  return (
    <Protected>
      <Navbar />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {claimType === 'claimer' ? 'Items You\'re Claiming' : 'Claims on Your Found Items'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {claimType === 'claimer' 
                    ? 'Items you\'ve verified ownership for' 
                    : 'People who verified ownership of items you found'}
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-medium transition"
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 font-medium transition ${
                  filter === 'all'
                    ? 'border-b-2 border-gray-900 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({claims.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 font-medium transition ${
                  filter === 'pending'
                    ? 'border-b-2 border-gray-900 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({claims.filter(c => c.claimed_status === 'PENDING').length})
              </button>
              <button
                onClick={() => setFilter('claimed')}
                className={`px-4 py-2 font-medium transition ${
                  filter === 'claimed'
                    ? 'border-b-2 border-gray-900 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Claimed ({claims.filter(c => c.claimed_status === 'CLAIMED').length})
              </button>
              <button
                onClick={() => setFilter('not_claimed')}
                className={`px-4 py-2 font-medium transition ${
                  filter === 'not_claimed'
                    ? 'border-b-2 border-gray-900 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Not Claimed ({claims.filter(c => c.claimed_status === 'NOT_CLAIMED').length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading claims...</p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <p className="text-gray-600 text-lg">No {filter !== 'all' ? filter : ''} claims found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClaims.map((claim) => (
                <div 
                  key={claim.claim_id} 
                  className={`rounded-xl p-6 border shadow-lg hover:shadow-xl transition ${
                    claimType === 'claimer'
                      ? 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
                      : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-bold text-xl ${claimType === 'claimer' ? 'text-gray-900' : 'text-white'}`}>
                          {claim.item_title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          claim.claimed_status === 'CLAIMED' 
                            ? claimType === 'claimer' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                            : claim.claimed_status === 'NOT_CLAIMED' 
                            ? 'bg-gray-300 text-gray-700' 
                            : claimType === 'claimer' ? 'bg-gray-100 text-gray-900 border border-gray-300' : 'bg-gray-700 text-white border border-gray-500'
                        }`}>
                          {claim.claimed_status}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-4 ${claimType === 'claimer' ? 'text-gray-600' : 'text-gray-300'}`}>
                        ✓ Verified: {new Date(claim.verification_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>

                      {/* Contact Info */}
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                          {claimType === 'claimer' ? 'Finder Contact' : 'Owner Contact (Claimer)'}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="flex items-start">
                            <span className="text-gray-600 w-16">Name:</span>
                            <span className="font-medium text-gray-900">
                              {claimType === 'claimer' ? claim.finder_name : claim.claimer_name}
                            </span>
                          </p>
                          <p className="flex items-start">
                            <span className="text-gray-600 w-16">Email:</span>
                            <a 
                              href={`mailto:${claimType === 'claimer' ? claim.finder_email : claim.claimer_email}`} 
                              className="font-medium text-gray-900 hover:text-black underline"
                            >
                              {claimType === 'claimer' ? claim.finder_email : claim.claimer_email}
                            </a>
                          </p>
                          {((claimType === 'claimer' && claim.finder_phone) || (claimType === 'finder' && claim.claimer_phone)) && (
                            <p className="flex items-start">
                              <span className="text-gray-600 w-16">Phone:</span>
                              <a 
                                href={`tel:${claimType === 'claimer' ? claim.finder_phone : claim.claimer_phone}`} 
                                className="font-medium text-gray-900 hover:text-black underline"
                              >
                                {claimType === 'claimer' ? claim.finder_phone : claim.claimer_phone}
                              </a>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => startConversation(
                            claimType === 'claimer' ? claim.finder_id : claim.claimer_id,
                            claimType === 'claimer' ? claim.finder_name : claim.claimer_name,
                            claimType === 'claimer' ? claim.finder_email : claim.claimer_email,
                            claim.item_id,
                            claim.item_type,
                            claim.item_title
                          )}
                          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Message {claimType === 'claimer' ? 'Finder' : 'Claimer'}
                        </button>
                      </div>

                      {/* Action Buttons */}
                      {claim.claimed_status === 'PENDING' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleClaimStatusUpdate(claim.claim_id, 'CLAIMED', claim)}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                              claimType === 'claimer'
                                ? 'bg-gray-900 hover:bg-black text-white'
                                : 'bg-white hover:bg-gray-100 text-gray-900'
                            }`}
                          >
                            ✓ {claimType === 'claimer' ? 'Mark as Claimed' : 'Item Returned to Owner'}
                          </button>
                          <button
                            onClick={() => handleClaimStatusUpdate(claim.claim_id, 'NOT_CLAIMED', claim)}
                            className={`px-4 py-2.5 border-2 rounded-lg text-sm font-semibold transition ${
                              claimType === 'claimer'
                                ? 'border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900'
                                : 'border-gray-600 text-gray-200 hover:border-white hover:text-white'
                            }`}
                          >
                            Not Claimed
                          </button>
                        </div>
                      )}

                      {claim.claimed_status === 'CLAIMED' && claim.claimed_date && (
                        <div className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          claimType === 'claimer' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                        }`}>
                          ✓ Item claimed on {new Date(claim.claimed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
