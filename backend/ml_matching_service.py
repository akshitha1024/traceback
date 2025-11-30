"""
ML Matching Service for Lost and Found Items
Combines text similarity, image similarity, and various features for intelligent matching
"""

import os
import numpy as np
from datetime import datetime
from sentence_transformers import SentenceTransformer
import sqlite3
from pathlib import Path

# Try to import image similarity (optional)
try:
    from image_similarity import image_similarity
    IMAGE_SIMILARITY_AVAILABLE = True
except ImportError:
    IMAGE_SIMILARITY_AVAILABLE = False
    print("WARNING: Image similarity not available (missing dependencies). Image matching will be disabled.")


class MLMatchingService:
    def __init__(self, db_path, model_path=None, upload_folder=None):
        """
        Initialize the ML matching service
        
        Args:
            db_path: Path to the database
            model_path: Path to the text similarity model
            upload_folder: Path to the uploads folder for images
        """
        self.db_path = db_path
        
        # Load text similarity model
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), 'traceback_text_similarity_model')
        
        print(f"Loading text similarity model from {model_path}...")
        self.text_model = SentenceTransformer(model_path)
        print("Text similarity model loaded successfully!")
        
        # Set upload folder
        if upload_folder is None:
            self.upload_folder = os.path.join(os.path.dirname(__file__), 'uploads')
        else:
            self.upload_folder = upload_folder
    
    def get_db_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def text_similarity(self, desc1, desc2):
        """
        Calculate text similarity between two descriptions using the trained model
        
        Args:
            desc1: First description
            desc2: Second description
            
        Returns:
            Similarity score between 0 and 1
        """
        if not desc1 or not desc2:
            return 0.0
        
        # Generate embeddings
        embeddings = self.text_model.encode([desc1, desc2])
        
        # Calculate cosine similarity
        similarity = np.dot(embeddings[0], embeddings[1]) / (
            np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])
        )
        
        # Ensure the result is between 0 and 1
        return float(max(0.0, min(1.0, similarity)))
    
    def image_sim(self, img1_path, img2_path):
        """
        Calculate image similarity between two images
        
        Args:
            img1_path: Path to first image
            img2_path: Path to second image
            
        Returns:
            Similarity score between 0 and 1
        """
        if not IMAGE_SIMILARITY_AVAILABLE:
            return 0.0
            
        if not img1_path or not img2_path:
            return 0.0
        
        # Construct full paths
        full_path1 = os.path.join(self.upload_folder, img1_path) if not os.path.isabs(img1_path) else img1_path
        full_path2 = os.path.join(self.upload_folder, img2_path) if not os.path.isabs(img2_path) else img2_path
        
        # Check if files exist
        if not os.path.exists(full_path1) or not os.path.exists(full_path2):
            return 0.0
        
        try:
            return image_similarity(full_path1, full_path2)
        except Exception as e:
            print(f"Error calculating image similarity: {e}")
            return 0.0
    
    def location_similarity(self, loc1, loc2):
        """
        Binary location similarity (exact match)
        
        Args:
            loc1: First location
            loc2: Second location
            
        Returns:
            1.0 if exact match, 0.0 otherwise
        """
        if not loc1 or not loc2:
            return 0.0
        
        return 1.0 if str(loc1).strip().lower() == str(loc2).strip().lower() else 0.0
    
    def category_similarity(self, cat1, cat2):
        """
        Binary category similarity (exact match)
        
        Args:
            cat1: First category
            cat2: Second category
            
        Returns:
            1.0 if exact match, 0.0 otherwise
        """
        if not cat1 or not cat2:
            return 0.0
        
        return 1.0 if str(cat1).strip().lower() == str(cat2).strip().lower() else 0.0
    
    def color_similarity(self, color1, color2):
        """
        Binary color similarity (exact match)
        
        Args:
            color1: First color
            color2: Second color
            
        Returns:
            1.0 if exact match, 0.0 otherwise
        """
        if not color1 or not color2:
            return 0.0
        
        return 1.0 if str(color1).strip().lower() == str(color2).strip().lower() else 0.0
    
    def date_similarity_linear(self, date1, date2, window=14):
        """
        Calculate date similarity using linear decay
        
        Args:
            date1: First date (string or datetime)
            date2: Second date (string or datetime)
            window: Number of days for full decay (default 14 days)
            
        Returns:
            Similarity score between 0 and 1
        """
        if not date1 or not date2:
            return 0.0
        
        try:
            # Convert to datetime if string
            if isinstance(date1, str):
                date1 = datetime.strptime(date1.split()[0], '%Y-%m-%d')
            if isinstance(date2, str):
                date2 = datetime.strptime(date2.split()[0], '%Y-%m-%d')
            
            # Calculate delta in days
            delta_days = abs((date1 - date2).days)
            
            # Linear decay
            return max(0.0, 1.0 - (delta_days / window))
        except Exception as e:
            print(f"Error calculating date similarity: {e}")
            return 0.0
    
    def calculate_match_score(self, lost_item, found_item):
        """
        Calculate comprehensive match score between a lost item and found item
        
        Formula:
        Match Score = 0.40*(Description_sim) + 0.25*(Image_sim) + 0.15*(Location_sim) +
                      0.10*(Category_sim) + 0.05*(Color_sim) + 0.05*(Date_sim)
        
        If either item doesn't have an image, image similarity is ignored and weights are redistributed.
        
        Args:
            lost_item: Dictionary containing lost item data
            found_item: Dictionary containing found item data
            
        Returns:
            Dictionary with match score and individual component scores
        """
        # Calculate individual similarities
        desc_sim = self.text_similarity(
            lost_item.get('description', ''),
            found_item.get('description', '')
        )
        
        # Check if both items have images
        lost_img = lost_item.get('image_filename', '')
        found_img = found_item.get('image_filename', '')
        has_both_images = bool(lost_img and found_img)
        
        img_sim = 0.0
        if has_both_images:
            img_sim = self.image_sim(lost_img, found_img)
        
        loc_sim = self.location_similarity(
            lost_item.get('location', ''),
            found_item.get('location', '')
        )
        
        cat_sim = self.category_similarity(
            lost_item.get('category', ''),
            found_item.get('category', '')
        )
        
        color_sim = self.color_similarity(
            lost_item.get('color', ''),
            found_item.get('color', '')
        )
        
        date_sim = self.date_similarity_linear(
            lost_item.get('date_lost', ''),
            found_item.get('date_found', '')
        )
        
        # Calculate weighted match score
        if has_both_images:
            # Use full formula with image similarity
            match_score = (
                0.40 * desc_sim +
                0.25 * img_sim +
                0.15 * loc_sim +
                0.10 * cat_sim +
                0.05 * color_sim +
                0.05 * date_sim
            )
        else:
            # Redistribute weights when no image comparison is possible
            # Description(53.3%), Location(20%), Category(13.3%), Color(6.7%), Date(6.7%)
            match_score = (
                0.533 * desc_sim +
                0.200 * loc_sim +
                0.133 * cat_sim +
                0.067 * color_sim +
                0.067 * date_sim
            )
        
        return {
            'match_score': round(match_score, 4),
            'description_similarity': round(desc_sim, 4),
            'image_similarity': round(img_sim, 4),
            'location_similarity': round(loc_sim, 4),
            'category_similarity': round(cat_sim, 4),
            'color_similarity': round(color_sim, 4),
            'date_similarity': round(date_sim, 4),
            'has_image_comparison': has_both_images
        }
    
    def find_matches_for_lost_item(self, lost_item_id, min_score=0.6, top_k=10):
        """
        Find matching found items for a given lost item
        
        Args:
            lost_item_id: ID of the lost item
            min_score: Minimum match score threshold (default 0.6 = 60%)
            top_k: Number of top matches to return (default 10)
            
        Returns:
            List of matches with scores, sorted by match score
        """
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # Get lost item details
        lost_item = cursor.execute("""
            SELECT l.rowid as id, l.*, c.name as category, loc.name as location
            FROM lost_items l
            LEFT JOIN categories c ON l.category_id = c.id
            LEFT JOIN locations loc ON l.location_id = loc.id
            WHERE l.rowid = ?
        """, (lost_item_id,)).fetchone()
        
        if not lost_item:
            conn.close()
            return []
        
        lost_item = dict(lost_item)
        
        # Get all found items (not claimed - check status field)
        found_items = cursor.execute("""
            SELECT f.rowid as id, f.*, c.name as category, loc.name as location
            FROM found_items f
            LEFT JOIN categories c ON f.category_id = c.id
            LEFT JOIN locations loc ON f.location_id = loc.id
            WHERE f.status != 'CLAIMED'
        """).fetchall()
        
        conn.close()
        
        matches = []
        for found_item in found_items:
            found_item = dict(found_item)
            
            # Calculate match score
            score_data = self.calculate_match_score(lost_item, found_item)
            
            # Only include if above threshold
            if score_data['match_score'] >= min_score:
                matches.append({
                    'found_item_id': found_item['id'],
                    'found_item': found_item,
                    **score_data
                })
        
        # Sort by match score (descending)
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Return top K matches
        return matches[:top_k]
    
    def find_matches_for_found_item(self, found_item_id, min_score=0.6, top_k=10):
        """
        Find matching lost items for a given found item
        
        Args:
            found_item_id: ID of the found item
            min_score: Minimum match score threshold (default 0.6 = 60%)
            top_k: Number of top matches to return (default 10)
            
        Returns:
            List of matches with scores, sorted by match score
        """
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # Get found item details
        found_item = cursor.execute("""
            SELECT f.rowid as id, f.*, c.name as category, loc.name as location
            FROM found_items f
            LEFT JOIN categories c ON f.category_id = c.id
            LEFT JOIN locations loc ON f.location_id = loc.id
            WHERE f.rowid = ?
        """, (found_item_id,)).fetchone()
        
        if not found_item:
            conn.close()
            return []
        
        found_item = dict(found_item)
        
        # Get all lost items
        lost_items = cursor.execute("""
            SELECT l.rowid as id, l.*, c.name as category, loc.name as location
            FROM lost_items l
            LEFT JOIN categories c ON l.category_id = c.id
            LEFT JOIN locations loc ON l.location_id = loc.id
        """).fetchall()
        
        conn.close()
        
        matches = []
        for lost_item in lost_items:
            lost_item = dict(lost_item)
            
            # Calculate match score
            score_data = self.calculate_match_score(lost_item, found_item)
            
            # Only include if above threshold
            if score_data['match_score'] >= min_score:
                matches.append({
                    'lost_item_id': lost_item['id'],
                    'lost_item': lost_item,
                    **score_data
                })
        
        # Sort by match score (descending)
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Return top K matches
        return matches[:top_k]
    
    def batch_match_all_items(self, min_score=0.6):
        """
        Find all potential matches between lost and found items
        
        Args:
            min_score: Minimum match score threshold (default 0.6 = 60%)
            
        Returns:
            List of all matches above threshold
        """
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # Get all lost items
        lost_items = cursor.execute("""
            SELECT l.rowid as id, l.*, c.name as category, loc.name as location
            FROM lost_items l
            LEFT JOIN categories c ON l.category_id = c.id
            LEFT JOIN locations loc ON l.location_id = loc.id
        """).fetchall()
        
        # Get all found items (not claimed - check status field)
        found_items = cursor.execute("""
            SELECT f.rowid as id, f.*, c.name as category, loc.name as location
            FROM found_items f
            LEFT JOIN categories c ON f.category_id = c.id
            LEFT JOIN locations loc ON f.location_id = loc.id
            WHERE f.status != 'CLAIMED'
        """).fetchall()
        
        conn.close()
        
        all_matches = []
        
        for lost_item in lost_items:
            lost_item = dict(lost_item)
            
            for found_item in found_items:
                found_item = dict(found_item)
                
                # Calculate match score
                score_data = self.calculate_match_score(lost_item, found_item)
                
                # Only include if above threshold
                if score_data['match_score'] >= min_score:
                    all_matches.append({
                        'lost_item_id': lost_item['id'],
                        'found_item_id': found_item['id'],
                        'lost_item_title': lost_item.get('title', ''),
                        'found_item_title': found_item.get('title', ''),
                        **score_data
                    })
        
        # Sort by match score (descending)
        all_matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return all_matches


# Test function
if __name__ == '__main__':
    db_path = os.path.join(os.path.dirname(__file__), 'traceback_100k.db')
    
    print("Initializing ML Matching Service...")
    service = MLMatchingService(db_path)
    
    print("\nTesting text similarity:")
    desc1 = "Lost brown leather wallet near library"
    desc2 = "Found brown wallet at library entrance"
    desc3 = "Found blue backpack in cafeteria"
    
    sim1 = service.text_similarity(desc1, desc2)
    sim2 = service.text_similarity(desc1, desc3)
    
    print(f"Similar descriptions: {sim1:.4f}")
    print(f"Different descriptions: {sim2:.4f}")
    
    print("\nML Matching Service initialized successfully!")
