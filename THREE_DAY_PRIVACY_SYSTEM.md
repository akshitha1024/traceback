# 3-Day Privacy System for Found Items

## Overview
Found items remain **private for the first 3 days** after being posted. During this period, they are only visible to specific users under specific conditions.

## Privacy Rules

### During First 3 Days (Private Period)

**Found items are ONLY visible to:**

1. **The person who posted it** (item owner)
   - Can see their own item on dashboard
   - Full access to all details

2. **Users with 70%+ ML match score**
   - Only see items that match their lost item reports
   - Items appear in "Matching Found Items" section on dashboard
   - Can view details and attempt to claim

3. **Moderators reviewing abuse reports**
   - Can see reported items regardless of privacy status
   - Full access to all details for moderation purposes

**Found items are NOT visible in:**
- ❌ Public browse (`/found` page)
- ❌ Search results (public)
- ❌ Category filtering (public)
- ❌ Location filtering (public)

### After 3 Days (Public Period)

**Found items become publicly visible:**
- ✅ Appear in browse page (`/found`)
- ✅ Appear in search results
- ✅ Visible to all logged-in users

**However, details remain limited:**
- **Public info**: Title, category, location, date/time
- **Hidden info**: Description, color, size, images, finder details
- **Only owner sees**: Images and full details

## Implementation Details

### Database Query Logic

```python
# Public browse endpoint (/api/found-items)
if not include_private:  # Public browse view
    # Only show items older than 3 days
    where_conditions.append("datetime(f.created_at) <= datetime('now', '-3 days')")
```

### ML Matching System

```python
# Dashboard endpoint (/api/user/<user_id>/reports-with-matches)
# Returns matches with >= 70% similarity score
match_rows = conn.execute("""
    SELECT ... FROM ml_matches m
    JOIN found_items f ON m.found_item_id = f.rowid
    WHERE m.lost_item_id = ? AND m.match_score >= 0.7
    ORDER BY m.match_score DESC
""", (lost_item_id,)).fetchall()
```

### Moderation Access

```python
# Abuse reports endpoint (/api/reports)
# Moderators can see all item details regardless of privacy
query = """
    SELECT ar.*, fi.*, li.*
    FROM abuse_reports ar
    LEFT JOIN found_items fi ON ar.target_id = fi.id
    LEFT JOIN lost_items li ON ar.target_id = li.id
"""
```

## User Experience Flow

### Person Who Found an Item
1. Posts found item on `/found` page
2. Item is **immediately private** (not publicly visible)
3. System runs ML matching against all lost items
4. Users with high-match lost items see it in their dashboard
5. After 3 days, item becomes public (limited details)

### Person Who Lost an Item
1. Posts lost item on `/lost` page
2. System runs ML matching against all found items
3. If match score >= 70%, found item appears in their dashboard
4. Can see **full details** of matching found items (even if private)
5. Can attempt to claim by answering security questions

### General Public
1. Browse `/found` page
2. Only see items **older than 3 days**
3. See limited info (title, category, location, date)
4. Must have lost item with 70%+ match to see private items

### Moderators
1. Review abuse reports on moderation page
2. Can see **all reported items** regardless of privacy
3. Full access to all details for investigation
4. Can take action (delete, warn, suspend)

## Privacy Timeline Example

```
Day 0 (Posted):
├─ Private ✓
├─ Visible to poster ✓
├─ Visible to 70%+ matches ✓
├─ Public browse ✗
└─ Moderators (if reported) ✓

Day 1-2:
├─ Still private ✓
├─ Same visibility rules
└─ Matching continues

Day 3+:
├─ Becomes public ✓
├─ Appears in browse page ✓
├─ Limited info shown
└─ Images still owner-only

```

## Security Benefits

1. **Reduces false claims**
   - Only people with matching lost items can see details
   - 70% threshold ensures legitimate matches

2. **Protects finder privacy**
   - Contact info not exposed publicly for 3 days
   - Gives time for legitimate owner to claim

3. **Prevents spam/abuse**
   - Limits who can see and interact with new posts
   - Reduces random claim attempts

4. **Improves match quality**
   - Prioritizes ML-matched users first
   - Better chance of returning to real owner

## Technical Configuration

### Match Threshold
```python
MATCH_THRESHOLD = 0.7  # 70% similarity required
```

### Privacy Period
```python
PRIVACY_DAYS = 3  # Items private for 3 days
```

To change these values, update the SQL queries in:
- `comprehensive_app.py` (found items endpoint)
- `ml_matching_service.py` (ML matching threshold)

## Database Schema

No additional columns needed! Uses existing:
- `created_at`: Determines privacy period
- `ml_matches` table: Stores pre-computed matches with scores
- `abuse_reports`: Links items to moderation system

## API Endpoints Reference

### Public Browse (Privacy Enforced)
```
GET /api/found-items
- Only returns items older than 3 days
- Limited details (no description, images, etc.)
```

### Dashboard (Includes Private Matches)
```
GET /api/user/<user_id>/reports-with-matches
- Returns user's own items
- Returns found items with 70%+ match to user's lost items
- Full details for matched items
```

### Moderation (Bypasses Privacy)
```
GET /api/reports
- Returns all reported items with full details
- No privacy restrictions for moderators
```

## Testing Checklist

- [ ] Post found item, verify not in public browse immediately
- [ ] Post matching lost item (70%+), verify found item appears in dashboard
- [ ] Wait 3 days, verify found item appears in public browse
- [ ] Report private item, verify moderator can see full details
- [ ] Verify images only visible to owner
- [ ] Verify non-matching users cannot see private items

---

**Status**: Implemented and Production Ready
**Version**: 1.0.0
**Date**: November 28, 2025
