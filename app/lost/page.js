
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ItemCard from "@/components/ItemCard";

export default function LostPage() {
  const [lostItems, setLostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false
  });

  const fetchLostItems = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/lost-items?limit=25&page=${page}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setLostItems(data.items || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error('Error fetching lost items:', err);
      setError('Failed to load lost items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLostItems(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchLostItems(newPage);
    }
  };

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    const pages = [];
    const current = pagination.page;
    const total = pagination.pages;
    
    // Show first page
    if (current > 3) {
      pages.push(1);
      if (current > 4) pages.push('...');
    }
    
    // Show pages around current
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }
    
    // Show last page
    if (current < total - 2) {
      if (current < total - 3) pages.push('...');
      pages.push(total);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(current - 1)}
          disabled={!pagination.has_prev}
          className="px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            disabled={page === '...' || page === current}
            className={`px-3 py-2 rounded-md ${
              page === current
                ? 'bg-blue-600 text-white'
                : page === '...'
                ? 'cursor-default'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(current + 1)}
          disabled={!pagination.has_next}
          className="px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <Protected>
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold">Lost Items</h1>
              <Link href="/report" className="btn-ghost">Report Lost Item</Link>
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">Loading lost items...</div>
            </div>
          </main>
        </div>
      </Protected>
    );
  }

  if (error) {
    return (
      <Protected>
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold">Lost Items</h1>
              <Link href="/report" className="btn-ghost">Report Lost Item</Link>
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-red-600">{error}</div>
            </div>
          </main>
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Lost Items</h1>
            <Link href="/report" className="btn-ghost">Report Lost Item</Link>
          </div>
          
          <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
            <div>
              Showing {lostItems.length} of {pagination.total?.toLocaleString()} lost items 
              (Page {pagination.page} of {pagination.pages})
            </div>
            <div>
              25 items per page
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lostItems.map((item) => (
              <ItemCard 
                key={item.id} 
                id={item.id}
                type="LOST"
                title={item.title}
                description={item.description}
                location={item.location_name || item.location}
                date={item.created_at}
                category={item.category_name || item.category}
                reportedBy={item.email}
                {...item}
              />
            ))}
          </div>
          
          {lostItems.length === 0 && !loading && (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-gray-500">No lost items found</div>
            </div>
          )}

          {renderPagination()}
        </main>
      </div>
    </Protected>
  );
}
