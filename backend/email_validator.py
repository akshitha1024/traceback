import re
import socket
import smtplib
from email.mime.text import MIMEText

def validate_email_format(email):
    """Check if email has valid format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def check_domain_exists(email):
    """Check if email domain exists (DNS lookup)"""
    try:
        domain = email.split('@')[1]
        socket.gethostbyname(domain)
        return True
    except socket.gaierror:
        return False

def check_mx_record(email):
    """Check if domain has MX (mail exchange) record"""
    try:
        import dns.resolver
        domain = email.split('@')[1]
        mx_records = dns.resolver.resolve(domain, 'MX')
        return len(mx_records) > 0
    except:
        # If dns library not available, just check domain
        return check_domain_exists(email)

def validate_kent_edu_email(email):
    """Validate Kent State email format specifically"""
    if not email.lower().endswith('@kent.edu'):
        return False, "Must be a kent.edu email address"
    
    # Check format
    if not validate_email_format(email):
        return False, "Invalid email format"
    
    # Check if domain exists
    if not check_domain_exists(email):
        return False, "Email domain does not exist"
    
    # Kent State specific validation
    username = email.split('@')[0]
    
    # Kent State usernames are typically 4-8 characters
    if len(username) < 2 or len(username) > 15:
        return False, "Invalid Kent State username format"
    
    # Should contain only letters, numbers, dots, or underscores
    if not re.match(r'^[a-zA-Z0-9._]+$', username):
        return False, "Username contains invalid characters"
    
    return True, "Valid email format"

def comprehensive_email_validation(email):
    """Complete email validation without sending actual emails"""
    
    # Basic format check
    if not validate_email_format(email):
        return False, "Invalid email format"
    
    # Domain existence check
    if not check_domain_exists(email):
        return False, "Email domain does not exist"
    
    # For kent.edu emails, do additional validation
    if email.lower().endswith('@kent.edu'):
        return validate_kent_edu_email(email)
    
    # For other domains, we've done what we can
    return True, "Email format appears valid"

# Example usage:
if __name__ == "__main__":
    test_emails = [
        "student@kent.edu",
        "invalid@nonexistentdomain12345.com",
        "test@gmail.com",
        "bad-format@",
        "john.doe@kent.edu"
    ]
    
    for email in test_emails:
        is_valid, message = comprehensive_email_validation(email)
        print(f"{email}: {'✅' if is_valid else '❌'} {message}")