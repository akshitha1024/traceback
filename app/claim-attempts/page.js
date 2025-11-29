"use client";
import React, { useState, useEffect } from "react";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function ClaimAttemptsPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClaimAttempts();
  }, []);

  const loadClaimAttempts = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.email) {
        setError('Please log in to view your claim attempts');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/my-claim-attempts?user_email=${encodeURIComponent(user.email)}`
      );

      if (response.ok) {
        const data = await response.json();
        setAttempts(data.attempts || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load claim attempts');
      }
    } catch (err) {
      console.error('Error loading claim attempts:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (attempt) => {
    const colorClasses = {
      green: 'bg-green-100 text-green-800 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      red: 'bg-red-100 text-red-800 border-red-300'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colorClasses[attempt.claim_status_color]}`}>
        {attempt.claim_status_label}
      </span>
    );
  };

  return (
    <Protected>
      <Navbar />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Claim Requests</h1>
            <p className="text-sm text-gray-600 mt-1">
              Track the status of items you've attempted to claim
            </p>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your claim attempts...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && attempts.length === 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
              <div className="text-gray-400 mb-3">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Claim Attempts Yet</h3>
              <p className="text-gray-600 mb-4">
                You haven't tried to claim any found items yet
              </p>
              <a
                href="/found"
                className="inline-block bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
              >
                Browse Found Items
              </a>
            </div>
          )}

          {!loading && !error && attempts.length > 0 && (
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <div
                  key={attempt.attempt_id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {attempt.item_title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {attempt.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {attempt.location}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(attempt)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Found On</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(() => {
                            // Parse date as local time to avoid timezone shift
                            const [year, month, day] = attempt.date_found.split('-');
                            const date = new Date(year, month - 1, day);
                            return date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                          })()}
                          {attempt.time_found && (
                            <span className="text-gray-600"> at {attempt.time_found}</span>
                          )}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">You Attempted On</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(attempt.attempted_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>

                    {attempt.claim_status === 'PENDING' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-yellow-900 mb-1">
                              Your Answers Are Being Reviewed
                            </p>
                            <p className="text-xs text-yellow-700">
                              The owner is reviewing your answers. They will contact you if you're selected or if they need more information.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {attempt.claim_status === 'VERIFIED' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900 mb-1">
                              🎯 You're a Potential Claimer!
                            </p>
                            <p className="text-xs text-green-700 mb-2">
                              The owner identified you as a potential claimer based on your correct answers. The owner is now making their final decision (3-day window for competition).
                            </p>
                            <p className="text-xs text-green-600">
                              ✨ You'll be notified if you're selected!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {attempt.claim_status === 'NOT_SELECTED' && (
                      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Item Was Given to Someone Else
                            </p>
                            <p className="text-xs text-gray-700">
                              The owner selected another person for this item. Better luck next time!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {attempt.claim_status === 'CLAIMED' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900 mb-1">
                              🎉 Congratulations! You Successfully Claimed This Item!
                            </p>
                            <p className="text-xs text-green-700 mb-3">
                              The owner has finalized your claim and this item has been given to you. Contact the owner to arrange pickup.
                            </p>
                            
                            {attempt.show_contact_info ? (
                              <>
                                <div className="bg-white rounded-lg p-3 mb-2">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">📞 Owner Contact Information:</p>
                                  <div className="space-y-1">
                                    <p className="text-sm text-gray-900">
                                      <span className="font-medium">Name:</span> {attempt.finder_name || 'Not provided'}
                                    </p>
                                    <p className="text-sm text-gray-900">
                                      <span className="font-medium">Email:</span>{' '}
                                      <a href={`mailto:${attempt.finder_email}`} className="text-blue-600 hover:underline">
                                        {attempt.finder_email}
                                      </a>
                                    </p>
                                    {attempt.finder_phone && (
                                      <p className="text-sm text-gray-900">
                                        <span className="font-medium">Phone:</span>{' '}
                                        <a href={`tel:${attempt.finder_phone}`} className="text-blue-600 hover:underline">
                                          {attempt.finder_phone}
                                        </a>
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 mt-3">
                                  <a
                                    href={`/messages?conversation=claim_${attempt.found_item_id}_${encodeURIComponent(attempt.finder_email)}&item_id=${attempt.found_item_id}&item_title=${encodeURIComponent(attempt.item_title)}&other_email=${encodeURIComponent(attempt.finder_email)}&other_name=${encodeURIComponent(attempt.finder_name || 'Owner')}`}
                                    className="flex-1 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-center"
                                  >
                                    💬 Message Finder
                                  </a>
                                  <p className="text-xs text-green-600">
                                    ⏰ Visible for {attempt.contact_visible_days_remaining} more day{attempt.contact_visible_days_remaining !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                                <p className="text-xs text-yellow-800">
                                  ⚠️ Contact information is no longer visible (5 days have passed since finalization). Please check your email for previous communications with the owner.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}


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
