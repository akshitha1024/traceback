
"use client";
import { useParams, useRouter } from "next/navigation";
import { lostItems, foundItems } from "@/data/mock";

export default function ItemDetails() {
  const { id } = useParams();
  const router = useRouter();
  const item = [...lostItems, ...foundItems].find((i) => i.id === id) || {
    title: "Item",
    type: "LOST",
    location: "—",
    date: "—",
  };

  return (
    <div className="p-6">
      <div className="mx-auto flex max-w-7xl gap-6">
        <div className="flex-1 rounded-xl border border-border bg-white p-4">
          <div className="aspect-[4/3] rounded-md border border-border bg-panel" />
        </div>

        <div className="flex-1 rounded-xl border border-border bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className={`chip ${item.type === "FOUND" ? "chip-found" : "chip-lost"}`}>{item.type}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs">{item.category || "—"}</span>
          </div>
          <h1 className="mb-1 text-xl font-semibold">{item.title}</h1>
          <div className="text-neutral-700">Date: {item.date}</div>
          <div className="text-neutral-700">Location: {item.location}</div>
          <button className="btn mt-4">
            Contact {item.type === "FOUND" ? "Owner" : "Finder"}
          </button>
          <div className="mt-6 text-sm">
            <button className="underline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
