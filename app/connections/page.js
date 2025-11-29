"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

// Component to show successful returns stats for a user
function SuccessfulReturnsStats({ userId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/public-profile/${userId}`);
      const result = await response.json();
      
      if (result.success) {
        setStats(result.profile);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs font-medium text-gray-500 mb-2">🎉 SUCCESSFUL RETURNS</div>
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="text-xs font-medium text-gray-500 mb-2">✅ SUCCESSFUL RETURNS</div>
      <div className="bg-green-50 rounded-lg px-3 py-2 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.successful_returns || 0}</div>
        <div className="text-xs text-gray-600">Items Returned to Owners</div>
      </div>
    </div>
  );
}

export default function Connections() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingConnection, setProcessingConnection] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    fetchConnections(user.id);
  }, [router]);

  const fetchConnections = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/connections/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setPendingRequests(data.pending || []);
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connectionId) => {
    setProcessingConnection(prev => ({ ...prev, [connectionId]: 'accepting' }));

    try {
      const response = await fetch(`http://localhost:5000/api/connections/${connectionId}/accept`, {
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
        alert(`✅ You are now connected as friends!`);
        fetchConnections(currentUser.id);
      } else {
        alert(`❌ ${data.message || 'Failed to accept connection'}`);
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert('❌ Failed to accept connection. Please try again.');
    } finally {
      setProcessingConnection(prev => ({ ...prev, [connectionId]: null }));
    }
  };

  const handleReject = async (connectionId) => {
    setProcessingConnection(prev => ({ ...prev, [connectionId]: 'rejecting' }));

    try {
      const response = await fetch(`http://localhost:5000/api/connections/${connectionId}/reject`, {
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
        alert('Connection request declined');
        fetchConnections(currentUser.id);
      } else {
        alert(`❌ ${data.message || 'Failed to decline connection'}`);
      }
    } catch (error) {
      console.error('Error declining connection:', error);
      alert('❌ Failed to decline connection. Please try again.');
    } finally {
      setProcessingConnection(prev => ({ ...prev, [connectionId]: null }));
    }
  };

  const handleRemoveFriend = async (connectionId, friendName) => {
    if (!confirm(`Remove ${friendName} from your connections?`)) {
      return;
    }

    setProcessingConnection(prev => ({ ...prev, [connectionId]: 'removing' }));

    try {
      const response = await fetch(`http://localhost:5000/api/connections/${connectionId}/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: currentUser.id
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Connection removed');
        fetchConnections(currentUser.id);
      } else {
        alert(`❌ ${data.message || 'Failed to remove connection'}`);
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      alert('❌ Failed to remove connection. Please try again.');
    } finally {
      setProcessingConnection(prev => ({ ...prev, [connectionId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading connections...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">👥 My Connections</h1>
            <p className="text-gray-600 mt-2">Manage your connections and friend requests</p>
          </div>

          {/* Pending Connection Requests */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                📬 Pending Requests
              </h2>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {pendingRequests.length} Pending
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-gray-600">No pending connection requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {request.profile_image ? (
                          <img
                            src={`http://localhost:5000/api/uploads/profiles/${request.profile_image}`}
                            alt={request.other_user_name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl">
                            👤
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.other_user_name}
                          </h3>
                          
                          {/* Major/Department */}
                          {request.major && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">🎓 MAJOR: </span>
                              <span className="text-sm text-gray-900">{request.major}</span>
                            </div>
                          )}
                          
                          {/* Year of Study */}
                          {request.year_of_study && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">📅 YEAR: </span>
                              <span className="text-sm text-gray-900">{request.year_of_study}</span>
                            </div>
                          )}
                          
                          {/* Program */}
                          {request.building_preference && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">📚 PROGRAM: </span>
                              <span className="text-sm text-gray-900">{request.building_preference}</span>
                            </div>
                          )}
                          
                          {/* Bio */}
                          {request.bio && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">👤 ABOUT: </span>
                              <p className="text-sm text-gray-700">{request.bio}</p>
                            </div>
                          )}
                          
                          {/* Interests */}
                          {request.interests && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">🎨 INTERESTS: </span>
                              <p className="text-sm text-gray-700">{request.interests}</p>
                            </div>
                          )}
                          
                          {/* Successful Returns Stats */}
                          <SuccessfulReturnsStats userId={request.other_user_id} />
                          
                          <p className="text-xs text-gray-500 mt-2">
                            Requested: {new Date(request.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={() => handleAccept(request.id)}
                          disabled={processingConnection[request.id]}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                        >
                          {processingConnection[request.id] === 'accepting' ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Accepting...</span>
                            </>
                          ) : (
                            <>
                              <span>✓</span>
                              <span>Accept</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={processingConnection[request.id]}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                        >
                          {processingConnection[request.id] === 'rejecting' ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Declining...</span>
                            </>
                          ) : (
                            <>
                              <span>✕</span>
                              <span>Decline</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friends/Connected */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                ✨ Connected Friends
              </h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {friends.length} Friends
              </span>
            </div>

            {friends.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="text-4xl mb-2">🤝</div>
                <p className="text-gray-600">No connections yet. Start connecting with people!</p>
                <Link 
                  href="/connect"
                  className="inline-block mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Find People to Connect
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4 flex-1">
                        {friend.profile_image ? (
                          <img
                            src={`http://localhost:5000/api/uploads/profiles/${friend.profile_image}`}
                            alt={friend.other_user_name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-2xl">
                            👤
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {friend.other_user_name}
                          </h3>
                          
                          {/* Major/Department */}
                          {friend.major && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">🎓 MAJOR: </span>
                              <span className="text-sm text-gray-900">{friend.major}</span>
                            </div>
                          )}
                          
                          {/* Year of Study */}
                          {friend.year_of_study && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">📅 YEAR: </span>
                              <span className="text-sm text-gray-900">{friend.year_of_study}</span>
                            </div>
                          )}
                          
                          {/* Program */}
                          {friend.building_preference && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">📚 PROGRAM: </span>
                              <span className="text-sm text-gray-900">{friend.building_preference}</span>
                            </div>
                          )}
                          
                          {/* Bio */}
                          {friend.bio && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">👤 ABOUT: </span>
                              <p className="text-sm text-gray-700">{friend.bio}</p>
                            </div>
                          )}
                          
                          {/* Interests */}
                          {friend.interests && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">🎨 INTERESTS: </span>
                              <p className="text-sm text-gray-700">{friend.interests}</p>
                            </div>
                          )}
                          
                          {/* Successful Returns Stats */}
                          <SuccessfulReturnsStats userId={friend.other_user_id} />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-2 mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <span className="text-green-700 font-medium text-sm">📧 Email:</span>
                        <a 
                          href={`mailto:${friend.email}`} 
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {friend.email}
                        </a>
                      </div>
                      <p className="text-xs text-gray-600 italic">
                        Connected since {new Date(friend.responded_at || friend.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Remove Friend Button */}
                    <button
                      onClick={() => handleRemoveFriend(friend.id, friend.other_user_name)}
                      disabled={processingConnection[friend.id]}
                      className="w-full bg-red-100 hover:bg-red-200 disabled:bg-gray-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {processingConnection[friend.id] === 'removing' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-700/30 border-t-red-700 rounded-full animate-spin"></div>
                          <span>Removing...</span>
                        </>
                      ) : (
                        <>
                          <span>🗑️</span>
                          <span>Remove Connection</span>
                        </>
                      )}
                    </button>
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
