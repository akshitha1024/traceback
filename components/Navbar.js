"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const hide = ["/", "/login", "/signup", "/verify-email"].includes(pathname);
  if (hide) return null;

  const logout = async () => {
    const token = localStorage.getItem("sessionToken");
    
    if (token) {
      try {
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error("Logout API call failed:", err);
      }
    }
    
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
          <Image 
            src="/logo.png" 
            alt="Traceback Logo" 
            width={200} 
            height={60}
            className="h-16 w-auto"
          />
        </Link>

        <div className="flex items-center gap-4">
          <Link 
            href="/profile/create" 
            className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span>👤</span>
            Profile
          </Link>
          <button 
            onClick={logout} 
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
