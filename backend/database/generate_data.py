import mysql.connector
import random
import uuid
from datetime import datetime, timedelta
import json
from faker import Faker

fake = Faker()

# Database connection configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',  # Update with your MySQL password
    'database': 'traceback_db'
}

# Item templates by category with realistic descriptions and security questions
ITEM_TEMPLATES = {
    'Electronics': {
        'items': [
            {
                'titles': ['iPhone 15', 'iPhone 14', 'iPhone 13', 'Samsung Galaxy S24', 'Samsung Galaxy S23'],
                'colors': ['Black', 'White', 'Blue', 'Pink', 'Purple', 'Silver', 'Gold'],
                'brands': ['Apple', 'Samsung'],
                'descriptions': [
                    '{brand} {title} in {color} color with clear case',
                    '{brand} {title} ({color}) with cracked screen protector', 
                    '{title} in {color} with popsocket on back',
                    '{brand} phone ({color}) with custom phone case'
                ],
                'security_questions': [
                    ('What color is the phone case?', 'case_color', 'text'),
                    ('What brand popsocket is on the back?', 'popsocket_brand', 'text'),
                    ('Is there a screen protector?', 'screen_protector', 'yesno'),
                    ('What is the lock screen wallpaper theme?', 'wallpaper', 'text'),
                    ('How many apps are in the dock?', 'dock_apps', 'number')
                ]
            },
            {
                'titles': ['MacBook Pro', 'MacBook Air', 'Dell Laptop', 'HP Laptop', 'Lenovo ThinkPad'],
                'colors': ['Silver', 'Space Gray', 'Black', 'White'],
                'brands': ['Apple', 'Dell', 'HP', 'Lenovo'],
                'descriptions': [
                    '{brand} {title} ({color}) with programming stickers',
                    '{title} laptop in {color} with university stickers',
                    '{brand} laptop ({color}) with dented corner',
                    '{title} with {color} protective case'
                ],
                'security_questions': [
                    ('What programming language sticker is most visible?', 'prog_language', 'text'),
                    ('What is the screen size (inches)?', 'screen_size', 'number'),
                    ('Is there a webcam cover?', 'webcam_cover', 'yesno'),
                    ('What company sticker is on the lid?', 'company_sticker', 'text'),
                    ('How many USB ports are there?', 'usb_ports', 'number')
                ]
            },
            {
                'titles': ['AirPods Pro', 'AirPods', 'Sony Headphones', 'Beats Headphones'],
                'colors': ['White', 'Black', 'Blue', 'Red', 'Silver'],
                'brands': ['Apple', 'Sony', 'Beats', 'JBL'],
                'descriptions': [
                    '{brand} {title} in {color} case',
                    '{title} ({color}) with custom ear tips',
                    '{brand} headphones in {color} with carrying case',
                    'Wireless {title} in {color} charging case'
                ],
                'security_questions': [
                    ('What color is the charging case?', 'case_color', 'text'),
                    ('Are there custom ear tips?', 'custom_tips', 'yesno'),
                    ('What is engraved on the case?', 'engraving', 'text'),
                    ('Is there a lanyard attached?', 'lanyard', 'yesno')
                ]
            }
        ]
    },
    'Bags & Backpacks': {
        'items': [
            {
                'titles': ['Nike Backpack', 'Adidas Backpack', 'Jansport Backpack', 'North Face Backpack'],
                'colors': ['Black', 'Navy Blue', 'Gray', 'Red', 'Green', 'Purple'],
                'brands': ['Nike', 'Adidas', 'Jansport', 'North Face', 'Herschel'],
                'descriptions': [
                    '{brand} {title} in {color} with laptop compartment',
                    '{color} {brand} backpack with water bottle holder',
                    '{title} ({color}) with multiple pockets',
                    '{brand} bag in {color} with reflective strips'
                ],
                'security_questions': [
                    ('How many main compartments are there?', 'compartments', 'number'),
                    ('What color are the zippers?', 'zipper_color', 'text'),
                    ('Is there a laptop sleeve inside?', 'laptop_sleeve', 'yesno'),
                    ('What is attached to the front pocket?', 'front_attachment', 'text'),
                    ('How many water bottle holders?', 'bottle_holders', 'number')
                ]
            },
            {
                'titles': ['Messenger Bag', 'Tote Bag', 'Crossbody Bag', 'Laptop Bag'],
                'colors': ['Brown', 'Black', 'Tan', 'Navy', 'Gray'],
                'brands': ['Coach', 'Michael Kors', 'Fossil', 'Tumi'],
                'descriptions': [
                    '{brand} {title} in {color} leather',
                    '{color} {title} with adjustable strap',
                    '{brand} bag ({color}) with metal hardware',
                    'Vintage {title} in {color} with wear marks'
                ],
                'security_questions': [
                    ('What material is it made of?', 'material', 'text'),
                    ('What color is the strap?', 'strap_color', 'text'),
                    ('Are there metal studs?', 'metal_studs', 'yesno'),
                    ('What is in the front pocket?', 'front_contents', 'text')
                ]
            }
        ]
    },
    'Keys': {
        'items': [
            {
                'titles': ['Car Keys', 'House Keys', 'Dorm Keys', 'Apartment Keys'],
                'colors': ['Silver', 'Black', 'Blue', 'Red', 'Gold'],
                'brands': ['Toyota', 'Honda', 'Ford', 'Nissan', 'Hyundai'],
                'descriptions': [
                    '{brand} {title} on {color} keychain',
                    '{title} with {color} key fob and house key',
                    '{brand} car key with {color} rubber cover',
                    'Multiple keys on {color} carabiner'
                ],
                'security_questions': [
                    ('What car brand is on the key fob?', 'car_brand', 'text'),
                    ('How many keys are on the ring?', 'key_count', 'number'),
                    ('What color is the key fob?', 'fob_color', 'text'),
                    ('Is there a bottle opener attached?', 'bottle_opener', 'yesno'),
                    ('What year is written on the car key?', 'car_year', 'number')
                ]
            }
        ]
    },
    'Wallets & Purses': {
        'items': [
            {
                'titles': ['Leather Wallet', 'Bifold Wallet', 'Card Holder', 'Money Clip'],
                'colors': ['Brown', 'Black', 'Tan', 'Navy', 'Red'],
                'brands': ['Coach', 'Fossil', 'Tommy Hilfiger', 'Calvin Klein'],
                'descriptions': [
                    '{brand} {title} in {color} leather',
                    '{color} {title} with multiple card slots',
                    'Worn {title} in {color} with loose stitching',
                    '{brand} wallet ({color}) with coin pocket'
                ],
                'security_questions': [
                    ('How many card slots are there?', 'card_slots', 'number'),
                    ('Is there a coin pocket?', 'coin_pocket', 'yesno'),
                    ('What color is the stitching?', 'stitch_color', 'text'),
                    ('Is there an ID window?', 'id_window', 'yesno'),
                    ('What brand logo is embossed?', 'logo', 'text')
                ]
            }
        ]
    },
    'Water Bottles & Containers': {
        'items': [
            {
                'titles': ['Hydro Flask', 'Nalgene Bottle', 'Yeti Tumbler', 'Stanley Cup'],
                'colors': ['Blue', 'Pink', 'Black', 'White', 'Green', 'Purple', 'Red'],
                'brands': ['Hydro Flask', 'Nalgene', 'Yeti', 'Stanley', 'Contigo'],
                'descriptions': [
                    '{brand} {title} in {color} with stickers',
                    '{color} {title} with dents on bottom',
                    '{brand} bottle ({color}) with carabiner clip',
                    'Insulated {title} in {color} with handle'
                ],
                'security_questions': [
                    ('What stickers are on it?', 'stickers', 'text'),
                    ('What size is it (oz)?', 'size_oz', 'number'),
                    ('Is there a carabiner attached?', 'carabiner', 'yesno'),
                    ('What color is the lid?', 'lid_color', 'text'),
                    ('Are there dents or scratches?', 'damage', 'yesno')
                ]
            }
        ]
    }
}

