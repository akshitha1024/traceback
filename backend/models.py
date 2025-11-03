# Database Models for Traceback Application

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# This will be set by the app
db = None

class User(db.Model):
    """User model for authentication and profiles"""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    name = db.Column(db.String(100), nullable=False)
    student_id = db.Column(db.String(50), unique=True)
    department = db.Column(db.String(100))
    year = db.Column(db.String(20))
    phone = db.Column(db.String(15))
    photo_url = db.Column(db.String(255))
    is_verified = db.Column(db.Boolean, default=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    lost_items = db.relationship('LostItem', backref='reporter', lazy=True)
    found_items = db.relationship('FoundItem', backref='reporter', lazy=True)
    reports = db.relationship('Report', backref='reporter', lazy=True)

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Convert user to dictionary (excluding sensitive data)"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'student_id': self.student_id,
            'department': self.department,
            'year': self.year,
            'phone': self.phone,
            'photo_url': self.photo_url,
            'is_verified': self.is_verified,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class LostItem(db.Model):
    """Model for lost items"""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    date_lost = db.Column(db.Date, nullable=False)
    color = db.Column(db.String(50))
    brand = db.Column(db.String(100))
    model = db.Column(db.String(100))
    serial_number = db.Column(db.String(100))
    reward_offered = db.Column(db.Float, default=0.0)
    contact_info = db.Column(db.String(200))
    images = db.Column(db.JSON)  # Store image URLs as JSON array
    status = db.Column(db.String(20), default='active')  # active, found, closed
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'location': self.location,
            'date_lost': self.date_lost.isoformat() if self.date_lost else None,
            'color': self.color,
            'brand': self.brand,
            'model': self.model,
            'serial_number': self.serial_number,
            'reward_offered': self.reward_offered,
            'contact_info': self.contact_info,
            'images': self.images,
            'status': self.status,
            'user_id': self.user_id,
            'reporter': self.reporter.name if self.reporter else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'type': 'lost'
        }

class FoundItem(db.Model):
    """Model for found items"""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    date_found = db.Column(db.Date, nullable=False)
    color = db.Column(db.String(50))
    brand = db.Column(db.String(100))
    model = db.Column(db.String(100))
    condition = db.Column(db.String(100))
    contact_info = db.Column(db.String(200))
    images = db.Column(db.JSON)  # Store image URLs as JSON array
    status = db.Column(db.String(20), default='available')  # available, claimed, returned
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'location': self.location,
            'date_found': self.date_found.isoformat() if self.date_found else None,
            'color': self.color,
            'brand': self.brand,
            'model': self.model,
            'condition': self.condition,
            'contact_info': self.contact_info,
            'images': self.images,
            'status': self.status,
            'user_id': self.user_id,
            'reporter': self.reporter.name if self.reporter else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'type': 'found'
        }

class Report(db.Model):
    """Model for abuse reports"""
    id = db.Column(db.Integer, primary_key=True)
    report_type = db.Column(db.String(20), nullable=False)  # user, item
    target_id = db.Column(db.Integer, nullable=False)  # ID of reported user/item
    target_type = db.Column(db.String(20), nullable=False)  # user, lost_item, found_item
    category = db.Column(db.String(50), nullable=False)  # inappropriate, spam, harassment, etc.
    reason = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    evidence_urls = db.Column(db.JSON)  # Screenshots/evidence URLs
    status = db.Column(db.String(20), default='pending')  # pending, reviewing, resolved, dismissed
    admin_notes = db.Column(db.Text)
    resolved_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'report_type': self.report_type,
            'target_id': self.target_id,
            'target_type': self.target_type,
            'category': self.category,
            'reason': self.reason,
            'description': self.description,
            'evidence_urls': self.evidence_urls,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'resolved_by': self.resolved_by,
            'user_id': self.user_id,
            'reporter': self.reporter.name if self.reporter else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Match(db.Model):
    """Model for storing item matches"""
    id = db.Column(db.Integer, primary_key=True)
    lost_item_id = db.Column(db.Integer, db.ForeignKey('lost_item.id'), nullable=False)
    found_item_id = db.Column(db.Integer, db.ForeignKey('found_item.id'), nullable=False)
    similarity_score = db.Column(db.Float, nullable=False)
    match_factors = db.Column(db.JSON)  # Store matching factors as JSON
    is_confirmed = db.Column(db.Boolean, default=False)
    confirmed_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    lost_item = db.relationship('LostItem', backref='matches')
    found_item = db.relationship('FoundItem', backref='matches')

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'lost_item_id': self.lost_item_id,
            'found_item_id': self.found_item_id,
            'similarity_score': self.similarity_score,
            'match_factors': self.match_factors,
            'is_confirmed': self.is_confirmed,
            'confirmed_by': self.confirmed_by,
            'lost_item': self.lost_item.to_dict() if self.lost_item else None,
            'found_item': self.found_item.to_dict() if self.found_item else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }