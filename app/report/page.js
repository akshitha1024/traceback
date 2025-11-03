
"use client";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";

export default function ReportPage() {
  const [tab, setTab] = useState("lost");
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingError, setLoadingError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    location_id: '',
    color: '',
    size: '',
    date_lost: '',
    date_found: '',
    time_lost: '',
    time_found: '',
    user_name: '',
    user_email: '',
    user_phone: '',
    additional_details: '',
    custom_category: '',
    custom_location: ''
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch categories and locations from API
  useEffect(() => {
    const fetchData = async () => {
      console.log('🔍 Fetching categories and locations...');
      
      // Fallback data in case API is not accessible
      const fallbackCategories = [
        { id: 1, name: 'Electronics' },
        { id: 2, name: 'Clothing & Accessories' },
        { id: 3, name: 'Bags & Backpacks' },
        { id: 4, name: 'Books & Supplies' },
        { id: 5, name: 'Keys & Cards' },
        { id: 6, name: 'Wallets & Money' },
        { id: 7, name: 'Jewelry & Watches' },
        { id: 8, name: 'Sports & Recreation' },
        { id: 9, name: 'Personal Items' },
        { id: 10, name: 'Documents & Papers' }
      ];
      
      const fallbackLocations = [
        { id: 1, name: 'University Library' },
        { id: 2, name: 'Kent Student Center' },
        { id: 3, name: 'Math & Computer Science Building' },
        { id: 4, name: 'Business Building' },
        { id: 5, name: 'Art Building' },
        { id: 6, name: 'Recreation Center' },
        { id: 7, name: 'Dining Commons' },
        { id: 8, name: 'Engineering Building' },
        { id: 9, name: 'Psychology Building' },
        { id: 10, name: 'Music & Speech Building' },
        { id: 11, name: 'Parking Deck A' },
        { id: 12, name: 'Parking Lot B' },
        { id: 13, name: 'Campus Green' },
        { id: 14, name: 'University Bookstore' },
        { id: 15, name: 'Student Health Services' },
        { id: 16, name: 'Residence Hall - Eastway' },
        { id: 17, name: 'Residence Hall - Westway' },
        { id: 18, name: 'Science Research Building' },
        { id: 19, name: 'Performing Arts Center' },
        { id: 20, name: 'Academic Success Center' },
        { id: 21, name: 'Nursing Building' },
        { id: 22, name: 'Education Building' },
        { id: 23, name: 'Journalism & Mass Communication' },
        { id: 24, name: 'Architecture Building' },
        { id: 25, name: 'Cafeteria - Eastway' },
        { id: 26, name: 'Cafeteria - Hub' },
        { id: 27, name: 'Tennis Courts' },
        { id: 28, name: 'Soccer Fields' },
        { id: 29, name: 'Track & Field' },
        { id: 30, name: 'Baseball Diamond' }
      ];
      
      try {
        console.log('📡 Making API calls to Flask server...');
        
        // Try multiple endpoints to improve connectivity
        const baseURLs = ['http://localhost:5000', 'http://127.0.0.1:5000'];
        let categoriesData = null;
        let locationsData = null;
        
        for (const baseURL of baseURLs) {
          if (!categoriesData || !locationsData) {
            try {
              console.log(`🔄 Trying ${baseURL}...`);
              
              if (!categoriesData) {
                const categoriesRes = await fetch(`${baseURL}/api/categories`, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                  signal: AbortSignal.timeout(5000) // 5 second timeout
                });
                
                if (categoriesRes.ok) {
                  categoriesData = await categoriesRes.json();
                  console.log('✅ Categories loaded from API:', categoriesData.length, 'items');
                }
              }
              
              if (!locationsData) {
                const locationsRes = await fetch(`${baseURL}/api/locations`, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                  signal: AbortSignal.timeout(5000) // 5 second timeout
                });
                
                if (locationsRes.ok) {
                  locationsData = await locationsRes.json();
                  console.log('✅ Locations loaded from API:', locationsData.length, 'items');
                }
              }
              
              if (categoriesData && locationsData) break;
              
            } catch (urlError) {
              console.log(`❌ ${baseURL} failed:`, urlError.message);
            }
          }
        }
        
        if (categoriesData) {
          setCategories(categoriesData);
        } else {
          console.log('📋 Using fallback categories');
          setCategories(fallbackCategories);
          setLoadingError('Categories API failed - using fallback data');
        }
        
        if (locationsData) {
          setLocations(locationsData);
        } else {
          console.log('📍 Using fallback locations');
          setLocations(fallbackLocations);
          setLoadingError(prev => prev ? prev + ' | Locations API failed' : 'Locations API failed - using fallback data');
        }
        
      } catch (error) {
        console.error('🚨 Network error, using fallback data:', error);
        setCategories(fallbackCategories);
        setLocations(fallbackLocations);
        setLoadingError(`Network error: ${error.message} - using fallback data`);
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Handle "Other" category selection
    if (name === 'category_id') {
      setShowCustomCategory(value === 'other');
      if (value !== 'other') {
        setFormData(prev => ({ ...prev, custom_category: '' }));
      }
    }

    // Handle "Other" location selection
    if (name === 'location_id') {
      setShowCustomLocation(value === 'other');
      if (value !== 'other') {
        setFormData(prev => ({ ...prev, custom_location: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const baseURLs = ['http://localhost:5000', 'http://127.0.0.1:5000'];
      let success = false;
      let result = null;

      const submitData = {
        ...formData,
        [tab === 'lost' ? 'date_lost' : 'date_found']: formData[tab === 'lost' ? 'date_lost' : 'date_found'],
        [tab === 'lost' ? 'time_lost' : 'time_found']: formData[tab === 'lost' ? 'time_lost' : 'time_found']
      };

      for (const baseURL of baseURLs) {
        try {
          const endpoint = tab === 'lost' 
            ? `${baseURL}/api/report-lost`
            : `${baseURL}/api/report-found`;

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submitData),
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });

          result = await response.json();

          if (response.ok) {
            success = true;
            break;
          }
        } catch (urlError) {
          console.log(`❌ ${baseURL} submission failed:`, urlError.message);
        }
      }

      if (success) {
        setMessage(`✅ ${tab === 'lost' ? 'Lost' : 'Found'} item reported successfully!`);
        // Reset form
        setFormData({
          title: '', description: '', category_id: '', location_id: '', color: '', size: '',
          date_lost: '', date_found: '', time_lost: '', time_found: '', user_name: '', user_email: '', 
          user_phone: '', additional_details: '', custom_category: '', custom_location: ''
        });
        setShowCustomCategory(false);
        setShowCustomLocation(false);
      } else {
        setMessage(`❌ Error: ${result?.error || 'Failed to submit to server'}`);
      }
    } catch (error) {
      setMessage('❌ Error submitting report. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };
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

          {loadingError && (
            <div className="mb-4 p-3 rounded-md bg-yellow-100 text-yellow-700">
              <strong>⚠️ API Connection Issue:</strong> {loadingError}
              <br />
              <small>Using fallback data. Check console for details.</small>
            </div>
          )}

          {message && (
            <div className={`mb-4 p-3 rounded-md ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="card max-w-xl space-y-3 p-5">
            <label className="block text-sm">
              Item Title*
              <input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2"
                placeholder={tab === "lost" ? "What did you lose?" : "What did you find?"}
                required
              />
            </label>

            <label className="block text-sm">
              Category*
              <select 
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2 text-sm max-h-40 overflow-y-auto"
                required
                size="1"
              >
                <option value="">Select a category</option>
                {categories.length > 0 ? (
                  categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading categories...</option>
                )}
                <option value="other">Other (specify below)</option>
              </select>
              {categories.length === 0 && (
                <small className="text-red-500">
                  Debug: Categories not loaded. Check console for errors.
                </small>
              )}
            </label>

            {showCustomCategory && (
              <label className="block text-sm">
                Custom Category*
                <input
                  name="custom_category"
                  value={formData.custom_category}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2"
                  placeholder="Enter custom category"
                  required
                />
              </label>
            )}

            <label className="block text-sm">
              Description*
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2"
                placeholder="Provide details of the item (color, notes, etc.)"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Color
                <input
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2"
                  placeholder="Item color"
                />
              </label>

              <label className="block text-sm">
                Size
                <input
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2"
                  placeholder="Item size"
                />
              </label>
            </div>

            <div>
              <div className="mb-1 text-sm">Upload Image</div>
              <div className="grid place-items-center rounded-md border-2 border-dashed border-border bg-panel p-10 text-neutral-600">
                Upload your image here or browse
              </div>
            </div>

            <label className="block text-sm">
              {tab === "lost" ? "Location* (Where did you lose it?)" : "Location* (Where did you find it?)"}
              <select 
                name="location_id"
                value={formData.location_id}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2 text-sm max-h-40 overflow-y-auto"
                required
                size="1"
              >
                <option value="">Select a location</option>
                {locations.length > 0 ? (
                  locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading locations...</option>
                )}
                <option value="other">Other (specify below)</option>
              </select>
              {locations.length === 0 && (
                <small className="text-red-500">
                  Debug: Locations not loaded. Check console for errors.
                </small>
              )}
            </label>

            {showCustomLocation && (
              <label className="block text-sm">
                Custom Location*
                <input
                  name="custom_location"
                  value={formData.custom_location}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2"
                  placeholder="Enter custom location"
                  required
                />
              </label>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Date*
                <input 
                  type="date" 
                  name={tab === "lost" ? "date_lost" : "date_found"}
                  value={formData[tab === "lost" ? "date_lost" : "date_found"]}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2" 
                  required
                />
              </label>

              <label className="block text-sm">
                Time (optional)
                <input 
                  type="time"
                  name={tab === "lost" ? "time_lost" : "time_found"}
                  value={formData[tab === "lost" ? "time_lost" : "time_found"]}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2"
                />
              </label>
            </div>

            <label className="block text-sm">
              Your Name*
              <input 
                name="user_name"
                value={formData.user_name}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2" 
                placeholder="Your full name"
                required
              />
            </label>

            <label className="block text-sm">
              Contact Email*
              <input 
                type="email"
                name="user_email"
                value={formData.user_email}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2" 
                placeholder="Your email address"
                required
              />
            </label>

            <label className="block text-sm">
              Phone Number (optional)
              <input 
                type="tel"
                name="user_phone"
                value={formData.user_phone}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2" 
                placeholder="Your phone number"
              />
            </label>

            <label className="block text-sm">
              Additional Details (optional)
              <textarea
                name="additional_details"
                value={formData.additional_details}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2"
                placeholder="Any additional information that might help..."
              />
            </label>

            <button 
              type="submit"
              disabled={loading}
              className={`btn w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Submitting...' : `Post ${tab === 'lost' ? 'Lost' : 'Found'} Item`}
            </button>
          </form>
        </main>
      </div>
    </Protected>
  );
}
