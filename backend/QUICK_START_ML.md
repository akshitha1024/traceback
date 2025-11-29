# Quick Start - ML Matching System

## 🚀 Start the Server

```bash
cd backend
python comprehensive_app.py
```

## 📊 Get User's Reports with Matches

**Endpoint:** `GET /api/user/{user_id}/reports-with-matches`

**Example:**
```bash
curl http://localhost:5000/api/user/1/reports-with-matches
```

**Response includes:**
- All lost reports by user with their matches (>30% similarity)
- All found reports by user with their matches (>30% similarity)
- Match scores breakdown (description, location, category, color, date)
- Full item details for each match

## 📈 Get Quick Summary

**Endpoint:** `GET /api/user/{user_id}/matches-summary`

**Example:**
```bash
curl http://localhost:5000/api/user/1/matches-summary
```

**Response:**
```json
{
  "user_id": 1,
  "lost_reports": 5,
  "found_reports": 3,
  "total_reports": 8,
  "total_matches": 12,
  "high_confidence_matches": 4,
  "has_matches": true
}
```

## 🔍 How Matching Works

### Match Formula (30% Minimum Threshold)
- **50%** - Description similarity (semantic text matching)
- **20%** - Location match (exact)
- **15%** - Category match (exact)
- **8%** - Color match (exact)
- **7%** - Date similarity (14-day window)

### Example:
Lost: "Brown wallet lost at Library on 11/20"
Found: "Leather wallet found near Library on 11/21"

**Result: ~75% Match**
- Description: 85% (semantic similarity)
- Location: 100% (Library = Library)
- Category: 100% (Wallet = Wallet)
- Color: 0% (not specified)
- Date: 93% (1 day apart)

## 📱 Frontend Integration

### Fetch User's Matches
```javascript
const response = await fetch(`/api/user/${userId}/reports-with-matches`);
const data = await response.json();

// Display lost reports with matches
data.lost_reports.forEach(report => {
  console.log(`Lost: ${report.title}`);
  console.log(`Matches: ${report.match_count}`);
  
  report.matches.forEach(match => {
    console.log(`  - Found Item #${match.found_item_id}`);
    console.log(`    Score: ${(match.match_score * 100).toFixed(1)}%`);
  });
});

// Display found reports with matches
data.found_reports.forEach(report => {
  console.log(`Found: ${report.title}`);
  console.log(`Matches: ${report.match_count}`);
  
  report.matches.forEach(match => {
    console.log(`  - Lost Item #${match.lost_item_id}`);
    console.log(`    Score: ${(match.match_score * 100).toFixed(1)}%`);
  });
});
```

## 🎯 Match Score Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| 30-40% | Possible match | Review details |
| 40-60% | Good match | Contact recommended |
| 60-80% | Strong match | Likely the same item |
| 80-100% | Excellent match | Very high confidence |

## 🛠️ Testing

```bash
# Test ML service
python test_ml_matching.py

# Test user matches (server must be running)
python test_user_matches.py

# Check score distribution
python test_score_distribution.py
```

## 📝 API Response Example

```json
{
  "user_id": 1,
  "lost_reports": [
    {
      "id": 5,
      "title": "Brown Leather Wallet",
      "description": "Lost my brown wallet with ID cards",
      "category_name": "Wallet",
      "location_name": "Library",
      "date_lost": "11/20/2025",
      "time_lost": "02:30 PM",
      "report_type": "LOST",
      "match_count": 2,
      "matches": [
        {
          "found_item_id": 12,
          "match_score": 0.7825,
          "description_similarity": 0.8912,
          "location_similarity": 1.0,
          "category_similarity": 1.0,
          "color_similarity": 1.0,
          "date_similarity": 0.8571,
          "found_item": {
            "id": 12,
            "title": "Wallet Found",
            "location_name": "Library",
            "date_found": "11/21/2025"
          }
        }
      ]
    }
  ],
  "found_reports": [...],
  "total_lost": 3,
  "total_found": 2,
  "total_reports": 5,
  "total_matches": 4
}
```

## 🔐 Notes

- **Privacy**: Found items respect 72-hour privacy window
- **Threshold**: 30% minimum (configurable via min_score parameter)
- **Performance**: Optimized for real-time matching
- **Accuracy**: Improves with more detailed descriptions
