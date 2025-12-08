"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function FoundItemQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const foundItemId = params.id;

  const [itemTitle, setItemTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // State for managing security questions
  const [questions, setQuestions] = useState([
    { question: "", question_type: "multiple_choice", choice_a: "", choice_b: "", choice_c: "", choice_d: "", correct_choice: "A", text_answer: "" },
    { question: "", question_type: "multiple_choice", choice_a: "", choice_b: "", choice_c: "", choice_d: "", correct_choice: "A", text_answer: "" }
  ]);

  const minQuestions = 2;
  const maxQuestions = 5;

  // Fetch item details to show what item we're adding questions for
  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/found-items/${foundItemId}`);
        if (response.ok) {
          const data = await response.json();
          setItemTitle(data.item?.title || data.title || "Item");
        }
      } catch (err) {
        console.error("Failed to fetch item details:", err);
        setItemTitle("Item"); // Fallback
      } finally {
        setLoading(false);
      }
    };

    if (foundItemId) {
      fetchItemDetails();
    }
  }, [foundItemId]);

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    if (questions.length < maxQuestions) {
      setQuestions([
        ...questions,
        { question: "", question_type: "multiple_choice", choice_a: "", choice_b: "", choice_c: "", choice_d: "", correct_choice: "A", text_answer: "" }
      ]);
    }
  };

  const removeQuestion = (index) => {
    if (questions.length > minQuestions) {
      const updatedQuestions = questions.filter((_, i) => i !== index);
      setQuestions(updatedQuestions);
    }
  };

  const validateQuestions = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1}: Please enter a question`);
        return false;
      }
      
      if (q.question_type === "text") {
        if (!q.text_answer || !q.text_answer.trim()) {
          setError(`Question ${i + 1}: Please provide the correct text answer`);
          return false;
        }
      } else {
        if (!q.choice_a.trim() || !q.choice_b.trim()) {
          setError(`Question ${i + 1}: Please provide at least 2 answer choices (A and B)`);
          return false;
        }
        // Verify at least 2 unique choices
        const choices = [q.choice_a, q.choice_b, q.choice_c, q.choice_d].filter(c => c && c.trim());
        if (choices.length < 2) {
          setError(`Question ${i + 1}: Please provide at least 2 different answer choices`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!validateQuestions()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("http://localhost:5000/api/security-questions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          found_item_id: foundItemId,
          questions: questions.map(q => ({
            question: q.question,
            question_type: q.question_type,
            choice_a: q.question_type === "multiple_choice" ? (q.choice_a || null) : null,
            choice_b: q.question_type === "multiple_choice" ? (q.choice_b || null) : null,
            choice_c: q.question_type === "multiple_choice" ? (q.choice_c || null) : null,
            choice_d: q.question_type === "multiple_choice" ? (q.choice_d || null) : null,
            correct_choice: q.question_type === "multiple_choice" ? q.correct_choice : null,
            text_answer: q.question_type === "text" ? q.text_answer : null
          }))
        }),
      });

      if (response.ok) {
        setMessage("✅ Security questions saved successfully!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        const data = await response.json();
        setError(`Failed to save questions: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setError("Failed to save security questions. Please try again.");
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const skipQuestions = () => {
    if (confirm("Are you sure you want to skip adding security questions? This will make it harder to verify ownership later.")) {
      router.push("/dashboard");
    }
  };

  if (loading) {
    return (
      <Protected>
        <Navbar />
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <Sidebar />
          <main className="mx-auto w-full max-w-4xl flex-1 p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          </main>
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <Navbar />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Sidebar />
        <main className="mx-auto w-full max-w-4xl flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Security Questions</h1>
            <p className="text-gray-600">
              For: <span className="font-semibold text-gray-900">{itemTitle}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              <strong>Required:</strong> Create {minQuestions}-{maxQuestions} multiple choice security questions to verify ownership. 
              Only the true owner will know the correct answers.
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">🔒</div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Why Security Questions?</h3>
                <p className="text-sm text-blue-800">
                  Security questions help verify that someone claiming your found item is the real owner. 
                  Ask questions only the true owner would know (e.g., "What's on the lock screen?", 
                  "What brand is it?", "What color is the case?").
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
              ❌ {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((q, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Question {index + 1}
                    {index >= minQuestions && (
                      <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
                    )}
                  </h3>
                  {questions.length > minQuestions && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {/* Question Type Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type*
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question_type_${index}`}
                        value="multiple_choice"
                        checked={q.question_type === "multiple_choice"}
                        onChange={(e) => handleQuestionChange(index, "question_type", e.target.value)}
                        className="w-4 h-4 text-gray-600"
                      />
                      <span className="text-sm text-gray-700">Multiple Choice</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question_type_${index}`}
                        value="text"
                        checked={q.question_type === "text"}
                        onChange={(e) => handleQuestionChange(index, "question_type", e.target.value)}
                        className="w-4 h-4 text-gray-600"
                      />
                      <span className="text-sm text-gray-700">Text Answer</span>
                    </label>
                  </div>
                </div>

                {/* Question */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question*
                  </label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                    placeholder={q.question_type === "text" ? "e.g., What is written on the back?" : "e.g., What brand is this device?"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Answer Choices or Text Answer based on type */}
                {q.question_type === "text" ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Answer*
                    </label>
                    <input
                      type="text"
                      value={q.text_answer}
                      onChange={(e) => handleQuestionChange(index, "text_answer", e.target.value)}
                      placeholder="Enter your answer"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    />
                  </div>
                ) : (
                  <>
                    {/* Answer Choices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choice A*
                    </label>
                    <input
                      type="text"
                      value={q.choice_a}
                      onChange={(e) => handleQuestionChange(index, "choice_a", e.target.value)}
                      placeholder="First answer option"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choice B*
                    </label>
                    <input
                      type="text"
                      value={q.choice_b}
                      onChange={(e) => handleQuestionChange(index, "choice_b", e.target.value)}
                      placeholder="Second answer option"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choice C (Optional)
                    </label>
                    <input
                      type="text"
                      value={q.choice_c}
                      onChange={(e) => handleQuestionChange(index, "choice_c", e.target.value)}
                      placeholder="Third answer option"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choice D (Optional)
                    </label>
                    <input
                      type="text"
                      value={q.choice_d}
                      onChange={(e) => handleQuestionChange(index, "choice_d", e.target.value)}
                      placeholder="Fourth answer option"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Correct Answer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer*
                  </label>
                  <select
                    value={q.correct_choice}
                    onChange={(e) => handleQuestionChange(index, "correct_choice", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="A">A - {q.choice_a || "(Empty)"}</option>
                    <option value="B">B - {q.choice_b || "(Empty)"}</option>
                    {q.choice_c && <option value="C">C - {q.choice_c}</option>}
                    {q.choice_d && <option value="D">D - {q.choice_d}</option>}
                  </select>
                </div>
                  </>
                )}
              </div>
            ))}

            {/* Add Question Button */}
            {questions.length < maxQuestions && (
              <button
                type="button"
                onClick={addQuestion}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-all duration-200 font-medium"
              >
                + Add Another Question ({questions.length}/{maxQuestions})
              </button>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "Save Questions & Finish"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </Protected>
  );
}
