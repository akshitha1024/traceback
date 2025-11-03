"use client";
import Link from "next/link";
import Image from "next/image";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12 bg-white/95 backdrop-blur-sm shadow-sm">
        <Image 
          src="/logo.png" 
          alt="Traceback Logo" 
          width={240} 
          height={70}
          className="h-14 w-auto sm:h-18"
        />
        <Link href="/login" className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
          Login/Sign Up
        </Link>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-6 py-16">
        <div className="text-center max-w-5xl mx-auto w-full">
          {/* Hero Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-8 leading-tight">
            LOST IT?
            <span className="block text-gray-700">TRACE IT BACK</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed font-medium">
            Campus finds made easy. Connect lost items with their owners instantly.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20 max-w-3xl mx-auto">
            <Link href="/login?redirect=/report" className="group bg-gray-900 hover:bg-black text-white px-8 sm:px-10 py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto min-w-[240px]">
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">📢</span>
                <span>REPORT LOST ITEM</span>
              </div>
            </Link>
            <Link href="/login?redirect=/report" className="group bg-gray-600 hover:bg-gray-700 text-white px-8 sm:px-10 py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto min-w-[240px]">
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">🔍</span>
                <span>REPORT FOUND ITEM</span>
              </div>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 mb-16 max-w-5xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="text-5xl mb-5">⚡</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">Instant Matching</h3>
              <p className="text-gray-600 text-base leading-relaxed">Smart algorithms connect lost and found items automatically</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="text-5xl mb-5">🏫</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">Campus Wide</h3>
              <p className="text-gray-600 text-base leading-relaxed">Covers all campus buildings, dorms, and common areas</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="text-5xl mb-5">🔒</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">Secure & Private</h3>
              <p className="text-gray-600 text-base leading-relaxed">Your information stays safe with verified student accounts</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-gray-600 text-lg font-medium">
            Sign in with your student account to get started
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm">
            <Link href="#" className="hover:text-gray-300 transition-colors">About</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">Contact</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
          </div>
          <div className="mt-4 text-gray-400 text-xs">
            © 2025 Traceback. Made for campus communities.
          </div>
        </div>
      </footer>
    </div>
  );
}
