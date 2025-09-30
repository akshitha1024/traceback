
"use client";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { lostItems, foundItems } from "@/data/mock";
import ItemCard from "@/components/ItemCard";

export default function Dashboard() {
  const top = lostItems[0];

  return (
    <Protected>
      <Navbar />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex gap-3">
              <a href="/report" className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                Report Lost Item
              </a>
              <a href="/report" className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Report Found Item
              </a>
            </div>
          </div>

          {/* Your Matches */}
          <section className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="mb-4 text-sm font-medium text-gray-600 uppercase tracking-wide">Your Matches</div>
            <div className="flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">LOST</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{top.title}</div>
                <div className="text-sm text-gray-600">{top.location}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-700">93% Match</div>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full bg-gradient-to-r from-gray-700 to-gray-900" style={{ width: "93%" }} />
                </div>
              </div>
              <a href={`/items/${top.id}`} className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                VIEW
              </a>
            </div>
          </section>

          {/* Recent */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Lost Items</h2>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">3</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {lostItems.map((i) => <ItemCard key={i.id} {...i} />)}
              </div>
            </section>

            <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Found Items</h2>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">2</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {foundItems.map((i) => <ItemCard key={i.id} {...i} />)}
              </div>
            </section>
          </div>
        </main>
      </div>
    </Protected>
  );
}
