"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

export default function ContactRequests() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    fetchContactRequests(user.id);
  }, [router]);

  const fetchContactRequests = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/contact-requests/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setIncomingRequests(data.incoming || []);
        setOutgoingRequests(data.outgoing || []);
      }
    } catch (error) {
      console.error('Error fetching contact requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, requesterId) => {
    setProcessingRequest(prev => ({ ...prev, [requestId]: 'approving' }));

    try {
      const response = await fetch(`http://localhost:5000/api/contact-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          requester_id: requesterId
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Contact request approved!\n\nYour email: ${data.your_email}\nTheir email: ${data.requester_email}`);
        fetchContactRequests(currentUser.id);
      } else {
        alert(`❌ ${data.message || 'Failed to approve request'}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('❌ Failed to approve request. Please try again.');
    } finally {
      setProcessingRequest(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const handleReject = async (requestId) => {
    setProcessingRequest(prev => ({ ...prev, [requestId]: 'rejecting' }));

    try {
      const response = await fetch(`http://localhost:5000/api/contact-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: currentUser.id
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Contact request rejected');
        fetchContactRequests(currentUser.id);
      } else {
        alert(`❌ ${data.message || 'Failed to reject request'}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('❌ Failed to reject request. Please try again.');
    } finally {
      setProcessingRequest(prev => ({ ...prev, [requestId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Contact Requests</h1>
            <p className="text-gray-600 mt-2">Manage your contact requests</p>
          </div>

          {/* Incoming Requests */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                📥 Incoming Requests
              </h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {incomingRequests.filter(r => r.status === 'pending').length} Pending
              </span>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-600">No incoming contact requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {request.profile_image ? (
                          <img
                            src={`http://localhost:5000/api/uploads/profiles/${request.profile_image}`}
                            alt={request.requester_name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl">
                            👤
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.requester_name}
                          </h3>
                          {request.major && (
                            <p className="text-sm text-gray-600">
                              🎓 {request.major}
                            </p>
                          )}
                          {request.year_of_study && (
                            <p className="text-sm text-gray-600">
                              📅 {request.year_of_study}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Requested: {new Date(request.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="ml-4">
                        {request.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(request.id, request.requester_id)}
                              disabled={processingRequest[request.id]}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                            >
                              {processingRequest[request.id] === 'approving' ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Approving...</span>
                                </>
                              ) : (
                                <>
                                  <span>✓</span>
                                  <span>Approve</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              disabled={processingRequest[request.id]}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                            >
                              {processingRequest[request.id] === 'rejecting' ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Rejecting...</span>
                                </>
                              ) : (
                                <>
                                  <span>✕</span>
                                  <span>Reject</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className={`px-4 py-2 rounded-lg font-medium ${
                            request.status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                📤 Outgoing Requests
              </h2>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                {outgoingRequests.filter(r => r.status === 'pending').length} Pending
              </span>
            </div>

            {outgoingRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="text-4xl mb-2">📤</div>
                <p className="text-gray-600">No outgoing contact requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {outgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {request.profile_image ? (
                          <img
                            src={`http://localhost:5000/api/uploads/profiles/${request.profile_image}`}
                            alt={request.target_user_name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl">
                            👤
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.target_user_name}
                          </h3>
                          {request.major && (
                            <p className="text-sm text-gray-600">
                              🎓 {request.major}
                            </p>
                          )}
                          {request.year_of_study && (
                            <p className="text-sm text-gray-600">
                              📅 {request.year_of_study}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Requested: {new Date(request.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {request.responded_at && (
                            <p className="text-xs text-gray-500">
                              Responded: {new Date(request.responded_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className={`px-4 py-2 rounded-lg font-medium ${
                          request.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'pending' ? '⏳ Pending' 
                            : request.status === 'approved' ? '✓ Approved' 
                            : '✕ Rejected'}
                        </span>
                      </div>
                    </div>

                    {request.status === 'approved' && request.target_user_email && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">📧 Email:</span>{' '}
                          <a href={`mailto:${request.target_user_email}`} className="text-blue-600 hover:underline">
                            {request.target_user_email}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
