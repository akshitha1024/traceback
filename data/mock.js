export const lostItems = [
  { 
    id: "l1", 
    type: "LOST", 
    title: "Car Keys with Toyota Keychain", 
    description: "Silver Toyota keychain with black car keys. Had a small blue tag with my name.",
    location: "Math & Science Building 101", 
    date: "Sep 10, 2025", 
    ago: "10 min ago", 
    category: "Keys", 
    match: 93,
    color: "Silver/Black",
    size: "Small",
    reportedBy: "Alice Johnson"
  },
  { 
    id: "l2", 
    type: "LOST", 
    title: "Chemistry Textbook", 
    description: "Organic Chemistry textbook, 3rd edition. Has yellow highlighter marks and my name written inside.",
    location: "Chemistry Lab Building", 
    date: "Sep 9, 2025", 
    ago: "50 min ago", 
    category: "Books",
    color: "Blue/White",
    size: "Large",
    reportedBy: "Bob Smith"
  },
  { 
    id: "l3", 
    type: "LOST", 
    title: "MacBook Pro 13", 
    description: "13-inch MacBook Pro, space gray. Has several programming stickers on the back.",
    location: "Library 2F", 
    date: "Sep 8, 2025", 
    ago: "1 hr ago", 
    category: "Electronics",
    color: "Space Gray",
    size: "Medium",
    reportedBy: "Charlie Brown"
  },
  { 
    id: "l4", 
    type: "LOST", 
    title: "Black Wallet", 
    description: "Black leather wallet with student ID and some cash. Has a photo of my family inside.",
    location: "Student Center", 
    date: "Sep 7, 2025", 
    ago: "2 hrs ago", 
    category: "Wallets",
    color: "Black",
    size: "Small",
    reportedBy: "Diana Lee"
  },
  { 
    id: "l5", 
    type: "LOST", 
    title: "Red Sports Bottle", 
    description: "Red metal water bottle with university logo. Has some dents on the bottom.",
    location: "Gym", 
    date: "Sep 6, 2025", 
    ago: "3 hrs ago", 
    category: "Bottles",
    color: "Red",
    size: "Medium",
    reportedBy: "Eva Martinez"
  }
];

export const foundItems = [
  { 
    id: "f1", 
    type: "FOUND", 
    title: "Blue Nike Backpack", 
    description: "Navy blue Nike backpack with white logo. Found with some textbooks and a laptop inside.",
    location: "Student Center", 
    date: "Oct 20, 2025", 
    ago: "1 day ago", 
    category: "Bags & Backpacks",
    color: "Navy Blue",
    size: "Large",
    reportedBy: "Frank Wilson",
    reportedByEmail: "frank.wilson@kent.edu",
    reportedByPhone: "+1 (330) 555-0123",
    reportedAt: "2025-10-20T14:30:00Z", // Recent - within 30 days
    isPrivate: true,
    publicAt: "2025-11-20T14:30:00Z", // 1 month later
    canClaim: false,
    securityQuestions: [
      {
        question: "What brand laptop was inside the backpack?",
        answer: "apple",
        type: "text"
      },
      {
        question: "How many textbooks were found inside?",
        answer: "3",
        type: "number"
      },
      {
        question: "What color were the zippers?",
        answer: "white",
        type: "text"
      }
    ]
  },
  { 
    id: "f2", 
    type: "FOUND", 
    title: "iPhone 14 with Clear Case", 
    description: "iPhone 14 in a clear protective case. Has a popsocket on the back.",
    location: "Cafeteria", 
    date: "Oct 19, 2025", 
    ago: "2 days ago", 
    category: "Electronics",
    color: "Black/Clear",
    size: "Small",
    reportedBy: "Grace Chen",
    reportedByEmail: "grace.chen@kent.edu",
    reportedByPhone: "+1 (330) 555-0456",
    reportedAt: "2025-10-19T13:45:00Z", // Recent - within 30 days
    isPrivate: true,
    publicAt: "2025-11-19T13:45:00Z", // 1 month later
    canClaim: false,
    securityQuestions: [
      {
        question: "What design is on the popsocket?",
        answer: "cat",
        type: "text"
      },
      {
        question: "What color is the phone itself (not the case)?",
        answer: "black",
        type: "text"
      },
      {
        question: "Is there a screen protector on the phone?",
        answer: "yes",
        type: "yesno"
      }
    ]
  },
  { 
    id: "f3", 
    type: "FOUND", 
    title: "Silver Toyota Keys", 
    description: "Toyota car keys with silver keychain. Has a small blue name tag attached.",
    location: "Math Building Entrance", 
    date: "Oct 18, 2025", 
    ago: "3 days ago", 
    category: "Keys",
    color: "Silver",
    size: "Small",
    reportedBy: "Henry Davis",
    reportedByEmail: "henry.davis@kent.edu", 
    reportedByPhone: "+1 (330) 555-0789",
    reportedAt: "2025-10-18T14:15:00Z", // Recent - within 30 days
    isPrivate: true,
    publicAt: "2025-11-18T14:15:00Z", // 1 month later
    canClaim: false,
    securityQuestions: [
      {
        question: "What year is written on the Toyota key?",
        answer: "2022",
        type: "number"
      },
      {
        question: "What initials are on the blue name tag?",
        answer: "mj",
        type: "text"
      },
      {
        question: "How many keys are on the keychain?",
        answer: "4",
        type: "number"
      }
    ]
  },
  { 
    id: "f4", 
    type: "FOUND", 
    title: "Black Leather Wallet", 
    description: "Black leather wallet found near the student center. Didn't open it for privacy.",
    location: "Student Center Parking", 
    date: "Oct 15, 2025", 
    ago: "6 days ago", 
    category: "Wallets",
    color: "Black",
    size: "Small",
    reportedBy: "Iris Johnson",
    reportedByEmail: "iris.johnson@kent.edu",
    reportedByPhone: "+1 (330) 555-0321",
    reportedAt: "2025-10-15T12:00:00Z", // Recent - within 30 days
    isPrivate: true,
    publicAt: "2025-11-15T12:00:00Z", // 1 month later
    canClaim: false,
    securityQuestions: [
      {
        question: "What brand is the wallet?",
        answer: "coach",
        type: "text"
      },
      {
        question: "Is there a coin pocket?",
        answer: "yes",
        type: "yesno"
      },
      {
        question: "What color is the stitching?",
        answer: "brown",
        type: "text"
      }
    ]
  },
  { 
    id: "f5", 
    type: "FOUND", 
    title: "MacBook Pro with Stickers", 
    description: "MacBook Pro found in library. Has programming and tech company stickers on it.",
    location: "Library 1F", 
    date: "Oct 10, 2025", 
    ago: "11 days ago", 
    category: "Electronics",
    color: "Space Gray",
    size: "Medium",
    reportedBy: "Jack Kim",
    reportedByEmail: "jack.kim@kent.edu",
    reportedByPhone: "+1 (330) 555-0654",
    reportedAt: "2025-10-10T11:30:00Z", // Recent - within 30 days
    isPrivate: true,
    publicAt: "2025-11-10T11:30:00Z", // 1 month later
    canClaim: false,
    securityQuestions: [
      {
        question: "What programming language sticker is most prominent?",
        answer: "python",
        type: "text"
      },
      {
        question: "What size is the MacBook (in inches)?",
        answer: "13",
        type: "number"
      },
      {
        question: "Is there a GitHub sticker on it?",
        answer: "yes",
        type: "yesno"
      }
    ]
  }
];

