"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Login() {
  const nav = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        toast.error(data.message, { duration: 5000 });
        return;
      }

      localStorage.setItem("accessToken", data.token);
      toast.success("Login successful! Redirecting to dashboard...", { duration: 5000 });
      setTimeout(() => nav.push("/dashboard"), 2000);

    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!", { duration: 5000 });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '16px', fontWeight: '500' },
        }}
      />

     
      <header className="flex items-center justify-between px-6 py-4 lg:px-12">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="Traceback Logo" width={200} height={60} className="h-12 w-auto sm:h-16" />
        </Link>
        <Link
          href="/signup"
          className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Sign Up
        </Link>
      </header>

     
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Welcome Back</h2>
            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white/50"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> 
                  Remember me
                </label>
                <button
  type="button"
  onClick={() => nav.push("/ForgetPassword")}
  className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
>
  Forgot password?
</button>

              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Logging in...
                  </div>
                ) : "Log In"}
              </button>
            </form>
            <div className="mt-6 text-center text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-gray-900 hover:text-black font-medium transition-colors">
                Sign up here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
