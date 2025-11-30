'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Eye, User } from 'lucide-react';

export default function ClaimAttemptsPage() {
  const params = useParams();
  const router = useRouter();
  const foundItemId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [itemTitle, setItemTitle] = useState('');

  useEffect(() => {
    loadClaimAttempts();
  }, [foundItemId]);

  const loadClaimAttempts = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!currentUser.email) {
        setError('Please log in to view claim attempts');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/claim-attempts/${foundItemId}?finder_email=${encodeURIComponent(currentUser.email)}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load claim attempts');
      }

      const data = await response.json();
      setAttempts(data.attempts || []);
      
      // Get item title from first attempt or fetch separately
      if (data.attempts && data.attempts.length > 0) {
        // You might want to add item_title to the API response
        setItemTitle(`Found Item #${foundItemId}`);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading claim attempts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Protected>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading claim attempts...</p>
            </div>
          </div>
        </div>
      </Protected>
    );
  }

  if (error) {
    return (
      <Protected>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                href="/dashboard"
                className="inline-block bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Claim Attempts</h1>
            <p className="text-gray-600">View all verification attempts for {itemTitle}</p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Eye className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-blue-900 mb-1">Privacy Notice</h3>
                <p className="text-sm text-blue-800">
                  You can see these attempts because you posted this found item. This information is private and only visible to you.
                  Users get only <strong>one attempt</strong> to answer your security questions.
                </p>
              </div>
            </div>
          </div>

          {/* Attempts List */}
          {attempts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Attempts Yet</h2>
              <p className="text-gray-600">No one has attempted to claim this item yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {attempts.map((attempt, index) => {
                const correctAnswers = attempt.answers_with_questions?.filter(a => a.is_correct).length || 0;
                const totalQuestions = attempt.answers_with_questions?.length || 0;
                const successRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
                const isPassing = successRate >= 67;

                return (
                  <div 
                    key={attempt.attempt_id} 
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                  >
                    {/* Attempt Header */}
                    <div className={`p-6 ${attempt.success ? 'bg-green-50 border-b-2 border-green-200' : 'bg-red-50 border-b-2 border-red-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${attempt.success ? 'bg-green-600' : 'bg-red-600'}`}>
                            {attempt.success ? (
                              <CheckCircle className="w-7 h-7 text-white" />
                            ) : (
                              <XCircle className="w-7 h-7 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {attempt.user_name || 'Unknown User'}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                attempt.success 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-red-600 text-white'
                              }`}>
                                {attempt.success ? '✓ Verified' : '✗ Failed'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              <strong>Email:</strong> {attempt.user_email}
                            </p>
                            {attempt.phone_number && (
                              <p className="text-sm text-gray-600">
                                <strong>Phone:</strong> {attempt.phone_number}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Attempted: {new Date(attempt.attempted_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                            {successRate}%
                          </div>
                          <p className="text-sm text-gray-600">
                            {correctAnswers}/{totalQuestions} correct
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Answers Detail */}
                    <div className="p-6">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Security Question Answers
                      </h4>
                      
                      {attempt.answers_with_questions && attempt.answers_with_questions.length > 0 ? (
                        <div className="space-y-4">
                          {attempt.answers_with_questions.map((qa, qIndex) => (
                            <div 
                              key={qIndex}
                              className={`border-2 rounded-lg p-4 ${
                                qa.is_correct 
                                  ? 'border-green-200 bg-green-50' 
                                  : 'border-red-200 bg-red-50'
                              }`}
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  qa.is_correct ? 'bg-green-600' : 'bg-red-600'
                                }`}>
                                  {qa.is_correct ? (
                                    <CheckCircle className="w-5 h-5 text-white" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 mb-2">{qa.question}</p>
                                  
                                  <div className="space-y-2 text-sm">
                                    <div className={`flex items-center gap-2 ${
                                      qa.is_correct ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                      <span className="font-medium">User's Answer:</span>
                                      <span className="font-bold">
                                        {qa.user_answer} - {qa.choices[qa.user_answer]}
                                      </span>
                                    </div>
                                    
                                    {!qa.is_correct && (
                                      <div className="flex items-center gap-2 text-green-700">
                                        <span className="font-medium">Correct Answer:</span>
                                        <span className="font-bold">
                                          {qa.correct_answer} - {qa.choices[qa.correct_answer]}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No answer details available</p>
                      )}
                    </div>

                    {/* Footer */}
                    {attempt.success && (
                      <div className="bg-green-50 border-t-2 border-green-200 p-4">
                        <p className="text-sm text-green-800">
                          ✅ This user successfully verified ownership and can now contact you to arrange pickup.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary Stats */}
          {attempts.length > 0 && (
            <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{attempts.length}</div>
                  <div className="text-sm text-gray-600">Total Attempts</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {attempts.filter(a => a.success).length}
                  </div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {attempts.filter(a => !a.success).length}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}
