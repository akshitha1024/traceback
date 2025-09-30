
"use client";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";

export default function ReportPage() {
  const [tab, setTab] = useState("lost");
  return (
    <Protected>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <h1 className="mb-2 text-xl font-semibold">Post an Item</h1>
          <p className="mb-4 text-neutral-600">
            Report a lost or found item to help connect items with their owners
          </p>

          <div className="mb-4 inline-flex rounded-md border border-border bg-white p-1">
            <button
              className={`navtab ${tab === "lost" ? "navtab-active" : ""}`}
              onClick={() => setTab("lost")}
            >
              Report Lost Item
            </button>
            <button
              className={`navtab ${tab === "found" ? "navtab-active" : ""}`}
              onClick={() => setTab("found")}
            >
              Report Found Item
            </button>
          </div>

          <form className="card max-w-xl space-y-3 p-5">
            <label className="block text-sm">
              Item Title*
              <input
                className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2"
                placeholder={tab === "lost" ? "What did you lose?" : "What did you find?"}
                required
              />
            </label>

            <label className="block text-sm">
              Category*
              <select className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2">
                <option>Electronics</option>
                <option>Bags & Backpacks</option>
                <option>Books</option>
                <option>Keys</option>
              </select>
            </label>

            <label className="block text-sm">
              Description*
              <textarea
                rows={4}
                className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2"
                placeholder="Provide details of the item (color, notes, etc.)"
              />
            </label>

            <div>
              <div className="mb-1 text-sm">Upload Image</div>
              <div className="grid place-items-center rounded-md border-2 border-dashed border-border bg-panel p-10 text-neutral-600">
                Upload your image here or browse
              </div>
            </div>

            <label className="block text-sm">
              {tab === "lost" ? "Location* (Where did you lose it?)" : "Location* (Where did you find it?)"}
              <input className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2" />
            </label>

            <label className="block text-sm">
              Date*
              <input type="date" className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2" />
            </label>

            <label className="block text-sm">
              Contact Information*
              <input className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2" placeholder="Email or Phone Number" />
            </label>

            <button className="btn w-full">Post Item</button>
          </form>
        </main>
      </div>
    </Protected>
  );
}
