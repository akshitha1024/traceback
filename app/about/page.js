"use client";

import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";

export default function About() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('sessionToken');
    setIsLoggedIn(!!(user && token));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12 bg-white/95 backdrop-blur-sm shadow-sm">
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
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">About TraceBack</h1>
          <div className="w-24 h-1 bg-gray-900 mx-auto"></div>
        </div>

        {/* Description */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12 mb-16">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            <strong>TraceBack</strong> is an intelligent Lost & Found platform built for the <strong>Kent State University – Kent Campus community. </strong>
            It uses machine learning to connect lost and found reports more accurately, helping students recover 
            their belongings quickly and with less effort.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Designed with privacy, trust, and student safety in mind, TraceBack provides a seamless, secure way for 
            the Kent Campus community to return items to their rightful owners.
          </p>
        </div>

        {/* Team Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Built By — Team Bravo</h2>
          <p className="text-center text-gray-600 mb-8 text-lg">Fall 2025, Kent State University</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Vamsi Krishna Konidena</h3>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Akshitha Chapalamadugu</h3>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Lahari Dommaraju</h3>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Poojitha Samala</h3>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  5
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Roopa Nimmanapalli</h3>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  6
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Bhanu Prasad Dharavathu</h3>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  7
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Bharath Kumar Nadipineni</h3>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  8
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Narendra Reddy Pannuru</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="inline-block bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
            Back to Home
          </Link>
        </div>
      </main>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
