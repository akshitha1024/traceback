"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function SuccessHistoryPage() {
  const router = useRouter();
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('both'); // 'both', 'owner', 'claimer'

  useEffect(() => {
    loadSuccessHistory();
  }, [filter]);

  const loadSuccessHistory = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user.email) {
        router.push('/login');
        return;
      }

      // Fetch successful returns/claims
      const response = await fetch(
        `http://localhost:5000/api/successful-returns?email=${encodeURIComponent(user.email)}&type=${filter}`
      );

      if (response.ok) {
        const data = await response.json();
        setReturns(data.returns || []);
      } else {
        console.error('Failed to load success history');
      }

      // Fetch stats
      const statsResponse = await fetch(
        `http://localhost:5000/api/successful-returns/stats?email=${encodeURIComponent(user.email)}`
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

    } catch (err) {
      console.error('Error loading success history:', err);
    } finally {
      setLoading(false);
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
              <p className="mt-4 text-gray-600">Loading success history...</p>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏆 Success History
            </h1>
            <p className="text-gray-600">
              Your successful returns and claims on TrackeBack
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Successful Returns</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.successful_returns}</p>
                    <p className="text-xs text-gray-500 mt-1">Items you returned to owners</p>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Successful Claims</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.successful_claims}</p>
                    <p className="text-xs text-gray-500 mt-1">Items you successfully claimed</p>
                  </div>
                  <div className="text-4xl">🎉</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total Success</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500 mt-1">Combined returns & claims</p>
                  </div>
                  <div className="text-4xl">🏆</div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('both')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'both'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All History
              </button>
              <button
                onClick={() => setFilter('owner')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'owner'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                As Owner ({stats?.successful_returns || 0})
              </button>
              <button
                onClick={() => setFilter('claimer')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'claimer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                As Claimer ({stats?.successful_claims || 0})
              </button>
            </div>
          </div>

          {/* History List */}
          {returns.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Success History Yet
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'owner' && "You haven't returned any items yet"}
                {filter === 'claimer' && "You haven't successfully claimed any items yet"}
                {filter === 'both' && "Start by reporting found items or claiming lost ones!"}
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/found"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Report Found Item
                </Link>
                <Link
                  href="/search"
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Search Lost Items
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {returns.map((item, index) => (
                <div
                  key={item.return_id || index}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start gap-4">
                    {/* Role Badge */}
                    <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center text-2xl ${
                      item.role === 'owner' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {item.role === 'owner' ? '✅' : '🎉'}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {item.item_title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {item.role === 'owner' ? (
                              <>✅ Returned to <span className="font-medium text-gray-900">{item.claimer_name}</span></>
                            ) : (
                              <>🎉 Claimed from <span className="font-medium text-gray-900">{item.owner_name}</span></>
                            )}
                          </p>
                          {/* Verification Code */}
                          {item.verification_code && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 mb-3 border-2 border-purple-300">
                              <p className="text-xs font-bold text-purple-900 mb-1">🔐 Return Verification Code:</p>
                              <p className="text-2xl font-black text-purple-900 tracking-wider">
                                {item.verification_code}
                              </p>
                              <p className="text-xs text-purple-700 mt-1">
                                {item.role === 'owner' 
                                  ? 'Share this code with the claimer to verify the return'
                                  : 'Use this code when picking up the item from the owner'}
                              </p>
                            </div>
                          )}
                          {/* Only show description to owners, not claimers */}
                          {item.role === 'owner' && item.item_description && item.item_description.trim() && (
                            <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-200">
                              <p className="text-xs font-bold text-blue-900 mb-1">📝 Item Description:</p>
                              <p className="text-sm font-medium text-gray-900">
                                {item.item_description}
                              </p>
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.role === 'owner'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.role === 'owner' ? '✅ RETURNED' : '🎉 CLAIMED'}
                        </span>
                      </div>

                      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-start">
                            <span className="text-gray-600 font-medium mr-2">📦 Category:</span>
                            <span className="font-bold text-gray-900">{item.item_category || 'Unknown'}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-600 font-medium mr-2">📍 Location:</span>
                            <span className="font-bold text-gray-900">{item.item_location || 'Unknown'}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-600 font-medium mr-2">🔍 Found:</span>
                            <span className="font-bold text-gray-900">
                              {new Date(item.date_found).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-600 font-medium mr-2">✅ Finalized:</span>
                            <span className="font-bold text-gray-900">
                              {new Date(item.finalized_date).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reason (only shown for returns as owner) */}
                      {item.role === 'owner' && item.claim_reason && item.claim_reason.trim() && (
                        <div className="bg-yellow-50 rounded-lg p-4 mb-3 border border-yellow-200">
                          <p className="text-xs font-bold text-yellow-900 mb-2">💭 Your reason for returning this item:</p>
                          <p className="text-sm font-medium text-gray-900">{item.claim_reason}</p>
                        </div>
                      )}

                      {/* Contact Info for Owner (show claimer contact for 6 days) */}
                      {item.role === 'owner' && (
                        item.show_contact_info ? (
                          <div className="bg-blue-50 rounded-lg p-4 mb-3 border-2 border-blue-300">
                            <p className="text-xs font-bold text-blue-900 mb-3">📞 Claimer Contact Information (Available for return coordination):</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700">👤 Name:</span>
                                <span className="text-sm font-bold text-gray-900">{item.claimer_name || 'Not provided'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700">📧 Email:</span>
                                <a href={`mailto:${item.claimer_email}`} className="text-sm font-bold text-blue-600 hover:underline">
                                  {item.claimer_email}
                                </a>
                              </div>
                              {item.claimer_phone && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-700">📱 Phone:</span>
                                  <a href={`tel:${item.claimer_phone}`} className="text-sm font-bold text-blue-600 hover:underline">
                                    {item.claimer_phone}
                                  </a>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-blue-700 font-medium mt-3 bg-blue-100 rounded px-2 py-1">
                              ⏰ Contact info visible for {item.contact_visible_days_remaining} more day{item.contact_visible_days_remaining !== 1 ? 's' : ''}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 rounded-lg p-4 mb-3 border border-yellow-300">
                            <p className="text-sm font-medium text-yellow-900">
                              ⚠️ Contact information is no longer visible (7 days have passed since finalization). Please check your email for previous communications with the claimer.
                            </p>
                          </div>
                        )
                      )}

                      {/* Contact Info for Claimer (show owner contact for 5 days) */}
                      {item.role === 'claimer' && (
                        item.show_contact_info ? (
                          <div className="bg-green-50 rounded-lg p-4 mb-3 border-2 border-green-300">
                            <p className="text-xs font-bold text-green-900 mb-3">📞 Owner Contact Information (Available for pickup):</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700">👤 Name:</span>
                                <span className="text-sm font-bold text-gray-900">{item.owner_name || 'Not provided'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700">📧 Email:</span>
                                <a href={`mailto:${item.owner_email}`} className="text-sm font-bold text-blue-600 hover:underline">
                                  {item.owner_email}
                                </a>
                              </div>
                              {item.owner_phone && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-700">📱 Phone:</span>
                                  <a href={`tel:${item.owner_phone}`} className="text-sm font-bold text-blue-600 hover:underline">
                                    {item.owner_phone}
                                  </a>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-green-700 font-medium mt-3 bg-green-100 rounded px-2 py-1">
                              ⏰ Contact info visible for {item.contact_visible_days_remaining} more day{item.contact_visible_days_remaining !== 1 ? 's' : ''}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 rounded-lg p-4 mb-3 border border-yellow-300">
                            <p className="text-sm font-medium text-yellow-900">
                              ⚠️ Contact information is no longer visible (7 days have passed since finalization). Please check your email for previous communications with the owner.
                            </p>
                          </div>
                        )
                      )}

                      <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                          <span className="text-blue-600">⏱️</span>
                          <span className="font-bold text-gray-900">{item.days_to_finalize}</span> 
                          {item.days_to_finalize === 1 ? 'day' : 'days'} to finalize
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                          <span className="text-purple-600">🆔</span>
                          Return ID: <span className="font-bold text-gray-900">#{item.return_id}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6 mt-12">
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
