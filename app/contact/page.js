"use client";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";

export default function Contact() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('sessionToken');
    setIsLoggedIn(!!(user && token));
  }, []);

  const teamMembers = [
    { name: "Vamsi Krishna Konidena", email: "vkoniden@kent.edu" },
    { name: "Akshitha Chapalamadugu", email: "achapala@kent.edu" },
    { name: "Lahari Dommaraju", email: "ldommara@kent.edu" },
    { name: "Poojitha Samala", email: "psamala@kent.edu" },
    { name: "Roopa Nimmanapalli", email: "rnimmana@kent.edu" },
    { name: "Bhanu Prasad Dharavathu", email: "bdharav1@kent.edu" },
    { name: "Bharath Kumar Nadipineni", email: "bnadipin@kent.edu" },
    { name: "Narendra Reddy Pannuru", email: "narendra@kent.edu" }
  ];

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
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">Contact Us</h1>
          <div className="w-24 h-1 bg-gray-900 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Have questions or need support? Get in touch with Team Bravo
          </p>
        </div>

        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              📧
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">Get help via email</p>
            <Link href="/report-bug" className="text-blue-600 hover:text-blue-700 font-semibold">
              Report Issue →
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              ❓
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">FAQs</h3>
            <p className="text-gray-600 mb-4">Find quick answers</p>
            <Link href="/faq" className="text-purple-600 hover:text-purple-700 font-semibold">
              Browse FAQ →
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              📚
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Documentation</h3>
            <p className="text-gray-600 mb-4">Learn how it works</p>
            <Link href="/how-it-works" className="text-green-600 hover:text-green-700 font-semibold">
              Read Docs →
            </Link>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12 mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Team Bravo</h2>
            <p className="text-gray-600 text-lg">Fall 2025 • Kent State University</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                      {member.name}
                    </h3>
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm group/email"
                    >
                      <svg className="w-4 h-4 group-hover/email:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="break-all">{member.email}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-10 shadow-2xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Need Immediate Help?</h2>
          <p className="text-blue-100 mb-6 text-lg max-w-2xl mx-auto">
            For urgent issues or technical support, please reach out to any team member via email. 
            We typically respond within 24-48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/report-bug"
              className="inline-block bg-white hover:bg-gray-100 text-blue-700 px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Report an Issue
            </Link>
            <Link
              href="/faq"
              className="inline-block bg-blue-800 hover:bg-blue-900 text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              View FAQs
            </Link>
          </div>
        </div>

        {/* Office Hours */}
        <div className="mt-12 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg inline-block">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📅 Response Time</h3>
            <div className="space-y-2 text-gray-700">
              <p className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Weekdays: 24-48 hours</span>
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span>Weekends: 48-72 hours</span>
              </p>
            </div>
          </div>
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
