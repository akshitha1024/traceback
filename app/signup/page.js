
"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Signup() {
  const nav = useRouter();
  const searchParams = useSearchParams();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!first.trim() || !last.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }
    
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    
    if (!email.toLowerCase().endsWith('@kent.edu')) {
      setError("Only kent.edu email addresses are allowed");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: first.trim(),
          last_name: last.trim(),
          email: email.trim().toLowerCase(),
          password: password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store redirect for after email verification
        const redirectTo = searchParams.get("redirect");
        if (redirectTo) {
          localStorage.setItem("postVerifyRedirect", redirectTo);
        }
        // Store email for verification page
        localStorage.setItem("pendingVerificationEmail", email.trim().toLowerCase());
        nav.push("/verify-email");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
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
        <Link 
          href={`/login${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`}
          className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Log In
        </Link>
      </header>

      {/* Signup Form */}
      <div className="flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Create Account</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white/50" 
                    value={first} 
                    onChange={e=>setFirst(e.target.value)} 
                    placeholder="First name"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white/50" 
                    value={last} 
                    onChange={e=>setLast(e.target.value)} 
                    placeholder="Last name"
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white/50" 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  placeholder="your.name@kent.edu"
                  required 
                />
                <p className="text-xs text-gray-600 mt-1">Only kent.edu email addresses are allowed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white/50" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                  placeholder="Create a password"
                  required 
                />
                <div className="mt-2 text-sm">
                  <label className="inline-flex items-center text-gray-600">
                    <input type="checkbox" className="mr-2" checked={showPassword} onChange={(e)=>setShowPassword(e.target.checked)} />
                    Show password
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white/50" 
                  value={confirm} 
                  onChange={e=>setConfirm(e.target.value)} 
                  placeholder="Confirm your password"
                  required 
                />
              </div>
              <button 
                className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating account...
                  </div>
                ) : "Create Account"}
              </button>
            </form>
            <div className="mt-6 text-center text-gray-600">
              Already have an account? {" "}
              <Link 
                href={`/login${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`} 
                className="text-gray-900 hover:text-black font-medium transition-colors"
              >
                Log in here
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
