"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { reports, lostItems, foundItems, users, reportCategories } from "@/data/mock";

export default function Moderation() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedReport, setSelectedReport] = useState(null);
  const [moderatorNotes, setModeratorNotes] = useState("");
  const [reportAction, setReportAction] = useState("");

  const filteredReports = reports.filter(report => {
    if (activeTab === "pending") return report.status === "PENDING";
    if (activeTab === "reviewed") return report.status === "REVIEWED";
    if (activeTab === "all") return true;
    return false;
  });

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

  const handleReportAction = (action) => {
    if (!selectedReport) return;
    
    // Simulate updating report status
    console.log(`Report ${selectedReport.id} ${action}:`, {
      action,
      moderatorNotes,
      timestamp: new Date().toISOString()
    });
    
    // Reset form
    setSelectedReport(null);
    setModeratorNotes("");
    setReportAction("");
  };

  const getTargetDetails = (report) => {
    if (report.type === "ITEM") {
      const allItems = [...lostItems, ...foundItems];
      return allItems.find(item => item.id === report.targetId);
    } else if (report.type === "USER") {
      return users.find(user => user.id === report.targetId);
    }
    return null;
  };

  return (
    <Protected>
      <Navbar />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Moderation Dashboard</h1>
              <p className="text-gray-600">Review and manage reported content and users</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <span className="text-red-800 font-medium">⚠️ Admin Access Only</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-orange-600">{reports.filter(r => r.status === "PENDING").length}</div>
              <div className="text-sm text-gray-600">Pending Reports</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-red-600">{reports.filter(r => r.priority === "HIGH").length}</div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-blue-600">{reports.filter(r => r.status === "REVIEWED").length}</div>
              <div className="text-sm text-gray-600">Reviewed Today</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-gray-600">{reports.length}</div>
              <div className="text-sm text-gray-600">Total Reports</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { key: "pending", label: "Pending", count: reports.filter(r => r.status === "PENDING").length },
                  { key: "reviewed", label: "Reviewed", count: reports.filter(r => r.status === "REVIEWED").length },
                  { key: "all", label: "All Reports", count: reports.length }
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

            {/* Reports List */}
            <div className="divide-y divide-gray-200">
              {filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reports to review</h3>
                  <p className="text-gray-600">All clear! Check back later for new reports.</p>
                </div>
              ) : (
                filteredReports.map((report) => {
                  const targetDetails = getTargetDetails(report);
                  return (
                    <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
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
                              Reported {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {reportCategories[report.category]?.label} - {report.reason}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Reported {report.type.toLowerCase()}:</strong> {report.targetTitle}
                              </p>
                              {targetDetails && (
                                <p className="text-xs text-gray-500">
                                  {report.type === "ITEM" 
                                    ? `${targetDetails.location} • ${targetDetails.category}`
                                    : targetDetails.email
                                  }
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                <strong>Reported by:</strong> {report.reportedBy}
                              </p>
                              <p className="text-xs text-gray-500">
                                Report ID: {report.id}
                              </p>
                            </div>
                          </div>
                          
                          {report.description && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700">
                                <strong>Details:</strong> {report.description}
                              </p>
                            </div>
                          )}
                          
                          {report.moderatorNotes && (
                            <div className="bg-blue-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-blue-800">
                                <strong>Moderator Notes:</strong> {report.moderatorNotes}
                              </p>
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
                          {targetDetails && (
                            <Link
                              href={report.type === "ITEM" ? `/items/${report.targetId}` : `/profile/${report.targetId}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-center"
                            >
                              View {report.type === "ITEM" ? "Item" : "Profile"}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Review Modal */}
          {selectedReport && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Review Report</h2>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
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
                      <option value="remove_content">Remove Content</option>
                      <option value="suspend_user">Suspend User</option>
                      <option value="ban_user">Ban User</option>
                      <option value="escalate">Escalate to Admin</option>
                    </select>
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
                    className="flex-1 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    Submit Decision
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
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