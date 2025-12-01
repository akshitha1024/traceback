"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('sessionToken');
    setIsLoggedIn(!!(user && token));
  }, []);

  const faqs = [
    {
      question: "Do I need an account to use TraceBack?",
      answer: "Yes. All users must create an account using their Kent State email and OTP verification. This ensures authenticity and prevents unauthorized access."
    },
    {
      question: "What parts of my profile are public?",
      answer: "Public: name, major, program, year, hobbies, and interests. Private: student/staff ID and contact email. Contact email is only shared during valid claim/return processes or with approved connection requests."
    },
    {
      question: "Why are lost reports not shown publicly?",
      answer: "To protect user privacy and prevent false claims. Lost reports are used exclusively by the ML matching system and are visible only to the user who submitted them."
    },
    {
      question: "Do photos improve matching accuracy?",
      answer: "Yes. Adding a photo significantly improves ML accuracy, although it is not mandatory."
    },
    {
      question: "Why are found items private for the first 72 hours?",
      answer: "This reduces false or opportunistic claims. During the 72-hour private mode: Only users with matching lost reports can view the item. Only limited details are shown (category, item type, location, and date). This gives the rightful owner the first opportunity to claim."
    },
    {
      question: "What happens after 72 hours if no one claims the item?",
      answer: "The found item becomes visible publicly with the same limited details, allowing any campus user to attempt a claim."
    },
    {
      question: "What details are shown on found items?",
      answer: "For privacy and security, only limited information is displayed: Item type, Category, Location, and Date/time. This prevents misuse or guess-based claiming."
    },
    {
      question: "How do I claim a found item?",
      answer: "Claims are made by answering the finder's security questions. Users receive one attempt, and answers cannot be edited afterward. Claims can be submitted during three stages: 72-hour private mode (if you reported a matching lost item), Public mode (after 72 hours), or Claimed — Final Chance (3 Days)."
    },
    {
      question: "Who validates claim answers?",
      answer: "The finder validates all responses. TraceBack does not automatically decide ownership."
    },
    {
      question: "What is \"Claimed — Final Chance (3 Days)\"?",
      answer: "If a finder identifies a potential claimer, the item enters a 3-day final review period. During this time: The item remains visible for final claim attempts, and a countdown timer shows remaining time. After the window ends, no further responses are accepted."
    },
    {
      question: "What happens after the final 3-day window?",
      answer: "The finder selects the rightful owner and submits a short justification. Both parties receive each other's contact email along with a security code to complete the item handover. Contact details are visible for 8 days only."
    },
    {
      question: "Why do false claim attempts typically decrease after an item is claimed?",
      answer: "Once an item is claimed, potential false claimers understand they must provide accurate answers and additional supporting information, which discourages misuse."
    },
    {
      question: "What happens after an item is successfully returned?",
      answer: "The finder fills out a quick return confirmation form. Successful returns are recorded in the user's history and contribute to their credibility."
    },
    {
      question: "What is the credibility system?",
      answer: "Users can view their full Returns & Claims history. Other users can see only the number of successful returns, which helps establish trust without exposing sensitive details."
    },
    {
      question: "How long do lost reports stay in the system?",
      answer: "Lost reports are automatically deleted after 30 days to keep the matching system efficient."
    },
    {
      question: "Can users connect with other users?",
      answer: "Yes. Users may send or accept connection requests to share contact information. This feature is optional and not part of the Lost & Found workflow."
    },
    {
      question: "What happens if someone uploads inappropriate or fake content?",
      answer: "Users can report posts using the Report Abuse option. Reasons include inappropriate content, spam, harassment, or safety concerns. Moderators review reports, and your identity remains confidential."
    },
    {
      question: "What data does TraceBack store?",
      answer: "Only essential data required for matching, verification, and safety. Full return/claim records are stored permanently for transparency but are accessible only to moderators."
    },
    {
      question: "Can I delete my account?",
      answer: "Yes. Users may delete their account at any time, and associated data will be removed as per platform policies."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12 bg-white/95 backdrop-blur-sm shadow-sm sticky top-0">
        <Link href={isLoggedIn ? "/dashboard" : "/"}>
          <Image 
            src="/logo.png" 
            alt="TraceBack Logo" 
            width={240} 
            height={70}
            className="h-14 w-auto sm:h-18 cursor-pointer"
          />
        </Link>
        {isLoggedIn ? (
          <Link href="/dashboard" className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
            Dashboard
          </Link>
        ) : (
          <Link href="/login?redirect=/dashboard" className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
            Login/Sign Up
          </Link>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <div className="w-24 h-1 bg-gray-900 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to know about using TraceBack
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
                    {faq.question}
                  </h3>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <svg
                    className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              
              {/* Answer */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-8 pb-6 pl-20">
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-10 shadow-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Still Have Questions?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            We're here to help! Contact our support team for assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#"
              className="inline-block bg-white hover:bg-gray-100 text-blue-700 px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Contact Support
            </Link>
            <Link
              href="/how-it-works"
              className="inline-block bg-blue-800 hover:bg-blue-900 text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Learn How It Works
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="inline-block text-gray-600 hover:text-gray-900 font-medium transition-colors">
             Back to Home
          </Link>
        </div>
      </main>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
