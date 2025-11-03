"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Protected({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TEMPORARY: Skip authentication for development
    // TODO: Re-enable authentication when verification system is ready
    setIsAuthenticated(true);
    setIsLoading(false);
    
    // Original authentication code (commented out for now)
    /*
    const checkAuth = async () => {
      const token = localStorage.getItem("sessionToken");
      
      if (!token) {
        router.replace("/login");
        return;
      }
      
      try {
        const response = await fetch('http://localhost:5000/api/auth/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("sessionToken");
          localStorage.removeItem("user");
          router.replace("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    */
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <>{children}</>;
}