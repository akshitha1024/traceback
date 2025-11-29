# ML Matching Service Documentation

## Overview

The ML Matching Service uses machine learning to intelligently match lost and found items based on multiple features:

- **Text Similarity (40%)**: Uses a fine-tuned sentence transformer model to compare item descriptions
- **Image Similarity (25%)**: Compares item images using deep learning (ResNet50 + color features)
- **Location Match (15%)**: Binary match for exact location
- **Category Match (10%)**: Binary match for item category
- **Color Match (5%)**: Binary match for item color
- **Date Similarity (5%)**: Linear decay over 14-day window

### Match Score Formula

```
Match Score = 0.40 × Description_sim + 
              0.25 × Image_sim + 
              0.15 × Location_sim + 
              0.10 × Category_sim + 
              0.05 × Color_sim + 
              0.05 × Date_sim
```

## Installation

### Required Dependencies

```bash
pip install sentence-transformers torch numpy
```

### Optional Dependencies (for image similarity)

```bash
pip install opencv-python torchvision Pillow
```

Or install all at once:

```bash
pip install -r requirements_ml.txt
```

## API Endpoints

### User-Specific Endpoints

#### 1. Get User Reports with Matches

**GET** `/api/user/<user_id>/reports-with-matches`

Get all lost and found reports for a specific user with their ML matches (>30% similarity).

**Response:**
```json
{
  "user_id": 1,
  "lost_reports": [
    {
      "id": 123,
      "title": "Brown Wallet",
      "category_name": "Wallet",
      "location_name": "Library",
      "date_lost": "11/20/2025",
      "report_type": "LOST",
      "matches": [
        {
          "found_item_id": 456,
          "match_score": 0.7825,
          "description_similarity": 0.8912,
          "location_similarity": 1.0,
          "category_similarity": 1.0,
          "found_item": { /* full found item details */ }
        }
      ],
      "match_count": 1
    }
  ],
  "found_reports": [
    {
      "id": 789,
      "title": "Blue Backpack",
      "category_name": "Backpack",
      "location_name": "Student Center",
      "date_found": "11/21/2025",
      "report_type": "FOUND",
      "matches": [],
      "match_count": 0
    }
  ],
  "total_lost": 1,
  "total_found": 1,
  "total_reports": 2,
  "total_matches": 1
}
```

#### 2. Get User Matches Summary

**GET** `/api/user/<user_id>/matches-summary`

Get a quick summary of matches for a user's reports.

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

### General Matching Endpoints

#### 3. Find Matches for Lost Item

**GET** `/api/ml/matches/lost/<lost_item_id>`

Find matching found items for a specific lost item.

**Query Parameters:**
- `min_score` (optional): Minimum match score (default: 0.3)
- `top_k` (optional): Number of results to return (default: 10)

**Example:**
```bash
GET /api/ml/matches/lost/123?min_score=0.4&top_k=5
```

**Response:**
```json
{
  "lost_item_id": 123,
  "matches": [
    {
      "found_item_id": 456,
      "match_score": 0.7825,
      "description_similarity": 0.8912,
      "image_similarity": 0.7234,
      "location_similarity": 1.0,
      "category_similarity": 1.0,
      "color_similarity": 0.0,
      "date_similarity": 0.8571,
      "found_item": { /* full found item details */ }
    }
  ],
  "count": 1
}
```

### 2. Find Matches for Found Item

**GET** `/api/ml/matches/found/<found_item_id>`

Find matching lost items for a specific found item.

**Query Parameters:**
- `min_score` (optional): Minimum match score (default: 0.3)
- `top_k` (optional): Number of results to return (default: 10)

**Example:**
```bash
GET /api/ml/matches/found/456?min_score=0.4&top_k=5
```

**Response:**
```json
{
  "found_item_id": 456,
  "matches": [
    {
      "lost_item_id": 123,
      "match_score": 0.7825,
      "description_similarity": 0.8912,
      "image_similarity": 0.7234,
      "location_similarity": 1.0,
      "category_similarity": 1.0,
      "color_similarity": 0.0,
      "date_similarity": 0.8571,
      "lost_item": { /* full lost item details */ }
    }
  ],
  "count": 1
}
```

