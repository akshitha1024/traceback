"use client";


import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';

export default function VerifyOwnershipPage() {
  const params = useParams();
  const router = useRouter();
  const foundItemId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [itemTitle, setItemTitle] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [finderDetails, setFinderDetails] = useState(null);
  const [finderProfile, setFinderProfile] = useState(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [attemptInfo, setAttemptInfo] = useState(null);

  useEffect(() => {
    checkPreviousAttempt();
    fetchSecurityQuestions();
  }, [foundItemId]);

  const checkPreviousAttempt = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!currentUser.email) return;

      const response = await fetch(
        `http://localhost:5000/api/check-claim-attempt/${foundItemId}?user_email=${encodeURIComponent(currentUser.email)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.has_attempted) {
          setHasAttempted(true);
          setAttemptInfo(data.attempt);
        }
      }
    } catch (error) {
      console.error('Error checking previous attempt:', error);
    }
  };

  const fetchFinderProfile = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setFinderProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching finder profile:', error);
    }
  };

  const fetchSecurityQuestions = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Pass user email to check privacy period access
      const url = currentUser.email 
        ? `http://localhost:5000/api/security-questions/${foundItemId}?user_email=${encodeURIComponent(currentUser.email)}`
        : `http://localhost:5000/api/security-questions/${foundItemId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.privacy_restricted) {
          throw new Error('This item is in the 3-day private period. Only users with matching lost items (≥80% match) can claim it during this time. The item will be publicly accessible after 3 days.');
        }
        throw new Error(errorData.error || 'Failed to fetch security questions');
      }
      
      const data = await response.json();
      
      // Check if user is trying to claim their own item
      if (currentUser.email && data.item?.finder_email && 
          currentUser.email.toLowerCase() === data.item.finder_email.toLowerCase()) {
        setError('You cannot claim your own found item.');
        setLoading(false);
        return;
      }
      
      setQuestions(data.questions || []);
      setItemTitle(data.item?.title || 'Unknown Item');
      setError(null);
    } catch (err) {
      console.error('Error fetching security questions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, choice) => {
    setAnswers({
      ...answers,
      [questionId]: choice
    });
  };

  const handleTextAnswerChange = (questionId, text) => {
    setAnswers({
      ...answers,
      [questionId]: text
    });
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!answers[currentQuestion.id]) {
      alert('Please select an answer before continuing.');
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Check all questions are answered
    for (const question of questions) {
      if (!answers[question.id]) {
        alert('Please answer all questions before submitting.');
        return;
      }
    }

    try {
      setVerifying(true);
      
      // Get current user info
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Submit answers to backend - NO VALIDATION ON FRONTEND
      const response = await fetch('http://localhost:5000/api/submit-claim-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          found_item_id: parseInt(foundItemId),
          answers: answers,
          claimer_user_id: currentUser.id || null,
          claimer_name: currentUser.name || 'Unknown',
          claimer_email: currentUser.email || '',
          claimer_phone: currentUser.phone || ''
        })
      });

      const data = await response.json();

      // Check if user has already attempted (403 response)
      if (response.status === 403 && data.already_attempted) {
        setHasAttempted(true);
        setAttemptInfo({
          attempted_at: data.attempted_at,
          success: false,
          message: data.error
        });
        return;
      }

      if (response.ok) {
        // Show thank you message - answers sent to finder
        setVerificationResult({
          submitted: true,
          message: data.message,
          finderEmail: data.finder_email
        });
      } else {
        setVerificationResult({
          submitted: false,
          error: true,
          message: data.error || 'Failed to submit answers.'
        });
      }
    } catch (err) {
      console.error('Submission error:', err);
      setVerificationResult({
        submitted: false,
        error: true,
        message: 'Failed to submit answers. Please try again.'
      });
    } finally {
      setVerifying(false);
    }
  };

  // Show if user already attempted
  if (hasAttempted && attemptInfo) {
    return (
      <Protected>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/found"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Found Items
            </Link>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <AlertTriangle className="w-20 h-20 text-blue-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Already Attempted</h2>
              <p className="text-lg text-gray-600 mb-6">
                You submitted your answers on{' '}
                <strong>{new Date(attemptInfo.attempted_at).toLocaleDateString()}</strong>.
              </p>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-blue-900 text-lg mb-2">One Attempt Only</h3>
                <p className="text-blue-800 text-base">
                  You can only answer the security questions once per item.
                </p>
              </div>

              <div className="flex gap-4">
                <Link
                  href="/found"
                  className="flex-1 bg-gray-900 hover:bg-black text-white text-center py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Back to Found Items
                </Link>
                <Link
                  href="/dashboard"
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 text-center py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Protected>
    );
  }

  if (loading) {
    return (
      <Protected>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading security questions...</p>
            </div>
          </div>
        </div>
      </Protected>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <Protected>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Unavailable</h2>
              <p className="text-gray-600 mb-6">
                {error || 'This item doesn\'t have security questions set up.'}
              </p>
              <Link
                href="/found"
                className="inline-block bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Back to Found Items
              </Link>
            </div>
          </div>
        </div>
      </Protected>
    );
  }

  // Show submission result
  if (verificationResult) {
    if (verificationResult.submitted) {
      return (
        <Protected>
          <Navbar />
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Thank You! 🙏</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Your answers have been submitted successfully.
                </p>
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6 text-left">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    What Happens Next?
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">1.</span>
                      <span>Your answers have been sent to the person who found and posted this item</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">2.</span>
                      <span>They will review your answers to verify if this is truly your item</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">3.</span>
                      <span>They will contact you if they need supporting information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">4.</span>
                      <span>You can check status on my claim requests</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-800">
                    <strong>⚠️ Note:</strong> This was your one attempt. You cannot submit answers again for this item.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Link
                    href="/dashboard"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/found"
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 text-center py-3 rounded-lg font-medium transition-all duration-200"
                  >
                    Browse Found Items
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Protected>
      );
    } else if (verificationResult.error) {
      return (
        <Protected>
          <Navbar />
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Submission Failed</h2>
                <p className="text-lg text-red-600 mb-4">{verificationResult.message}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800">
                    There was an error submitting your answers. Please try again or contact support.
                  </p>
                </div>
                <Link
                  href="/found"
                  className="inline-block bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Back to Found Items
                </Link>
              </div>
            </div>
          </div>
        </Protected>
      );
    }
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allQuestionsAnswered = questions.every(q => answers[q.id]);

  return (
    <Protected>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/found"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Found Items
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Claim Your Item</h1>
            <p className="text-gray-600">Answer security questions set by the finder to prove ownership and claim this item</p>
          </div>

          {/* Item Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Item to Claim:</strong> {itemTitle}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              The finder set these security questions to prevent false claims. Answer them correctly to claim your item.
            </p>
          </div>

          {/* One-Attempt Warning */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-blue-900 mb-1">ℹ️ Important: One Attempt Only</h3>
                <p className="text-sm text-blue-800">
                  You can submit your answers <strong>once</strong>. Your responses will be sent to the finder for review.
                </p>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gray-900 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentQuestion.question}</h2>
              
              {/* Text Answer Input */}
              {currentQuestion.question_type === 'text' ? (
                <div>
                  <input
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleTextAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here"
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:outline-none transition-colors"
                  />
                </div>
              ) : (
                /* Multiple Choice Options */
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map((choice) => {
                    const choiceKey = `choice_${choice.toLowerCase()}`;
                    const choiceText = currentQuestion[choiceKey];
                    
                    if (!choiceText) return null;

                    const isSelected = answers[currentQuestion.id] === choice;

                    return (
                      <button
                        key={choice}
                        onClick={() => handleAnswerSelect(currentQuestion.id, choice)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                            : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            isSelected
                              ? 'bg-white text-gray-900'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {choice}
                          </div>
                          <span className="flex-1 font-medium">{choiceText}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              {currentQuestionIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-white/90 hover:bg-white text-gray-900 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              {!isLastQuestion ? (
                <button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                  className="flex-1 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next Question
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!allQuestionsAnswered || verifying}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit Answers
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Protected>
  );
}
