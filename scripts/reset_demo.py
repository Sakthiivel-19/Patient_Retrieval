import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from scripts.seed_demo_data import seed_database

if __name__ == "__main__":
    print("[*] Resetting demo state to baseline...")
    seed_database()
    print("[OK] Demo state successfully reset.")
