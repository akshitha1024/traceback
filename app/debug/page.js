"use client";



import { useState, useEffect } from "react";

export default function DebugAPIPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (url, name) => {
    try {
      setLoading(true);
      const start = Date.now();
      const response = await fetch(url);
      const duration = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        return {
          name,
          url,
          status: response.status,
          duration: `${duration}ms`,
          dataCount: Array.isArray(data) ? data.length : 'N/A',
          success: true,
          data: Array.isArray(data) ? data.slice(0, 2) : data // First 2 items for preview
        };
      } else {
        const errorText = await response.text();
        return {
          name,
          url,
          status: response.status,
          duration: `${duration}ms`,
          success: false,
          error: errorText
        };
      }
    } catch (error) {
      return {
        name,
        url,
        success: false,
        error: error.message
      };
    }
  };

  const runTests = async () => {
    setResults([]);
    setLoading(true);
    
    const endpoints = [
      { url: 'http://localhost:5000/health', name: 'Health Check' },
      { url: 'http://localhost:5000/api/categories', name: 'Categories' },
      { url: 'http://localhost:5000/api/locations', name: 'Locations' },
      { url: 'http://localhost:5000/api/lost-items?limit=5', name: 'Lost Items (5)' },
      { url: 'http://localhost:5000/api/found-items?limit=5', name: 'Found Items (5)' }
    ];

    const testResults = [];
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint.url, endpoint.name);
      testResults.push(result);
    }
    
    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 API Debug Page</h1>
        
        <button 
          onClick={runTests}
          disabled={loading}
          className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '🔄 Testing...' : '🔄 Refresh Tests'}
        </button>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">
                  {result.success ? '✅' : '❌'} {result.name}
                </h3>
                <span className="text-sm text-gray-500">
                  {result.duration || 'N/A'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                <strong>URL:</strong> {result.url}
              </p>
              
              {result.success ? (
                <div>
                  <p className="text-sm">
                    <strong>Status:</strong> {result.status} | 
                    <strong> Data Count:</strong> {result.dataCount}
                  </p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        Preview Data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-red-600">
                    <strong>Status:</strong> {result.status || 'Network Error'}
                  </p>
                  <p className="text-sm text-red-600">
                    <strong>Error:</strong> {result.error}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🔍 Troubleshooting</h3>
          <ul className="text-sm space-y-1">
            <li>• Make sure Flask server is running on <code>http://localhost:5000</code></li>
            <li>• Check for CORS issues in browser console</li>
            <li>• Verify Flask server is showing requests in terminal</li>
            <li>• Try accessing endpoints directly in browser</li>
          </ul>
        </div>
      </div>
    </div>
  );
}