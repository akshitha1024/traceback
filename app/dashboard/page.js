"use client";
import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { lostItems, foundItems } from "@/data/mock";
import ItemCard from "@/components/ItemCard";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [datetime, setDatetime] = useState("");

  // Fetch user info from backend
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:5000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to load dashboard", err);
      }
    };

    fetchUser();

    // Update datetime every second
    const updateDatetime = () => {
      const now = new Date();
      const formattedDate = now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const formattedTime = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setDatetime(`${formattedDate} • ${formattedTime}`);
    };

    updateDatetime();
    const interval = setInterval(updateDatetime, 1000);
    return () => clearInterval(interval);
  }, []);

  const top = lostItems[0];

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
  };

  return (
    <Protected>
      <Navbar />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Sidebar />

        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">
              {getGreeting()},{" "}
              <span className="text-gray-700 font-bold">
                {user?.firstName ?? "--"} 👋
              </span>
            </h1>
            <div className="text-sm text-gray-500 font-medium bg-white/80 border border-gray-100 px-4 py-2 rounded-xl shadow-sm">
              {datetime || "--"}
            </div>
          </div>

          {/* Matches */}
          <section className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="mb-4 text-sm font-medium text-gray-600 uppercase tracking-wide">
              Your Matches
            </div>
            <div className="flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                LOST
              </span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{top.title}</div>
                <div className="text-sm text-gray-600">{top.location}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-700">93% Match</div>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-gray-700 to-gray-900"
                    style={{ width: "93%" }}
                  />
                </div>
              </div>
              <a
                href={`/items/${top.id}`}
                className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                VIEW
              </a>
            </div>
          </section>

          {/* Recent Items */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Lost Items
                </h2>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  {lostItems.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {lostItems.map((i) => (
                  <ItemCard key={i.id} {...i} />
                ))}
              </div>
            </section>

            <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Found Items
                </h2>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {foundItems.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {foundItems.map((i) => (
                  <ItemCard key={i.id} {...i} />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </Protected>
  );
}
