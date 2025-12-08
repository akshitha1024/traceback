"use client";



import { useState, useEffect } from "react";
import Link from "next/link";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function Moderation() {
  const [activeTab, setActiveTab] = useState("returns");
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedBugReport, setSelectedBugReport] = useState(null);
  const [actionType, setActionType] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [reports, setReports] = useState([]);
  const [bugReports, setBugReports] = useState([]);
  const [successfulReturns, setSuccessfulReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isModerator, setIsModerator] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [emailMessage, setEmailMessage] = useState("");

  // ET timezone formatter
  const formatETDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  };

  const formatETDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    checkModeratorAccess(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkModeratorAccess = async (user) => {
    try {
      const response = await fetch(`http://localhost:5000/api/check-moderator?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      
      if (response.ok && data.is_moderator) {
        setIsModerator(true);
        loadReports();
        loadSuccessfulReturns();
        loadBugReports();
      } else {
        setIsModerator(false);
      }
    } catch (error) {
      console.error('Error checking moderator access:', error);
      setIsModerator(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const loadReports = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`http://localhost:5000/api/reports?admin_email=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      if (response.ok) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadSuccessfulReturns = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`http://localhost:5000/api/moderation/successful-returns?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      if (response.ok) {
        setSuccessfulReturns(data.returns || []);
      }
    } catch (error) {
      console.error('Error loading successful returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBugReports = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`http://localhost:5000/api/moderation/bug-reports?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      if (response.ok) {
        setBugReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading bug reports:', error);
    }
  };

  const handleBugReportUpdate = async (reportId, status, notes) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`http://localhost:5000/api/moderation/bug-reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          moderator_notes: notes,
          moderator_email: user.email
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update bug report' };
      }
    } catch (error) {
      console.error('Error updating bug report:', error);
      return { success: false, error: 'Error updating bug report' };
    }
  };

  const handleSendBugReportEmail = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`http://localhost:5000/api/send-bug-report-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: selectedBugReport.report_id,
          reporter_email: selectedBugReport.email,
          reporter_name: selectedBugReport.name,
          bug_title: selectedBugReport.title,
          bug_status: selectedBugReport.status,
          bug_description: selectedBugReport.description,
          bug_issue_type: selectedBugReport.issue_type,
          message: emailMessage,
          moderator_email: user.email
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to send email' };
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: 'Error sending email' };
    }
  };

  const handleModeratorAction = async () => {
    if (!selectedReport || !actionType || !actionReason.trim()) {
      alert('Please select an action and provide a reason');
      return;
    }

    setProcessing(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Send moderation action to backend
      const response = await fetch(`http://localhost:5000/api/moderation/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: selectedReport.report_id,
          action_type: actionType,
          reason: actionReason,
          moderator_email: user.email,
          target_id: selectedReport.target_id,
          target_user_email: selectedReport.found_owner_email || selectedReport.lost_owner_email,
          item_type: selectedReport.item_type
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Action completed successfully. User has been notified via email.');
        setSelectedReport(null);
        setActionType("");
        setActionReason("");
        loadReports();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error processing action:', error);
      alert('Error processing action');
    } finally {
      setProcessing(false);
    }
  };

  const pendingReports = reports.filter(r => r.status === 'PENDING');
  const reviewedReports = reports.filter(r => r.status === 'REVIEWED');
  
  const openBugReports = bugReports.filter(r => r.status === 'OPEN');
  const inProgressBugReports = bugReports.filter(r => r.status === 'IN_PROGRESS');
  const resolvedBugReports = bugReports.filter(r => r.status === 'RESOLVED');

  if (checkingAccess) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Checking access...</p>
            </div>
          </main>
        </div>
      </Protected>
    );
  }

  if (!isModerator) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="text-center py-12">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
                <p className="text-red-700 mb-4">
                  You do not have moderator privileges to access this page.
                </p>
                <p className="text-sm text-red-600">
                  Only authorized moderators can view the moderation dashboard.
                </p>
                <Link 
                  href="/dashboard"
                  className="mt-6 inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </main>
        </div>
      </Protected>
    );
  }

  if (loading) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
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
            <p className="text-gray-600">Manage successful returns and abuse reports</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-green-600">{successfulReturns.length}</div>
              <div className="text-sm text-gray-600">Successful Returns</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-orange-600">{pendingReports.length}</div>
              <div className="text-sm text-gray-600">Abuse Reports</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-red-600">{openBugReports.length}</div>
              <div className="text-sm text-gray-600">Open Bug Reports</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-purple-600">{inProgressBugReports.length}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-blue-600">{resolvedBugReports.length}</div>
              <div className="text-sm text-gray-600">Resolved Bugs</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap">
                {[
                  { key: "returns", label: "Successful Returns", count: successfulReturns.length },
                  { key: "pending", label: "Abuse Reports", count: pendingReports.length },
                  { key: "reviewed", label: "Reviewed Abuse", count: reviewedReports.length },
                  { key: "bugs", label: "Open Bug Reports", count: bugReports.filter(b => b.status !== 'RESOLVED').length },
                  { key: "resolved-bugs", label: "Resolved Bug Reports", count: bugReports.filter(b => b.status === 'RESOLVED').length }
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

            {/* Content */}
            <div className="divide-y divide-gray-200">
              {/* Successful Returns Tab */}
              {activeTab === "returns" && (
                successfulReturns.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No successful returns yet</h3>
                    <p className="text-gray-600">Successful returns will appear here.</p>
                  </div>
                ) : (
                  successfulReturns.map((item) => (
                    <div key={item.return_id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{item.item_title}</h3>
                          <p className="text-sm text-gray-600">Return ID: #{item.return_id} | Verification Code: <span className="font-mono text-purple-600">{item.verification_code}</span></p>
                          <p className="text-xs text-gray-500">Finalized: {formatETDateTime(item.finalized_at)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs font-bold text-green-900 mb-2">👤 Owner (Gave Item)</p>
                          <p className="text-sm text-gray-900"><strong>Name:</strong> {item.owner_name}</p>
                          <p className="text-sm text-gray-900"><strong>Email:</strong> {item.owner_email}</p>
                          {item.owner_phone && <p className="text-sm text-gray-900"><strong>Phone:</strong> {item.owner_phone}</p>}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs font-bold text-blue-900 mb-2">🎯 Claimer (Received Item)</p>
                          <p className="text-sm text-gray-900"><strong>Name:</strong> {item.claimer_name}</p>
                          <p className="text-sm text-gray-900"><strong>Email:</strong> {item.claimer_email}</p>
                          {item.claimer_phone && <p className="text-sm text-gray-900"><strong>Phone:</strong> {item.claimer_phone}</p>}
                        </div>
                      </div>

                      {/* Item Description */}
                      {item.item_description && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                          <p className="text-xs font-bold text-gray-900 mb-1">📝 Item Description:</p>
                          <p className="text-sm text-gray-800">{item.item_description}</p>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <p><strong>Category:</strong> {item.item_category}</p>
                          <p><strong>Location:</strong> {item.item_location}</p>
                          <p><strong>Found:</strong> {formatETDateTime(item.created_at)}</p>
                        </div>
                      </div>

                      {/* Reason for Giving */}
                      {item.claim_reason && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <p className="text-xs font-bold text-yellow-900 mb-1">💭 Reason for Giving to Claimer:</p>
                          <p className="text-sm text-gray-800 italic">{item.claim_reason}</p>
                        </div>
                      )}

                      {/* Security Questions with Correct Answers */}
                      {item.questions_json && (() => {
                        try {
                          const questions = JSON.parse(item.questions_json);
                          return questions.length > 0 && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                              <p className="text-xs font-bold text-purple-900 mb-2">❓ Security Questions & Correct Answers:</p>
                              {questions.map((q, idx) => (
                                <div key={idx} className="mb-2 pb-2 border-b border-purple-200 last:border-0">
                                  <p className="text-sm font-semibold text-gray-900">Q{idx + 1}: {q.question}</p>
                                  {q.type === 'multiple_choice' && q.choices && (
                                    <div className="text-xs text-gray-600 ml-4 mb-1">
                                      {Object.entries(q.choices).map(([key, value]) => (
                                        <span key={key} className={key === q.correct_choice ? 'font-bold text-green-700' : ''}>
                                          {key}: {value} {key === q.correct_choice && '✓'}
                                          {' '}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <p className="text-sm text-green-700 ml-4">
                                    <strong>✓ Correct Answer:</strong> {q.correct_answer}
                                  </p>
                                </div>
                              ))}
                            </div>
                          );
                        } catch (e) {
                          return null;
                        }
                      })()}

                      {/* All Claim Responses */}
                      {item.all_claim_responses && (() => {
                        try {
                          const responses = JSON.parse(item.all_claim_responses);
                          return responses.length > 0 && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                              <p className="text-xs font-bold text-indigo-900 mb-2">👥 All Claim Attempts ({responses.length}):</p>
                              {responses.map((resp, idx) => (
                                <div key={idx} className={`mb-3 p-3 rounded ${resp.marked_as_potential ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{resp.name}</p>
                                      <p className="text-xs text-gray-600">{resp.email}</p>
                                    </div>
                                    {resp.marked_as_potential && (
                                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded font-bold">
                                        ✓ WINNER
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    Attempted: {formatETDateTime(resp.attempted_at)}
                                    {resp.marked_at && ` | Marked: ${formatETDateTime(resp.marked_at)}`}
                                  </p>
                                  <div className="bg-white bg-opacity-50 rounded p-2">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Answers Provided:</p>
                                    {Object.values(resp.answers).map((answer, aIdx) => (
                                      <p key={aIdx} className="text-sm text-gray-800 ml-2">• {answer}</p>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        } catch (e) {
                          return null;
                        }
                      })()}
                    </div>
                  ))
                )
              )}

              {/* Pending Reports Tab */}
              {activeTab === "pending" && (
                pendingReports.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending reports</h3>
                    <p className="text-gray-600">All reports have been reviewed.</p>
                  </div>
                ) : (
                  pendingReports.map((report) => (
                    <div key={report.report_id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              PENDING
                            </span>
                            <span className="text-xs text-gray-500">
                              Reported: {formatETDate(report.created_at)}
                            </span>
                          </div>

                          <h3 className="font-semibold text-gray-900 mb-2">
                            {report.category} - {report.reason}
                          </h3>

                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                            <p className="text-xs font-bold text-red-900 mb-1">🚨 Reported By:</p>
                            <p className="text-sm text-gray-900"><strong>Name:</strong> {report.reporter_full_name || 'Anonymous'}</p>
                            <p className="text-sm text-gray-900"><strong>Email:</strong> {report.reporter_email}</p>
                          </div>

                          {report.description && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                              <p className="text-xs font-bold text-yellow-900 mb-1">📝 Details:</p>
                              <p className="text-sm text-gray-800">{report.description}</p>
                            </div>
                          )}

                          {report.found_item_title && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-blue-900">📦 Complete Found Item Report</p>
                                <Link
                                  href={`/found-item-details/${report.target_id}`}
                                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                                >
                                  View Full Post
                                </Link>
                              </div>
                              
                              {report.found_image_filename && (
                                <div className="bg-white rounded p-2 mb-2">
                                  <p className="text-xs text-gray-600 mb-2">📸 Item Image</p>
                                  <img
                                    src={`http://localhost:5000/uploads/${report.found_image_filename}`}
                                    alt={report.found_item_title}
                                    className="w-full max-w-md rounded-lg border border-gray-300"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <div className="bg-white rounded p-2">
                                  <p className="text-xs text-gray-600">Title</p>
                                  <p className="text-sm font-semibold text-gray-900">{report.found_item_title}</p>
                                </div>
                                
                                {report.found_item_description && (
                                  <div className="bg-white rounded p-2">
                                    <p className="text-xs text-gray-600">Description</p>
                                    <p className="text-sm text-gray-900">{report.found_item_description}</p>
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-white rounded p-2">
                                    <p className="text-xs text-gray-600">Category</p>
                                    <p className="text-sm font-medium text-gray-900">{report.found_category || 'N/A'}</p>
                                  </div>
                                  <div className="bg-white rounded p-2">
                                    <p className="text-xs text-gray-600">Location Found</p>
                                    <p className="text-sm font-medium text-gray-900">{report.found_location || 'N/A'}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2">
                                  {report.found_color && (
                                    <div className="bg-white rounded p-2">
                                      <p className="text-xs text-gray-600">Color</p>
                                      <p className="text-sm font-medium text-gray-900">{report.found_color}</p>
                                    </div>
                                  )}
                                  {report.found_size && (
                                    <div className="bg-white rounded p-2">
                                      <p className="text-xs text-gray-600">Size</p>
                                      <p className="text-sm font-medium text-gray-900">{report.found_size}</p>
                                    </div>
                                  )}
                                  <div className="bg-white rounded p-2">
                                    <p className="text-xs text-gray-600">Date Found</p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {formatETDate(report.found_date)}
                                    </p>
                                  </div>
                                </div>
                                
                                {report.found_time && (
                                  <div className="bg-white rounded p-2">
                                    <p className="text-xs text-gray-600">Time Found</p>
                                    <p className="text-sm font-medium text-gray-900">{report.found_time}</p>
                                  </div>
                                )}
                                
                                {report.found_current_location && (
                                  <div className="bg-white rounded p-2">
                                    <p className="text-xs text-gray-600">Current Location (Where item is kept)</p>
                                    <p className="text-sm font-medium text-gray-900">{report.found_current_location}</p>
                                  </div>
                                )}
                                
                                {report.found_finder_notes && (
                                  <div className="bg-white rounded p-2">
                                    <p className="text-xs text-gray-600">Finder's Notes</p>
                                    <p className="text-sm text-gray-900 italic">{report.found_finder_notes}</p>
                                  </div>
                                )}
                                
                                <div className="bg-white rounded p-2">
                                  <p className="text-xs text-gray-600">Posted By (Finder)</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {report.found_owner_name} ({report.found_owner_email})
                                  </p>
                                  {report.found_owner_phone && (
                                    <p className="text-sm text-gray-700">Phone: {report.found_owner_phone}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedReport(report)}
                          className="ml-4 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Take Action
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}

              {/* Reviewed Reports Tab */}
              {activeTab === "reviewed" && (
                reviewedReports.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reviewed reports</h3>
                    <p className="text-gray-600">Reviewed reports will appear here.</p>
                  </div>
                ) : (
                  reviewedReports.map((report) => (
                    <div key={report.report_id} className="p-6 border-b border-gray-200 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            REVIEWED
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {report.moderator_action?.replace('_', ' ').toUpperCase() || 'N/A'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatETDate(report.updated_at || report.created_at)}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-3">
                        {report.category} - {report.reason}
                      </h3>

                      {/* Reporter Information */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                        <p className="text-sm font-semibold text-amber-900 mb-1">👤 Reporter Information</p>
                        <p className="text-sm text-amber-800"><strong>Name:</strong> {report.reported_by_name || 'Anonymous'}</p>
                        <p className="text-sm text-amber-800"><strong>Email:</strong> {report.reported_by_email || 'Not provided'}</p>
                      </div>

                      {/* Reported Item/Post Information */}
                      {report.item_type === 'FOUND' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-green-900">📦 Complete Found Item Report</p>
                            <Link 
                              href={`/found-item-details/${report.target_id}`}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                            >
                              View Full Post
                            </Link>
                          </div>
                          
                          {report.found_image_filename && (
                            <div className="bg-white rounded p-2 mb-2">
                              <p className="text-xs text-gray-600 mb-2">📸 Item Image</p>
                              <img
                                src={`http://localhost:5000/uploads/${report.found_image_filename}`}
                                alt={report.found_item_title}
                                className="w-full max-w-md rounded-lg border border-gray-300"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <div className="bg-white rounded p-2">
                              <p className="text-xs text-gray-600">Title</p>
                              <p className="text-sm font-semibold text-gray-900">{report.found_item_title || 'N/A'}</p>
                            </div>
                            
                            {report.found_item_description && (
                              <div className="bg-white rounded p-2">
                                <p className="text-xs text-gray-600">Description</p>
                                <p className="text-sm text-gray-900">{report.found_item_description}</p>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white rounded p-2">
                                <p className="text-xs text-gray-600">Category</p>
                                <p className="text-sm font-medium text-gray-900">{report.found_category || 'N/A'}</p>
                              </div>
                              <div className="bg-white rounded p-2">
                                <p className="text-xs text-gray-600">Location Found</p>
                                <p className="text-sm font-medium text-gray-900">{report.found_location || 'N/A'}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              {report.found_color && (
                                <div className="bg-white rounded p-2">
                                  <p className="text-xs text-gray-600">Color</p>
                                  <p className="text-sm font-medium text-gray-900">{report.found_color}</p>
                                </div>
                              )}
                              {report.found_size && (
                                <div className="bg-white rounded p-2">
                                  <p className="text-xs text-gray-600">Size</p>
                                  <p className="text-sm font-medium text-gray-900">{report.found_size}</p>
                                </div>
                              )}
                              <div className="bg-white rounded p-2">
                                <p className="text-xs text-gray-600">Date Found</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {report.found_date ? new Date(report.found_date).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            {report.found_time && (
                              <div className="bg-white rounded p-2">
                                <p className="text-xs text-gray-600">Time Found</p>
                                <p className="text-sm font-medium text-gray-900">{report.found_time}</p>
                              </div>
                            )}
                            
                            {report.found_current_location && (
                              <div className="bg-white rounded p-2">
                                <p className="text-xs text-gray-600">Current Location (Where item is kept)</p>
                                <p className="text-sm font-medium text-gray-900">{report.found_current_location}</p>
                              </div>
                            )}
                            
                            {report.found_finder_notes && (
                              <div className="bg-white rounded p-2">
                                <p className="text-xs text-gray-600">Finder's Notes</p>
                                <p className="text-sm text-gray-900 italic">{report.found_finder_notes}</p>
                              </div>
                            )}
                            
                            <div className="bg-white rounded p-2">
                              <p className="text-xs text-gray-600">Posted By (Finder)</p>
                              <p className="text-sm font-medium text-gray-900">
                                {report.found_owner_name || 'N/A'} ({report.found_owner_email || 'N/A'})
                              </p>
                              {report.found_owner_phone && (
                                <p className="text-sm text-gray-700">Phone: {report.found_owner_phone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {report.item_type === 'LOST' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-red-900">🔍 Lost Item Details</p>
                            <Link 
                              href={`/lost-item-details/${report.target_id}`}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                            >
                              View Post
                            </Link>
                          </div>
                          <p className="text-sm text-red-800"><strong>Title:</strong> {report.lost_item_title || 'N/A'}</p>
                          <p className="text-sm text-red-800"><strong>Description:</strong> {report.lost_item_description || 'N/A'}</p>
                          <p className="text-sm text-red-800"><strong>Category:</strong> {report.lost_category || 'N/A'}</p>
                          <p className="text-sm text-red-800"><strong>Location:</strong> {report.lost_location || 'N/A'}</p>
                          <p className="text-sm text-red-800"><strong>Date Lost:</strong> {formatETDate(report.lost_date)}</p>
                        </div>
                      )}

                      {/* Item Owner Information */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm font-semibold text-blue-900 mb-1">👨‍💼 Post Owner Information</p>
                        {(report.found_owner_name || report.lost_owner_name || report.found_owner_email || report.lost_owner_email) ? (
                          <>
                            <p className="text-sm text-blue-800"><strong>Name:</strong> {report.found_owner_name || report.lost_owner_name || 'Not available'}</p>
                            <p className="text-sm text-blue-800"><strong>Email:</strong> {report.found_owner_email || report.lost_owner_email || 'Not available'}</p>
                            {(report.found_owner_phone || report.lost_owner_phone) && (
                              <p className="text-sm text-blue-800"><strong>Phone:</strong> {report.found_owner_phone || report.lost_owner_phone}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-blue-700 italic">Owner information not available (post was deleted before tracking was implemented)</p>
                        )}
                      </div>

                      {/* Moderation Action Details */}
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p className="text-sm font-semibold text-gray-900 mb-1">⚖️ Action Details</p>
                        <p className="text-sm text-gray-800"><strong>Action:</strong> {report.moderator_action?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
                        {report.moderator_notes && (
                          <p className="text-sm text-gray-800 mt-1"><strong>Reason:</strong> {report.moderator_notes}</p>
                        )}
                        {report.moderator_name && (
                          <p className="text-xs text-gray-600 mt-1">Action taken by: {report.moderator_name}</p>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}

              {/* Bug Reports Tab */}
              {activeTab === "bugs" && (
                bugReports.filter(b => b.status !== 'RESOLVED').length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🐛</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No open bug reports</h3>
                    <p className="text-gray-600">Open bug reports will appear here.</p>
                  </div>
                ) : (
                  bugReports.filter(b => b.status !== 'RESOLVED').map((bug) => (
                    <div key={bug.report_id} className="p-6 hover:bg-gray-50 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              bug.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                              bug.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {bug.status}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              bug.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              bug.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              bug.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {bug.priority} Priority
                            </span>
                            <span className="text-xs text-gray-500">
                              Reported: {formatETDateTime(bug.created_at)}
                            </span>
                          </div>

                          <h3 className="font-bold text-gray-900 text-lg mb-2">{bug.title}</h3>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-xs font-bold text-blue-900 mb-1">📋 Issue Type:</p>
                            <p className="text-sm text-gray-900">{bug.issue_type}</p>
                          </div>

                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                            <p className="text-xs font-bold text-gray-900 mb-2">📝 Description:</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{bug.description}</p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                              <p className="text-xs font-bold text-purple-900">Reporter:</p>
                              <p className="text-sm text-gray-900">{bug.name}</p>
                              <p className="text-xs text-gray-600">{bug.email}</p>
                            </div>
                            {bug.browser && (
                              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                                <p className="text-xs font-bold text-indigo-900">Browser:</p>
                                <p className="text-sm text-gray-900">{bug.browser}</p>
                              </div>
                            )}
                            {bug.device_type && (
                              <div className="bg-teal-50 border border-teal-200 rounded-lg p-2">
                                <p className="text-xs font-bold text-teal-900">Device:</p>
                                <p className="text-sm text-gray-900">{bug.device_type}</p>
                              </div>
                            )}
                            {bug.resolved_at && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                <p className="text-xs font-bold text-green-900">Resolved:</p>
                                <p className="text-xs text-gray-700">{formatETDate(bug.resolved_at)}</p>
                              </div>
                            )}
                          </div>

                          {bug.moderator_notes && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                              <p className="text-xs font-bold text-amber-900 mb-1">💬 Moderator Notes:</p>
                              <p className="text-sm text-gray-800">{bug.moderator_notes}</p>
                              {bug.moderator_name && (
                                <p className="text-xs text-gray-600 mt-1">Action taken by: {bug.moderator_name}</p>
                              )}
                            </div>
                          )}

                          {bug.email_sent && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-xs font-bold text-green-900 mb-1">📧 Email Notification:</p>
                              <p className="text-sm text-gray-800 mb-2">Sent to reporter on {formatETDateTime(bug.email_sent)}</p>
                              {bug.email_message && (
                                <div className="bg-white border border-green-200 rounded p-2 mt-2">
                                  <p className="text-xs font-bold text-gray-700 mb-1">Message sent:</p>
                                  <p className="text-xs text-gray-800 whitespace-pre-wrap">{bug.email_message}</p>
                                  {bug.moderator_name && (
                                    <p className="text-xs text-gray-600 mt-2">
                                      Sent by: {bug.moderator_name}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedBugReport(bug)}
                          className="ml-4 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}

              {/* Resolved Bug Reports Tab */}
              {activeTab === "resolved-bugs" && (
                bugReports.filter(b => b.status === 'RESOLVED').length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No resolved bug reports</h3>
                    <p className="text-gray-600">Resolved bug reports will appear here.</p>
                  </div>
                ) : (
                  bugReports.filter(b => b.status === 'RESOLVED').map((bug) => (
                    <div key={bug.report_id} className="p-6 hover:bg-gray-50 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              {bug.status}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              bug.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              bug.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              bug.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {bug.priority} Priority
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{bug.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Reported: {formatETDateTime(bug.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-bold text-gray-700 mb-1">📋 Issue Type:</p>
                        <p className="text-sm text-gray-900 mb-3">{bug.issue_type}</p>
                        
                        <p className="text-xs font-bold text-gray-700 mb-1">📝 Description:</p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{bug.description}</p>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-bold text-blue-900 mb-2">Reporter:</p>
                        <p className="text-sm text-gray-900 font-medium">{bug.name}</p>
                        <p className="text-sm text-gray-600">{bug.email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {bug.browser && (
                          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                            <p className="text-xs font-bold text-indigo-900">Browser:</p>
                            <p className="text-sm text-gray-900">{bug.browser}</p>
                          </div>
                        )}
                        {bug.device_type && (
                          <div className="bg-teal-50 border border-teal-200 rounded-lg p-2">
                            <p className="text-xs font-bold text-teal-900">Device:</p>
                            <p className="text-sm text-gray-900">{bug.device_type}</p>
                          </div>
                        )}
                        {bug.resolved_at && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                            <p className="text-xs font-bold text-green-900">Resolved:</p>
                            <p className="text-xs text-gray-700">{formatETDate(bug.resolved_at)}</p>
                          </div>
                        )}
                      </div>

                      {bug.moderator_notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                          <p className="text-xs font-bold text-amber-900 mb-1">💬 Moderator Notes:</p>
                          <p className="text-sm text-gray-800">{bug.moderator_notes}</p>
                          {bug.moderator_name && (
                            <p className="text-xs text-gray-600 mt-1">Action taken by: {bug.moderator_name}</p>
                          )}
                        </div>
                      )}

                      {bug.email_sent && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs font-bold text-green-900 mb-1">📧 Email Notification:</p>
                          <p className="text-sm text-gray-800 mb-2">Sent to reporter on {formatETDateTime(bug.email_sent)}</p>
                          {bug.email_message && (
                            <div className="bg-white border border-green-200 rounded p-2 mt-2">
                              <p className="text-xs font-bold text-gray-700 mb-1">Message sent:</p>
                              <p className="text-xs text-gray-800 whitespace-pre-wrap">{bug.email_message}</p>
                              {bug.moderator_name && (
                                <p className="text-xs text-gray-600 mt-2">
                                  Sent by: {bug.moderator_name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Moderate Report #{selectedReport.report_id}</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2"><strong>Category:</strong> {selectedReport.category}</p>
              <p className="text-sm text-gray-600 mb-2"><strong>Reason:</strong> {selectedReport.reason}</p>
              <p className="text-sm text-gray-600"><strong>Reported Item:</strong> {selectedReport.found_item_title || selectedReport.lost_item_title}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Action *
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
              >
                <option value="">-- Select Action --</option>
                <option value="delete_post">Delete Post</option>
                <option value="warn_user">Warn User</option>
                <option value="suspend_user">Suspend User (30 days)</option>
                <option value="delete_account">Delete User Account</option>
                <option value="dismiss">Dismiss Report (No Action)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Action * (User will receive this via email)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
                placeholder="Explain why this action is being taken..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleModeratorAction}
                disabled={processing || !actionType || !actionReason.trim()}
                className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Execute Action'}
              </button>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setActionType("");
                  setActionReason("");
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bug Report Update Modal */}
      {selectedBugReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Update Bug Report #{selectedBugReport.report_id}</h2>

            <div className="mb-4 bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2"><strong>Title:</strong> {selectedBugReport.title}</p>
              <p className="text-sm text-gray-600 mb-2"><strong>Issue Type:</strong> {selectedBugReport.issue_type}</p>
              <p className="text-sm text-gray-600 mb-2"><strong>Current Status:</strong> {selectedBugReport.status}</p>
              <p className="text-sm text-gray-600"><strong>Reporter:</strong> {selectedBugReport.name} ({selectedBugReport.email})</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Status *
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
              >
                <option value="">-- Select Status --</option>
                <option value="OPEN">🔴 Open</option>
                <option value="IN_PROGRESS">🟡 In Progress</option>
                <option value="RESOLVED">🟢 Resolved</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes *
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
                placeholder="Add notes about this bug report..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="mb-6 border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📧 Email Message to Reporter *
              </label>
              <div className="mb-3 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="mb-1 font-medium text-blue-900">Email will be sent automatically and will include:</p>
                <p>• Greeting: "Dear {selectedBugReport.name},"</p>
                <p>• Thank you message and bug report details</p>
                <p>• Your custom message (below)</p>
                <p>• Contact instructions and signature</p>
              </div>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={4}
                placeholder="Enter your message to the reporter here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!actionType || !actionReason.trim()) {
                    alert('Please select a status and add notes');
                    return;
                  }
                  if (!emailMessage.trim()) {
                    alert('Please enter an email message for the reporter');
                    return;
                  }
                  
                  // Update status first
                  const updateResult = await handleBugReportUpdate(selectedBugReport.report_id, actionType, actionReason);
                  
                  if (!updateResult.success) {
                    alert(updateResult.error);
                    return;
                  }
                  
                  // Send email (mandatory)
                  const emailResult = await handleSendBugReportEmail();
                  
                  if (!emailResult.success) {
                    alert('Bug report updated but email failed to send: ' + emailResult.error);
                  } else {
                    alert('Bug report updated and email sent successfully!');
                  }
                  
                  // Close modal and reload
                  setSelectedBugReport(null);
                  setActionType("");
                  setActionReason("");
                  setEmailMessage("");
                  loadBugReports();
                }}
                disabled={!actionType || !actionReason.trim() || !emailMessage.trim()}
                className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update & Send Email
              </button>
              <button
                onClick={() => {
                  setSelectedBugReport(null);
                  setActionType("");
                  setActionReason("");
                  setEmailMessage("");
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </Protected>
  );
}
