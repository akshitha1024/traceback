import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'traceback_db'),
            'port': int(os.getenv('DB_PORT', 3306)),
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci'
        }
        self.connection = None

    def connect(self):
        """Create database connection"""
        try:
            self.connection = mysql.connector.connect(**self.config)
            if self.connection.is_connected():
                print(f"Connected to MySQL database: {self.config['database']}")
                return True
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            return False

    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("MySQL connection closed")

    def create_database(self):
        """Create database if it doesn't exist"""
        try:
            # Connect without specifying database
            temp_config = self.config.copy()
            del temp_config['database']
            
            temp_conn = mysql.connector.connect(**temp_config)
            cursor = temp_conn.cursor()
            
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.config['database']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"Database '{self.config['database']}' created or already exists")
            
            cursor.close()
            temp_conn.close()
            
        except Error as e:
            print(f"Error creating database: {e}")

    def execute_sql_file(self, file_path):
        """Execute SQL commands from a file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                sql_commands = file.read()
                
            # Split commands by semicolon and execute each
            commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip()]
            
            cursor = self.connection.cursor()
            
            for command in commands:
                if command:
                    cursor.execute(command)
                    
            self.connection.commit()
            cursor.close()
            
            print(f"Successfully executed SQL file: {file_path}")
            
        except Error as e:
            print(f"Error executing SQL file {file_path}: {e}")
        except FileNotFoundError:
            print(f"SQL file not found: {file_path}")

    def get_connection(self):
        """Get database connection"""
        return self.connection

    def execute_query(self, query, params=None, fetch=False):
        """Execute a single query"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params)
            
            if fetch:
                result = cursor.fetchall()
                cursor.close()
                return result
            else:
                self.connection.commit()
                cursor.close()
                return True
                
        except Error as e:
            print(f"Error executing query: {e}")
            return False

    def get_categories(self):
        """Get all categories"""
        query = "SELECT id, name, description FROM categories ORDER BY name"
        return self.execute_query(query, fetch=True)

    def get_locations(self):
        """Get all locations"""
        query = "SELECT id, name, building_code, category, description FROM locations ORDER BY name"
        return self.execute_query(query, fetch=True)

    def get_lost_items(self, limit=100, offset=0, category_id=None, location_id=None):
        """Get lost items with filters"""
        base_query = """
        SELECT l.*, c.name as category_name, loc.name as location_name, u.name as user_name, u.email as user_email
        FROM lost_items l
        JOIN categories c ON l.category_id = c.id
        JOIN locations loc ON l.location_id = loc.id
        JOIN users u ON l.user_id = u.id
        WHERE 1=1
        """
        
        params = []
        if category_id:
            base_query += " AND l.category_id = %s"
            params.append(category_id)
            
        if location_id:
            base_query += " AND l.location_id = %s"
            params.append(location_id)
            
        base_query += " ORDER BY l.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        return self.execute_query(base_query, params, fetch=True)

    def get_found_items(self, limit=100, offset=0, category_id=None, location_id=None, include_private=False):
        """Get found items with filters"""
        base_query = """
        SELECT f.*, c.name as category_name, loc.name as location_name, u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM found_items f
        JOIN categories c ON f.category_id = c.id
        JOIN locations loc ON f.location_id = loc.id
        JOIN users u ON f.user_id = u.id
        WHERE 1=1
        """
        
        params = []
        
        if not include_private:
            base_query += " AND (f.is_private = FALSE OR f.privacy_expires_at <= NOW())"
            
        if category_id:
            base_query += " AND f.category_id = %s"
            params.append(category_id)
            
        if location_id:
            base_query += " AND f.location_id = %s"
            params.append(location_id)
            
        base_query += " ORDER BY f.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        return self.execute_query(base_query, params, fetch=True)

    def get_security_questions(self, found_item_id):
        """Get security questions for a found item"""
        query = """
        SELECT id, question, answer, question_type
        FROM security_questions
        WHERE found_item_id = %s
        """
        return self.execute_query(query, (found_item_id,), fetch=True)

    def verify_security_answers(self, found_item_id, user_answers):
        """Verify security question answers"""
        questions = self.get_security_questions(found_item_id)
        if not questions:
            return False, "No security questions found"
            
        correct_count = 0
        total_questions = len(questions)
        
        for question in questions:
            question_id = question['id']
            correct_answer = question['answer'].lower().strip()
            user_answer = user_answers.get(str(question_id), '').lower().strip()
            
            if user_answer == correct_answer:
                correct_count += 1
                
        # Require 67% correct answers
        required_correct = max(1, int(total_questions * 0.67))
        success = correct_count >= required_correct
        
        return success, f"Answered {correct_count}/{total_questions} correctly"

    def get_item_with_finder_details(self, found_item_id):
        """Get found item with finder contact details (after verification)"""
        query = """
        SELECT f.*, c.name as category_name, loc.name as location_name, 
               u.name as finder_name, u.email as finder_email, u.phone as finder_phone
        FROM found_items f
        JOIN categories c ON f.category_id = c.id
        JOIN locations loc ON f.location_id = loc.id
        JOIN users u ON f.user_id = u.id
        WHERE f.id = %s
        """
        result = self.execute_query(query, (found_item_id,), fetch=True)
        return result[0] if result else None