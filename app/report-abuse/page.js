"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { lostItems, foundItems, users, reportCategories } from "@/data/mock";

export default function ReportAbuse() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetType = searchParams.get('type'); // 'item' or 'user'
  const targetId = searchParams.get('id');
  
  const [targetItem, setTargetItem] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    reason: "",
    description: "",
    anonymous: false
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (targetType && targetId) {
      if (targetType === 'item') {
        const allItems = [...lostItems, ...foundItems];
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
    
    // Simulate report submission
    setTimeout(() => {
      // In a real app, this would send to an API
      const reportData = {
        id: `r${Date.now()}`,
        type: targetType.toUpperCase(),
        targetId: targetId,
        targetTitle: targetItem?.title || targetItem?.name || "Unknown",
        reportedBy: formData.anonymous ? "Anonymous" : "Current User",
        reportedById: formData.anonymous ? null : "current_user_id",
        category: formData.category,
        reason: formData.reason,
        description: formData.description,
        status: "PENDING",
        priority: "MEDIUM",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log("Report submitted:", reportData);
      setSubmitted(true);
      setLoading(false);
    }, 1000);
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
              <p className="text-gray-600 mb-6">
                Thank you for helping keep our community safe. Your report has been submitted and will be reviewed by our moderation team.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Our team will review your report within 24 hours</li>
                  <li>• We'll investigate the reported content/user</li>
                  <li>• Appropriate action will be taken if needed</li>
                  <li>• You may receive updates on serious violations</li>
                </ul>
              </div>
              <div className="flex justify-center gap-4">
                <Link href="/dashboard" className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200">
                  Back to Dashboard
                </Link>
                <button 
                  onClick={() => {setSubmitted(false); setFormData({category: "", reason: "", description: "", anonymous: false});}}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Report Another Issue
                </button>
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
                <h2 className="font-semibold text-gray-800 mb-2">Reporting {targetType}:</h2>
                <div className="flex items-center gap-3">
                  {targetType === 'item' && (
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
                  )}
                  {targetType === 'user' && (
                    <>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">USER</span>
                      <span className="font-medium">{targetItem.name}</span>
                      <span className="text-sm text-gray-600">• {targetItem.email}</span>
                    </>
                  )}
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
                  placeholder="Please provide any additional context that would help our moderation team understand the issue..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Provide more details about what happened, when it occurred, or any other relevant information.
                </p>
              </div>

              {/* Anonymous Option */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="anonymous"
                  checked={formData.anonymous}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-1"
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">
                    Submit report anonymously
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Your identity will not be shared with the reported user, but our moderation team may still see it for investigation purposes.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    By submitting this report, you agree to our community guidelines and terms of service.
                  </p>
                  <button
                    type="submit"
                    disabled={loading || !formData.category || !formData.reason}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Submitting...
                      </div>
                    ) : (
                      "Submit Report"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Need immediate help?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-1">Emergency situations:</h4>
                <p>If you're in immediate danger, contact campus security or local authorities immediately.</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Technical issues:</h4>
                <p>For app-related problems, contact our support team at support@traceback.edu</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Protected>
  );
}