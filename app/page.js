"use client";
import Link from "next/link";
import Image from "next/image";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <Image 
          src="/logo.png" 
          alt="Traceback Logo" 
          width={240} 
          height={70}
          className="h-12 w-auto sm:h-16"
        />
        <Link href="/login" className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
          Login/Sign Up
        </Link>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            LOST IT?
            <span className="block text-gray-700">TRACE IT BACK</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Campus finds made easy. Connect lost items with their owners instantly.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-16">
            <Link href="/report" className="group bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              <div className="flex items-center justify-center gap-2">
                <span>📢</span>
                <span>REPORT LOST ITEM</span>
              </div>
            </Link>
            <Link href="/report" className="group bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              <div className="flex items-center justify-center gap-2">
                <span>🔍</span>
                <span>REPORT FOUND ITEM</span>
              </div>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold text-lg mb-2">Instant Matching</h3>
              <p className="text-gray-600">Smart algorithms connect lost and found items automatically</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl mb-3">🏫</div>
              <h3 className="font-semibold text-lg mb-2">Campus Wide</h3>
              <p className="text-gray-600">Covers all campus buildings, dorms, and common areas</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold text-lg mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your information stays safe with verified student accounts</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-gray-600 text-sm mb-8">
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
