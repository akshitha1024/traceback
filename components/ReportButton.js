"use client";
import { useState } from "react";
import Link from "next/link";

export default function ReportButton({ type, targetId, size = "small", style = "icon" }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (style === "icon") {
    return (
      <div className="relative">
        <Link
          href={`/report-abuse?type=${type}&id=${targetId}`}
          className={`inline-flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-all duration-200 ${
            size === "small" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base"
          }`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          title={`Report this ${type}`}
        >
          🚩
        </Link>
        
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap z-10">
            Report this {type}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  }

  if (style === "button") {
    return (
      <Link
        href={`/report-abuse?type=${type}&id=${targetId}`}
        className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 rounded-lg font-medium transition-all duration-200 border border-gray-200 hover:border-red-200 ${
          size === "small" ? "text-sm" : "text-base"
        }`}
      >
        <span>🚩</span>
        <span>Report</span>
      </Link>
    );
  }

  if (style === "text") {
    return (
      <Link
        href={`/report-abuse?type=${type}&id=${targetId}`}
        className="text-gray-500 hover:text-red-600 text-sm underline transition-colors duration-200"
      >
        Report this {type}
      </Link>
    );
  }

  return null;
}