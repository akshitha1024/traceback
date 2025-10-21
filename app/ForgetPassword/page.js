"use client";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // Step 1: email, Step 2: OTP + new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP
  const sendOtp = async () => {
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) return toast.error(data.message, { duration: 5000 });
      toast.success("OTP sent to your email", { duration: 5000 });
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong", { duration: 5000 });
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and reset password
  const resetPassword = async () => {
    if (!otp || !newPassword) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) return toast.error(data.message, { duration: 5000 });
      toast.success("Password reset successfully! Redirecting to login...", { duration: 5000 });
      setTimeout(() => window.location.href = "/login", 2000);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong", { duration: 5000 });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-6 py-12">
      <Toaster position="top-center" toastOptions={{ duration: 5000, style: { fontSize: '16px', fontWeight: '500' } }} />
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Forgot Password</h2>

        {step === 1 && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter your email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 mb-4 bg-white/50"
            />
            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 mb-4 bg-white/50"
            />

            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 mb-4 bg-white/50"
            />

            <button
              onClick={resetPassword}
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