### 3. Calculate Match Score

**POST** `/api/ml/matches/calculate`

Calculate match score between a specific lost and found item.

**Request Body:**
```json
{
  "lost_item_id": 123,
  "found_item_id": 456
}
```

**Response:**
```json
{
  "lost_item_id": 123,
  "found_item_id": 456,
  "match_score": 0.7825,
  "description_similarity": 0.8912,
  "image_similarity": 0.7234,
  "location_similarity": 1.0,
  "category_similarity": 1.0,
  "color_similarity": 0.0,
  "date_similarity": 0.8571
}
```

### 4. Batch Match All Items

**GET** `/api/ml/matches/batch`

Find all potential matches between lost and found items.

**Query Parameters:**
- `min_score` (optional): Minimum match score (default: 0.3)
- `limit` (optional): Maximum number of results (default: 100)

**Example:**
```bash
GET /api/ml/matches/batch?min_score=0.5&limit=50
```

**Response:**
```json
{
  "matches": [
    {
      "lost_item_id": 123,
      "found_item_id": 456,
      "lost_item_title": "Brown Wallet",
      "found_item_title": "Leather Wallet",
      "match_score": 0.7825,
      "description_similarity": 0.8912,
      "image_similarity": 0.7234,
      "location_similarity": 1.0,
      "category_similarity": 1.0,
      "color_similarity": 0.0,
      "date_similarity": 0.8571
    }
  ],
  "count": 1,
  "min_score": 0.5
}
```

## Python Usage

### Initialize Service

```python
from ml_matching_service import MLMatchingService

# Initialize with database path
service = MLMatchingService(
    db_path='traceback_100k.db',
    upload_folder='uploads'
)
```

### Find Matches

```python
# Find matches for a lost item
matches = service.find_matches_for_lost_item(
    lost_item_id=123,
    min_score=0.3,
    top_k=10
)

# Find matches for a found item
matches = service.find_matches_for_found_item(
    found_item_id=456,
    min_score=0.3,
    top_k=10
)
```

### Calculate Match Score

```python
lost_item = {
    'description': 'Brown leather wallet',
    'category': 'Wallet',
    'location': 'Library',
    'color': 'Brown',
    'date_lost': '2025-11-20',
    'image_filename': 'lost_wallet.jpg'
}

found_item = {
    'description': 'Leather wallet found',
    'category': 'Wallet',
    'location': 'Library',
    'color': 'Brown',
    'date_found': '2025-11-21',
    'image_filename': 'found_wallet.jpg'
}

score_data = service.calculate_match_score(lost_item, found_item)
print(f"Match Score: {score_data['match_score']}")
```

## Understanding Match Scores

- **0.0 - 0.3**: Low match (unlikely to be the same item) - Not shown
- **0.3 - 0.4**: Moderate match (possible match, needs verification)
- **0.4 - 0.6**: Good match (likely the same item)
- **0.6 - 1.0**: Excellent match (very likely the same item)

**Default Threshold: 30%** - Only matches with 30% or higher similarity are shown to users

## Date Similarity Function

The date similarity uses linear decay over a 14-day window:

```python
def date_similarity_linear(delta_days, window=14):
    return max(0, 1 - (delta_days / window))
```

Examples:
- Same day: 1.0
- 7 days apart: 0.5
- 14 days apart: 0.0
- 20 days apart: 0.0

## Testing

Run the test script to verify the service is working:

```bash
python test_ml_matching.py
```

## Notes

- The text similarity model is pre-trained and fine-tuned on lost/found item descriptions
- Image similarity requires additional dependencies (opencv-python, torchvision)
- If image dependencies are not installed, image_similarity will return 0.0
- The service automatically handles missing or null values
- Match scores are cached for performance (future enhancement)

## Privacy Considerations

- The matching system respects the 72-hour privacy window for found items
- Only items that are publicly visible or within the ML matching window are included
- User contact information is never included in match results
- Match notifications are sent only to users who reported lost items
