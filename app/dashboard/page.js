
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ItemCard from "@/components/ItemCard";
import PotentialMatchCard from "@/components/PotentialMatchCard";
import Reviews from "@/components/Reviews";
import { findPotentialMatches } from "@/utils/matching";
import apiService from "@/utils/apiService";

export default function Dashboard() {
  const router = useRouter();
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [claimsAsClaimer, setClaimsAsClaimer] = useState([]);
  const [claimsAsFinder, setClaimsAsFinder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadDashboardData();
    loadClaims();
  }, []);

  const startConversation = async (otherUserId, otherUserName, otherUserEmail, itemId, itemType, itemTitle) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user.id) {
        alert('Please log in to send messages');
        return;
      }
      
      // Send an initial message to create the conversation
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          sender_name: user.name,
          sender_email: user.email,
          receiver_id: otherUserId,
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

  const loadClaims = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.email) return;

      // Load claims where user is the claimer (they verified ownership)
      const claimerResponse = await fetch(`http://localhost:5000/api/claims?user_email=${encodeURIComponent(user.email)}&type=claimer`);
      const claimerData = await claimerResponse.json();
      
      if (claimerResponse.ok) {
        setClaimsAsClaimer(claimerData.claims || []);
      }

      // Load claims where user is the finder (someone verified their found item)
      const finderResponse = await fetch(`http://localhost:5000/api/claims?user_email=${encodeURIComponent(user.email)}&type=finder`);
      const finderData = await finderResponse.json();
      
      if (finderResponse.ok) {
        setClaimsAsFinder(finderData.claims || []);
      }
    } catch (error) {
      console.error('Failed to load claims:', error);
    }
  };

  const handleMarkAsClaimed = async (foundItemId, claimerEmail, claimerName) => {
    try {
      const confirmed = window.confirm(
        `Mark this item as claimed by ${claimerName} (${claimerEmail})?\n\n` +
        `This will:\n` +
        `• Move the item to claimed status\n` +
        `• Update the claim attempt to successful\n` +
        `• Notify the claimer\n\n` +
        `Click OK to confirm.`
      );
      
      if (!confirmed) return;

      // Update claim attempt to success
      const response = await fetch(`http://localhost:5000/api/update-claim-attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          found_item_id: foundItemId,
          user_email: claimerEmail,
          success: true
        })
      });

      if (response.ok) {
        alert(`✅ Item marked as claimed by ${claimerName}!`);
        // Reload dashboard
        window.location.reload();
      } else {
        const data = await response.json();
        alert(`❌ Failed to mark as claimed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error marking as claimed:', error);
      alert('Failed to mark item as claimed');
    }
  };

  const handleClaimStatusUpdate = async (claimId, status, claim) => {
    try {
      // If marking as NOT_CLAIMED (False Claim), automatically report it
      if (status === 'NOT_CLAIMED') {
        const confirmFalseClaim = window.confirm(
          `⚠️ Mark this as a FALSE CLAIM?\n\n` +
          `This will:\n` +
          `• Mark the claim as invalid\n` +
          `• Report the user for false verification\n` +
          `• Prevent them from claiming this item again\n\n` +
          `Click OK to confirm, or Cancel to go back.`
        );
        
        if (!confirmFalseClaim) {
          return; // User cancelled
        }

        // Update claim status to NOT_CLAIMED
        const response = await fetch(`http://localhost:5000/api/claims/${claimId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            claimed_status: 'NOT_CLAIMED',
            notes: 'Marked as false claim - User reported for false verification'
          })
        });

        if (response.ok) {
          // Automatically create abuse report
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          
          const reportData = {
            type: 'CLAIM',
            target_id: claimId,
            target_title: `False Claim: ${claim.item_title}`,
            reported_by_id: currentUser.id || null,
            reported_by_name: currentUser.name || 'Anonymous',
            reported_by_email: currentUser.email || '',
            category: 'False Claim',
            reason: 'False ownership verification',
            description: `User ${claim.claimer_name} (${claim.claimer_email}) falsely verified ownership of item: ${claim.item_title}`
          };

          // Submit abuse report
          await fetch('http://localhost:5000/api/reports', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(reportData)
          });

          alert('✅ Claim marked as false and reported to administrators.');
          loadClaims(); // Reload claims
        } else {
          alert('❌ Failed to update claim');
        }
        return;
      }
      
      // If marking as CLAIMED, show confirmation
      if (status === 'CLAIMED') {
        const confirmed = window.confirm(
          `✓ Confirm that the item was successfully returned?\n\n` +
          `After confirming, you can scroll down to leave a review about your experience.`
        );
        
        if (!confirmed) {
          return;
        }
      }

      const response = await fetch(`http://localhost:5000/api/claims/${claimId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimed_status: status,
          notes: status === 'CLAIMED' ? 'Item successfully retrieved' : 'Item not claimed'
        })
      });

      if (response.ok) {
        if (status === 'CLAIMED') {
          alert('✅ Item marked as claimed! Scroll down to the reviews section to share your experience.');
          loadClaims(); // Reload claims
          // Scroll to reviews section after a short delay
          setTimeout(() => {
            const reviewsSection = document.querySelector('section[class*="reviews"]') || 
                                 document.querySelector('h2:has-text("Reviews")') ||
                                 document.querySelector('[class*="Reviews"]');
            if (reviewsSection) {
              reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              // If can't find reviews, just scroll to bottom
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
          }, 1000);
        } else {
          alert(`✅ Claim marked as ${status.toLowerCase()}`);
          loadClaims(); // Reload claims
        }
      } else {
        alert('❌ Failed to update claim');
      }
    } catch (error) {
      console.error('Error updating claim:', error);
      alert('Error updating claim');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!currentUser.id) {
        console.log('No user logged in');
        setLostItems([]);
        setFoundItems([]);
        setLoading(false);
        return;
      }

      // Load user's own reports with matches and stats
      const [userReportsResponse, statsResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/user/${currentUser.id}/reports-with-matches`).then(res => res.json()),
        apiService.getStats().catch(() => ({}))
      ]);

      console.log('📊 User reports with matches:', userReportsResponse);

      // Extract user's lost and found items
      const userLostItems = userReportsResponse.lost_reports || [];
      const userFoundItems = userReportsResponse.found_reports || [];

      setLostItems(userLostItems);
      setFoundItems(userFoundItems);
      setStats(statsResponse || {});

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Use ML matches from backend (already filtered for >=60% and unclaimed items)
  const matchesByLostItem = lostItems.map(lostItem => {
    // Backend already provides ML matches for each lost item
    const matches = (lostItem.matches || []).map(match => ({
      ...match.found_item,
      matchScore: match.match_score * 100, // Convert to percentage
      matchDetails: {
        description: match.description_similarity * 100,
        image: match.image_similarity * 100,
        location: match.location_similarity * 100,
        category: match.category_similarity * 100,
        color: match.color_similarity * 100,
        date: match.date_similarity * 100
      }
    }));
    
    return {
      lostItem,
      matches: matches.sort((a, b) => b.matchScore - a.matchScore)
    };
  }).filter(item => item.matches.length > 0); // Only show lost items that have matches

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

  // Component for Found Item Card with hooks
  const FoundItemCard = ({ foundItem, handleMarkAsClaimed }) => {
    const [itemAttempts, setItemAttempts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const fetchAttempts = async () => {
        try {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const response = await fetch(
            `http://localhost:5000/api/claim-attempts/${foundItem.id}?finder_email=${encodeURIComponent(currentUser.email)}`
          );
          if (response.ok) {
            const data = await response.json();
            setItemAttempts(data.attempts || []);
          }
        } catch (error) {
          console.error('Error fetching attempts:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchAttempts();
    }, [foundItem.id]);

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        {/* Found Report Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b-2 border-green-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold text-2xl">
                {foundItem.title.charAt(0)}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">FOUND</span>
                    <h3 className="text-lg font-bold text-gray-900">
                      {foundItem.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Found on:</strong> {new Date(foundItem.date_found).toLocaleDateString()}{foundItem.time_found && ` at ${foundItem.time_found}`} at {foundItem.location}
                  </p>
                  {foundItem.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {foundItem.description}
                    </p>
                  )}
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                  foundItem.status === 'CLAIMED' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-yellow-500 text-white'
                }`}>
                  {foundItem.status === 'CLAIMED' ? 'Claimed' : 'Unclaimed'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Claim Attempts */}
        {loading && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading responses...</p>
          </div>
        )}
        
        {!loading && itemAttempts.length > 0 && (
          <div className="p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              People who responded ({itemAttempts.length}):
            </h4>
            <div className="space-y-4">
              {itemAttempts.map((attempt) => (
                <div key={attempt.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                          {attempt.conversation_id ? attempt.conversation_id.substring(0, 1).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 break-all text-sm">
                            {attempt.conversation_id ? `Claimer #${attempt.conversation_id.substring(0, 12)}` : 'Anonymous Claimer'}
                          </h5>
                          {(attempt.success === 1 || attempt.marked_as_potential_at) ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <a href={`mailto:${attempt.user_email}`} className="hover:text-blue-600 underline">
                                {attempt.user_email}
                              </a>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">Contact info revealed when verified</p>
                          )}
                        </div>
                      </div>
                      
                      {attempt.answers_with_questions && attempt.answers_with_questions.length > 0 && (
                        <div className="bg-white rounded-lg p-4 mb-3 border border-blue-100">
                          <h6 className="font-semibold text-gray-900 mb-3 text-sm">Verification Questions & Their Answers:</h6>
                          <div className="space-y-3">
                            {attempt.answers_with_questions.map((qa, idx) => (
                              <div key={idx} className="text-sm border-l-2 border-blue-300 pl-3">
                                <p className="text-gray-700 font-medium mb-1">
                                  <span className="text-blue-600">Q{idx + 1}:</span> {qa.question}
                                </p>
                                {qa.question_type === 'text' ? (
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <span className="text-gray-600 text-xs">Your answer:</span>
                                    <span className="font-medium text-gray-900">{qa.correct_answer}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-gray-600 text-xs">Their answer:</span>
                                    <span className="font-medium text-gray-900">{qa.user_answer}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-600 text-xs">Their answer:</span>
                                  <div className="flex-1">
                                    <span className={`font-medium ${qa.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                                      {qa.user_answer}
                                    </span>
                                    {qa.choices && qa.choices[qa.user_answer] && (
                                      <span className="text-gray-600 ml-1">
                                        - {qa.choices[qa.user_answer]}
                                      </span>
                                    )}
                                    {qa.is_correct ? (
                                      <span className="ml-2 text-xs text-green-600">✓ Correct</span>
                                    ) : (
                                      <span className="ml-2 text-xs text-red-600">✗ Incorrect (Correct: {qa.correct_answer})</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Answers submitted: {new Date(attempt.submitted_at).toLocaleString()}
                      </div>
                      
                      {attempt.success === 1 && attempt.marked_as_potential_at && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Marked as potential claimer: {new Date(attempt.marked_as_potential_at).toLocaleString()}
                        </div>
                      )}
                      
                      {foundItem.status === 'CLAIMED' && attempt.success === 1 && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Declared as final claimer: {foundItem.claimed_date ? new Date(foundItem.claimed_date).toLocaleString() : 'Recently'}
                        </div>
                      )}
                      
                      {attempt.verification_status === 'PENDING' && foundItem.status !== 'CLAIMED' && (
                        <button
                          onClick={() => handleMarkAsClaimed(foundItem.id, attempt.user_email, attempt.user_name)}
                          className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Verify & Give to This Person
                        </button>
                      )}
                      
                      {attempt.verification_status === 'VERIFIED' && (
                        <div className="mt-3 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium text-center">
                          ✓ Verified - Item given to this person
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!loading && itemAttempts.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">No one has responded to this found item yet</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Protected>
      <Navbar />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {JSON.parse(localStorage.getItem('user') || '{}').name || 'User'}!
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' • '}
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <a href="/connect" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                🤝 Connect with People
              </a>
              <a href="/report" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Report Item
              </a>
            </div>
          </div>

          {/* Auto-deletion Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-900">
                <strong>Note:</strong> Lost items are automatically deleted after 30 days. You can also delete them manually anytime if you found your item.
              </div>
            </div>
          </div>

          {/* Stats Overview - Global Platform Statistics */}
          {Object.keys(stats).length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-xl border border-blue-100 p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="bg-white rounded-xl shadow-md border border-blue-200 p-4 hover:shadow-lg transition-shadow">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{stats.total_found_items || 0}</div>
                  <div className="text-sm text-gray-700 font-medium"><span className="text-lg">📦</span> Total Found Items</div>
                  <div className="text-xs text-gray-500 mt-1">All time</div>
                </div>
                <div className="bg-white rounded-xl shadow-md border border-green-200 p-4 hover:shadow-lg transition-shadow">
                  <div className="text-3xl font-bold text-green-600 mb-1">{stats.items_claimed || 0}</div>
                  <div className="text-sm text-gray-700 font-medium"><span className="text-lg">✔️</span> Items Claimed</div>
                  <div className="text-xs text-gray-500 mt-1">Successfully returned</div>
                </div>
                <div className="bg-white rounded-xl shadow-md border border-purple-200 p-4 hover:shadow-lg transition-shadow">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{stats.active_found_items || 0}</div>
                  <div className="text-sm text-gray-700 font-medium"><span className="text-lg">🟢</span> Active Found Items</div>
                  <div className="text-xs text-gray-500 mt-1">Awaiting claims</div>
                </div>
                <div className="bg-white rounded-xl shadow-md border border-orange-200 p-4 hover:shadow-lg transition-shadow">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{stats.found_this_week || 0}</div>
                  <div className="text-sm text-gray-700 font-medium"><span className="text-lg">📅</span> Found This Week</div>
                  <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
                </div>
              </div>
            </div>
          )}

          {/* Claims Sections Side by Side */}
          {(claimsAsClaimer.length > 0 || claimsAsFinder.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Verified Claims Section - Items You're Claiming */}
              {claimsAsClaimer.length > 0 && (
                <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">Items You're Claiming</div>
                      <div className="text-sm text-gray-600">Items you've verified ownership for</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {claimsAsClaimer.filter(c => c.claimed_status === 'PENDING').length}
                      </span>
                      {claimsAsClaimer.length > 2 && (
                        <a 
                          href="/claims?type=claimer"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          See All
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {claimsAsClaimer.slice(0, 2).map((claim) => (
                      <div key={claim.claim_id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">{claim.item_title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                claim.claimed_status === 'CLAIMED' ? 'bg-gray-900 text-white' :
                                claim.claimed_status === 'NOT_CLAIMED' ? 'bg-gray-300 text-gray-700' :
                                'bg-gray-100 text-gray-900 border border-gray-300'
                              }`}>
                                {claim.claimed_status}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-4">
                              <p className="flex items-center gap-2">
                                <span className="text-gray-900">✓</span>
                                Verified: {new Date(claim.verification_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>

                            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Finder Contact</h4>
                              <div className="space-y-2 text-sm">
                                <p className="flex items-start">
                                  <span className="text-gray-600 w-16">Name:</span>
                                  <span className="font-medium text-gray-900">{claim.finder_name}</span>
                                </p>
                                <p className="flex items-start">
                                  <span className="text-gray-600 w-16">Email:</span>
                                  <a href={`mailto:${claim.finder_email}`} className="font-medium text-gray-900 hover:text-black underline">{claim.finder_email}</a>
                                </p>
                                {claim.finder_phone && (
                                  <p className="flex items-start">
                                    <span className="text-gray-600 w-16">Phone:</span>
                                    <a href={`tel:${claim.finder_phone}`} className="font-medium text-gray-900 hover:text-black underline">{claim.finder_phone}</a>
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => startConversation(
                                  claim.finder_id,
                                  claim.finder_name,
                                  claim.finder_email,
                                  claim.item_id,
                                  claim.item_type,
                                  claim.item_title
                                )}
                                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Message Finder
                              </button>
                            </div>

                            {claim.claimed_status === 'PENDING' && (
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleClaimStatusUpdate(claim.claim_id, 'CLAIMED', claim)}
                                  className="flex-1 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                  ✓ Mark as Claimed
                                </button>
                                <button
                                  onClick={() => handleClaimStatusUpdate(claim.claim_id, 'NOT_CLAIMED', claim)}
                                  className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 rounded-lg text-sm font-semibold transition-all duration-200"
                                >
                                  Not Claimed
                                </button>
                              </div>
                            )}

                            {claim.claimed_status === 'CLAIMED' && claim.claimed_date && (
                              <div className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium">
                                ✓ Item claimed on {new Date(claim.claimed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Claims for Your Found Items */}
              {claimsAsFinder.length > 0 && (
                <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">Claims on Your Found Items</div>
                      <div className="text-sm text-gray-600">People who verified ownership of items you found</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {claimsAsFinder.filter(c => c.claimed_status === 'PENDING').length}
                      </span>
                      {claimsAsFinder.length > 2 && (
                        <a 
                          href="/claims?type=finder"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          See All
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {claimsAsFinder.slice(0, 2).map((claim) => (
                      <div key={claim.claim_id} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-white text-lg">{claim.item_title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                claim.claimed_status === 'CLAIMED' ? 'bg-white text-gray-900' :
                                claim.claimed_status === 'NOT_CLAIMED' ? 'bg-gray-600 text-gray-200' :
                                'bg-gray-700 text-white border border-gray-500'
                              }`}>
                                {claim.claimed_status}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-300 mb-4">
                              <p className="flex items-center gap-2">
                                <span className="text-white">📋</span>
                                Someone verified ownership: {new Date(claim.verification_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>

                            <div className="bg-white rounded-lg p-4 mb-4">
                              <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Owner Contact (Claimer)</h4>
                              <div className="space-y-2 text-sm">
                                <p className="flex items-start">
                                  <span className="text-gray-600 w-16">Name:</span>
                                  <span className="font-medium text-gray-900">{claim.claimer_name}</span>
                                </p>
                                <p className="flex items-start">
                                  <span className="text-gray-600 w-16">Email:</span>
                                  <a href={`mailto:${claim.claimer_email}`} className="font-medium text-gray-900 hover:text-black underline">{claim.claimer_email}</a>
                                </p>
                                {claim.claimer_phone && (
                                  <p className="flex items-start">
                                    <span className="text-gray-600 w-16">Phone:</span>
                                    <a href={`tel:${claim.claimer_phone}`} className="font-medium text-gray-900 hover:text-black underline">{claim.claimer_phone}</a>
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => startConversation(
                                  claim.claimer_id,
                                  claim.claimer_name,
                                  claim.claimer_email,
                                  claim.item_id,
                                  claim.item_type,
                                  claim.item_title
                                )}
                                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Message Claimer
                              </button>
                            </div>

                            <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 mb-4">
                              <p className="text-sm text-gray-200">
                                <span className="text-white font-semibold">💡 Action needed:</span> Contact the claimer to arrange item return. Once the item is returned, mark it as claimed below.
                              </p>
                            </div>

                            {/* View Claim Attempts Link */}
                            <div className="mb-3">
                              <a
                                href={`/claim-attempts/${claim.item_id}`}
                                className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white underline transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View All Claim Attempts for This Item
                              </a>
                            </div>

                            {claim.claimed_status === 'PENDING' && (
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleClaimStatusUpdate(claim.claim_id, 'CLAIMED', claim)}
                                  className="flex-1 bg-white hover:bg-gray-100 text-gray-900 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                  ✓ Item Returned to Owner
                                </button>
                                <button
                                  onClick={() => handleClaimStatusUpdate(claim.claim_id, 'NOT_CLAIMED', claim)}
                                  className="px-4 py-2.5 border-2 border-gray-600 text-gray-200 hover:border-white hover:text-white rounded-lg text-sm font-semibold transition-all duration-200"
                                >
                                  False Claim
                                </button>
                              </div>
                            )}

                            {claim.claimed_status === 'CLAIMED' && claim.claimed_date && (
                              <div className="bg-white text-gray-900 rounded-lg px-4 py-2 text-sm font-medium">
                                ✓ Item returned on {new Date(claim.claimed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Matches for Your Reports */}
          <section className="mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Reports</h2>
              <p className="text-sm text-gray-600">View potential matches for your lost items and claim responses for your found items</p>
            </div>
            
            {lostItems.length === 0 && foundItems.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nothing to Show</h3>
                <p className="text-gray-600 mb-4">You haven't reported any lost or found items yet</p>
                <a href="/report" className="inline-block bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-medium transition-all duration-200">
                  Report Item
                </a>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Lost Reports Section */}
                {lostItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🔴 Your Lost Reports</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {lostItems.map((item, idx) => (
                        <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
                          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 border-b border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">LOST</span>
                              <span className="text-xs text-gray-600">{item.category}</span>
                              {item.matches && item.matches.length > 0 && (
                                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">
                                  {item.matches.length} Match{item.matches.length !== 1 ? 'es' : ''}
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                            <p className="text-xs text-gray-600">
                              {new Date(item.date_lost).toLocaleDateString()}{item.time_lost && ` at ${item.time_lost}`} • {item.location}
                            </p>
                          </div>
                          <div className="p-4">
                            {/* Owner-only image for LOST items */}
                            {typeof window !== 'undefined' && (() => {
                              const user = JSON.parse(localStorage.getItem('user') || '{}');
                              const isOwner = !!(item.user_email && user.email && user.email.toLowerCase() === item.user_email.toLowerCase());
                              return item.image_filename && isOwner ? (
                                <div className="mb-3 rounded-lg overflow-hidden">
                                  <img
                                    src={`http://localhost:5000/api/uploads/${item.image_filename}`}
                                    alt={item.title}
                                    loading="lazy"
                                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                                    onError={(e) => { e.target.style.display = 'none'; console.error('Failed to load image:', item.image_filename); }}
                                  />
                                </div>
                              ) : null;
                            })()}
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                            )}
                            <a
                              href={`/lost-item-details/${item.id}`}
                              className="block w-full bg-red-600 hover:bg-red-700 text-white text-center py-2 rounded-lg text-sm font-medium transition"
                            >
                              More Details {item.matches && item.matches.length > 0 && '→ View Matches'}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Found Reports Section */}
                {foundItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🟢 Your Found Reports</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {foundItems.map((item, idx) => (
                        <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
                          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 border-b border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">FOUND</span>
                              <span className="text-xs text-gray-600">{item.category_name || item.category}</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                            <p className="text-xs text-gray-600">
                              {new Date(item.date_found).toLocaleDateString()}{item.time_found && ` at ${item.time_found}`} • {item.location_name || item.location}
                            </p>
                          </div>
                          <div className="p-4">
                            {/* Owner-only image for FOUND items */}
                            {typeof window !== 'undefined' && (() => {
                              const user = JSON.parse(localStorage.getItem('user') || '{}');
                              const isOwner = !!(item.finder_email && user.email && user.email.toLowerCase() === item.finder_email.toLowerCase());
                              return item.image_filename && isOwner ? (
                                <div className="mb-3 rounded-lg overflow-hidden">
                                  <img
                                    src={`http://localhost:5000/api/uploads/${item.image_filename}`}
                                    alt={item.title}
                                    loading="lazy"
                                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                                    onError={(e) => { e.target.style.display = 'none'; console.error('Failed to load image:', item.image_filename); }}
                                  />
                                </div>
                              ) : null;
                            })()}
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                item.status === 'CLAIMED' ? 'bg-gray-200 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.status === 'CLAIMED' ? 'Claimed' : 'Unclaimed'}
                              </span>
                            </div>
                            <a
                              href={`/found-item-details/${item.id}`}
                              className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 rounded-lg text-sm font-medium transition"
                            >
                              View Responses
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Reviews Section */}
          <section className="mb-6">
            <Reviews />
          </section>
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
