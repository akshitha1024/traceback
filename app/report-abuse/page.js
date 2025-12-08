"use client";



import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { foundItems, users, reportCategories } from "@/data/mock";

export default function ReportAbuse() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetType = searchParams.get('type'); // 'item' or 'user'
  const targetId = searchParams.get('id');
  
  const [targetItem, setTargetItem] = useState(null);
  const [claimInfo, setClaimInfo] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    reason: "",
    description: "",
    anonymous: false
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if reporting a false claim
    const storedClaimInfo = localStorage.getItem('reportClaimInfo');
    if (storedClaimInfo) {
      const claim = JSON.parse(storedClaimInfo);
      setClaimInfo(claim);
      setTargetItem({
        title: claim.itemTitle,
        name: claim.claimerName,
        email: claim.claimerEmail
      });
      setFormData(prev => ({
        ...prev,
        category: 'False Claim',
        reason: 'False ownership verification',
        description: `Reporting false claim for item: ${claim.itemTitle}\nClaimed by: ${claim.claimerName} (${claim.claimerEmail})`
      }));
      // Clear from localStorage after loading
      localStorage.removeItem('reportClaimInfo');
    } else if (targetType && targetId) {
      if (targetType === 'item') {
        const allItems = [...foundItems];
        const item = allItems.find(i => i.id === targetId);
        setTargetItem(item);
      } else if (targetType === 'user') {
        const user = users.find(u => u.id === targetId);
        setTargetItem(user);
      }
    }
  }, [targetType, targetId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // All reports are anonymous (name shows as Anonymous, but email stored for moderators)
    const reportData = claimInfo ? {
      // Reporting a false claim
      type: 'CLAIM',
      target_id: claimInfo.claimId,
      target_title: `False Claim: ${claimInfo.itemTitle}`,
      reported_by_id: currentUser.id || null,
      reported_by_name: 'Anonymous',
      reported_by_email: currentUser.email,
      category: formData.category,
      reason: formData.reason,
      description: formData.description
    } : {
      // Regular item/user report
      type: targetType.toUpperCase(),
      target_id: parseInt(targetId),
      target_title: targetItem?.title || targetItem?.name || "Unknown",
      reported_by_id: currentUser.id || null,
      reported_by_name: 'Anonymous',
      reported_by_email: currentUser.email,
      category: formData.category,
      reason: formData.reason,
      description: formData.description
    };
    
    // Submit to API
    fetch('http://localhost:5000/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("Report submitted:", data);
        setSubmitted(true);
      } else {
        alert('Failed to submit report: ' + (data.error || 'Unknown error'));
      }
      setLoading(false);
    })
    .catch(error => {
      console.error("Error submitting report:", error);
      alert('Failed to submit report. Please try again.');
      setLoading(false);
    });
  };

  if (submitted) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-4xl flex-1 p-6">
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Submitted</h1>
              <p className="text-gray-600 mb-8">
                Your report has been shared with moderators only. We will review this post and take appropriate action. Thank you for reporting.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/dashboard" className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200">
                  Back to Dashboard
                </Link>
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
        <main className="mx-auto w-full max-w-4xl flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Report Abuse</h1>
              <p className="text-gray-600">Help us maintain a safe and trustworthy community</p>
            </div>
            <Link href="/dashboard" className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
              Cancel
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {/* Target Info */}
            {targetItem && (
              <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                <h2 className="font-semibold text-gray-800 mb-2">
                  {claimInfo ? 'Reporting False Claim:' : `Reporting ${targetType}:`}
                </h2>
                <div className="flex items-center gap-3">
                  {claimInfo ? (
                    <>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">FALSE CLAIM</span>
                      <span className="font-medium">{claimInfo.itemTitle}</span>
                      <span className="text-sm text-gray-600">• Claimed by {claimInfo.claimerName}</span>
                    </>
                  ) : targetType === 'item' ? (
                    <>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        targetItem.type === 'LOST' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {targetItem.type}
                      </span>
                      <span className="font-medium">{targetItem.title}</span>
                      <span className="text-sm text-gray-600">• {targetItem.location}</span>
                      <span className="text-sm text-gray-600">• by {targetItem.reportedBy}</span>
                    </>
                  ) : targetType === 'user' ? (
                    <>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">USER</span>
                      <span className="font-medium">{targetItem.name}</span>
                      <span className="text-sm text-gray-600">• {targetItem.email}</span>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-amber-500 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Important</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Please only report genuine violations. False reports may result in restrictions on your account. 
                    All reports are reviewed and logged.
                  </p>
                </div>
              </div>
            </div>

            {/* Report Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of issue are you reporting? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(reportCategories).map(([key, category]) => (
                    <label key={key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={key}
                        checked={formData.category === key}
                        onChange={handleInputChange}
                        required
                        className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{category.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specific Reason */}
              {formData.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific reason *
                  </label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white transition-all duration-200"
                  >
                    <option value="">Select a specific reason</option>
                    {reportCategories[formData.category]?.reasons.map((reason, index) => (
                      <option key={index} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white transition-all duration-200 resize-none"
                  placeholder="Optional: Provide any additional context..."
                />
              </div>

              {/* Submit Button */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="submit"
                  disabled={loading || !formData.category || !formData.reason}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Report"
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </Protected>
  );
}