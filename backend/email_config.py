# TrackeBack Email Configuration
# Gmail configuration for traceback24@gmail.com

# Gmail SMTP Configuration
EMAIL_CONFIG = {
    'provider': 'gmail',
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'email': 'traceback24@gmail.com',
    'password': 'rbve lpqz xyjn exbb',  # Gmail App Password
    'from_name': 'TrackeBack - Kent State'
}

# Email verification settings
VERIFICATION_SETTINGS = {
    'code_length': 6,  # 6-digit code
    'expiry_minutes': 15,  # Code expires in 15 minutes
    'max_attempts': 3,  # Maximum verification attempts
    'rate_limit_per_hour': 5,  # Max 5 codes per hour per email
    'verification_valid_hours': 24  # Email stays verified for 24 hours
}

# Email templates
EMAIL_TEMPLATES = {
    'subject': 'TrackeBack Verification Code: {code}',
    'kent_state_colors': {
        'primary': '#1a365d',  # Kent State Navy
        'secondary': '#ffd700',  # Kent State Gold
        'accent': '#4299e1'
    }
}