# One-Attempt-Per-User Implementation

## Overview
This implementation ensures that users can only answer security questions **once per found item**, preventing spam and repeated false claim attempts. Additionally, only the person who posted the found item can view the answers that users submitted.

## Features Implemented

### 1. **Backend Endpoints**

#### Check Claim Attempt
- **Endpoint**: `GET /api/check-claim-attempt/<found_item_id>`
- **Query Params**: `user_email` (required)
- **Purpose**: Check if a user has already attempted to claim an item
- **Response**:
  ```json
  {
    "has_attempted": true/false,
    "attempt": {
      "attempt_id": 1,
      "attempted_at": "2024-11-25 10:30:00",
      "success": true/false,
      "answers_json": "{...}"
    },
    "message": "You have already attempted..."
  }
  ```

#### View Claim Attempts (Finder Only)
- **Endpoint**: `GET /api/claim-attempts/<found_item_id>`
- **Query Params**: `finder_email` (required)
- **Authorization**: Only the finder (person who posted the found item) can access
- **Purpose**: View all claim attempts with detailed answers
- **Response**:
  ```json
  {
    "attempts": [
      {
        "attempt_id": 1,
        "user_email": "user@kent.edu",
        "user_name": "John Doe",
        "attempted_at": "2024-11-25 10:30:00",
        "success": true,
        "answers_with_questions": [
          {
            "question": "What color was the item?",
            "user_answer": "B",
            "correct_answer": "B",
            "is_correct": true,
            "choices": {
              "A": "Red",
              "B": "Blue",
              "C": "Green",
              "D": "Yellow"
            }
          }
        ]
      }
    ],
    "total": 1
  }
  ```
- **Error (403)**: "Unauthorized: You can only view attempts for your own items"

### 2. **Frontend Pages**

#### Verify Ownership Page (`/verify/[id]`)
**Before Starting Questions:**
- Checks if user has already attempted via API call to `/api/check-claim-attempt`
- If already attempted, shows blocking page with:
  - ⚠️ Alert that they've already tried
  - Date of previous attempt
  - Result (successful/unsuccessful)
  - One-Attempt Policy explanation
  - Links to dashboard or back to found items

**During Questions:**
- Prominent warning banner at top:
  - "⚠️ Important: One-Attempt Policy"
  - Bold text: "You can only answer these security questions ONE TIME"
  - Reminder to think carefully before submitting

**After Submission:**
- Existing behavior (success/failure result)
- Attempt is logged in `claim_attempts` table with UNIQUE constraint

#### Claim Attempts Viewer Page (`/claim-attempts/[id]`)
**Access Control:**
- Only accessible to the finder who posted the item
- Shows 403 error if accessed by anyone else

**Display:**
- Lists all claim attempts (successful and failed)
- For each attempt shows:
  - User information (name, email, phone)
  - Attempt date/time
  - Success/failure status
  - Score (e.g., "67% - 2/3 correct")
  - Detailed answer breakdown:
    - Each question
    - User's answer with ✓ or ✗
    - Correct answer (if user was wrong)
    - Color-coded (green for correct, red for incorrect)

**Summary Stats:**
- Total attempts
- Number successful
- Number failed

### 3. **Dashboard Integration**

In the "Claims on Your Found Items" section:
- Added link: "View All Claim Attempts for This Item" 👁️
- Appears above the action buttons
- Routes to `/claim-attempts/[item_id]`
- Allows finders to review all attempts (not just successful ones)

## Database Schema

### `claim_attempts` Table
```sql
CREATE TABLE claim_attempts (
    attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    found_item_id INTEGER NOT NULL,
    user_id INTEGER,
    user_email TEXT NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT 0,
    answers_json TEXT,
    UNIQUE(found_item_id, user_email)  -- ONE ATTEMPT PER USER
)
```

**Key Features:**
- `UNIQUE(found_item_id, user_email)`: Database-level enforcement of one-attempt rule
- `answers_json`: Stores the answers for later review by finder
- `success`: Whether the attempt passed verification (≥67% correct)

## User Flow

### Claiming an Item (User's Perspective)

1. **Navigate to Item**
   - User finds an item in "Found Items" page
   - Clicks "Claim This Item"

2. **Check Previous Attempt**
   - System checks if user already attempted
   - If yes → Shows "Already Attempted" blocking page
   - If no → Proceeds to questions

3. **View Questions with Warning**
   - Sees prominent warning banner
   - "ONE TIME ONLY" messaging
   - Questions displayed one at a time

4. **Submit Answers**
   - All answers required
   - Backend logs attempt in `claim_attempts` table
   - If correct (≥67%) → Success, get finder contact
   - If incorrect → Failure, cannot retry

5. **After First Attempt**
   - Any future visit to `/verify/[id]` shows blocking page
   - Message: "You have already attempted to claim this item"
   - No way to answer again

### Viewing Attempts (Finder's Perspective)

1. **From Dashboard**
   - See "Claims on Your Found Items" section
   - Click "View All Claim Attempts for This Item" link

2. **View Attempts Page**
   - See list of all users who tried to claim
   - Both successful and failed attempts shown
   - Can review their answers vs correct answers

