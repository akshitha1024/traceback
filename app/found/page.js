
"use client";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { foundItems } from "@/data/mock";
import ItemCard from "@/components/ItemCard";

export default function FoundPage() {
  return (
    <Protected>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Found Items</h1>
            <a href="/report" className="btn">Report Found Item</a>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {foundItems.map((i) => <ItemCard key={i.id} {...i} />)}
          </div>
        </main>
      </div>
    </Protected>
  );
}
