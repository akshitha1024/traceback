"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function FoundItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id;

  const [foundItem, setFoundItem] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);
  const [selectedClaimer, setSelectedClaimer] = useState(null);
  const [claimReason, setClaimReason] = useState('');

  useEffect(() => {
    // Reset state when itemId changes
    setFoundItem(null);
    setAttempts([]);
    setError(null);
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

      // Fetch the specific found item directly by ID
      const itemResponse = await fetch(
        `http://localhost:5000/api/found-items/${itemId}`
      );

      if (itemResponse.ok) {
        const itemData = await itemResponse.json();
        const item = itemData.item;
        
        if (!item) {
          setError('Item not found');
          setLoading(false);
          return;
        }

        // Check if user is the finder or a moderator
        const moderatorEmails = ['aksh@kent.edu', 'achapala@kent.edu', 'vkoniden@kent.edu', 'ldommara@kent.edu', 'bdharav1@kent.edu', 'psamala@kent.edu'];
        const isModerator = moderatorEmails.includes(user.email?.toLowerCase());
        
        if (item.finder_email?.toLowerCase() !== user.email?.toLowerCase() && !isModerator) {
          setError('You do not have permission to view this item');
          setLoading(false);
          return;
        }

        setFoundItem(item);

        // Fetch claim attempts for this item (with cache busting)
        const attemptsResponse = await fetch(
          `http://localhost:5000/api/claim-attempts/${itemId}?finder_email=${encodeURIComponent(user.email)}&_t=${Date.now()}`,
          { cache: 'no-store' }
        );

        if (attemptsResponse.ok) {
          const attemptsData = await attemptsResponse.json();
          console.log(`Loaded ${attemptsData.attempts?.length || 0} attempts for item ${itemId}`);
          setAttempts(attemptsData.attempts || []);
        } else {
          console.error('Failed to load attempts:', attemptsResponse.status);
          setAttempts([]);
        }
      } else {
        if (itemResponse.status === 404) {
          setError('Item not found');
        } else {
          setError('Failed to load item details');
        }
      }
    } catch (err) {
      console.error('Error loading item details:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPotentialClaimer = async (attemptId, userEmail, userName) => {
    if (!confirm(`Mark ${userName} as a potential claimer? This is not final and the item will remain open for 3 days to allow other potential claimers to submit their answers.`)) {
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch('http://localhost:5000/api/update-claim-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          found_item_id: parseInt(itemId),
          user_email: userEmail,
          success: true
        })
      });

      if (response.ok) {
        alert(`✅ ${userName} marked as potential claimer! The item will remain open for 3 days. You can declare them as the final claimer after the 3-day period.`);
        loadItemDetails();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to mark as potential claimer: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error marking as potential claimer:', err);
      alert('❌ Failed to mark as potential claimer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclareAsFinalClaimer = async (attemptId, userEmail, userName) => {
    // Show modal to collect reason
    setSelectedClaimer({ attemptId, userEmail, userName });
    setShowFinalizationModal(true);
  };

  const handleSubmitFinalization = async () => {
    if (!claimReason || claimReason.trim().length < 10) {
      alert('Please provide a detailed reason (at least 10 characters)');
      return;
    }

    try {
      setActionLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch('http://localhost:5000/api/finalize-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          found_item_id: parseInt(itemId),
          user_email: selectedClaimer.userEmail,
          owner_email: user.email,
          claim_reason: claimReason.trim()
        })
      });

      if (response.ok) {
        alert(`✅ Item successfully returned to ${selectedClaimer.userName}! The post has been deleted and this information is stored permanently.`);
        setShowFinalizationModal(false);
        setClaimReason('');
        setSelectedClaimer(null);
        router.push('/dashboard'); // Redirect to dashboard since item is deleted
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to finalize claim: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error finalizing claim:', err);
      alert('❌ Failed to finalize claim');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsClaimed = async (attemptId, userEmail, userName) => {
    if (!confirm(`Mark this item as claimed by ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch('http://localhost:5000/api/update-claim-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          found_item_id: parseInt(itemId),
          user_email: userEmail,
          success: true
        })
      });

      if (response.ok) {
        alert(`✅ Item marked as claimed by ${userName}! They will be notified.`);
        // Reload the page to reflect changes
        loadItemDetails();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to mark as claimed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error marking as claimed:', err);
      alert('❌ Failed to mark as claimed');
    } finally {
      setActionLoading(false);
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

  if (error || !foundItem) {
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

          {/* Found Item Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b-2 border-green-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold text-3xl">
                    {foundItem.title.charAt(0)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">FOUND</span>
                        <span className="bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded">{foundItem.category}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          foundItem.status === 'CLAIMED' 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-yellow-500 text-white'
                        }`}>
                          {foundItem.status === 'CLAIMED' ? 'CLAIMED' : 'UNCLAIMED'}
                        </span>
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">{foundItem.title}</h1>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                        <div>
                          <span className="font-semibold">Found on:</span> {new Date(foundItem.date_found).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}{foundItem.time_found && ` at ${foundItem.time_found}`}
                        </div>
                        <div>
                          <span className="font-semibold">Location:</span> {foundItem.location_name || foundItem.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Owner-only image display */}
              {foundItem.image_filename && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Photo</h3>
                  <div className="rounded-lg overflow-hidden w-64">
                    <img
                      src={`http://localhost:5000/api/uploads/${foundItem.image_filename}`}
                      alt={foundItem.title}
                      loading="lazy"
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
                      onError={(e) => { e.target.style.display = 'none'; console.error('Failed to load image:', foundItem.image_filename); }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 italic">Only visible to you</p>
                </div>
              )}
              
              {foundItem.description && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{foundItem.description}</p>
                </div>
              )}
              
              {foundItem.color && (
                <div className="mb-2">
                  <span className="font-semibold text-gray-900">Color:</span> <span className="text-gray-700">{foundItem.color}</span>
                </div>
              )}
              
              {foundItem.size && (
                <div className="mb-2">
                  <span className="font-semibold text-gray-900">Size:</span> <span className="text-gray-700">{foundItem.size}</span>
                </div>
              )}
            </div>
          </div>

          {/* Responses Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Claim Responses ({attempts.length})
            </h2>
            
            {attempts.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Responses Yet</h3>
                <p className="text-gray-600">
                  No one has attempted to claim this item yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {attempts.map((attempt) => (
                  <div key={attempt.attempt_id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {attempt.user_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{attempt.user_name || 'Unknown User'}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <a href={`mailto:${attempt.user_email}`} className="hover:text-blue-600 underline">
                              {attempt.user_email}
                            </a>
                          </div>
                        </div>
                      </div>
                      {attempt.success === 1 && (
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                          ✓ VERIFIED
                        </span>
                      )}
                    </div>

                    {/* Verification Questions & Answers */}
                    {attempt.answers_with_questions && attempt.answers_with_questions.length > 0 && (
                      <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Verification Questions & Answers:</h4>
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
                      Answers submitted: {new Date(attempt.attempted_at).toLocaleString()}
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
                      <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Declared as final claimer: {foundItem.claimed_date ? new Date(foundItem.claimed_date).toLocaleString() : 'Recently'}
                      </div>
                    )}

                    {/* Contact This Claimer Button */}
                    <button
                      onClick={() => {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const conversationId = `conv_${Math.min(user.id, attempt.user_id || 0)}_${Math.max(user.id, attempt.user_id || 0)}_${foundItem.id}`;
                        window.location.href = `/messages?conversation=${conversationId}&item_id=${foundItem.id}&item_title=${encodeURIComponent(foundItem.title)}&other_email=${attempt.user_email}&other_name=${encodeURIComponent(attempt.user_name || 'Claimer')}`;
                      }}
                      className="w-full mb-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Contact This Claimer
                    </button>

                    {/* Mark as Potential Claimer OR Declare as Final Claimer */}
                    {foundItem.status !== 'CLAIMED' && (() => {
                      // Check if ANY attempt has been marked as potential claimer
                      const potentialClaimers = attempts.filter(a => a.success === 1);
                      const hasPotentialClaimer = potentialClaimers.length > 0;
                      
                      if (hasPotentialClaimer) {
                        // Find the earliest marked_as_potential_at time across all potential claimers
                        const earliestMarkedTime = potentialClaimers.reduce((earliest, a) => {
                          const markedAt = a.marked_as_potential_at 
                            ? new Date(a.marked_as_potential_at.replace(' ', 'T'))
                            : new Date(a.attempted_at.replace(' ', 'T'));
                          return !earliest || markedAt < earliest ? markedAt : earliest;
                        }, null);
                        
                        const now = new Date();
                        const threeDays = 3 * 24 * 60 * 60 * 1000;
                        const deadline = new Date(earliestMarkedTime.getTime() + threeDays);
                        const diff = deadline - now;
                        const canFinalize = diff <= 0;
                        
                        // Calculate time remaining in dd days, hh hours, mm minutes format
                        let timeRemainingStr = '';
                        if (!canFinalize && diff > 0) {
                          const days = Math.floor(diff / (24 * 60 * 60 * 1000));
                          const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                          const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
                          
                          const dd = String(days).padStart(2, '0');
                          const hh = String(hours).padStart(2, '0');
                          const mm = String(minutes).padStart(2, '0');
                          
                          timeRemainingStr = ` (${dd} days, ${hh} hours, ${mm} minutes)`;
                        }
                        
                        // Show "Declare as Final Claimer" for ALL attempts once someone is marked as potential claimer
                        return (
                          <button
                            onClick={() => handleDeclareAsFinalClaimer(attempt.attempt_id, attempt.user_email, attempt.user_name)}
                            disabled={actionLoading || !canFinalize}
                            className={`w-full mb-3 ${canFinalize ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2`}
                            title={!canFinalize ? `Time remaining: ${timeRemainingStr}` : 'Finalize this claim'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {actionLoading ? 'Processing...' : `Declare as Final Claimer${timeRemainingStr}`}
                          </button>
                        );
                      } else {
                        // No potential claimer yet - show "Mark as Potential Claimer" for unverified attempts
                        if (attempt.success !== 1) {
                          return (
                            <button
                              onClick={() => handleMarkAsPotentialClaimer(attempt.attempt_id, attempt.user_email, attempt.user_name)}
                              disabled={actionLoading}
                              className="w-full mb-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {actionLoading ? 'Processing...' : 'Mark as Potential Claimer'}
                            </button>
                          );
                        }
                        return null;
                      }
                    })()}

                    {/* Status badges */}
                    {attempt.success === 1 && foundItem.status !== 'CLAIMED' && (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-2 text-sm font-medium text-center mb-3">
                        ⭐ Identified as Potential Claimer
                      </div>
                    )}

                    {foundItem.status === 'CLAIMED' && (
                      <div className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium text-center">
                        ✓ Item given to this person
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Finalization Modal */}
      {showFinalizationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Finalize Claim for {selectedClaimer?.userName}
              </h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Important:</strong> This action will:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
                  <li>Delete the found item post permanently</li>
                  <li>Record this successful return in TrackeBack's permanent records</li>
                  <li>Add this to your successful returns history</li>
                  <li>Add this to {selectedClaimer?.userName}'s successful claims history</li>
                  <li>Store this information for moderation purposes</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why are you giving this item to {selectedClaimer?.userName}? *
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Please explain your reason for selecting this person as the rightful owner. 
                  This information will be stored permanently for moderation and transparency purposes.
                </p>
                <textarea
                  value={claimReason}
                  onChange={(e) => setClaimReason(e.target.value)}
                  placeholder="Example: This person correctly answered all verification questions including the unique identifier that only the real owner would know. They provided the exact location, date, and specific details about the item that matched my observations."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={6}
                  maxLength={500}
                  disabled={actionLoading}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {claimReason.length}/500 characters (minimum 10)
                  </p>
                  {claimReason.length < 10 && claimReason.length > 0 && (
                    <p className="text-xs text-red-600">
                      Please provide more detail
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">📊 What happens next:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✅ The found item will be marked as successfully returned</li>
                  <li>📧 {selectedClaimer?.userName} will receive a notification</li>
                  <li>🗑️ The post will be deleted from public view</li>
                  <li>📝 This information will be preserved in TrackeBack's moderation records</li>
                  <li>⭐ Both you and the claimer will have this in your success histories</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFinalizationModal(false);
                    setClaimReason('');
                    setSelectedClaimer(null);
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFinalization}
                  disabled={actionLoading || claimReason.trim().length < 10}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    '✓ Confirm & Finalize Return'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
