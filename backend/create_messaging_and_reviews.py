import sqlite3

# Connect to database
conn = sqlite3.connect('traceback_100k.db')
cursor = conn.cursor()

# Create messages table for direct messaging
cursor.execute('''
CREATE TABLE IF NOT EXISTS messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    sender_id INTEGER NOT NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    receiver_id INTEGER NOT NULL,
    receiver_name TEXT NOT NULL,
    receiver_email TEXT NOT NULL,
    message_text TEXT NOT NULL,
    item_id INTEGER,
    item_type TEXT,
    item_title TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
)
''')

print('✅ Messages table created successfully')

# Create conversations index for faster queries
cursor.execute('''
CREATE INDEX IF NOT EXISTS idx_conversation_id ON messages(conversation_id)
''')

cursor.execute('''
CREATE INDEX IF NOT EXISTS idx_sender_receiver ON messages(sender_id, receiver_id)
''')

print('✅ Message indexes created successfully')

# Update reviews table to support user-to-user reviews
cursor.execute('''
CREATE TABLE IF NOT EXISTS user_reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewer_id INTEGER NOT NULL,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT NOT NULL,
    reviewed_user_id INTEGER NOT NULL,
    reviewed_user_name TEXT NOT NULL,
    claim_id INTEGER,
    item_id INTEGER,
    item_title TEXT,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_type TEXT NOT NULL CHECK(review_type IN ('FINDER', 'CLAIMER', 'APP')),
    helpful_count INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_user_id) REFERENCES users(id),
    FOREIGN KEY (claim_id) REFERENCES ownership_claims(claim_id)
)
''')

print('✅ User reviews table created successfully')

# Create indexes for reviews
cursor.execute('''
CREATE INDEX IF NOT EXISTS idx_reviewed_user ON user_reviews(reviewed_user_id)
''')

cursor.execute('''
CREATE INDEX IF NOT EXISTS idx_reviewer ON user_reviews(reviewer_id)
''')

cursor.execute('''
CREATE INDEX IF NOT EXISTS idx_claim_reviews ON user_reviews(claim_id)
''')

print('✅ User review indexes created successfully')

conn.commit()

# Show table structures
print('\n📊 Messages table structure:')
cursor.execute('PRAGMA table_info(messages)')
for col in cursor.fetchall():
    print(f'  {col[1]} ({col[2]})')

print('\n📊 User reviews table structure:')
cursor.execute('PRAGMA table_info(user_reviews)')
for col in cursor.fetchall():
    print(f'  {col[1]} ({col[2]})')

conn.close()
print('\n✅ All tables and indexes created successfully!')
