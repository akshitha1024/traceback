"""
TrackeBack Login Error Messages Summary
Shows all possible login error responses
"""

def show_login_error_messages():
    """Display all possible login error messages"""
    print("🔐 TrackeBack Login Error Messages")
    print("=" * 50)
    
    scenarios = [
        {
            "scenario": "Email not registered",
            "input": "newuser@kent.edu + any password",
            "response": "Email not found. Please sign up first.",
            "action": "User should register first"
        },
        {
            "scenario": "Registered email + wrong password",
            "input": "registered@kent.edu + wrong password",
            "response": "Invalid credentials. Please check your password.",
            "action": "User should check their password"
        },
        {
            "scenario": "Registered email + correct password",
            "input": "registered@kent.edu + correct password", 
            "response": "Login successful + user data",
            "action": "User gets access to the app"
        },
        {
            "scenario": "Non-Kent email",
            "input": "user@gmail.com + any password",
            "response": "Only Kent State (@kent.edu) email addresses are allowed",
            "action": "User must use @kent.edu email"
        },
        {
            "scenario": "Empty fields",
            "input": "Empty email or password",
            "response": "Email and password are required",
            "action": "User must fill all fields"
        },
        {
            "scenario": "Deactivated account",
            "input": "deactivated@kent.edu + correct password",
            "response": "Account is deactivated",
            "action": "User needs to contact support"
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{i}. {scenario['scenario']}")
        print(f"   Input: {scenario['input']}")
        print(f"   Response: \"{scenario['response']}\"")
        print(f"   Action: {scenario['action']}")
    
    print(f"\n🎯 Benefits of Specific Error Messages:")
    print("  ✅ Users know exactly what went wrong")
    print("  ✅ Clear guidance on what to do next")
    print("  ✅ Better user experience")
    print("  ✅ Reduces support requests")
    
    print(f"\n🔧 Implementation in comprehensive_app.py:")
    print("  - Check if email exists in database")
    print("  - If not found: 'Email not found. Please sign up first.'")
    print("  - If found but wrong password: 'Invalid credentials. Please check your password.'")
    print("  - If successful: Return user data + token")

if __name__ == "__main__":
    show_login_error_messages()
    print("\n✅ Error message system is now user-friendly!")