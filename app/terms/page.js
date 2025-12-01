"use client";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";

export default function TermsOfService() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('sessionToken');
    setIsLoggedIn(!!(user && token));
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
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Terms of Service
          </h1>
          <div className="w-24 h-1 bg-gray-900 mx-auto mb-6"></div>
          <div className="space-y-2 text-gray-600">
            <p><strong>Effective Date:</strong> November 2025</p>
            <p><strong>Last Updated:</strong> November 2025</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl mb-12">
          <p className="text-gray-800 leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of the TraceBack platform ("TraceBack," "we," "our," or "us"). 
            By accessing or using TraceBack, you agree to be bound by these Terms. If you do not agree, do not use the platform.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Eligibility</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>1.1</strong> You must be a currently enrolled student, faculty member, or staff member of Kent State University.</p>
              <p><strong>1.2</strong> A valid Kent State email and OTP verification are required to create an account.</p>
              <p><strong>1.3</strong> You may not use TraceBack if you are not affiliated with the university.</p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Account Responsibilities</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>2.1</strong> You must provide accurate and truthful information during account creation.</p>
              <p><strong>2.2</strong> You are responsible for keeping your login credentials secure.</p>
              <p><strong>2.3</strong> You may not impersonate another person or allow others to use your account.</p>
              <p><strong>2.4</strong> TraceBack may suspend accounts involved in misuse or suspicious activity.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Profile Privacy</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>3.1</strong> Public Information: name, major, program, year, hobbies, and interests.</p>
              <p><strong>3.2</strong> Private Information: student/staff ID and contact email.</p>
              <p><strong>3.3</strong> Your contact email is shared only during valid claim/return processes or when you approve a connection request.</p>
              <p><strong>3.4</strong> Lost item reports are never public.</p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                4
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Reporting Lost or Found Items</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>4.1</strong> You must provide accurate and honest details when submitting a lost or found report.</p>
              <p><strong>4.2</strong> You may not knowingly submit false or misleading information.</p>
              <p><strong>4.3</strong> Lost reports are used solely for ML matching and will not be shown to other users.</p>
              <p><strong>4.4</strong> Found reports must include at least two verification questions to help validate ownership.</p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                5
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">72-Hour Private Mode</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>5.1</strong> All found items remain private for the first 72 hours after creation.</p>
              <p><strong>5.2</strong> Only users whose lost reports match the found item can view it during this period.</p>
              <p><strong>5.3</strong> Only limited details are displayed: category, item type, location, and date/time.</p>
              <p><strong>5.4</strong> This policy exists to reduce false or opportunistic claims.</p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                6
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Claiming Items</h2>
            </div>
            <div className="pl-16 space-y-4 text-gray-700">
              <p><strong>6.1</strong> Users may attempt to claim items by answering the finder's verification questions.</p>
              <p><strong>6.2</strong> Each user receives one attempt, which cannot be changed or edited later.</p>
              <p><strong>6.3</strong> Claims can be made in three stages:</p>
              <div className="pl-6 space-y-2">
                <p><strong>6.3.1</strong> Private Mode (first 72 hours)</p>
                <p><strong>6.3.2</strong> Public Mode (after 72 hours)</p>
                <p><strong>6.3.3</strong> Claimed — Final Chance (3 days)</p>
              </div>
              <p><strong>6.4</strong> The finder is solely responsible for validating answers and selecting the rightful owner.</p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                7
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Claimed — Final Chance (3 Days)</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>7.1</strong> When a finder identifies a potential claimer, the item enters a 3-day final review window.</p>
              <p><strong>7.2</strong> During this period, other users may still submit claims if they believe the item belongs to them.</p>
              <p><strong>7.3</strong> A countdown timer indicates the remaining time.</p>
              <p><strong>7.4</strong> After the window ends, no further responses are accepted.</p>
            </div>
          </div>

          {/* Section 8 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-600 to-pink-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                8
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Final Claim Decision and Item Return</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>8.1</strong> After the final review period, the finder selects the final owner.</p>
              <p><strong>8.2</strong> The finder must submit a brief justification for their decision.</p>
              <p><strong>8.3</strong> Both parties receive each other's contact email and a security code for item handover.</p>
              <p><strong>8.4</strong> Contact details remain visible for 8 days and then become hidden again.</p>
              <p><strong>8.5</strong> TraceBack is not responsible for the physical handover of items.</p>
            </div>
          </div>

          {/* Section 9 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                9
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Prohibited Conduct</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p className="font-semibold">Users agree not to:</p>
              <p><strong>9.1</strong> Submit false, fraudulent, or misleading reports.</p>
              <p><strong>9.2</strong> Attempt to claim items that do not belong to them.</p>
              <p><strong>9.3</strong> Upload inappropriate, harmful, or abusive content.</p>
              <p><strong>9.4</strong> Harass, threaten, or deceive other users.</p>
              <p><strong>9.5</strong> Misuse TraceBack's features to gain unfair advantage.</p>
              <p><strong>9.6</strong> Attempt to bypass security or impersonate another user.</p>
              <p className="mt-4 font-semibold text-red-700">Violations may result in suspension or referral to university authorities.</p>
            </div>
          </div>

          {/* Section 10 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-600 to-cyan-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                10
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Moderation and Safety</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>10.1</strong> Moderators may review reports for inappropriate content, fraud, or safety concerns.</p>
              <p><strong>10.2</strong> Moderators may remove posts or restrict accounts if needed.</p>
              <p><strong>10.3</strong> Successful returns and moderated incidents are stored permanently.</p>
              <p><strong>10.4</strong> User identities remain confidential during moderation.</p>
            </div>
          </div>

          {/* Section 11 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                11
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Data Retention</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>11.1</strong> Lost reports are automatically deleted after 30 days.</p>
              <p><strong>11.2</strong> Found reports are removed after the return process is completed.</p>
              <p><strong>11.3</strong> Permanent moderation logs and return records are retained for transparency.</p>
              <p><strong>11.4</strong> Users may request account deletion; however, some data may be retained for safety or audit reasons.</p>
            </div>
          </div>

          {/* Section 12 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                12
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">System Availability</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>12.1</strong> TraceBack aims for consistent uptime but does not guarantee uninterrupted service.</p>
              <p><strong>12.2</strong> Maintenance, server outages, or campus network issues may temporarily affect access.</p>
            </div>
          </div>

          {/* Section 13 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-lime-600 to-lime-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                13
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Limitation of Liability</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>13.1</strong> TraceBack assists users in connecting lost and found items but does not guarantee item recovery.</p>
              <p><strong>13.2</strong> TraceBack is not responsible for mistakes, disputes, or the accuracy of user-submitted data.</p>
              <p><strong>13.3</strong> The platform is not liable for damages resulting from misuse or incorrect item exchanges.</p>
              <p><strong>13.4</strong> Users assume all risk associated with in-person item exchanges.</p>
            </div>
          </div>

          {/* Section 14 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-sky-600 to-sky-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                14
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Termination of Use</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>14.1</strong> TraceBack may suspend or terminate accounts that violate these Terms.</p>
              <p><strong>14.2</strong> Users may delete their accounts at any time.</p>
              <p><strong>14.3</strong> Deleting an account permanently removes profile data but not moderation logs.</p>
            </div>
          </div>

          {/* Section 15 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-fuchsia-600 to-fuchsia-700 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                15
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Changes to Terms</h2>
            </div>
            <div className="pl-16 space-y-3 text-gray-700">
              <p><strong>15.1</strong> TraceBack may update these Terms periodically.</p>
              <p><strong>15.2</strong> Continued use of the platform after updates constitutes acceptance of the revised Terms.</p>
            </div>
          </div>
        </div>

        {/* Acknowledgment */}
        <div className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">By using TraceBack, you acknowledge that you have read, understood, and agree to these Terms of Service.</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Link href="/" className="inline-block bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-xl font-bold transition-all duration-200">
              Return to Home
            </Link>
            <Link href="/contact" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all duration-200">
              Contact Support
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
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
