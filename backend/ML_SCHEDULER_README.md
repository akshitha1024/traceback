# ML Matching Scheduler

## Overview

The ML Matching Scheduler automatically runs machine learning-based matching between lost and found items every hour. This ensures that new reports are continuously matched with potential matches.

## Features

- **Automatic Matching**: Runs every 1 hour
- **Smart Image Comparison**: Uses image similarity when both items have photos (25% weight)
- **Text Analysis**: Analyzes descriptions using fine-tuned BERT model (40% weight)
- **Multi-Factor Scoring**: Considers location, category, color, and dates
- **60% Threshold**: Only shows matches with ≥60% confidence score
- **Unclaimed Items Only**: Only matches unclaimed found items

## Match Score Formula

When both items have images:
```
Match Score = 0.40 × Description + 0.25 × Image + 0.15 × Location + 
              0.10 × Category + 0.05 × Color + 0.05 × Date
```

When either item lacks an image (weights redistributed):
```
Match Score = 0.533 × Description + 0.200 × Location + 0.133 × Category + 
              0.067 × Color + 0.067 × Date
```

## Running the Scheduler

### Option 1: ML Matching Only
```bash
# Windows
start-ml-scheduler.bat

# Linux/Mac
python ml_scheduler.py
```

### Option 2: Combined Scheduler (ML + Cleanup)
```bash
# Windows
start-combined-scheduler.bat

# Linux/Mac
python combined_scheduler.py
```

The combined scheduler runs:
- **ML Matching**: Every 1 hour
- **Cleanup**: Daily at 2:00 AM (removes claimed items older than 3 days)

## Output Example

```
🕐 Starting ML Matching Scheduler for TrackeBack
⏰ ML matching will run every hour
🤖 Matches with ≥60% confidence will be shown in dashboard

[2025-11-25 10:00:00] 🤖 Starting ML Matching Process...
[2025-11-25 10:00:00] 📊 Processing 45 found items against 38 lost items...
   🎯 High confidence match: Found #12 ↔ Lost #8 (85.3%)
   🎯 High confidence match: Found #23 ↔ Lost #15 (82.1%)
[2025-11-25 10:00:05] ✅ ML Matching Complete!
   📈 Total matches found: 67
   ⭐ High confidence matches (≥80%): 8
   📊 Average matches per found item: 1.49

⏳ Waiting for next scheduled run (in 1 hour)...
```

## How It Works

1. **Every Hour**:
   - Scheduler wakes up and fetches all unclaimed found items
   - For each found item, it searches for matching lost items
   - Uses ML model to calculate similarity scores
   - Only keeps matches with ≥60% confidence

2. **Image Similarity**:
   - If both items have images: Uses ResNet-50 deep features + color analysis
   - If either lacks image: Skips image comparison, redistributes weights

3. **Dashboard Display**:
   - Matches are automatically available via API
   - Dashboard shows matches with their confidence scores
   - Users can view detailed breakdown of each match

## API Endpoints

The scheduler doesn't create new endpoints - it processes data that's served through existing APIs:

- `GET /api/user/<user_id>/reports-with-matches` - Dashboard with matches
- `GET /api/lost-items/<id>` - Lost item details with found matches
- `GET /api/found-items/<id>` - Found item details with lost matches
- `GET /api/ml/matches/lost/<id>` - Direct ML matches for lost item
- `GET /api/ml/matches/found/<id>` - Direct ML matches for found item

## Stopping the Scheduler

Press `Ctrl+C` to stop the scheduler gracefully.

## Production Deployment

For production, consider using a process manager like:

### Windows Service
```bash
# Using NSSM (Non-Sucking Service Manager)
nssm install TrackeBackScheduler "C:\path\to\python.exe" "C:\path\to\combined_scheduler.py"
nssm start TrackeBackScheduler
```

### Linux Systemd
```bash
# Create /etc/systemd/system/trackeback-scheduler.service
[Unit]
Description=TrackeBack ML Matching Scheduler
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/python3 combined_scheduler.py
Restart=always

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable trackeback-scheduler
sudo systemctl start trackeback-scheduler
```

### Docker
```dockerfile
# Add to docker-compose.yml
scheduler:
  build: ./backend
  command: python combined_scheduler.py
  volumes:
    - ./backend:/app
  depends_on:
    - backend
```

## Monitoring

Check logs to monitor scheduler activity:
- Timestamps for each run
- Number of matches found
- High confidence matches highlighted
- Error messages if any issues occur

## Troubleshooting

**Scheduler not starting?**
- Ensure database exists: `traceback_100k.db`
- Check Python dependencies: `pip install -r requirements.txt`
- Verify ML model exists: `traceback_text_similarity_model/`

**No matches found?**
- Check if there are unclaimed found items
- Verify lost items exist in database
- Ensure items have descriptions
- Check match threshold (default 60%)

**High memory usage?**
- Image similarity uses deep learning models
- Consider reducing `top_k` parameter
- Process items in smaller batches if needed
