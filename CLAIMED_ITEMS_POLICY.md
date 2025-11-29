# Claimed Items - 3-Day Retention Policy

## Overview
When a found item is successfully claimed (finder verifies the claimer's answers), the item enters a 3-day retention period before being permanently deleted from the system.

## How It Works

### 1. Item Gets Claimed
- User submits answers to security questions
- Finder reviews answers and marks as "Claimed"
- `found_items.status` changes to `'CLAIMED'`
- `found_items.claimed_date` is set to current timestamp
- Claimer receives notification of verification

### 2. 3-Day Public Display
- Claimed items appear in `/claimed-items` page for **3 days only**
- Shows countdown: "Deletes in 3 days", "Deletes in 2 days", "Deletes tomorrow"
- True owners can dispute false claims during this period
- Anyone can report if they believe it's their item

### 3. Automatic Deletion
- After 3 days, items are permanently deleted
- Cleanup runs:
  - Automatically when server starts
  - Every 24 hours at 2:00 AM (via scheduler)
  - Manually via API endpoint `/api/cleanup-claimed-items`

## Database Changes

### New Columns Added
```sql
ALTER TABLE found_items ADD COLUMN status TEXT DEFAULT 'ACTIVE';
ALTER TABLE found_items ADD COLUMN claimed_date TEXT;
```

### Possible Status Values
- `'ACTIVE'` - Normal found item, not claimed
- `'CLAIMED'` - Verified claim, in 3-day retention period

## Implementation Files

### Backend
- **comprehensive_app.py**
  - `cleanup_old_claimed_items()` - Deletes items older than 3 days
  - `POST /api/cleanup-claimed-items` - Manual cleanup endpoint
  - `POST /api/update-claim-attempt` - Sets claimed_date when marking as claimed
  - `GET /api/claimed-items` - Returns items from last 3 days only

- **cleanup_scheduler.py** - Background scheduler
  - Runs cleanup every 24 hours at 2:00 AM
  - Can be started with `start-cleanup-scheduler.bat`

### Frontend
- **app/claimed-items/page.js**
  - Shows 3-day countdown for each item
  - Warning banner about 3-day policy
  - "This is My Item" button for disputes

## Usage

### Start the Cleanup Scheduler
```bash
cd backend
python cleanup_scheduler.py
```

Or use the batch file:
```bash
cd backend
start-cleanup-scheduler.bat
```

### Manual Cleanup
```bash
curl -X POST http://localhost:5000/api/cleanup-claimed-items
```

## Important Notes

1. **No Recovery**: Once deleted after 3 days, items cannot be recovered
2. **Dispute Window**: Users have only 3 days to dispute false claims
3. **Automatic**: Deletion happens automatically, no manual intervention needed
4. **Notifications Fixed**: Updated to use correct schema (no `user_id` column)

## Security Considerations

- Short 3-day window reduces storage requirements
- Gives legitimate owners time to dispute
- Prevents system clutter with old claimed items
- Items are truly given to claimers after 3 days

## Troubleshooting

### Scheduler Not Running
- Ensure `schedule` package is installed: `pip install schedule==1.2.0`
- Check if scheduler process is running
- View scheduler logs for errors

### Items Not Deleting
- Check if `claimed_date` is set correctly
- Verify server timezone matches database timezone
- Run manual cleanup to test: `/api/cleanup-claimed-items`

### Notification Errors
- Notifications table schema: `user_email`, `notification_type`, `item_id`, `item_type`, `title`, `message`
- Does NOT have: `user_id`, `type`, `related_item_id`
- Fixed in latest update
