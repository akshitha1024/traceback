"use client";
export const dynamic = "force-dynamic";
export const dynamicParams = true;


import { useState, useEffect } from "react";
import Link from "next/link";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { reportCategories } from "@/data/mock";

export default function Moderation() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionType, setActionType] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(`http://localhost:5000/api/reports?admin_email=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      
      if (response.ok) {
        setReports(data.reports || []);
      } else {
        console.error('Failed to load reports:', data.error);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "LOW": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "bg-orange-100 text-orange-800";
      case "REVIEWED": return "bg-blue-100 text-blue-800";
      case "RESOLVED": return "bg-green-100 text-green-800";
      case "DISMISSED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleReportAction = async (action) => {
    if (!selectedReport || !isAdmin) return;
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // If action is to remove content, call delete endpoint
      if (action === 'remove_content') {
        const response = await fetch(`http://localhost:5000/api/reports/${selectedReport.report_id}/delete-content`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            admin_email: user.email,
            moderator_notes: moderatorNotes || 'Content removed by admin'
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert(`✅ ${data.message}`);
          setSelectedReport(null);
          setModeratorNotes("");
          setReportAction("");
          loadReports(); // Reload reports
        } else {
          alert('❌ Failed to delete content: ' + data.error);
        }
      } else {
        // Update report status for other actions
        const response = await fetch(`http://localhost:5000/api/reports/${selectedReport.report_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            admin_email: user.email,
            status: action === 'dismiss' ? 'DISMISSED' : 'REVIEWED',
            moderator_action: action,
            moderator_notes: moderatorNotes
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert('✅ Report updated successfully');
          setSelectedReport(null);
          setModeratorNotes("");
          setReportAction("");
          loadReports(); // Reload reports
        } else {
          alert('❌ Failed to update report: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Error handling report action:', error);
      alert('Error processing action. Please try again.');
    }
  };

  const getTargetDetails = async (report) => {
    // For now, we'll just show basic info from the report
    // In the future, we could fetch full details from the API
    return {
      id: report.target_id,
      title: report.target_title,
      type: report.type
    };
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
              <p className="mt-4 text-gray-600">Loading reports...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Moderation Dashboard</h1>
            <p className="text-gray-600">Review reported abuse and successful returns</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-red-600">{reports.length}</div>
              <div className="text-sm text-gray-600">Abuse Reports</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-green-600">{successfulReturns.length}</div>
              <div className="text-sm text-gray-600">Successful Returns</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-orange-600">{reports.filter(r => r.status === "PENDING").length}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { key: "reports", label: "Abuse Reports", count: reports.length },
                  { key: "returns", label: "Successful Returns", count: successfulReturns.length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            {/* Content - Conditional Rendering */}
            {activeTab === "returns" ? (
              /* Successful Returns List */
              <div className="divide-y divide-gray-200">
                {successfulReturns.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No successful returns yet</h3>
                    <p className="text-gray-600">When items are successfully returned, they will appear here.</p>
                  </div>
                ) : (
                  successfulReturns.map((returnItem) => (
                    <div key={returnItem.return_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">🏆</div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{returnItem.item_title}</h3>
                            <p className="text-xs text-gray-500">Return ID: #{returnItem.return_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-700">
                            Finalized: {new Date(returnItem.finalized_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(returnItem.finalized_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Owner Info */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2">👤 Item Owner (Gave)</h4>
                          <p className="text-sm text-gray-900 mb-1">
                            <strong>Name:</strong> {returnItem.owner_name}
                          </p>
                          <p className="text-sm text-gray-900 mb-1">
                            <strong>Email:</strong> <a href={`mailto:${returnItem.owner_email}`} className="text-blue-600 hover:underline">{returnItem.owner_email}</a>
                          </p>
                          {returnItem.owner_phone && (
                            <p className="text-sm text-gray-900">
                              <strong>Phone:</strong> <a href={`tel:${returnItem.owner_phone}`} className="text-blue-600 hover:underline">{returnItem.owner_phone}</a>
                            </p>
                          )}
                        </div>

                        {/* Claimer Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">🎯 Claimer (Received)</h4>
                          <p className="text-sm text-gray-900 mb-1">
                            <strong>Name:</strong> {returnItem.claimer_name}
                          </p>
                          <p className="text-sm text-gray-900">
                            <strong>Email:</strong> <a href={`mailto:${returnItem.claimer_email}`} className="text-blue-600 hover:underline">{returnItem.claimer_email}</a>
                          </p>
                        </div>
                      </div>

                      {/* Item Description */}
                      {returnItem.item_description && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                          <p className="text-sm text-gray-900">
                            <strong className="text-blue-900">📝 Description:</strong> {returnItem.item_description}
                          </p>
                        </div>
                      )}

                      {/* Item Details */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">📂 Category:</span>
                            <span className="font-semibold ml-2 text-gray-900">{returnItem.item_category}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">📍 Location:</span>
                            <span className="font-semibold ml-2 text-gray-900">{returnItem.item_location}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">📅 Found Date:</span>
                            <span className="font-semibold ml-2 text-gray-900">{new Date(returnItem.date_found).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Claim Reason */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-gray-900">
                          <strong className="text-yellow-900">💡 Reason for Giving to Claimer:</strong>
                        </p>
                        <p className="text-sm text-gray-800 mt-2 italic">{returnItem.claim_reason}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Abuse Reports List */
              <div className="divide-y divide-gray-200">
                {reports.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No abuse reports</h3>
                    <p className="text-gray-600">No abuse reports have been filed yet.</p>
                  </div>
                ) : (
                  reports.map((report) => {
                  return (
                    <div key={report.report_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              report.type === "ITEM" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                            }`}>
                              {report.type}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(report.priority)}`}>
                              {report.priority} PRIORITY
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              Reported {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {reportCategories[report.category]?.label || report.category} - {report.reason}
                          </h3>
                          
                          {/* Reporter Information */}
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                            <h4 className="font-semibold text-red-900 mb-2">🚨 Reported By:</h4>
                            <p className="text-sm text-gray-900 mb-1">
                              <strong>Name:</strong> {report.reporter_full_name || report.reported_by_name || 'Anonymous'}
                            </p>
                            <p className="text-sm text-gray-900 mb-1">
                              <strong>Email:</strong> <a href={`mailto:${report.reporter_email || report.reported_by_email}`} className="text-blue-600 hover:underline">{report.reporter_email || report.reported_by_email}</a>
                            </p>
                            {report.reporter_phone && (
                              <p className="text-sm text-gray-900">
                                <strong>Phone:</strong> <a href={`tel:${report.reporter_phone}`} className="text-blue-600 hover:underline">{report.reporter_phone}</a>
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Report ID: {report.report_id} | Reported on: {new Date(report.created_at).toLocaleString()}
                            </p>
                          </div>
                          
                          {/* Report Description */}
                          {report.description && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                              <p className="text-sm text-gray-900">
                                <strong className="text-yellow-900">📝 Report Details:</strong>
                              </p>
                              <p className="text-sm text-gray-800 mt-2">{report.description}</p>
                            </div>
                          )}

                          {/* Reported Item Details - FOUND ITEM */}
                          {report.type === 'FOUND' && (report.found_item_title || report.target_title) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                              <h4 className="font-semibold text-blue-900 mb-3">🔍 Reported Found Item Details:</h4>
                              <p className="text-sm text-gray-900 mb-2">
                                <strong>Title:</strong> {report.found_item_title || report.target_title}
                              </p>
                              {report.found_item_description && (
                                <p className="text-sm text-gray-900 mb-2">
                                  <strong>Description:</strong> {report.found_item_description}
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <p className="text-gray-900">
                                  <strong>Category:</strong> {report.found_category || 'N/A'}
                                </p>
                                <p className="text-gray-900">
                                  <strong>Location:</strong> {report.found_location || 'N/A'}
                                </p>
                                <p className="text-gray-900">
                                  <strong>Date Found:</strong> {report.found_date ? new Date(report.found_date).toLocaleDateString() : 'N/A'}
                                </p>
                                <p className="text-gray-900">
                                  <strong>Item ID:</strong> {report.target_id}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-blue-300">
                                <p className="text-sm text-gray-900 mb-1">
                                  <strong className="text-blue-900">👤 Posted By:</strong> {report.found_owner_name}
                                </p>
                                <p className="text-sm text-gray-900 mb-1">
                                  <strong>Email:</strong> <a href={`mailto:${report.found_owner_email}`} className="text-blue-600 hover:underline">{report.found_owner_email}</a>
                                </p>
                                {report.found_owner_phone && (
                                  <p className="text-sm text-gray-900">
                                    <strong>Phone:</strong> <a href={`tel:${report.found_owner_phone}`} className="text-blue-600 hover:underline">{report.found_owner_phone}</a>
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Reported Item Details - LOST ITEM */}
                          {report.type === 'LOST' && (report.lost_item_title || report.target_title) && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
                              <h4 className="font-semibold text-purple-900 mb-3">🔎 Reported Lost Item Details:</h4>
                              <p className="text-sm text-gray-900 mb-2">
                                <strong>Title:</strong> {report.lost_item_title || report.target_title}
                              </p>
                              {report.lost_item_description && (
                                <p className="text-sm text-gray-900 mb-2">
                                  <strong>Description:</strong> {report.lost_item_description}
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <p className="text-gray-900">
                                  <strong>Category:</strong> {report.lost_category || 'N/A'}
                                </p>
                                <p className="text-gray-900">
                                  <strong>Location:</strong> {report.lost_location || 'N/A'}
                                </p>
                                <p className="text-gray-900">
                                  <strong>Date Lost:</strong> {report.lost_date ? new Date(report.lost_date).toLocaleDateString() : 'N/A'}
                                </p>
                                <p className="text-gray-900">
                                  <strong>Item ID:</strong> {report.target_id}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-purple-300">
                                <p className="text-sm text-gray-900 mb-1">
                                  <strong className="text-purple-900">👤 Reported By (Original Owner):</strong> {report.lost_owner_name}
                                </p>
                                <p className="text-sm text-gray-900 mb-1">
                                  <strong>Email:</strong> <a href={`mailto:${report.lost_owner_email}`} className="text-blue-600 hover:underline">{report.lost_owner_email}</a>
                                </p>
                                {report.lost_owner_phone && (
                                  <p className="text-sm text-gray-900">
                                    <strong>Phone:</strong> <a href={`tel:${report.lost_owner_phone}`} className="text-blue-600 hover:underline">{report.lost_owner_phone}</a>
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {report.moderator_notes && (
                            <div className="bg-blue-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-blue-800">
                                <strong>Moderator Notes:</strong> {report.moderator_notes}
                              </p>
                              {report.moderator_action && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Action taken: {report.moderator_action}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            Review
                          </button>
                          {(report.item_type === 'FOUND' || (report.type === 'ITEM' && report.found_item_title)) && (
                            <Link
                              href={`/found-item-details/${report.target_id}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-center"
                            >
                              View Found Item
                            </Link>
                          )}
                          {(report.item_type === 'LOST' || (report.type === 'ITEM' && report.lost_item_title)) && (
                            <Link
                              href={`/lost-item-details/${report.target_id}`}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-center"
                            >
                              View Lost Item
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            )}
          </div>

          {/* Review Modal */}
          {selectedReport && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Review Report #{selectedReport.report_id}</h2>
                  <button
                    onClick={() => {
                      setSelectedReport(null);
                      setModeratorNotes("");
                      setReportAction("");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Report Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Report Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium ml-2">{selectedReport.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Target:</span>
                      <span className="font-medium ml-2">{selectedReport.target_title}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium ml-2">{selectedReport.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reason:</span>
                      <span className="font-medium ml-2">{selectedReport.reason}</span>
                    </div>
                  </div>
                  {selectedReport.description && (
                    <div className="mt-3">
                      <span className="text-gray-600 text-sm">Description:</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedReport.description}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moderator Action *
                    </label>
                    <select
                      value={reportAction}
                      onChange={(e) => setReportAction(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400"
                    >
                      <option value="">Select action</option>
                      <option value="dismiss">Dismiss Report</option>
                      <option value="warn_user">Warn User</option>
                      <option value="remove_content">🗑️ Delete Content (Permanent)</option>
                      <option value="suspend_user">Suspend User</option>
                      <option value="ban_user">Ban User</option>
                      <option value="escalate">Escalate to Admin</option>
                    </select>
                    {reportAction === 'remove_content' && (
                      <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                          ⚠️ <strong>Warning:</strong> This will permanently delete the reported {selectedReport.type.toLowerCase()} 
                          (ID: {selectedReport.target_id}) from the database. This action cannot be undone.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moderator Notes
                    </label>
                    <textarea
                      value={moderatorNotes}
                      onChange={(e) => setModeratorNotes(e.target.value)}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 resize-none"
                      placeholder="Add notes about your decision and any actions taken..."
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReportAction(reportAction)}
                    disabled={!reportAction}
                    className={`flex-1 ${
                      reportAction === 'remove_content' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-gray-900 hover:bg-black'
                    } disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200`}
                  >
                    {reportAction === 'remove_content' ? '🗑️ Delete Content' : 'Submit Decision'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReport(null);
                      setModeratorNotes("");
                      setReportAction("");
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Protected>
  );
}