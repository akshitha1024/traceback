"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Item = ({ href, label }) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`block rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
        active 
          ? "bg-gray-900 text-white shadow-lg" 
          : "text-gray-700 hover:bg-white/60 hover:text-gray-900"
      }`}
    >
      {label}
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const hide = ["/", "/login", "/signup", "/verify-email"].includes(pathname);
  if (hide) return null;

  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="sticky top-20 flex h-[calc(100vh-5rem)] flex-col gap-3 p-6 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Navigation</h3>
          <div className="space-y-2">
            <Item href="/dashboard" label="Dashboard" />
            <Item href="/found" label="Found Items" />
            <Item href="/claimed-items" label="Claimed — Final Chance (3 Days)" />
            <Item href="/report" label="Report Item" />
          </div>
        </div>
        
        <div className="mb-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My Claims</h3>
          <div className="space-y-2">
            <Item href="/claim-attempts" label="My Claim Requests" />
            <Item href="/success-history" label="🏆 Return & Claim History" />
          </div>
        </div>
        
        <div className="mb-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Social</h3>
          <div className="space-y-2">
            <Item href="/connections" label="👥 Connections" />
          </div>
        </div>
        
        <div className="mb-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Admin</h3>
          <div className="space-y-2">
            <Item href="/moderation" label="Moderation" />
          </div>
        </div>
      </div>
    </aside>
  );
}
