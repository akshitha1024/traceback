
"use client";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportPage() {
  const router = useRouter();
  const [tab, setTab] = useState("lost");
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingError, setLoadingError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location_id: '1',
    color: '',
    date_lost: '',
    date_found: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  useEffect(() => {
    const curatedCategories = [
      'Electronics','Jewelry','Clothing','Bags','Keys','Books','Documents','Accessories','Toys','Kitchen'
    ].map((name, idx) => ({ id: `cur_${idx + 1}`, name }));

    setCategories(curatedCategories);

    // Restore previous location loading behavior: try backend, fallback to a simple list
    const curatedLocationsFallback = [ { id: 1, name: 'University Library' } ];

    const baseURLs = ['http://localhost:5000', 'http://127.0.0.1:5000'];
    let fetched = false;

    (async () => {
      for (const baseURL of baseURLs) {
        try {
          const res = await fetch(`${baseURL}/api/locations`);
          if (!res.ok) continue;
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setLocations(data);
            fetched = true;
            break;
          }
        } catch (err) {
          // try next
        }
      }

      if (!fetched) {
        setLocations(curatedLocationsFallback);
      }
    })();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Location field - no custom location option anymore
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('❌ Image file size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setMessage('❌ Please select a valid image file');
        return;
      }

      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
      console.log('✅ Image selected:', file.name, 'Size:', Math.round(file.size / 1024), 'KB');
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Reset the file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const baseURLs = ['http://localhost:5000', 'http://127.0.0.1:5000'];
      let success = false;
      let result = null;

      // Prepare form data for submission (including image if present)
      const submitData = new FormData();

      // Validate date (native date picker -> YYYY-MM-DD)
      const dateFieldName = tab === 'lost' ? 'date_lost' : 'date_found';
      const dateValue = formData[dateFieldName] || '';
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateValue)) {
        setMessage('❌ Please select a valid date');
        setLoading(false);
        return;
      }

      // Title & description
      submitData.append('title', formData.title || '');
      submitData.append('description', formData.description || '');

      // Category: send as label in custom_category for backend compatibility
      submitData.append('category_id', 'other');
      submitData.append('custom_category', formData.category || 'Misc');

      // Provide a default location_id to satisfy backend requirement
      submitData.append('location_id', formData.location_id || '1');
      // Date and time (automatically capture current ET time)
      submitData.append(dateFieldName, dateValue);
      
      // Add current time in ET timezone
      const timeFieldName = tab === 'lost' ? 'time_lost' : 'time_found';
      const now = new Date();
      // Convert to ET (America/New_York)
      const etTime = now.toLocaleTimeString('en-US', { 
        timeZone: 'America/New_York',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      submitData.append(timeFieldName, etTime);

      // Color (required) - contact details are associated with user profile
      submitData.append('color', formData.color || '');

      // Add user information from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      submitData.append('user_name', user.full_name || user.name || 'Anonymous');
      submitData.append('user_email', user.email || '');
      submitData.append('user_phone', user.phone || '');

      // Add image if selected
      if (selectedImage) {
        submitData.append('image', selectedImage);
        console.log('📸 Image included in submission:', selectedImage.name);
      }

      for (const baseURL of baseURLs) {
        try {
          const endpoint = tab === 'lost' 
            ? `${baseURL}/api/report-lost`
            : `${baseURL}/api/report-found`;

          const response = await fetch(endpoint, {
            method: 'POST',
            body: submitData, // Send FormData directly (no Content-Type header needed)
            signal: AbortSignal.timeout(15000) // 15 second timeout for image upload
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
        
        // If this is a found item, redirect to security questions page
        if (tab === 'found' && result?.item_id) {
          setTimeout(() => {
            router.push(`/found-item-questions/${result.item_id}`);
          }, 1500);
        } else {
          // For lost items, redirect to dashboard
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
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
              Category* <button type="button" onClick={()=>setShowCategoryModal(true)} className="text-xs underline ml-2">Learn more</button>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2 text-sm max-h-40 overflow-y-auto"
                  required
                  size="1"
                >
                  <option value="">Select a category</option>
                  {categories.length > 0 ? (
                    categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading categories...</option>
                  )}
                </select>
              {categories.length === 0 && (
                <small className="text-red-500">
                  Debug: Categories not loaded. Check console for errors.
                </small>
              )}
            </label>

            {/* No custom category input: all categories provided */}

            <label className="block text-sm">
              Description*
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2"
                placeholder="E.g., brand name, unique features, condition, scratches, text/logo on item..."
                required
              />
              <p className="mt-1 text-xs text-gray-600">
                💡 <strong>Hint:</strong> Please provide a brief description with identifying details (brand, model, unique features, condition, etc.). 
                <span className="text-gray-500"> Do not repeat color, location, date, or time - these are captured in separate fields.</span>
              </p>
            </label>

            <div className="grid grid-cols-1 gap-3">
              <label className="block text-sm mb-2">
                Color* (Select one)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {[
                  { name: 'Black', color: '#000000' },
                  { name: 'Blue', color: '#0066FF' },
                  { name: 'Red', color: '#FF0000' },
                  { name: 'Brown', color: '#8B4513' },
                  { name: 'Silver', color: '#C0C0C0' },
                  { name: 'White', color: '#FFFFFF' },
                  { name: 'Grey', color: '#808080' },
                  { name: 'Gold', color: '#FFD700' },
                  { name: 'Pink', color: '#FF69B4' },
                  { name: 'Green', color: '#00FF00' },
                  { name: 'Orange', color: '#FF8800' },
                  { name: 'Yellow', color: '#FFFF00' },
                  { name: 'Purple', color: '#800080' },
                  { name: 'Multicolor', color: 'linear-gradient(135deg, red, orange, yellow, green, blue, purple)' }
                ].map((colorOption) => (
                  <label
                    key={colorOption.name}
                    className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all hover:shadow-lg ${
                      formData.color === colorOption.name
                        ? 'border-blue-600 ring-2 ring-blue-300 shadow-md'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={colorOption.name}
                      checked={formData.color === colorOption.name}
                      onChange={handleInputChange}
                      className="sr-only"
                      required
                    />
                    <div
                      className="w-full h-12 rounded-md mb-2 border border-gray-300"
                      style={{
                        background: colorOption.color,
                        boxShadow: colorOption.name === 'White' ? 'inset 0 0 0 1px #ccc' : 'none'
                      }}
                    />
                    <div className="text-xs font-medium text-gray-700">{colorOption.name}</div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1 text-sm">Upload Image (Optional)</div>
              {!imagePreview ? (
                <label 
                  htmlFor="image-upload" 
                  className="grid place-items-center rounded-md border-2 border-dashed border-border bg-panel p-10 text-neutral-600 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <div className="font-medium">Click to upload image</div>
                    <div className="text-sm text-gray-500 mt-1">
                      JPG, PNG, GIF up to 5MB
                    </div>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-md border border-border bg-panel p-4">
                  <div className="flex items-start gap-4">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded-md border"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{selectedImage?.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Size: {Math.round(selectedImage?.size / 1024)} KB
                      </div>
                      <div className="flex gap-2 mt-2">
                        <label 
                          htmlFor="image-upload"
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-pointer hover:bg-blue-200"
                        >
                          Change Image
                        </label>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              )}
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
              </select>
              {locations.length === 0 && (
                <small className="text-red-500">
                  Debug: Locations not loaded. Check console for errors.
                </small>
              )}
            </label>

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

            {/* Contact fields removed — contact info is taken from the reporter's profile */}

            <button 
              type="submit"
              disabled={loading}
              className={`btn w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Submitting...' : `Post ${tab === 'lost' ? 'Lost' : 'Found'} Item`}
            </button>
          </form>
          {/* Category "Learn more" modal */}
          {showCategoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black opacity-40" onClick={()=>setShowCategoryModal(false)} />
              <div className="relative z-10 w-full max-w-2xl bg-white rounded-md shadow-lg p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Categories — Examples</h3>
                  <button className="text-sm text-gray-600" onClick={()=>setShowCategoryModal(false)}>Close</button>
                </div>
                <div className="mt-4 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500">
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Examples</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Electronics','Phone, Charger, Laptop, Headphones etc...'],
                        ['Jewelry','Ring, Necklace, Bracelet, Watch etc...'],
                        ['Clothing','Jacket, Hoodie, Sweater etc...'],
                        ['Bags','Backpack, Tote, Purse etc...'],
                        ['Keys','Keyring, Car Key, Dorm Key etc...'],
                        ['Books','Textbook, Notebook, Planner etc...'],
                        ['Documents','ID, Passport, Certificates etc...'],
                        ['Accessories','Sunglasses, Hat, Belt etc...'],
                        ['Toys','Plush, Puzzle, Game etc...'],
                        ['Kitchen','Utensils, Water Bottle, Mug etc...']
                      ].map(([cat, examples]) => (
                        <tr key={cat} className="border-t">
                          <td className="py-2 font-medium">{cat}</td>
                          <td className="py-2 text-gray-700">{examples}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Protected>
  );
}
