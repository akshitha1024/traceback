# Quick Start Guide: One-Attempt Feature

## What Was Implemented

### ✅ For Users Who Want to Claim Items:

**1. Warning Before You Start**
When you try to claim an item, you'll see a prominent warning:

```
⚠️ Important: One-Attempt Policy

You can only answer these security questions ONE TIME. 
Once you submit your answers, you cannot try again—even if you get them wrong.

Make sure you're confident about your answers before submitting.
```

**2. Blocking After First Attempt**
If you try to claim the same item again:

```
⚠️ Already Attempted

You have already attempted to claim this item on November 25, 2024.

One-Attempt Policy
To prevent spam and false claims, each user can only answer 
the security questions once per item.

Your attempt was: Unsuccessful ❌

[Back to Found Items]  [Go to Dashboard]
```

### ✅ For People Who Posted Found Items:

**1. View All Claim Attempts**
From your Dashboard → "Claims on Your Found Items" → Click "👁️ View All Claim Attempts for This Item"

You'll see:
- List of everyone who tried to claim
- Their email and contact info
- When they tried
- Their score (e.g., "67% - 2/3 correct")
- **All their answers** with ✓ or ✗ for each question
- What the correct answers were

**2. Privacy Protected**
- Only YOU (the finder) can see these answers
- Other users cannot see what others answered
- This helps you verify if someone truly knew the details

## How to Test It

### Test 1: Try to Claim an Item Twice

1. Go to Found Items page
2. Click "Claim This Item" on any item
3. Answer the questions and submit
4. Go back and try to claim the SAME item again
5. ✅ You should see the "Already Attempted" blocking page

### Test 2: View Attempts as Finder

1. Log in as the person who posted a found item
2. Go to Dashboard
3. Scroll to "Claims on Your Found Items"
4. Click "View All Claim Attempts for This Item"
5. ✅ You should see all attempts with full answer details

### Test 3: Try to View Someone Else's Attempts

1. Log in as any user
2. Manually go to: `/claim-attempts/1` (replace 1 with any item ID)
3. ✅ If you're not the finder, you should get a 403 error page

## Quick Commands

**Start Backend:**
```bash
cd backend
python comprehensive_app.py
```

**Start Frontend:**
```bash
npm run dev
```

**Run Tests:**
```bash
cd backend
python test_one_attempt_viewing.py
```

## API Endpoints

### Check if User Already Attempted
```
GET /api/check-claim-attempt/<found_item_id>?user_email=user@kent.edu
```

Response:
```json
{
  "has_attempted": true,
  "attempt": {
    "attempted_at": "2024-11-25 10:30:00",
    "success": false
  },
  "message": "You have already attempted..."
}
```

### View All Attempts (Finder Only)
```
GET /api/claim-attempts/<found_item_id>?finder_email=finder@kent.edu
```

Response:
```json
{
  "attempts": [
    {
      "user_email": "claimer@kent.edu",
      "attempted_at": "2024-11-25 10:30:00",
      "success": false,
      "answers_with_questions": [
        {
          "question": "What color was it?",
          "user_answer": "B",
          "correct_answer": "A",
          "is_correct": false
        }
      ]
    }
  ]
}
```

## Files You Can Edit

### Want to Change the Warning Message?
Edit: `app/verify/[id]/page.js`
Look for: "⚠️ Important: One-Attempt Policy"

### Want to Customize the Attempts View?
Edit: `app/claim-attempts/[id]/page.js`
Change colors, layout, or displayed information

### Want to Add More Stats?
Edit: `backend/comprehensive_app.py`
Find: `@app.route('/api/claim-attempts/<int:found_item_id>')`

## Common Questions

**Q: Can I give someone a second chance?**
A: Not currently implemented. The database constraint prevents it. 
   (This could be added as a "whitelist" feature in the future)

**Q: Can admins see all attempts?**
A: Not currently. Only the finder can see attempts for their items.
   (Admin view could be added)

**Q: What if someone answers from a different email?**
A: Each email gets one attempt. Different emails = different attempts.

**Q: Can I see who attempted to claim my item in real-time?**
A: Not currently. You need to manually check the dashboard.
   (Email notifications could be added)

## Summary

✅ Users can only answer once per item
✅ Clear warnings shown before and after
✅ Only finders can see the answers
✅ All attempts logged in database
✅ Color-coded correct/incorrect answers
✅ Full contact info for follow-up

Everything is working and ready to use! 🎉
