"use client";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";

export default function HowItWorks() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);

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
        <Link href="/login" className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
          Login/Sign Up
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">How It Works</h1>
          <div className="w-24 h-1 bg-gray-900 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            TraceBack is a smart, campus-focused Lost & Found system designed to match lost and found items using machine learning, secure verification, and a transparent return process.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {/* Step 1 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                1️⃣
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Create an Account</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Sign up with your <strong>Kent State email</strong> and verify using the OTP.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Create your profile with your name, major, program, year, bio, and interests.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-gray-800 leading-relaxed mb-2">
                    <strong className="text-blue-900">Public:</strong> name, major, program, interests
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    <strong className="text-blue-900">Private:</strong> student/staff ID & contact email (contact email is shared only for returns/claims or accepted connections)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                2️⃣
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Lost or Found Items</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Submit item details such as title, category, description, color, location, date/time, and optional photos.
                </p>
                
                <div className="space-y-3">
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <p className="text-gray-800 leading-relaxed">
                      <strong className="text-red-900">Lost items</strong> are never public — they are used only for ML matching. You can view your lost items and any matched found items in your dashboard.
                    </p>
                  </div>
                  
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <p className="text-gray-800 leading-relaxed">
                      <strong className="text-green-900">Found items</strong> require at least two security questions to verify ownership.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                3️⃣
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">72-Hour Private Mode (Found Items)</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Every found item stays <strong>private for the first 72 hours</strong>.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  During this time, only users with matching lost reports can see the item (with limited details).
                </p>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                  <p className="text-purple-900 font-semibold mb-2">After 72 hours:</p>
                  <p className="text-gray-800 leading-relaxed">
                    If no one claims the item, it appears on the <strong>Found Items page</strong> with the same limited details so anyone can view and attempt a claim.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                4️⃣
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Claiming an Item</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Matched users answer the finder's security questions.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg space-y-2">
                  <p className="text-gray-800 leading-relaxed">
                    • Each user gets <strong>one attempt only</strong>, and answers cannot be edited.
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    • The finder reviews all responses and may request additional supporting information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                5️⃣
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Claimed — Final Chance (3 Days)</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  When someone is marked as a potential claimer, the item enters a <strong>3-day final chance window</strong>.
                </p>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg space-y-2">
                  <p className="text-gray-800 leading-relaxed">
                    • Others can still submit answers if they believe the item is theirs.
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    • After the timer ends, no more responses are accepted.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 6 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                6️⃣
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Final Claim Decision</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  After the final window:
                </p>
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg space-y-2">
                  <p className="text-gray-800 leading-relaxed">
                    • The finder selects the rightful owner.
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    • Submits a short reason form.
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    • Both parties receive each other's contact email + a security code for the handover.
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    • Contact information stays visible for 8 days, then disappears automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 7 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                7️⃣
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Credibility System</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  You can track your Returns & Claims history in your profile.
                </p>
                <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
                  <p className="text-gray-800 leading-relaxed">
                    Other users can only see how many items you've returned, not your full history.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 8 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-pink-600 to-pink-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                8️⃣
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Moderation & Safety</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  All successful returns are stored permanently for transparency.
                </p>
                <div className="bg-pink-50 border-l-4 border-pink-500 p-4 rounded-r-lg space-y-2 mb-3">
                  <p className="text-gray-800 leading-relaxed">
                    • Users can report inappropriate or abusive posts anytime through Report Abuse.
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    • Moderators review reports and take necessary action.
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    • Your identity always remains confidential — only moderators can see the flagged content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-12 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 mb-8 text-lg">Join TraceBack and help create a safer campus community.</p>
          <Link href="/login" className="inline-block bg-white hover:bg-gray-100 text-gray-900 px-10 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Sign Up Now
          </Link>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href="/" className="inline-block text-gray-600 hover:text-gray-900 font-medium transition-colors">
            ← Back to Home
          </Link>
        </div>
      </main>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