# Security question answer generators
def generate_security_answers():
    answers = {
        'case_color': random.choice(['clear', 'black', 'pink', 'blue', 'purple']),
        'popsocket_brand': random.choice(['popsocket', 'generic', 'custom', 'none']),
        'screen_protector': random.choice(['yes', 'no']),
        'wallpaper': random.choice(['nature', 'abstract', 'photo', 'default', 'dark']),
        'dock_apps': str(random.randint(3, 6)),
        'prog_language': random.choice(['python', 'javascript', 'java', 'react', 'github']),
        'screen_size': str(random.choice([13, 14, 15, 16])),
        'webcam_cover': random.choice(['yes', 'no']),
        'company_sticker': random.choice(['google', 'microsoft', 'apple', 'netflix', 'spotify']),
        'usb_ports': str(random.randint(2, 4)),
        'compartments': str(random.randint(2, 5)),
        'zipper_color': random.choice(['black', 'silver', 'gold', 'same color']),
        'laptop_sleeve': random.choice(['yes', 'no']),
        'front_attachment': random.choice(['keychain', 'pin', 'patch', 'nothing']),
        'bottle_holders': str(random.randint(1, 3)),
        'material': random.choice(['leather', 'canvas', 'nylon', 'polyester']),
        'strap_color': random.choice(['black', 'brown', 'same color', 'different']),
        'metal_studs': random.choice(['yes', 'no']),
        'front_contents': random.choice(['pens', 'cards', 'keys', 'nothing']),
        'car_brand': random.choice(['toyota', 'honda', 'ford', 'nissan', 'hyundai']),
        'key_count': str(random.randint(2, 8)),
        'fob_color': random.choice(['black', 'gray', 'blue', 'red']),
        'bottle_opener': random.choice(['yes', 'no']),
        'car_year': str(random.randint(2018, 2024)),
        'card_slots': str(random.randint(4, 12)),
        'coin_pocket': random.choice(['yes', 'no']),
        'stitch_color': random.choice(['brown', 'black', 'tan', 'white']),
        'id_window': random.choice(['yes', 'no']),
        'logo': random.choice(['coach', 'fossil', 'tommy', 'calvin', 'none']),
        'stickers': random.choice(['band stickers', 'university logo', 'travel stickers', 'none']),
        'size_oz': str(random.choice([16, 20, 24, 32, 40])),
        'carabiner': random.choice(['yes', 'no']),
        'lid_color': random.choice(['black', 'white', 'same color', 'different']),
        'damage': random.choice(['yes', 'no'])
    }
    return answers

