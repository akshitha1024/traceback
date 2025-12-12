// Email Verification Component for TrackeBack
// Add this to your React components

import React, { useState } from 'react';

const EmailVerification = ({ onVerified, itemTitle, itemType, itemId }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'code'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sendVerificationCode = async () => {
    if (!email.endsWith('@kent.edu')) {
      setError('Only Kent State (@kent.edu) email addresses are allowed');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          item_title: itemTitle,
          item_type: itemType,
          item_id: itemId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setStep('code');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: code.trim()
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setMessage(data.message);
        onVerified(email); // Callback to parent component
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setCode(''); // Clear previous code
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-verification bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🏫 Verify Your Kent State Email
        </h2>
        <p className="text-gray-600">
          {step === 'email' 
            ? 'Enter your @kent.edu email to receive a verification code'
            : 'Enter the 6-digit code sent to your email'
          }
        </p>
      </div>

      {step === 'email' ? (
        <div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Kent State Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              placeholder="your.name@kent.edu"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <button
            onClick={sendVerificationCode}
            disabled={loading || !email}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-2xl tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              maxLength={6}
            />
            <p className="text-sm text-gray-500 mt-1">
              Code sent to {email}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="flex space-x-2">
              <button
                onClick={resendCode}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:bg-gray-400"
              >
                Resend Code
              </button>
              <button
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                  setMessage('');
                }}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:bg-gray-400"
              >
                Change Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Help text */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>• Code expires in 15 minutes</p>
        <p>• Check your spam folder if you don't see the email</p>
        <p>• Only @kent.edu addresses are accepted</p>
      </div>
    </div>
  );
};

// Usage example in a form component:
const ReportItemForm = () => {
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const handleEmailVerified = (email) => {
    setIsEmailVerified(true);
    setVerifiedEmail(email);
  };

  return (
    <div>
      <h1>Report Lost/Found Item</h1>
      
      {!isEmailVerified ? (
        <EmailVerification 
          onVerified={handleEmailVerified}
          itemTitle="iPhone 15"
          itemType="lost"
          itemId={null}
        />
      ) : (
        <div className="text-center p-6">
          <div className="text-green-600 mb-4">
            ✅ Email verified: {verifiedEmail}
          </div>
          <p>Now you can proceed with reporting your item...</p>
          {/* Rest of your form */}
        </div>
      )}
    </div>
  );
};

export default EmailVerification;