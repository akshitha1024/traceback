#!/usr/bin/env python3
"""
TrackeBack Database Setup Script
This script sets up the complete MySQL database with realistic data
"""

import os
import sys
import subprocess
from pathlib import Path

def install_requirements():
    """Install required Python packages"""
    print("Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install requirements: {e}")
        return False

def setup_env_file():
    """Set up environment file"""
    env_file = Path('.env')
    env_example = Path('.env.example')
    
    if not env_file.exists():
        if env_example.exists():
            # Copy example file
            with open(env_example, 'r') as f:
                content = f.read()
            
            with open(env_file, 'w') as f:
                f.write(content)
            
            print("✓ Created .env file from example")
            print("⚠️  Please update .env with your MySQL credentials before continuing")
            return False
        else:
            print("✗ .env.example file not found")
            return False
    else:
        print("✓ .env file already exists")
        return True

def run_database_setup():
    """Run the complete database setup"""
    print("\n" + "="*50)
    print("TRACEBACK DATABASE SETUP")
    print("="*50)
    
    # Check if we're in the right directory
    current_dir = Path.cwd()
    if not (current_dir / 'schema.sql').exists():
        print("✗ Please run this script from the database directory")
        return False
    
    # Install requirements
    if not install_requirements():
        return False
    
    # Setup environment file
    if not setup_env_file():
        print("\nPlease update the .env file with your MySQL credentials and run this script again.")
        return False
    
    # Import the database manager after installing requirements
    try:
        from db_manager import DatabaseManager
    except ImportError as e:
        print(f"✗ Failed to import database manager: {e}")
        return False
    
    # Initialize database manager
    db = DatabaseManager()
    
    # Create database
    print("\n1. Creating database...")
    db.create_database()
    
    # Connect to database
    print("2. Connecting to database...")
    if not db.connect():
        return False
    
    # Run schema
    print("3. Creating tables...")
    db.execute_sql_file('schema.sql')
    
    # Insert base data
    print("4. Inserting base data (categories and locations)...")
    db.execute_sql_file('base_data.sql')
    
    # Generate realistic data
    print("5. Generating realistic data (this may take a few minutes)...")
    try:
        from generate_data import generate_users, generate_lost_items, generate_found_items
        
        # Generate users
        print("   - Generating users...")
        generate_users(db.get_connection(), 1000)
        
        # Generate lost items
        print("   - Generating lost items...")
        generate_lost_items(db.get_connection(), 50000)
        
        # Generate found items with security questions
        print("   - Generating found items...")
        generate_found_items(db.get_connection(), 50000)
        
    except Exception as e:
        print(f"✗ Error generating data: {e}")
        return False
    
    # Cleanup
    db.disconnect()
    
    print("\n" + "="*50)
    print("✓ DATABASE SETUP COMPLETED SUCCESSFULLY!")
    print("="*50)
    print(f"Database: {db.config['database']}")
    print("Generated:")
    print("  - 1,000 users")
    print("  - 50,000 lost items") 
    print("  - 50,000 found items")
    print("  - Security questions for all found items")
    print("  - Kent State campus locations")
    print("  - 16 item categories")
    print("\nYou can now update your Flask backend to use this database!")
    
    return True

if __name__ == "__main__":
    success = run_database_setup()
    if not success:
        print("\n✗ Setup failed. Please check the errors above and try again.")
        sys.exit(1)
    else:
        print("\n🎉 Setup completed successfully!")
        sys.exit(0)