export const users = [
  { id: "u1", name: "Alice Johnson", email: "alice@example.com" },
  { id: "u2", name: "Bob Smith", email: "bob@example.com" },
  { id: "u3", name: "Charlie Brown", email: "charlie@example.com" },
  { id: "u4", name: "Diana Lee", email: "diana@example.com" },
  { id: "u5", name: "Eva Martinez", email: "eva@example.com" },
  { id: "u6", name: "Frank Wilson", email: "frank@example.com" },
  { id: "u7", name: "Grace Chen", email: "grace@example.com" },
  { id: "u8", name: "Henry Davis", email: "henry@example.com" },
  { id: "u9", name: "Iris Johnson", email: "iris@example.com" },
  { id: "u10", name: "Jack Kim", email: "jack@example.com" }
];

// Report categories and reasons
export const reportCategories = {
  INAPPROPRIATE_CONTENT: {
    label: "Inappropriate Content",
    reasons: [
      "Offensive language or hate speech",
      "Sexual or adult content",
      "Violence or threats",
      "Discriminatory content",
      "Other inappropriate content"
    ]
  },
  SPAM_FAKE: {
    label: "Spam or Fake",
    reasons: [
      "Fake or misleading item description",
      "Duplicate posting",
      "Spam or promotional content",
      "Not a genuine lost/found item",
      "Suspicious or fraudulent activity"
    ]
  },
  HARASSMENT: {
    label: "Harassment or Abuse",
    reasons: [
      "Harassment or bullying",
      "Impersonation",
      "Unwanted contact or messages",
      "Threatening behavior",
      "Privacy violation"
    ]
  },
  SAFETY_CONCERNS: {
    label: "Safety Concerns",
    reasons: [
      "Potential safety risk",
      "Suspicious meeting location",
      "Inappropriate contact requests",
      "Dangerous item description",
      "Other safety concerns"
    ]
  }
};

// Mock reports data
export const reports = [
  {
    id: "r1",
    type: "ITEM",
    targetId: "l2",
    targetTitle: "Chemistry Textbook",
    reportedBy: "Grace Chen",
    reportedById: "u7",
    category: "SPAM_FAKE",
    reason: "Duplicate posting",
    description: "This same textbook has been posted multiple times by different users.",
    status: "PENDING",
    priority: "MEDIUM",
    createdAt: "2025-10-14T10:30:00Z",
    updatedAt: "2025-10-14T10:30:00Z"
  },
  {
    id: "r2",
    type: "USER",
    targetId: "u3",
    targetTitle: "Charlie Brown",
    reportedBy: "Alice Johnson",
    reportedById: "u1",
    category: "HARASSMENT",
    reason: "Unwanted contact or messages",
    description: "User has been sending inappropriate messages after I contacted about a found item.",
    status: "REVIEWED",
    priority: "HIGH",
    createdAt: "2025-10-13T15:45:00Z",
    updatedAt: "2025-10-14T09:20:00Z",
    moderatorNotes: "Contacted user and issued warning. Monitoring for further reports."
  }
];
