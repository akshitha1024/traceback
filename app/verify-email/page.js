
"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function VerifyEmail() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Get email from localStorage
    const pendingEmail = localStorage.getItem("pendingVerificationEmail");
    if (pendingEmail) {
      setEmail(pendingEmail);
    } else {
      // If no pending email, redirect to signup
      router.push("/signup");
    }
  }, [router]);

  const handleVerification = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!code.trim()) {
      setError("Verification code is required");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: code.trim()
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
                // Store session token
                localStorage.setItem("sessionToken", data.session_token);
                // Clear explicit-logout flag so session restores normally
                try { localStorage.removeItem('loggedOutByUser'); } catch(e) {}
                localStorage.setItem("user", JSON.stringify(data.user));
        
        // Clean up
        localStorage.removeItem("pendingVerificationEmail");
        
        setSuccess("Email verified successfully! Redirecting...");
        
        // Redirect after verification
        setTimeout(() => {
          // Check if profile is completed
          const profileComplete = data.user.profile_completed === true || 
                                 data.user.profile_completed === 1;
          
          if (profileComplete) {
            // Existing user with complete profile -> dashboard
            const redirectTo = localStorage.getItem("postVerifyRedirect") || "/dashboard";
            localStorage.removeItem("postVerifyRedirect");
            router.push(redirectTo);
          } else {
            // New user -> profile creation
            router.push("/profile/create");
          }
        }, 1500);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResending(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess("Verification code sent! Please check your email.");
      } else {
        setError(data.error || "Failed to resend code");
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setResending(false);
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
        <Link href="/login" className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
          Log In
        </Link>
      </header>

      {/* Verification Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
              <p className="text-gray-600 text-sm">
                We sent a 6-digit code to <br />
                <span className="font-medium text-gray-900">{email}</span>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleVerification} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input 
                  type="text"
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white/50 text-center text-2xl tracking-widest font-mono" 
                  value={code} 
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))} 
                  placeholder="000000"
                  required 
                />
                <p className="text-xs text-gray-600 mt-1">Enter the 6-digit code from your email</p>
              </div>

              <button 
                type="submit"
                className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : "Verify Email"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm mb-3">
                Didn't receive the code?
              </p>
              <button 
                onClick={handleResend}
                disabled={resending}
                className="text-gray-900 hover:text-black font-medium transition-colors disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            </div>

            <div className="mt-6 text-center text-gray-600 text-sm">
              Wrong email? {" "}
              <Link href="/signup" className="text-gray-900 hover:text-black font-medium transition-colors">
                Sign up again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
