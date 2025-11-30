
"use client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Protected from "@/components/Protected";

export default function ItemDetails() {
  const router = useRouter();

  return (
    <Protected>
      <Navbar />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Item Details Not Available</h1>
            <p className="text-gray-600 mb-6">
              For privacy reasons, detailed item information is not shown. <br />
              Items are only visible as a list with name and location.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              <strong>Privacy Policy:</strong> All found items remain private for the first 72 hours to reduce the number of false-claim attempts, while lost-item reports are never shown publicly to protect user privacy and prevent others from using that information to answer security questions and falsely claim ownership. During this private window, our ML system notifies only users whose lost reports closely match the found item. After 3 days, the found item becomes visible to the public with only limited details—item name, found location, category, and date/time—to keep the verification process fair, secure, and trustworthy.
            </p>
            <button
              onClick={() => router.push("/search")}
              className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Back to Found Items
            </button>
          </div>
        </main>
      </div>
    </Protected>
  );
}
