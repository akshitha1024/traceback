import { useState, useEffect } from 'react';

export default function SecurityVerification({ foundItem, onSuccess, onCancel }) {
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [securityQuestions, setSecurityQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const maxAttempts = 3;

  // Fetch security questions when component mounts
  useEffect(() => {
    const fetchSecurityQuestions = async () => {
      if (!foundItem || !foundItem.id) {
        setError('No item ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/security-questions/${foundItem.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch security questions');
        }
        
        const data = await response.json();
        setSecurityQuestions(data.questions || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching security questions:', err);
        setError('Failed to load security questions');
        setLoading(false);
      }
    };

    fetchSecurityQuestions();
  }, [foundItem]);

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Security Questions</h3>
            <p className="text-gray-600">Please wait while we prepare the verification...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !securityQuestions || securityQuestions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Verification Unavailable</h3>
            <p className="text-red-600 mb-4">{error || 'This item doesn\'t have security questions set up.'}</p>
            <button
              onClick={onCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = securityQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === securityQuestions.length - 1;

  const handleAnswerChange = (value) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: value
    });
  };

  const normalizeAnswer = (answer) => {
    return answer.toString().toLowerCase().trim();
  };

  const checkAnswer = () => {
    if (!currentQuestion || !currentQuestion.answer) return false;
    
    const userAnswer = normalizeAnswer(answers[currentQuestionIndex] || '');
    const correctAnswer = normalizeAnswer(currentQuestion.answer);
    
    return userAnswer === correctAnswer;
  };

  const handleNext = () => {
    if (!answers[currentQuestionIndex]) {
      alert('Please provide an answer before continuing.');
      return;
    }

    if (isLastQuestion) {
      // Check all answers
      let correctAnswers = 0;
      securityQuestions.forEach((question, index) => {
        if (question && question.answer) {
          const userAnswer = normalizeAnswer(answers[index] || '');
          const correctAnswer = normalizeAnswer(question.answer);
          if (userAnswer === correctAnswer) {
            correctAnswers++;
          }
        }
      });

      const requiredCorrect = Math.ceil(securityQuestions.length * 0.67); // Need 67% correct
      const passed = correctAnswers >= requiredCorrect;

      setIsVerified(passed);
      setShowResult(true);

      if (passed) {
        setTimeout(() => {
          onSuccess({
            name: foundItem.reportedBy,
            email: foundItem.reportedByEmail,
            phone: foundItem.reportedByPhone,
            location: foundItem.location,
            date: foundItem.date,
            description: foundItem.description
          });
        }, 2000);
      } else {
        setAttempts(attempts + 1);
        setTimeout(() => {
          if (attempts + 1 >= maxAttempts) {
            onCancel();
          } else {
            setShowResult(false);
            setCurrentQuestionIndex(0);
            setAnswers({});
          }
        }, 3000);
      }
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (showResult) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {isVerified ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Verification Successful!</h3>
                <p className="text-green-600">You've proven ownership of this item. Redirecting to founder details...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-800 mb-2">Verification Failed</h3>
                <p className="text-red-600 mb-2">You didn't answer enough questions correctly.</p>
                {attempts + 1 < maxAttempts ? (
                  <p className="text-gray-600 text-sm">
                    You have {maxAttempts - (attempts + 1)} attempt{maxAttempts - (attempts + 1) !== 1 ? 's' : ''} remaining.
                  </p>
                ) : (
                  <p className="text-gray-600 text-sm">
                    No more attempts remaining. Contact campus security if this is your item.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Verify Ownership</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {securityQuestions.length}
            </span>
            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
              Attempts: {attempts + 1}/{maxAttempts}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / securityQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">{currentQuestion?.question || 'Loading question...'}</h4>
          
          {currentQuestion?.question_type === 'multiple_choice' ? (
            <div className="space-y-2">
              {currentQuestion.choice_a && (
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value="A"
                    checked={answers[currentQuestionIndex] === 'A'}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="mr-3"
                  />
                  <span>A. {currentQuestion.choice_a}</span>
                </label>
              )}
              {currentQuestion.choice_b && (
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value="B"
                    checked={answers[currentQuestionIndex] === 'B'}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="mr-3"
                  />
                  <span>B. {currentQuestion.choice_b}</span>
                </label>
              )}
              {currentQuestion.choice_c && (
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value="C"
                    checked={answers[currentQuestionIndex] === 'C'}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="mr-3"
                  />
                  <span>C. {currentQuestion.choice_c}</span>
                </label>
              )}
              {currentQuestion.choice_d && (
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value="D"
                    checked={answers[currentQuestionIndex] === 'D'}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="mr-3"
                  />
                  <span>D. {currentQuestion.choice_d}</span>
                </label>
              )}
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type your answer here..."
              />
              <p className="text-xs text-gray-500 mt-1">Answer is case-insensitive</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {currentQuestionIndex > 0 && (
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            {isLastQuestion ? 'Verify Ownership' : 'Next Question'}
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Answer questions about your item to prove ownership and get founder contact details.
        </div>
      </div>
    </div>
  );
}