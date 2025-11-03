'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchAndFilter from '../../components/SearchAndFilter';
import ItemCard from '../../components/ItemCard';
import { lostItems, foundItems } from '../../data/mock';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Get initial search query from URL if provided
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
  }, [searchParams]);

  // Initialize items data
  useEffect(() => {
    const combinedItems = [
      ...lostItems.map(item => ({ ...item, type: 'lost' })),
      ...foundItems.map(item => ({ ...item, type: 'found' }))
    ];
    setAllItems(combinedItems);
    setFilteredItems(combinedItems);
    setLoading(false);
  }, []);

  const handleFilterChange = (filtered) => {
    setFilteredItems(filtered);
  };

  const getResultsText = () => {
    const total = filteredItems.length;
    if (searchQuery) {
      return `${total} result${total !== 1 ? 's' : ''} for "${searchQuery}"`;
    }
    return `${total} item${total !== 1 ? 's' : ''} found`;
  };

  const getNoResultsMessage = () => {
    if (searchQuery) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No results found for "{searchQuery}"
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• Check your spelling</p>
            <p>• Try more general terms</p>
            <p>• Remove some filters</p>
            <p>• Browse all items instead</p>
          </div>
        </div>
      );
    }
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📱</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No items match your filters
        </h3>
        <p className="text-gray-600">
          Try adjusting your filters to see more results.
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Lost & Found Items
          </h1>
          <p className="text-gray-600">
            Find lost items or check if someone has found yours
          </p>
        </div>

        {/* Search and Filter Component */}
        <div className="mb-8">
          <SearchAndFilter
            items={allItems}
            onFilterChange={handleFilterChange}
            initialQuery={searchQuery}
          />
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {getResultsText()}
            </h2>
            {filteredItems.length > 0 && (
              <div className="text-sm text-gray-500">
                Updated {new Date().toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="relative">
                <ItemCard 
                  item={item} 
                  type={item.type}
                  showType={true}
                />
                {/* Type badge */}
                <div className="absolute top-3 right-3">
                  <span className={`
                    px-2 py-1 text-xs font-semibold rounded-full
                    ${item.type === 'lost' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                    }
                  `}>
                    {item.type === 'lost' ? 'Lost' : 'Found'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          getNoResultsMessage()
        )}

        {/* Quick Tips */}
        {filteredItems.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💡 Search Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>Lost something?</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Search by item name or description</li>
                  <li>• Filter by location where you lost it</li>
                  <li>• Check recent found items first</li>
                </ul>
              </div>
              <div>
                <strong>Found something?</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Search existing lost reports</li>
                  <li>• Use specific keywords in descriptions</li>
                  <li>• Report your find to help others</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Can't find what you're looking for?
            </h3>
            <p className="text-blue-700 mb-4">
              Report your lost item or help others by reporting found items
            </p>
            <div className="space-x-4">
              <a
                href="/lost"
                className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Report Lost Item
              </a>
              <a
                href="/found"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Report Found Item
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}