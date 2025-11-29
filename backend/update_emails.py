"""
Update TrackeBack Database Email Addresses
Changes all email addresses to @kent.edu domain
"""

import sqlite3
import random
import os

DB_PATH = "traceback_100k.db"

def generate_kent_email(name):
    """Generate a Kent State email from a name"""
    if not name:
        # Generate random Kent email if no name
        first_names = ['john', 'jane', 'mike', 'sarah', 'david', 'emily', 'chris', 'anna', 'alex', 'maria']
        last_names = ['smith', 'johnson', 'brown', 'davis', 'wilson', 'miller', 'taylor', 'anderson', 'thomas', 'jackson']
        first = random.choice(first_names)
        last = random.choice(last_names)
        return f"{first}.{last}@kent.edu"
    
    # Clean the name and create email
    name_parts = name.lower().replace(' ', '.').replace("'", "").replace("-", "")
    # Remove any non-alphabetic characters except dots
    clean_name = ''.join(c for c in name_parts if c.isalpha() or c == '.')
    
    # If name is too long, truncate
    if len(clean_name) > 20:
        clean_name = clean_name[:20]
    
    return f"{clean_name}@kent.edu"

def update_email_addresses():
    """Update all email addresses in the database to @kent.edu"""
    
    if not os.path.exists(DB_PATH):
        print("❌ Database not found!")
        return False
    
    print("📧 Updating TrackeBack Database Email Addresses")
    print("🏫 Converting all emails to @kent.edu domain")
    print("=" * 50)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Update lost_items emails
    print("📊 Updating lost_items email addresses...")
    
    cursor.execute("SELECT id, user_name, user_email FROM lost_items")
    lost_items = cursor.fetchall()
    
    updated_lost = 0
    for item_id, user_name, current_email in lost_items:
        if current_email:  # Only update if email exists
            new_email = generate_kent_email(user_name)
            cursor.execute("UPDATE lost_items SET user_email = ? WHERE id = ?", (new_email, item_id))
            updated_lost += 1
    
    print(f"   ✅ Updated {updated_lost:,} lost item emails")
    
    # Update found_items emails
    print("📊 Updating found_items email addresses...")
    
    cursor.execute("SELECT id, finder_name, finder_email FROM found_items")
    found_items = cursor.fetchall()
    
    updated_found = 0
    for item_id, finder_name, current_email in found_items:
        if current_email:  # Only update if email exists
            new_email = generate_kent_email(finder_name)
            cursor.execute("UPDATE found_items SET finder_email = ? WHERE id = ?", (new_email, item_id))
            updated_found += 1
    
    print(f"   ✅ Updated {updated_found:,} found item emails")
    
    # Commit changes
    conn.commit()
    
    # Verify the update
    print("\n📊 Verification - Sample email addresses after update:")
    
    print("\n📧 Sample Lost Item Emails:")
    cursor.execute("SELECT user_name, user_email FROM lost_items WHERE user_email IS NOT NULL LIMIT 10")
    for name, email in cursor.fetchall():
        print(f"   {name}: {email}")
    
    print("\n📧 Sample Found Item Emails:")
    cursor.execute("SELECT finder_name, finder_email FROM found_items WHERE finder_email IS NOT NULL LIMIT 10")
    for name, email in cursor.fetchall():
        print(f"   {name}: {email}")
    
    # Count total @kent.edu emails
    cursor.execute("SELECT COUNT(*) FROM lost_items WHERE user_email LIKE '%@kent.edu'")
    kent_lost_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM found_items WHERE finder_email LIKE '%@kent.edu'")
    kent_found_count = cursor.fetchone()[0]
    
    print(f"\n📈 Email Statistics:")
    print(f"   Lost items with @kent.edu: {kent_lost_count:,}")
    print(f"   Found items with @kent.edu: {kent_found_count:,}")
    print(f"   Total @kent.edu emails: {kent_lost_count + kent_found_count:,}")
    
    conn.close()
    
    print("\n🎉 Email addresses updated successfully!")
    print("🏫 All emails now use @kent.edu domain")
    
    return True

def verify_kent_emails():
    """Verify that all emails are @kent.edu"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n🔍 Email Domain Verification")
    print("=" * 30)
    
    # Check for any non-Kent emails in lost_items
    cursor.execute("SELECT COUNT(*) FROM lost_items WHERE user_email IS NOT NULL AND user_email NOT LIKE '%@kent.edu'")
    non_kent_lost = cursor.fetchone()[0]
    
    # Check for any non-Kent emails in found_items
    cursor.execute("SELECT COUNT(*) FROM found_items WHERE finder_email IS NOT NULL AND finder_email NOT LIKE '%@kent.edu'")
    non_kent_found = cursor.fetchone()[0]
    
    if non_kent_lost == 0 and non_kent_found == 0:
        print("✅ All email addresses are @kent.edu")
    else:
        print(f"❌ Found {non_kent_lost} non-Kent emails in lost_items")
        print(f"❌ Found {non_kent_found} non-Kent emails in found_items")
    
    conn.close()

if __name__ == "__main__":
    print("🚀 TrackeBack Email Domain Updater")
    print(f"⏰ {os.popen('date /t && time /t').read().strip()}")
    print()
    
    if update_email_addresses():
        verify_kent_emails()
    else:
        print("❌ Failed to update email addresses")