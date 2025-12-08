"use client";


import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const nav = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting login with:', email.trim().toLowerCase());
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password
        })
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        // Store session token
        localStorage.setItem("sessionToken", data.session_token);
          // Clear explicit-logout flag so session restores normally
          try { localStorage.removeItem('loggedOutByUser'); } catch(e) {}
        // Set session expiry for 1 hour
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
        localStorage.setItem('sessionExpiresAt', String(expiresAt));
        localStorage.setItem("user", JSON.stringify(data.user));
        
        console.log('Login successful, redirecting...');
        
        // Check if profile is complete
        const profileComplete = data.user.profile_completed === true || 
                               data.user.profile_completed === 1;
        
        if (!profileComplete) {
          // Redirect to profile creation if not complete
          console.log('Profile incomplete, redirecting to /profile/create');
          nav.push("/profile/create");
        } else {
          // Redirect to dashboard or requested page
          const redirectTo = searchParams.get("redirect") || "/dashboard";
          console.log('Redirecting to:', redirectTo);
          nav.push(redirectTo);
        }
      } else {
        console.error('Login failed:', data.error);
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 lg:px-12">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image 
            src="/logo.png" 
            alt="Traceback Logo" 
            width={200} 
            height={60}
            className="h-12 w-auto sm:h-16"
          />
        </Link>
        <Link href="/signup" className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
          Sign Up
        </Link>
      </header>

      {/* Login Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Welcome Back</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white/50" 
                  type="email" 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  placeholder="Enter your email"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white/50" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                  placeholder="Enter your password"
                  required 
                />
                <div className="mt-2 text-sm">
                  <label className="inline-flex items-center text-gray-600">
                    <input type="checkbox" className="mr-2" checked={showPassword} onChange={(e)=>setShowPassword(e.target.checked)} />
                    Show password
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                {/* Remember me removed - sessions expire automatically after 1 hour */}
                <Link href="/forgot-password" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <button 
                className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Logging in...
                  </div>
                ) : "Log In"}
              </button>
            </form>
            <div className="mt-6 text-center text-gray-600">
              Don&apos;t have an account? {" "}
              <Link href="/signup" className="text-gray-900 hover:text-black font-medium transition-colors">
                Sign up here
              </Link>
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
