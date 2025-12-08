"use client";



import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function EditProfile() {
  const nav = useRouter();
  const [userType, setUserType] = useState("student"); // "student" or "staff"
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
  const [studentIdError, setStudentIdError] = useState("");

  // Fetch all profile data from backend for editing
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (!currentUser || !currentUser.id) {
          nav.push('/login');
          return;
        }

        // Fetch complete profile from backend
        const response = await fetch(`http://localhost:5000/api/profile/${currentUser.id}`);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.profile) {
            const profile = result.profile;
            
            // Check if profile is completed
            if (!profile.profile_completed) {
              // No completed profile, redirect to create
              nav.push('/profile/create');
              return;
            }

            // Prefill ALL fields except student ID from backend
            setFormData({
              firstName: profile.first_name || '',
              lastName: profile.last_name || '',
              studentId: '', // Never prefill student ID
              department: profile.major || '',
              year: profile.year_of_study || '',
              program: profile.building_preference || '',
              bio: profile.bio || '',
              interests: profile.interests || ''
            });

            // Set profile photo preview if exists
            if (profile.profile_image_url) {
              setPhotoPreview(profile.profile_image_url);
            }
          } else {
            // No profile found, redirect to create
            nav.push('/profile/create');
          }
        } else {
          nav.push('/profile/create');
        }
      } catch (e) {
        console.error('Error loading profile:', e);
        nav.push('/profile/create');
      }
    };

    loadProfileData();
  }, [nav]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special validation for student ID
    if (name === "studentId") {
      // Remove any non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      
      // Limit to 9 digits
      const limitedValue = digitsOnly.slice(0, 9);
      
      setFormData(prev => ({
        ...prev,
        [name]: limitedValue
      }));
      
      // Show error if not exactly 9 digits (when user is done typing)
      if (limitedValue.length > 0 && limitedValue.length !== 9) {
        setStudentIdError("Student ID must be exactly 9 digits");
      } else {
        setStudentIdError("");
      }
    } else if (name === "program") {
      // Reset year when program changes since year options are different
      setFormData(prev => ({
        ...prev,
        [name]: value,
        year: "" // Clear year selection
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate ID before submission
    if (!formData.studentId || formData.studentId.length !== 9) {
      setStudentIdError(`${userType === "student" ? "Student" : "Employee/Staff"} ID must be exactly 9 digits`);
      alert(`Please enter a valid 9-digit ${userType === "student" ? "Student" : "Employee/Staff"} ID`);
      return;
    }

    // Validate year for students
    if (userType === "student" && !formData.year) {
      alert("Please select your year of study");
      return;
    }
    
    setLoading(true);
    
    try {
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!currentUser) {
        alert('Please log in to create a profile');
        nav.push('/login');
        return;
      }

      let imageUploadResult = null;
      
      // Upload profile photo first if selected
      if (profilePhoto) {
        const imageFormData = new FormData();
        imageFormData.append('image', profilePhoto);
        
        const imageResponse = await fetch(`http://localhost:5000/api/profile/${currentUser.id}/image`, {
          method: 'POST',
          body: imageFormData
        });
        
        imageUploadResult = await imageResponse.json();
        
        if (!imageUploadResult.success) {
          throw new Error(imageUploadResult.message || 'Failed to upload profile photo');
        }
      }
      
      // Update profile data
      const profileUpdateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        student_id: formData.studentId,
        bio: formData.bio,
        interests: formData.interests,
        year_of_study: userType === "student" ? formData.year : null,
        major: formData.department,
        building_preference: formData.program,
        user_type: userType,
        notification_preferences: 'email',
        privacy_settings: 'standard'
      };
      
      const profileResponse = await fetch(`http://localhost:5000/api/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileUpdateData)
      });
      
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => ({ message: 'Failed to update profile' }));
        console.error('Profile update failed:', profileResponse.status);
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const profileResult = await profileResponse.json();
      
      if (profileResult.success) {
        // Determine if this was an edit or create based on whether profile was already completed
        const wasEditing = currentUser.profile_completed === true || currentUser.profile_completed === 1;
        
        // Update localStorage with new profile data and ensure profile_completed is true
        const updatedUser = { 
          ...currentUser, 
          ...profileResult.profile,
          profile_completed: true,
          first_name: formData.firstName,
          last_name: formData.lastName,
          bio: formData.bio,
          year_of_study: formData.year,
          major: formData.department
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Also save the legacy format for compatibility
        const profileData = {
          ...formData,
          hasPhoto: profilePhoto !== null,
          photoSize: profilePhoto ? profilePhoto.size : null,
          photoType: profilePhoto ? profilePhoto.type : null
        };
        localStorage.setItem("studentProfile", JSON.stringify(profileData));
        if (profilePhoto && imageUploadResult) {
          localStorage.setItem("studentProfilePhoto", imageUploadResult.image_url);
        }
        
        const successMessage = wasEditing ? 'Profile updated successfully!' : 'Profile created successfully!';
        alert(successMessage);
        nav.push("/dashboard");
      } else {
        throw new Error(profileResult.message || 'Failed to update profile');
      }
      
    } catch (error) {
      console.error('Profile operation error:', error);
      const userMessage = error.message.includes('verify your information') 
        ? error.message 
        : 'Failed to update profile. Please try again.';
      alert(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    "Accessories", "Accounting", "Accounting Analytics", "Accounting Fundamentals", "Accounting Technology", "Acting", "Actuarial Mathematics",
    "Adapted Physical Education", "Addictions Counseling", "Adult Gerontology Acute Care Nurse Practitioner", "Adult Gerontology Clinical Nurse Specialist",
    "Adult Gerontology Primary Care Nurse Practitioner", "Adult/Adolescent Sexual Assault Nurse Examiner", "Advanced Accounting",
    "Advanced Semiconductor Manufacturing Technician", "Advertising", "Aeronautical Studies", "Aeronautical Systems Engineering Technology",
    "Aerospace Engineering", "African Studies", "Africana Studies", "Air Traffic and Airspace Management", "Aircraft Dispatch",
    "Alcohol, Tobacco and Other Drug Prevention", "American Sign Language", "American Sign Language/English Interpreting",
    "Ancient, Medieval and Renaissance Studies", "Animation Game Design", "Anthropology", "Applied Data and Information", "Applied Geology",
    "Applied Mathematics", "Applied Media", "Applied Statistics", "Arabic", "Arabic Translation", "Architectural History", "Architectural Studies",
    "Architecture", "Architecture and Environmental Design", "Art Education", "Art History", "Artificial Intelligence", "Arts Entrepreneurship",
    "Athletic Coaching", "Athletic Training", "Audiology", "Autism Spectrum Disorders", "Aviation Law and Policy", "Aviation Maintenance Management",
    "Aviation Management", "Aviation Management and Logistics", "Aviation Weather", "Behavioral Intervention Specialist", "Biochemistry",
    "Bioethics and Health Humanities", "Bioinformatics", "Biological Sciences", "Biology", "Biology for Environmental Management and Conservation",
    "Biomedical Sciences", "Biostatistics", "Biotechnology", "Brewing Technology", "Broadcast Engineering Technology", "Business", "Business Administration",
    "Business Analytics", "Business German", "Business Management", "Business Management Technology", "Business Russian", "Business Spanish",
    "CAD for Manufacturing", "Career and Academic Advising", "Career and Community Studies", "Career-Based Intervention", "Career-Technical Teacher Education",
    "Ceramics", "Chemistry", "Child and Youth Practice", "Chinese", "Classics", "Climate Change", "Clinical Epidemiology", "Clinical Mental Health Counseling",
    "Clinical Psychology", "Clinical Rehabilitation Counseling", "Clinical Research", "College Teaching", "Communication and Advocacy",
    "Communication and Information", "Communication Sciences and Disorders", "Communication Studies", "Community College Leadership",
    "Community Health Education", "Community Health Worker Supervision", "Computed Tomography", "Computer Engineering Technology",
    "Computer Forensics and Information Security", "Computer Forensics and Security", "Computer Information Systems", "Computer Science",
    "Computer Technology", "Computer-Aided Drafting/Design Technician", "Computers and Geosciences", "Construction Management", "Counseling",
    "Counselor Education and Supervision", "Creative Writing", "Criminology and Criminal Justice", "Criminology and Justice Studies",
    "Cultural Foundations", "Curriculum and Instruction", "Cybercriminology", "Cybersecurity", "Cybersecurity Engineering", "Cybersecurity Foundations",
    "Dance", "Dance Studies", "Data Analytics", "Data Science", "Deaf Education Multiple Disabilities", "Design", "Digital Media Production",
    "Disability Studies and Community Inclusion", "Drawing", "Early Childhood Education", "Early Intervention", "Early Years Education and Care",
    "Earth Science", "Economics", "Education", "Educational Leadership K-12", "Educational Psychology", "Educational Technology",
    "Electrical/Electronic Engineering Technology", "Electronics", "Emerging Media and Technology", "Engineering Technology", "English", "Enology",
    "Entrepreneurship", "Environment, Peace and Justice", "Environmental and Conservation Biology", "Environmental Geographic Information Science",
    "Environmental Geology", "Environmental Health Sciences", "Environmental Studies", "Epidemiology", "Esports",
    "Essentials for Business Decision Making", "Ethnomusicology", "Event Management", "Event Planning", "Exercise Physiology", "Exercise Science",
    "Family Nurse Practitioner", "Fashion Design", "Fashion Industry Studies", "Fashion Media", "Fashion Merchandising", "Finance",
    "Financial Management", "Floriculture", "Forensic Anthropology", "French", "French for the Professions", "French Translation",
    "Game Design", "Game Programming", "Gender and Sexuality Studies", "General Business", "Geographic Information Science", "Geography",
    "Geology", "German", "German Studies", "German Translation", "Gerontology", "Gifted Education", "Glass", "Global Issues", "Greek",
    "Greenhouse Production", "Health Education and Promotion", "Health Informatics", "Health Policy and Management", "Health Services Administration",
    "Health Systems and Facilities Design", "Health Technologies and Informatics", "Healthcare Compliance", "Healthcare Design",
    "Healthcare Systems Management", "Help Desk Support", "Higher Education Administration", "Higher Education Administration and Student Affairs",
    "Historic Preservation", "History", "Horticulture", "Horticulture Technology", "Hospitality and Event Management", "Hospitality and Tourism Management",
    "Hospitality Management", "Human Development and Family Science", "Human Disease", "Human Resource Management", "Human Services", "Human Sexuality",
    "Industrial Engineering Technology", "Information Technology", "Innovation", "Institutional Research and Assessment", "Insurance Studies",
    "Integrated Health Studies", "Integrated Language Arts", "Integrated Mathematics", "Integrated Science", "Integrated Social Studies",
    "Integrative Studies", "Interior Design", "International Business", "International Family Science", "International Studies",
    "Internationalization of Higher Education", "Interprofessional Leadership", "Italian", "Italian Studies", "Japanese", "Japanese Translation",
    "Jazz Studies", "Jewelry, Metals and Enameling", "Jewish Studies", "Journalism", "Journalism Education", "Knowledge Management",
    "Landscape Architecture", "Latin", "Latin American Studies", "Leadership", "Leadership and Management", "Leading Through Challenge",
    "Learning Science", "Lesbian, Gay, Bisexual, Transgender and Queer Studies", "LGBTQ+ Public Health", "Liberal Studies",
    "Library and Information Science", "Life Science", "Life Science/Chemistry", "Long-Term Care Administration", "Magnetic Resonance Imaging",
    "Mammography", "Management", "Marketing", "Materials Science", "Mathematics", "Mathematics for Secondary School Teachers",
    "Mechanical Engineering Technology", "Mechatronics Engineering", "Mechatronics Engineering Technology", "Media Advocacy", "Medical Anthropology",
    "Medical Assisting", "Medical Billing", "Medical Laboratory Science", "Medical Librarianship", "Microbiology", "Middle Childhood Education",
    "Mild to Moderate Special Education", "Military and Leadership Studies", "Modeling and Animation", "Music", "Music Education",
    "Music in Audio Recording", "Music Technology", "Music Theory", "Musical Theatre", "Negotiation, Mediation and Conflict Management",
    "Neuroscience", "Nonprofit Management", "Nonprofit Studies", "Nurse Educator", "Nursing", "Nursing Administration and Health Systems Leadership",
    "Nursing ADN", "Nursing for Registered Nurses", "Nursing Home Administration", "Nutrition", "Occupational Therapy Assistant",
    "Office Software Applications", "Office Technology", "Ohio Superintendent's Licensure", "Online and Blended Learning", "Painting",
    "Paleontology", "Paralegal Studies", "Park Management", "Peace and Conflict Studies", "Peace Officers Training Academy",
    "Pediatric Primary Care Nurse Practitioner", "Performance", "Philosophy", "Photography", "Photojournalism", "Physical Education and Sport Performance",
    "Physical Science", "Physical Therapist Assistant Technology", "Physics", "Plant Biology", "Podiatric Medicine", "Political Science",
    "Pre-Health", "Pre-Law", "Print Media and Photography", "Professional and Technical Writing", "Professional Pilot", "Professional Sales",
    "Professional Studies", "Psychiatric Mental Health Nurse Practitioner", "Psychological Science", "Psychology", "Public Administration",
    "Public Health", "Public Relations", "Pure Mathematics", "Qualitative Research", "Quantitative Business Management",
    "Quantitative Methods in Econometrics", "Race, Gender and Social Justice", "Radiologic Imaging Sciences", "Radiologic Technology",
    "Reading", "Recreation Management", "Recreation, Park and Tourism Management", "Religion Studies", "Research, Measurement and Statistics",
    "Respiratory Care", "Respiratory Therapy", "Russian", "Russian Literature, Culture and Translation", "Russian Studies", "Russian Translation",
    "Safety, Quality and Lean in Manufacturing", "School Counseling", "School Health Education", "School Library Media", "School Psychology",
    "Sculpture and Expanded Media", "Secondary Education", "Semiconductor Manufacturing Technician", "Social and Behavioral Sciences",
    "Social Work", "Society, Health and Medicine", "Sociology", "Software Development", "Spanish", "Spanish Translation", "Special Education",
    "Speech Language Pathology", "Speech Pathology and Audiology", "Sport Administration", "Sport, Exercise and Performance Psychology",
    "Sports Medicine", "Studio Art", "Sustainability", "Teaching and Learning with Technology", "Teaching English as a Foreign Language",
    "Teaching English as a Second Language", "Technical and Applied Studies", "Technical Modeling Design", "Technology", "Textiles",
    "Theatre Design and Technology", "Theatre Design, Technology and Production", "Theatre Performance", "Theatre Studies", "Tourism Management",
    "Translation", "Translation Studies", "Unmanned Aircraft Systems", "Unmanned Aircraft Systems Flight Operations", "Urban Design",
    "Urban Studies", "User Experience", "User Experience Design", "Veterinary Technology", "Visual Communication Design", "Viticulture",
    "Web Design and Development", "Web Programming", "Women's Health Nurse Practitioner", "Women's Studies", "World Literature and Cultures",
    "World Music", "Zoology", "Other"
  ];

  const studentPrograms = [
    "Undergraduate",
    "Graduate (Master's)",
    "PhD",
    "Other"
  ];

  const getYearOptions = () => {
    if (formData.program === "Undergraduate") {
      return ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
    } else if (formData.program === "Graduate (Master's)") {
      return ["1st Year", "2nd Year"];
    } else if (formData.program === "PhD") {
      return ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year"];
    } else {
      return ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
    }
  };

  const staffRoles = [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Lecturer",
    "Teaching Assistant",
    "Research Assistant",
    "Administrative Staff",
    "Technical Staff",
    "Support Staff",
    "Other"
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
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium shadow-md">
          ⚠️ Profile Required
        </div>
      </header>

      {/* Mandatory Notice Banner */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Profile Completion Required</h3>
              <p className="mt-1 text-sm">Update your profile information. Student ID is required for verification each time you edit.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Creation Form */}
      <div className="flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Edit Your Profile</h2>
              <p className="text-gray-600">Let others in the campus community know who you are when you report items</p>
              <p className="text-sm text-gray-500 mt-2">
                📝 <strong>Note:</strong> Your contact details will remain private and secure
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  I am a *
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setUserType("student")}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      userType === "student"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">🎓</div>
                    <div className="font-semibold">Student</div>
                    <div className="text-xs text-gray-500 mt-1">Undergraduate, Graduate, or PhD</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("staff")}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      userType === "staff"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">👨‍🏫</div>
                    <div className="font-semibold">Professor/Staff</div>
                    <div className="text-xs text-gray-500 mt-1">Faculty or Administrative Staff</div>
                  </button>
                </div>
              </div>

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
                    {userType === "student" ? "Student ID" : "Employee/Staff ID"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${studentIdError ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200`}
                    placeholder={userType === "student" ? "Enter your 9-digit student ID" : "Enter your employee/staff ID"}
                    pattern="[0-9]{9}"
                    maxLength={9}
                    inputMode="numeric"
                    required
                  />
                  {studentIdError && (
                    <p className="mt-1 text-sm text-red-500">{studentIdError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {userType === "student" 
                      ? "Must be exactly 9 digits (numbers only)" 
                      : "Your institutional ID (9 digits)"}
                  </p>
                </div>
              </div>

              {/* Academic/Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  {userType === "student" ? "Academic Information" : "Professional Information"}
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department/Major *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Select your department{userType === "student" ? "/major" : ""}</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {userType === "student" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Program of Study *
                      </label>
                      <select
                        name="program"
                        value={formData.program}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                      >
                        <option value="">Select program</option>
                        {studentPrograms.map((program) => (
                          <option key={program} value={program}>{program}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year of Study *
                      </label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.program}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{formData.program ? "Select year" : "Select program first"}</option>
                        {getYearOptions().map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      {formData.program && (
                        <p className="mt-1 text-xs text-gray-500">
                          {formData.program === "Undergraduate" && "4-5 years typical"}
                          {formData.program === "Graduate (Master's)" && "2 years typical"}
                          {formData.program === "PhD" && "4-6 years typical"}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role/Position *
                    </label>
                    <select
                      name="program"
                      value={formData.program}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="">Select your role</option>
                      {staffRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Privacy & Visibility Information</h4>
                    <div className="space-y-2 text-sm text-blue-700">
                      <p className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>We <strong>do not</strong> show your contact email to people unnecessarily. It's only shared when required for item returns or claims.</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Everything in your profile is visible to other users <strong>except your Student ID and contact email</strong>.</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>When you choose to connect with someone, they can see your contact email <strong>but not your Student ID</strong>.</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Your Student ID is used only for identity verification and is never shared with anyone.</span>
                      </p>
                    </div>
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
                  "Update Profile"
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