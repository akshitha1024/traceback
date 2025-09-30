
"use client";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { lostItems } from "@/data/mock";
import ItemCard from "@/components/ItemCard";

export default function LostPage() {
  return (
    <Protected>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Lost Items</h1>
            <a href="/report" className="btn-ghost">Report Lost Item</a>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lostItems.map((i) => <ItemCard key={i.id} {...i} />)}
          </div>
        </main>
      </div>
    </Protected>
  );
}
