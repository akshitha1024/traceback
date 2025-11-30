'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = ask email, 2 = enter code+new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const requestReset = async () => {
    setError('');
    setMessage('');
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError('Please enter your Kent State email');
      return;
    }

    if (!normalized.endsWith('@kent.edu')) {
      setError('Only Kent State (@kent.edu) email addresses are allowed');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('A verification code was sent to your email. Enter it below with your new password.');
        setStep(2);
      } else {
        setError(data.error || 'Failed to request password reset');
      }
    } catch (err) {
      console.error('requestReset error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async () => {
    setError('');
    setMessage('');
    if (!code.trim() || !newPassword) {
      setError('Code and new password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim(), new_password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password reset successful. You can now log in with your new password. Redirecting to login...');
        setTimeout(()=>router.push('/login'), 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('submitReset error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
          {message && <div className="mb-3 text-sm text-green-700">{message}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Enter your Kent State email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="you@kent.edu" />
              <div className="flex justify-between items-center">
                <button onClick={requestReset} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">{loading ? 'Sending...' : 'Send Code'}</button>
                <Link href="/login" className="text-sm text-gray-600">Back to login</Link>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Verification Code</label>
              <input value={code} onChange={e=>setCode(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Enter code from email" />

              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type={showPassword ? 'text' : 'password'} className="w-full px-3 py-2 border rounded" placeholder="New password" />
              <div className="mt-2 text-sm">
                <label className="inline-flex items-center text-gray-600">
                  <input type="checkbox" className="mr-2" checked={showPassword} onChange={(e)=>setShowPassword(e.target.checked)} />
                  Show password
                </label>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={submitReset} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">{loading ? 'Submitting...' : 'Reset Password'}</button>
                <button onClick={()=>setStep(1)} className="text-sm text-gray-600">Back</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
