"use client";


import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { foundItems, lostItems } from "@/data/mock";
import { getMatchStrength, getMatchColor } from "@/utils/matching";

export default function ContactAdmin() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get('itemId');
  const lostItemId = searchParams.get('lostItemId');
  const matchScore = searchParams.get('matchScore');
  
  const [foundItem, setFoundItem] = useState(null);
  const [lostItem, setLostItem] = useState(null);
  
  useEffect(() => {
    if (itemId) {
      const item = foundItems.find(f => f.id === itemId);
      setFoundItem(item);
    }
    if (lostItemId) {
      const item = lostItems.find(l => l.id === lostItemId);
      setLostItem(item);
    }
  }, [itemId, lostItemId]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    itemDescription: '',
    additionalInfo: '',
    proofOfOwnership: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally send the data to your backend
    console.log('Contact form submitted:', formData);
    setIsSubmitted(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSubmitted) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-2xl flex-1 p-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h1>
                <p className="text-gray-600">
                  Your request has been sent to the administrators. If the item matches your description and you can provide proof of ownership, you'll be contacted within 24 hours.
                </p>
              </div>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Go Back
              </button>
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
        <main className="mx-auto w-full max-w-2xl flex-1 p-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Contact Admin for Private Item</h1>
              <p className="text-gray-600">
                This found item is currently in private mode for the finder's security. If you believe this item belongs to you, please fill out this form with detailed information.
              </p>
            </div>

            {/* Match Information */}
            {matchScore && lostItem && foundItem && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-blue-800 font-medium">Potential Match Detected</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchColor(parseInt(matchScore))}`}>
                    {matchScore}% Match • {getMatchStrength(parseInt(matchScore))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-red-700 font-medium mb-1">Your Lost Item:</div>
                    <div className="text-gray-700">{lostItem.title}</div>
                    <div className="text-gray-600">Category: {lostItem.category}</div>
                  </div>
                  <div>
                    <div className="text-green-700 font-medium mb-1">Found Item:</div>
                    <div className="text-gray-700">{foundItem.title}</div>
                    <div className="text-gray-600">Category: {foundItem.category}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-blue-700">
                  This system detected similarities between your lost item and this found item. Please provide detailed information below to help verify ownership.
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="text-amber-600 mr-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-amber-800 font-medium">Privacy Protection Notice</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Items remain private for 30 days to protect finder information. Be prepared to provide proof of ownership if this is your item.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Item Description *
                </label>
                <textarea
                  name="itemDescription"
                  required
                  rows={4}
                  value={formData.itemDescription}
                  onChange={handleChange}
                  placeholder="Describe the item in detail: color, brand, size, distinguishing features, contents, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof of Ownership
                </label>
                <textarea
                  name="proofOfOwnership"
                  rows={3}
                  value={formData.proofOfOwnership}
                  onChange={handleChange}
                  placeholder="Describe any proof you can provide: receipts, photos, serial numbers, unique identifiers, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  name="additionalInfo"
                  rows={3}
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  placeholder="Any other relevant information that might help verify ownership..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </Protected>
  );
}