3. **Use Cases**
   - Verify that successful claimer answered correctly
   - Check failed attempts to see if someone had partial knowledge
   - Identify potential spam/fraudulent attempts
   - Contact failed claimers if their answers were close (manual decision)

## Security Features

1. **Database Constraint**
   - `UNIQUE(found_item_id, user_email)` prevents duplicate attempts at DB level
   - Even if frontend bypassed, backend blocks it

2. **Backend Validation**
   - Explicit check in `/api/verify-ownership` endpoint
   - Returns 403 with `already_attempted: true` if user tried before

3. **Frontend Checks**
   - Proactive check before showing questions
   - Better UX than letting user answer then blocking them

4. **Authorization**
   - Only finder can view attempts (verified via email match)
   - 403 error if unauthorized user tries to access

5. **Privacy**
   - Answers visible only to finder
   - Other users cannot see what others answered
   - Lost item owners don't see answers publicly

## Testing

### Automated Test Script
Run `python backend/test_one_attempt_viewing.py` to test:
- ✅ Check claim attempt endpoint
- ✅ View attempts (authorized)
- ✅ Block unauthorized access (403)
- ✅ Database table existence

### Manual Testing Flow

1. **Test One-Attempt Policy:**
   ```
   a. User A claims item #123 → Answers questions → Gets result
   b. User A tries to claim item #123 again → Blocked with message
   c. User B claims item #123 → Allowed (different user)
   ```

2. **Test Finder View:**
   ```
   a. Finder logs in
   b. Goes to Dashboard → "Claims on Your Found Items"
   c. Clicks "View All Claim Attempts for This Item"
   d. Sees all attempts with full answer details
   ```

3. **Test Unauthorized Access:**
   ```
   a. User C (not the finder) tries to access `/claim-attempts/123`
   b. Gets 403 error page
   ```

## Configuration

No configuration needed. Features are ready to use:
- Backend endpoints active
- Frontend pages created
- Database migrations already run
- No environment variables required

## Files Changed/Created

### Backend
- ✅ `comprehensive_app.py`:
  - Added `/api/check-claim-attempt/<id>` endpoint
  - Added `/api/claim-attempts/<id>` endpoint
  - Existing `/api/verify-ownership` already has one-attempt check

### Frontend
- ✅ `app/verify/[id]/page.js`:
  - Added `checkPreviousAttempt()` function
  - Added blocking UI for already-attempted users
  - Added prominent warning banner

- ✅ `app/claim-attempts/[id]/page.js` (NEW):
  - Full page to view claim attempts
  - Authorization check
  - Detailed answer display
  - Summary statistics

- ✅ `app/dashboard/page.js`:
  - Added "View All Claim Attempts" link

### Testing
- ✅ `backend/test_one_attempt_viewing.py` (NEW)

## API Usage Examples

### Frontend: Check Before Showing Questions
```javascript
const checkPreviousAttempt = async () => {
  const response = await fetch(
    `http://localhost:5000/api/check-claim-attempt/${foundItemId}?user_email=${user.email}`
  );
  
  const data = await response.json();
  if (data.has_attempted) {
    // Show blocking page
    setHasAttempted(true);
    setAttemptInfo(data.attempt);
  }
};
```

### Frontend: Load Attempts (Finder)
```javascript
const loadClaimAttempts = async () => {
  const response = await fetch(
    `http://localhost:5000/api/claim-attempts/${foundItemId}?finder_email=${finder.email}`
  );
  
  if (response.ok) {
    const data = await response.json();
    setAttempts(data.attempts);
  } else if (response.status === 403) {
    // Unauthorized
  }
};
```

## User Messages

### When Attempting to Claim Again:
> ⚠️ **Already Attempted**
> 
> You have already attempted to claim this item on November 25, 2024.
> 
> **One-Attempt Policy**
> 
> To prevent spam and false claims, each user can only answer the security questions **once per item**.
> 
> Your attempt was: **Unsuccessful ❌**
> 
> If you believe this is your item, please contact the finder or campus security.

### Before Starting Questions:
> ⚠️ **Important: One-Attempt Policy**
> 
> You can only answer these security questions **ONE TIME**. Once you submit your answers, you cannot try again—even if you get them wrong.
> 
> Make sure you're confident about your answers before submitting. Take your time and think carefully.

## Benefits

1. **Prevents Spam**: Users can't repeatedly guess answers
2. **Fair Process**: One chance per user ensures fairness
3. **Transparency**: Finders can see all attempts and make informed decisions
4. **Audit Trail**: All attempts logged with timestamps
5. **Privacy**: Answers only visible to finder, not other claimers
6. **Better UX**: Proactive warnings instead of surprise blocking

## Future Enhancements (Optional)

- [ ] Email notification to finder when someone attempts to claim
- [ ] Allow finder to "whitelist" a user for a second attempt (edge case)
- [ ] Show attempt statistics on found item detail page (e.g., "3 users attempted")
- [ ] Admin dashboard to view all attempts across all items
- [ ] Rate limiting (e.g., max 5 different items per hour per user)
