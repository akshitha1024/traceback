"use client";



import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function ProfileView() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    fetchProfile(user.id);
    fetchStats(user.email);
  }, [router]);

  const fetchProfile = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/profile/${userId}`);
      const result = await response.json();
      
      if (result.success) {
        setProfile(result.profile);
      } else {
        // If no profile found, show basic user info
        setProfile(currentUser);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
      // Fallback to localStorage data
      const fallbackProfile = JSON.parse(localStorage.getItem('studentProfile') || 'null');
      if (fallbackProfile) {
        setProfile(fallbackProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (email) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/successful-returns/stats?email=${encodeURIComponent(email)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('studentProfile');
    localStorage.removeItem('studentProfilePhoto');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">It looks like you haven't created a profile yet.</p>
            <Link 
              href="/profile/create"
              className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
            >
              Create Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 lg:px-12 bg-white/80 backdrop-blur-sm shadow-sm">
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
          <Image 
            src="/logo.png" 
            alt="Traceback Logo" 
            width={200} 
            height={60}
            className="h-12 w-auto sm:h-16"
          />
        </Link>
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard"
            className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-100 hover:bg-red-200 text-red-900 px-4 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-4xl">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-gray-800 to-black px-8 py-12 text-white relative">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                
                {/* Profile Photo */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center">
                    {profile.profile_image_url || localStorage.getItem('studentProfilePhoto') ? (
                      <img 
                        src={profile.profile_image_url || localStorage.getItem('studentProfilePhoto')} 
                        alt="Profile photo" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white/60 text-center">
                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl font-bold mb-2">
                    {profile.full_name || `${profile.first_name || profile.firstName || ''} ${profile.last_name || profile.lastName || ''}`.trim() || 'User'}
                  </h1>
                  <p className="text-white/80 text-lg mb-4">
                    {profile.email || currentUser?.email || 'No email provided'}
                  </p>
                  
                  {/* Quick Stats */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                    {profile.year_of_study || profile.year ? (
                      <div className="bg-white/20 px-3 py-1 rounded-full">
                        📚 {profile.year_of_study || profile.year}
                      </div>
                    ) : null}
                    {profile.major || profile.department ? (
                      <div className="bg-white/20 px-3 py-1 rounded-full">
                        🎓 {profile.major || profile.department}
                      </div>
                    ) : null}
                    {profile.profile_completed && (
                      <div className="bg-green-500/20 px-3 py-1 rounded-full">
                        ✅ Profile Complete
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Button */}
                <div className="absolute top-4 right-4">
                  <Link 
                    href="/profile/edit"
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                    aria-label="Edit profile"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Profile</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Personal Information */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Personal Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-gray-900">
                        {profile.full_name || `${profile.first_name || profile.firstName || ''} ${profile.last_name || profile.lastName || ''}`.trim() || 'Not provided'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-gray-900">{profile.email || currentUser?.email || 'Not provided'}</p>
                    </div>

                    {profile.phone_number && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <p className="mt-1 text-gray-900">{profile.phone_number}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      <p className="mt-1 text-gray-900">{profile.bio || 'No bio provided'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interests/Hobbies</label>
                      <p className="mt-1 text-gray-900">{profile.interests || 'No interests listed'}</p>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Academic Information
                  </h2>
                  
                  <div className="space-y-4">
                    {(profile.major || profile.department) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Major/Department</label>
                        <p className="mt-1 text-gray-900">{profile.major || profile.department}</p>
                      </div>
                    )}

                    {(profile.year_of_study || profile.year) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                        <p className="mt-1 text-gray-900">{profile.year_of_study || profile.year}</p>
                      </div>
                    )}

                    {(profile.building_preference || profile.program) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Program/Building Preference</label>
                        <p className="mt-1 text-gray-900">{profile.building_preference || profile.program}</p>
                      </div>
                    )}

                    {profile.studentId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Student ID</label>
                        <p className="mt-1 text-gray-900">{profile.studentId}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Account Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="mt-1 text-gray-900">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Status</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${profile.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-gray-900">
                        {profile.is_verified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Returns & Claims Statistics */}
              {stats && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Returns & Claims History
                    </h2>
                    <Link 
                      href="/success-history"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                    >
                      <span>Learn More</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Successful Returns</p>
                          <p className="text-2xl font-bold text-blue-900 mt-1">{stats.successful_returns || 0}</p>
                          <p className="text-xs text-blue-600 mt-1">Items you returned</p>
                        </div>
                        <div className="text-3xl">✅</div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 font-medium">Successful Claims</p>
                          <p className="text-2xl font-bold text-green-900 mt-1">{stats.successful_claims || 0}</p>
                          <p className="text-xs text-green-600 mt-1">Items you claimed</p>
                        </div>
                        <div className="text-3xl">🎉</div>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-700 font-medium">Total Success</p>
                          <p className="text-2xl font-bold text-purple-900 mt-1">{stats.total || 0}</p>
                          <p className="text-xs text-purple-600 mt-1">Combined transactions</p>
                        </div>
                        <div className="text-3xl">🏆</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Communication Preferences */}
              {profile.privacy_settings && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Communication Preferences
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.notification_preferences && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notifications</label>
                        <p className="mt-1 text-gray-900 capitalize">{profile.notification_preferences}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
                <Link 
                  href="/dashboard"
                  className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium transition-all duration-200 text-center"
                >
                  Back to Dashboard
                </Link>

                <Link 
                  href="/report"
                  className="flex-1 md:flex-none bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 text-center"
                >
                  Report Item
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
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
    </div>
  );
}