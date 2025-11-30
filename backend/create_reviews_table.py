import sqlite3
from datetime import datetime, timedelta

# Connect to database
conn = sqlite3.connect('traceback_100k.db', timeout=20)
conn.execute('PRAGMA journal_mode=WAL')

# Create reviews table
conn.execute('''
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    item_found TEXT,
    image_filename TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved INTEGER DEFAULT 1
)
''')

print('✅ Reviews table created successfully')

# Insert sample reviews
sample_reviews = [
    {
        'user_name': 'Sarah Johnson',
        'user_email': 'sjohnso8@kent.edu',
        'rating': 5,
        'review_text': 'Amazing service! I lost my laptop in the library and found it within 2 days thanks to TrackeBack. The notification system is quick and the staff at the Student Center were incredibly helpful. Highly recommend to all Kent State students!',
        'item_found': 'MacBook Pro',
        'image_filename': None,
        'created_at': (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S')
    },
    {
        'user_name': 'Michael Chen',
        'user_email': 'mchen12@kent.edu',
        'rating': 5,
        'review_text': 'TrackeBack saved my semester! Lost my wallet with my student ID and credit cards at the Rec Center. Someone found it and posted on TrackeBack, and I got it back the same day with everything intact. This system is a lifesaver for the Kent State community!',
        'item_found': 'Wallet with IDs and cards',
        'image_filename': None,
        'created_at': (datetime.now() - timedelta(days=12)).strftime('%Y-%m-%d %H:%M:%S')
    },
    {
        'user_name': 'Emily Rodriguez',
        'user_email': 'erodrig5@kent.edu',
        'rating': 4,
        'review_text': 'Great platform for connecting lost items with their owners. I found someone\'s AirPods in the MSCC and was able to return them easily through TrackeBack. The matching system is intuitive and the email notifications work perfectly. Would be nice to have a mobile app, but overall excellent service!',
        'item_found': 'Keys with Kent State keychain',
        'image_filename': None,
        'created_at': (datetime.now() - timedelta(days=8)).strftime('%Y-%m-%d %H:%M:%S')
    }
]

for review in sample_reviews:
    conn.execute('''
        INSERT INTO reviews (user_name, user_email, rating, review_text, item_found, image_filename, created_at, is_approved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        review['user_name'],
        review['user_email'],
        review['rating'],
        review['review_text'],
        review['item_found'],
        review['image_filename'],
        review['created_at'],
        1
    ))

conn.commit()
print(f'✅ Inserted {len(sample_reviews)} sample reviews')

# Verify
cursor = conn.execute('SELECT COUNT(*) FROM reviews')
count = cursor.fetchone()[0]
print(f'📊 Total reviews in database: {count}')

conn.close()
print('✅ Database setup complete!')
