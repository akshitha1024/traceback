"""
Test ML Scheduler
Quick test to verify ML matching runs correctly
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from ml_scheduler import run_ml_matching

if __name__ == '__main__':
    print("=" * 60)
    print("Testing ML Matching Scheduler")
    print("=" * 60)
    print("\nRunning one-time ML matching test...\n")
    
    try:
        matches_found = run_ml_matching()
        print("\n" + "=" * 60)
        print(f"✅ TEST PASSED - Found {matches_found} matches")
        print("=" * 60)
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"❌ TEST FAILED: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
