'use client';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const router = useRouter();

  const handleNavigation = (path) => {
    window.scrollTo(0, 0);
    router.push(path);
    // Force a hard refresh of the page content
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  return (
    <footer className="bg-gray-900 text-white py-8 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm">
          <button 
            onClick={() => handleNavigation('/about')}
            className="hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none"
          >
            About
          </button>
          <button 
            onClick={() => handleNavigation('/how-it-works')}
            className="hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none"
          >
            How It Works
          </button>
          <button 
            onClick={() => handleNavigation('/faq')}
            className="hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none"
          >
            FAQ
          </button>
          <button 
            onClick={() => handleNavigation('/report-bug')}
            className="hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none"
          >
            Report Bug / Issue
          </button>
          <button 
            onClick={() => handleNavigation('/contact')}
            className="hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none"
          >
            Contact
          </button>
          <button 
            onClick={() => handleNavigation('/terms')}
            className="hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none"
          >
            Terms of Service
          </button>
        </div>
        <div className="mt-4 text-gray-400 text-xs">
          © 2025 TraceBack — Made for campus communities. Built by Team Bravo (Fall 2025), Kent State University.
        </div>
      </div>
    </footer>
  );
}
