'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Protected from '@/components/Protected';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function ClaimedItemsPage() {
  const [claimedItems, setClaimedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [verificationError, setVerificationError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadClaimedItems();
    
    // Update time every second for countdown
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadClaimedItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/claimed-items');
      const data = await response.json();
      
      if (response.ok) {
        setClaimedItems(data.claimed_items || []);
      }
    } catch (error) {
      console.error('Failed to load claimed items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportClick = async (item) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Check if user already attempted this item
    try {
      const checkResponse = await fetch(
        `http://localhost:5000/api/check-claim-attempt/${item.item_id}?user_email=${encodeURIComponent(user.email || '')}`
      );
      const checkData = await checkResponse.json();
      
      if (checkData.has_attempted) {
        alert('⚠️ You have already attempted to claim this item. You cannot report it again.');
        return;
      }
    } catch (error) {
      console.error('Error checking claim attempt:', error);
    }
    
    setSelectedItem(item);
    setVerificationError('');
    setUserAnswers({});
    
    // Fetch security questions for this item
    try {
      const response = await fetch(`http://localhost:5000/api/security-questions/${item.item_id}`);
      const data = await response.json();
      
      if (response.ok && data.questions) {
        setSecurityQuestions(data.questions);
        setShowVerificationModal(true);
      } else {
        alert('❌ Unable to load verification questions. Please try again.');
      }
    } catch (error) {
      console.error('Error loading security questions:', error);
      alert('❌ Failed to load verification questions. Please try again.');
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitVerification = async () => {
    // Check all questions are answered
    const allAnswered = securityQuestions.every(q => userAnswers[q.id]);
    if (!allAnswered) {
      setVerificationError('Please answer all security questions before submitting.');
      return;
    }

    setVerifying(true);
    setVerificationError('');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Submit claim answers for verification
      const response = await fetch('http://localhost:5000/api/submit-claim-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          found_item_id: selectedItem.item_id,
          answers: userAnswers,
          claimer_name: user.name || user.full_name || 'Anonymous',
          claimer_email: user.email || 'anonymous',
          claimer_phone: user.phone || ''
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Success - answers submitted for review
        setShowVerificationModal(false);
        alert('✅ Your answers have been submitted! The item finder will review and verify your claim.');
      } else if (result.already_attempted) {
        setVerificationError('You have already submitted answers for this item.');
      } else if (result.self_claim_attempt) {
        setVerificationError('You cannot report your own found item.');
      } else {
        setVerificationError(result.error || 'Failed to submit answers. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      setVerificationError('❌ Failed to submit answers. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const closeModal = () => {
    setShowVerificationModal(false);
    setSelectedItem(null);
    setSecurityQuestions([]);
    setUserAnswers({});
    setVerificationError('');
  };

  const getTimeRemaining = (claimedDate) => {
    try {
      // Parse the claimed date from backend (SQLite datetime format: YYYY-MM-DD HH:MM:SS)
      // Database now stores local ET time, so parse as local time
      const claimedDateStr = claimedDate.replace(' ', 'T'); // Convert to ISO format (local time)
      const claimed = new Date(claimedDateStr);
      
      // Calculate deadline: 3 days from claimed time
      const threeDays = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
      const deadline = new Date(claimed.getTime() + threeDays);
      
      // Get current time
      const now = new Date();
      
      // Calculate difference in milliseconds
      const diff = deadline - now;
      
      if (diff <= 0) {
        return 'Expired';
      }
      
      // Calculate time remaining in dd:hh:mm:ss format
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);
      
      // Format as dd:hh:mm:ss
      const dd = String(days).padStart(2, '0');
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      
      return `${dd}:${hh}:${mm}:${ss}`;
    } catch (e) {
      console.error('Error calculating time remaining:', e, claimedDate);
      return 'N/A';
    }
  };

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
                <p className="text-gray-600">Loading claimed items...</p>
              </div>
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
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recently Claimed Items</h1>
            <p className="text-gray-600">Items with potential claimers. Owner can finalize after the 3-day window to allow other claimers to submit their answers.</p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">⏰ 3-Day Window</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Items remain in this section for <strong>3 days</strong> to allow other potential claimers to submit their answers. The owner can finalize after 3 days. If someone was marked as a potential claimer for your item, you can still try to claim it during this window!
                </p>
              </div>
            </div>
          </div>

          {/* Claimed Items List */}
          {claimedItems.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Recently Claimed Items</h2>
              <p className="text-gray-600">There are no items that have been claimed in the last 3 days.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {claimedItems.map((item) => (
                <div 
                  key={item.claim_id}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200"
                >
                  {/* Claimed Badge */}
                  <div className="bg-green-500 text-white px-4 py-2 flex items-center justify-between">
                    <span className="font-semibold flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      POTENTIAL CLAIMER
                    </span>
                    <span className="text-sm">
                      3-day window
                    </span>
                  </div>

                  {/* Item Details - Simplified */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{item.item_title}</h3>

                    <div className="space-y-2 mb-4">
                      {/* Category */}
                      <div className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="font-medium">Category:</span>
                        <span className="ml-1">{item.category_name}</span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Location:</span>
                        <span className="ml-1">{item.location_name}</span>
                      </div>

                      {/* Found At */}
                      {item.date_found && (
                        <div className="flex items-center text-sm text-gray-700">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Found At:</span>
                          <span className="ml-1">
                            {(() => {
                              try {
                                const [year, month, day] = item.date_found.split('-');
                                const date = new Date(year, month - 1, day);
                                const dateStr = date.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                });
                                
                                if (item.time_found) {
                                  // Convert 24-hour format to 12-hour format
                                  const [hours24, minutes] = item.time_found.split(':');
                                  const hours = parseInt(hours24);
                                  const ampm = hours >= 12 ? 'PM' : 'AM';
                                  const hours12 = hours % 12 || 12;
                                  const timeStr = `${hours12}:${minutes} ${ampm}`;
                                  return `${dateStr} at ${timeStr}`;
                                }
                                return dateStr;
                              } catch (e) {
                                return item.date_found;
                              }
                            })()}
                          </span>
                        </div>
                      )}

                      {/* Claimed Date */}
                      <div className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Claimed (ET):</span>
                        <span className="ml-1">
                          {(() => {
                            try {
                              const claimedDate = new Date(item.claimed_date);
                              return claimedDate.toLocaleString('en-US', { 
                                timeZone: 'America/New_York',
                                month: '2-digit', 
                                day: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              });
                            } catch (e) {
                              return item.claimed_date_formatted || 'N/A';
                            }
                          })()}
                        </span>
                      </div>

                      {/* Report Deadline */}
                      <div className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Doesn't Accept Answers After (ET):</span>
                        <span className="ml-1 text-red-600 font-semibold">
                          {(() => {
                            try {
                              const claimedDate = new Date(item.claimed_date);
                              const reportDeadline = new Date(claimedDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // Exactly 3 days
                              return reportDeadline.toLocaleString('en-US', { 
                                timeZone: 'America/New_York',
                                month: '2-digit', 
                                day: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              });
                            } catch (e) {
                              return 'N/A';
                            }
                          })()}
                        </span>
                      </div>

                      {/* Time Window (Days until deletion) */}
                      <div className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Time Remaining:</span>
                        <span className="ml-1 text-red-600 font-semibold font-mono">
                          {getTimeRemaining(item.claimed_date)}
                        </span>
                      </div>
                    </div>

                    {/* Action Button or Status Message */}
                    {(() => {
                      const user = JSON.parse(localStorage.getItem('user') || '{}');
                      const isFinderUser = user.email && item.finder_email && user.email.toLowerCase() === item.finder_email.toLowerCase();
                      const isClaimerUser = user.email && item.claimer_email && user.email.toLowerCase() === item.claimer_email.toLowerCase();
                      
                      if (isFinderUser) {
                        return (
                          <div className="w-full bg-green-100 border-2 border-green-500 text-green-800 px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            You gave this item to the claimer
                          </div>
                        );
                      }
                      
                      if (isClaimerUser) {
                        return (
                          <div className="w-full bg-blue-100 border-2 border-blue-500 text-blue-800 px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            You claimed this item
                          </div>
                        );
                      }
                      
                      // Check if time has expired (20 seconds)
                      const timeRemaining = getTimeRemaining(item.claimed_date);
                      const isExpired = timeRemaining === 'Expired' || parseInt(timeRemaining) <= 0;
                      
                      if (isExpired) {
                        return (
                          <div className="w-full bg-gray-100 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium text-sm text-center">
                            <div className="flex items-center justify-center mb-1">
                              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-semibold">Competition Window Closed</span>
                            </div>
                            <p className="text-xs text-gray-600">The owner is making their final decision. You can no longer submit answers.</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReportClick(item)}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Claim This Item ({timeRemaining})
                          </button>
                          <a
                            href={`/report-abuse?type=item&id=${item.item_id}`}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center"
                            title="Report abuse"
                          >
                            🚩
                          </a>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">•</span>
                <span>The countdown timer shows exactly how much time remains before the owner can finalize the claim</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Once the owner finalized the answer the found item will be deleted</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>During this 3-day period, other users can still submit claim attempts for the item</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Click "Claim this item" if you believe this is your item that was mistakenly claimed</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>You must answer security questions correctly to verify ownership</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>The owner will see your responses and will ask supporting information if there is a tie</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>All times are displayed in Eastern Time (ET) for consistency</span>
              </li>
            </ul>
          </div>
        </main>
      </div>

      {/* Security Questions Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Verify Ownership
                </h2>
                <button
                  onClick={closeModal}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                <p className="text-sm text-blue-900">
                  <strong>Item:</strong> {selectedItem?.item_title}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  To report this item, please answer the security questions set by the person who found it. This helps verify that you are the true owner.
                </p>
              </div>

              {verificationError && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r">
                  <p className="text-sm text-red-800">{verificationError}</p>
                </div>
              )}

              <div className="space-y-6">
                {securityQuestions.map((question, index) => (
                  <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Question {index + 1}: {question.question}
                    </label>

                    {question.question_type === 'multiple_choice' ? (
                      <div className="space-y-2">
                        {['choice_a', 'choice_b', 'choice_c', 'choice_d'].map((choiceKey) => {
                          if (!question[choiceKey]) return null;
                          const choiceValue = choiceKey.split('_')[1].toUpperCase();
                          return (
                            <label
                              key={choiceKey}
                              className="flex items-center p-3 bg-white border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
                            >
                              <input
                                type="radio"
                                name={`question_${question.id}`}
                                value={choiceValue}
                                checked={userAnswers[question.id] === choiceValue}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-3 text-sm text-gray-900">
                                {choiceValue}. {question[choiceKey]}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={userAnswers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Type your answer here"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                  disabled={verifying}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitVerification}
                  disabled={verifying}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {verifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit & Report
                    </>
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
