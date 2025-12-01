"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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

export default function ConnectWithPeople() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [requestingContact, setRequestingContact] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/connect');
      const data = await response.json();
      
      console.log('Users API response:', data);
      
      if (data.success) {
        setUsers(data.users || []);
        console.log('Loaded users:', data.users?.length);
      } else {
        console.error('API returned success: false', data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    // Don't show current user
    if (currentUser && user.id === currentUser.id) return false;

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.major?.toLowerCase().includes(searchLower) ||
      user.bio?.toLowerCase().includes(searchLower);

    // Program filter
    const matchesProgram = filterProgram === "all" || user.building_preference === filterProgram;

    // Department filter
    const matchesDepartment = filterDepartment === "all" || user.major === filterDepartment;

    return matchesSearch && matchesProgram && matchesDepartment;
  });

  // Get unique programs and departments for filters
  const programs = [...new Set(users.map(u => u.building_preference).filter(Boolean))];
  const departments = [...new Set(users.map(u => u.major).filter(Boolean))];

  const handleContactRequest = async (user) => {
    if (!currentUser) {
      alert('Please log in to send a connection request');
      return;
    }

    setRequestingContact(prev => ({ ...prev, [user.id]: true }));

    try {
      const response = await fetch('http://localhost:5000/api/contact-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requester_id: currentUser.id,
          requester_name: currentUser.name || `${currentUser.first_name} ${currentUser.last_name}`,
          requester_email: currentUser.email,
          target_user_id: user.id,
          target_user_name: user.full_name
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Connection request sent to ${user.full_name}!\n\nThey will receive a notification and can accept or decline your request. Once accepted, you'll be able to see each other's contact information.`);
      } else {
        alert(`❌ ${data.message || 'Failed to send connection request. Please try again.'}`);
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('❌ Failed to send connection request. Please check your connection and try again.');
    } finally {
      setRequestingContact(prev => ({ ...prev, [user.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header - match dashboard style */}
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/logo.png"
                alt="TraceBack Logo"
                width={320}
                height={100}
                className="h-20 w-auto sm:h-24"
              />
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤝 Connect with People
          </h1>
          <p className="text-gray-600">
            Find and connect with other students and staff members
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Search
              </label>
              <input
                type="text"
                placeholder="Search by name, major, or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Program Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📚 Program
              </label>
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Programs</option>
                {programs.map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎓 Department/Major
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'}
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                  <div className="flex items-center space-x-3">
                    {user.profile_image ? (
                      <img
                        src={`http://localhost:5000/api/uploads/profiles/${user.profile_image}`}
                        alt={user.full_name}
                        className="w-12 h-12 rounded-full border-2 border-white object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-white bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
                        👤
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold truncate">{user.full_name || 'Anonymous'}</h3>
                      {user.year_of_study && (
                        <p className="text-white/90 text-xs">{user.year_of_study}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Content */}
                <div className="p-4 space-y-3 flex-1">
                  {/* Major/Department */}
                  {user.major && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">🎓 MAJOR</div>
                      <div className="text-gray-900 text-sm font-medium truncate">{user.major}</div>
                    </div>
                  )}

                  {/* Program */}
                  {user.building_preference && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">📚 PROGRAM</div>
                      <div className="text-gray-900 text-sm">{user.building_preference}</div>
                    </div>
                  )}

                  {/* Bio */}
                  {user.bio && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">👤 ABOUT</div>
                      <p className="text-gray-700 text-xs">{user.bio}</p>
                    </div>
                  )}

                  {/* Interests */}
                  {user.interests && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">🎨 INTERESTS</div>
                      <p className="text-gray-700 text-xs">{user.interests}</p>
                    </div>
                  )}

                  {/* Show member badge if no other info */}
                  {!user.bio && !user.interests && !user.major && (
                    <div className="text-center py-2">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                        ✨ Community Member
                      </span>
                    </div>
                  )}

                  {/* Successful Returns Stats */}
                  <SuccessfulReturnsStats userId={user.id} />
                </div>

                {/* Connect Button */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleContactRequest(user)}
                    disabled={requestingContact[user.id]}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {requestingContact[user.id] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span>🤝</span>
                        <span>Connect</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Privacy Notice */}
                <div className="px-4 pb-3">
                  <p className="text-xs text-gray-500 italic text-center">
                    Once they accept, you'll both see each other's contact email
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Debug Info - Remove in production */}
        {!loading && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            Total users loaded: {users.length} | Filtered: {filteredUsers.length}
          </div>
        )}
      </div>
    </div>
  );
}
