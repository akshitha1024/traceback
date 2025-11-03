# TrackeBack Email Configuration
# Copy this file to email_config.py and update with your email settings

# OPTION 1: Gmail SMTP (Recommended for testing)
# You'll need to create an "App Password" in your Gmail account
EMAIL_CONFIG = {
    'provider': 'gmail',
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'email': 'your-app-email@gmail.com',
    'password': 'your-app-password',  # Use App Password, not regular password
    'from_name': 'TrackeBack - Kent State'
}

# OPTION 2: Outlook/Hotmail SMTP
# EMAIL_CONFIG = {
#     'provider': 'outlook',
#     'smtp_server': 'smtp-mail.outlook.com',
#     'smtp_port': 587,
#     'email': 'your-app-email@outlook.com',
#     'password': 'your-password',
#     'from_name': 'TrackeBack - Kent State'
# }

# OPTION 3: Kent State Email (if available)
# Contact Kent State IT to get SMTP server details
# EMAIL_CONFIG = {
#     'provider': 'kent',
#     'smtp_server': 'smtp.kent.edu',  # Ask IT for actual server
#     'smtp_port': 587,
#     'email': 'traceback@kent.edu',
#     'password': 'your-password',
#     'from_name': 'TrackeBack - Kent State University'
# }

# OPTION 4: SendGrid (Professional solution)
# EMAIL_CONFIG = {
#     'provider': 'sendgrid',
#     'api_key': 'your-sendgrid-api-key',
#     'from_email': 'traceback@yourdomain.com',
#     'from_name': 'TrackeBack - Kent State'
# }

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