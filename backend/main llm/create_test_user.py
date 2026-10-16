"""
Create a test user for local development when Google OAuth is not configured.

SETUP INSTRUCTIONS:
1. Create virtual environment:
   python -m venv venv

2. Activate virtual environment:
   venv\Scripts\activate  (Windows)
   source venv/bin/activate  (Linux/Mac)

3. Install dependencies:
   pip install -r requirements.txt

4. Run this script:
   python create_test_user.py
"""

import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

try:
    from auth.database import SessionLocal, engine
    from auth.models import User
    from auth.security import hash_password
except ImportError as e:
    print("✗ Error: Required modules not found.")
    print(f"  {e}")
    print("\nPlease install dependencies first:")
    print("  1. python -m venv venv")
    print("  2. venv\\Scripts\\activate  (Windows)")
    print("  3. pip install -r requirements.txt")
    sys.exit(1)

def create_test_user():
    """Create a test user for local development."""
    
    # Test user credentials
    username = "testuser"
    email = "test@example.com"
    password = "test123"
    
    # Create database tables if they don't exist
    from auth.database import Base
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"✓ Test user already exists:")
            print(f"  Username: {username}")
            print(f"  Email: {email}")
            print(f"  Password: {password}")
            print(f"\nLogin at: http://localhost:5173/login")
            return
        
        # Create new test user
        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(password),
            auth_provider="local"
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print("✓ Test user created successfully:")
        print(f"  Username: {username}")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        print(f"\nLogin at: http://localhost:5173/login")
        
    except Exception as e:
        print(f"✗ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
