"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateProfile() {
  const nav = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    department: "",
    year: "",
    program: "",
    bio: "",
    interests: ""
  });
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Photo size should be less than 5MB");
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert("Please select a valid image file");
        return;
      }

      setProfilePhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview(null);
    // Clear the file input
    const fileInput = document.getElementById('profile-photo');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate profile creation
    setTimeout(() => {
      // Save profile data with photo (in real app, this would be an API call)
      const profileData = {
        ...formData,
        hasPhoto: profilePhoto !== null,
        photoSize: profilePhoto ? profilePhoto.size : null,
        photoType: profilePhoto ? profilePhoto.type : null
      };
      localStorage.setItem("studentProfile", JSON.stringify(profileData));
      if (profilePhoto) {
        // In a real app, you'd upload the photo to a server here
        localStorage.setItem("studentProfilePhoto", photoPreview);
      }
      nav.push("/dashboard");
    }, 1000);
  };

  const departments = [
    "Computer Science",
    "Information Technology", 
    "Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Business Administration",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Literature",
    "Psychology",
    "Other"
  ];

  const years = [
    "1st Year",
    "2nd Year", 
    "3rd Year",
    "4th Year",
    "Graduate",
    "PhD"
  ];

  const programs = [
    "Bachelor's Degree",
    "Master's Degree",
    "PhD Program",
    "Diploma",
    "Certificate Course"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 lg:px-12">
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
          <Image 
            src="/logo.png" 
            alt="Traceback Logo" 
            width={200} 
            height={60}
            className="h-12 w-auto sm:h-16"
          />
        </Link>
        <Link href="/dashboard" className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
          Skip for Now
        </Link>
      </header>

      {/* Profile Creation Form */}
      <div className="flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Profile</h2>
              <p className="text-gray-600">Let other students know who you are when you report items</p>
              <p className="text-sm text-gray-500 mt-2">
                📝 <strong>Note:</strong> Your contact details will remain private and secure
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Profile Photo <span className="text-sm font-normal text-gray-500">(Optional)</span>
                </h3>
                
                <div className="flex flex-col items-center space-y-4">
                  {/* Photo Preview */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-center">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-xs">No Photo</span>
                        </div>
                      )}
                    </div>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex flex-col items-center space-y-2">
                    <label htmlFor="profile-photo" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-gray-300">
                      📷 Choose Photo
                    </label>
                    <input
                      type="file"
                      id="profile-photo"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Max size: 5MB • Formats: JPG, PNG, GIF<br/>
                      This will help other students recognize you
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                      placeholder="Enter your first name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                    placeholder="Enter your student ID"
                  />
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Academic Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Select your department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year *
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="">Select year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program *
                    </label>
                    <select
                      name="program"
                      value={formData.program}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="">Select program</option>
                      {programs.map((program) => (
                        <option key={program} value={program}>{program}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Additional Information <span className="text-sm font-normal text-gray-500">(Optional)</span>
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 resize-none"
                    placeholder="Tell others a little about yourself (visible to other students)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests/Hobbies
                  </label>
                  <input
                    type="text"
                    name="interests"
                    value={formData.interests}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                    placeholder="e.g., Photography, Music, Sports, Gaming..."
                  />
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-blue-500 text-lg">🔒</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">Privacy Protection</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your contact details (email, phone) are kept private and will never be shown to other students. 
                      Only your name, profile photo (if uploaded), and academic information will be visible when you report lost or found items.
                      Your profile photo is completely optional and can be removed at any time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:hover:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Profile...
                  </div>
                ) : (
                  "Create Profile"
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                You can always update your profile information later in settings
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}