def connect_db():
    """Connect to MySQL database"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"Error connecting to database: {err}")
        return None

def generate_users(conn, count=1000):
    """Generate realistic users"""
    cursor = conn.cursor()
    
    users = []
    for _ in range(count):
        name = fake.name()
        # Generate Kent State email
        username = name.lower().replace(' ', '.').replace("'", "")
        email = f"{username}@kent.edu"
        phone = fake.phone_number()
        student_id = f"85{random.randint(1000000, 9999999)}"
        
        users.append((name, email, phone, student_id, True))
    
    query = """
    INSERT INTO users (name, email, phone, student_id, is_verified)
    VALUES (%s, %s, %s, %s, %s)
    """
    
    cursor.executemany(query, users)
    conn.commit()
    cursor.close()
    
    print(f"Generated {count} users")

def get_random_item_data(category_name):
    """Get random item data for a category"""
    if category_name not in ITEM_TEMPLATES:
        return None
    
    category = ITEM_TEMPLATES[category_name]
    item_type = random.choice(category['items'])
    
    title = random.choice(item_type['titles'])
    color = random.choice(item_type['colors'])
    brand = random.choice(item_type['brands'])
    description = random.choice(item_type['descriptions']).format(
        brand=brand, title=title, color=color
    )
    
    return {
        'title': title,
        'color': color,
        'brand': brand,
        'description': description,
        'security_questions': item_type['security_questions']
    }

def generate_lost_items(conn, count=50000):
    """Generate lost items"""
    cursor = conn.cursor()
    
    # Get categories and locations
    cursor.execute("SELECT id, name FROM categories")
    categories = cursor.fetchall()
    
    cursor.execute("SELECT id, name FROM locations")
    locations = cursor.fetchall()
    
    cursor.execute("SELECT id FROM users")
    users = [row[0] for row in cursor.fetchall()]
    
    lost_items = []
    
    for _ in range(count):
        category_id, category_name = random.choice(categories)
        location_id, location_name = random.choice(locations)
        user_id = random.choice(users)
        
        # Get item data or create generic
        item_data = get_random_item_data(category_name)
        if item_data:
            title = item_data['title']
            color = item_data['color']
            brand = item_data['brand']
            description = item_data['description']
        else:
            # Generic items for categories without templates
            titles = [f"{category_name.rstrip('s')}", f"Personal {category_name.rstrip('s')}", f"Student {category_name.rstrip('s')}"]
            title = random.choice(titles)
            color = random.choice(['Black', 'Blue', 'Red', 'White', 'Gray'])
            brand = fake.company()
            description = f"{title} in {color} color, lost at {location_name}"
        
        # Generate dates (lost within last 6 months)
        date_lost = fake.date_between(start_date='-180d', end_date='today')
        time_lost = fake.time()
        
        # Additional details
        size = random.choice(['Small', 'Medium', 'Large', 'Extra Large'])
        material = random.choice(['Plastic', 'Metal', 'Leather', 'Fabric', 'Glass'])
        reward = random.choice([0, 0, 0, 25, 50, 100])  # Most items have no reward
        
        item_uuid = str(uuid.uuid4())
        
        lost_items.append((
            item_uuid, user_id, category_id, location_id, title, description,
            color, size, brand, material, None, None, date_lost, time_lost,
            reward, 'both', False, None
        ))
    
    query = """
    INSERT INTO lost_items (
        uuid, user_id, category_id, location_id, title, description,
        color, size, brand, material, distinguishing_features, image_url,
        date_lost, time_lost, reward_offered, contact_preference,
        is_resolved, resolved_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    # Insert in batches
    batch_size = 1000
    for i in range(0, len(lost_items), batch_size):
        batch = lost_items[i:i+batch_size]
        cursor.executemany(query, batch)
        conn.commit()
        print(f"Inserted {min(i+batch_size, len(lost_items))}/{len(lost_items)} lost items")
    
    cursor.close()
    print(f"Generated {count} lost items")

def generate_found_items(conn, count=50000):
    """Generate found items with security questions"""
    cursor = conn.cursor()
    
    # Get categories and locations
    cursor.execute("SELECT id, name FROM categories")
    categories = cursor.fetchall()
    
    cursor.execute("SELECT id, name FROM locations")
    locations = cursor.fetchall()
    
    cursor.execute("SELECT id FROM users")
    users = [row[0] for row in cursor.fetchall()]
    
    found_items = []
    security_questions_data = []
    
    for _ in range(count):
        category_id, category_name = random.choice(categories)
        location_id, location_name = random.choice(locations)
        user_id = random.choice(users)
        
        # Get item data
        item_data = get_random_item_data(category_name)
        if item_data:
            title = item_data['title']
            color = item_data['color']
            brand = item_data['brand']
            description = item_data['description']
            security_questions_template = item_data['security_questions']
        else:
            # Generic items
            titles = [f"{category_name.rstrip('s')}", f"Found {category_name.rstrip('s')}", f"Student {category_name.rstrip('s')}"]
            title = random.choice(titles)
            color = random.choice(['Black', 'Blue', 'Red', 'White', 'Gray'])
            brand = fake.company()
            description = f"{title} in {color} color, found at {location_name}"
            security_questions_template = [
                ('What color is this item?', 'color', 'text'),
                ('Where was it found?', 'location', 'text'),
                ('What is the approximate size?', 'size', 'text')
            ]
        
        # Generate dates (found within last 3 months)
        date_found = fake.date_between(start_date='-90d', end_date='today')
        time_found = fake.time()
        
        # Privacy settings (30 days from found date)
        privacy_expires = datetime.combine(date_found, datetime.min.time()) + timedelta(days=30)
        is_private = datetime.now() < privacy_expires
        
        # Additional details
        size = random.choice(['Small', 'Medium', 'Large'])
        material = random.choice(['Plastic', 'Metal', 'Leather', 'Fabric', 'Glass'])
        current_location = f"{location_name} Security Office"
        finder_notes = f"Found near {location_name}, turned in immediately"
        
        item_uuid = str(uuid.uuid4())
        
        found_items.append((
            item_uuid, user_id, category_id, location_id, title, description,
            color, size, brand, material, None, None, date_found, time_found,
            current_location, finder_notes, is_private, privacy_expires,
            False, None, None
        ))
        
        # Generate security questions for this item
        answers = generate_security_answers()
        selected_questions = random.sample(security_questions_template, min(3, len(security_questions_template)))
        
        for question, answer_key, q_type in selected_questions:
            answer = answers.get(answer_key, 'unknown')
            security_questions_data.append((len(found_items), question, answer.lower(), q_type))
    
    # Insert found items
    query = """
    INSERT INTO found_items (
        uuid, user_id, category_id, location_id, title, description,
        color, size, brand, material, distinguishing_features, image_url,
        date_found, time_found, current_location, finder_notes,
        is_private, privacy_expires_at, is_claimed, claimed_at, claimed_by_user_id
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    # Insert in batches
    batch_size = 1000
    for i in range(0, len(found_items), batch_size):
        batch = found_items[i:i+batch_size]
        cursor.executemany(query, batch)
        conn.commit()
        print(f"Inserted {min(i+batch_size, len(found_items))}/{len(found_items)} found items")
    
    # Get the IDs of inserted found items for security questions
    cursor.execute("SELECT id FROM found_items ORDER BY id DESC LIMIT %s", (count,))
    found_item_ids = [row[0] for row in cursor.fetchall()]
    found_item_ids.reverse()  # Match the order we inserted
    
    # Insert security questions
    security_questions_final = []
    for i, (item_index, question, answer, q_type) in enumerate(security_questions_data):
        found_item_id = found_item_ids[item_index - 1]  # Adjust for 0-based index
        security_questions_final.append((found_item_id, question, answer, q_type))
    
    security_query = """
    INSERT INTO security_questions (found_item_id, question, answer, question_type)
    VALUES (%s, %s, %s, %s)
    """
    
    for i in range(0, len(security_questions_final), batch_size):
        batch = security_questions_final[i:i+batch_size]
        cursor.executemany(security_query, batch)
        conn.commit()
        print(f"Inserted {min(i+batch_size, len(security_questions_final))}/{len(security_questions_final)} security questions")
    
    cursor.close()
    print(f"Generated {count} found items with security questions")

def main():
    print("Starting data generation for TrackeBack database...")
    
    conn = connect_db()
    if not conn:
        print("Failed to connect to database")
        return
    
    try:
        # Generate data
        print("1. Generating users...")
        generate_users(conn, 1000)
        
        print("2. Generating lost items...")
        generate_lost_items(conn, 50000)
        
        print("3. Generating found items...")
        generate_found_items(conn, 50000)
        
        print("Data generation completed successfully!")
        
    except Exception as e:
        print(f"Error during data generation: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()