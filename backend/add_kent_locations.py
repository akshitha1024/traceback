import sqlite3
from datetime import datetime

DB_PATH = 'traceback_100k.db'

# Complete list of Kent State buildings and dining locations
kent_locations = [
    ("Administrative Services Building", "ASB", "Main administrative offices"),
    ("Aeronautics & Engineering Building", "AEB", "Engineering programs"),
    ("Aeronautics & Technology Building", "ATB", "Aviation and technology"),
    ("Allyn Hall", "ALH", "Campus building"),
    ("Architecture Building", "ARCH", "Architecture programs"),
    ("Art Annex", "AAN", "Art studios and classrooms"),
    ("Art Building", "ART", "Main art building"),
    ("Beall Hall", "BEL", "Residence hall"),
    ("Bookstore (KSU Bookstore)", "BOOK", "Campus bookstore"),
    ("Bowman Hall", "BOW", "Academic building"),
    ("Business Administration Building", "BAB", "Business school"),
    ("Campus Health Center", "CHC", "Health services"),
    ("Cartwright Hall", "CAR", "Residence hall"),
    ("Centennial Court A", "CCA", "Residence hall"),
    ("Centennial Court B", "CCB", "Residence hall"),
    ("Centennial Court C", "CCC", "Residence hall"),
    ("Centennial Court D", "CCD", "Residence hall"),
    ("Centennial Court E", "CCE", "Residence hall"),
    ("Centennial Court F", "CCF", "Residence hall"),
    ("Center for the Performing Arts", "CPA", "Theater and performances"),
    ("Center for Undergraduate Excellence (CUE)", "CUE", "Academic support"),
    ("Clark Hall", "CLK", "Academic building"),
    ("Cunningham Hall", "CUN", "Residence hall"),
    ("Design Innovation Hub (DI Hub)", "DIH", "Innovation and design"),
    ("Dix Stadium", "DIX", "Athletic stadium"),
    ("Dunbar Hall", "DUN", "Residence hall"),
    ("Eastway Dining (Eastway Center)", "EAST", "Dining hall"),
    ("Engleman Hall", "ENG", "Residence hall"),
    ("Fashion School – Rockwell Hall", "ROCK", "Fashion design and merchandising"),
    ("Fletcher Hall", "FLE", "Residence hall"),
    ("Franklin Hall", "FRA", "Residence hall"),
    ("George T. Simon Café (Library Café)", "GTSC", "Library café and dining"),
    ("Heer Hall", "HER", "Residence hall"),
    ("Henderson Hall", "HEN", "Residence hall"),
    ("Ice Arena", "ICE", "Ice skating and hockey"),
    ("Integrated Sciences Building (ISB)", "ISB", "Science labs and classrooms"),
    ("Johnson Hall", "JOH", "Residence hall"),
    ("Kent Hall", "KNT", "Academic building"),
    ("Kent Hall Annex", "KNTA", "Academic building annex"),
    ("Kent Market 1 (Student Center)", "KM1", "Student Center marketplace"),
    ("Kent Market 2 (Student Center)", "KM2", "Student Center marketplace"),
    ("Kent State Student Center (includes The HUB)", "KSSC", "Student center and dining"),
    ("Korb Hall", "KOR", "Residence hall"),
    ("Koonce Hall", "KOO", "Residence hall"),
    ("Leebrick Hall", "LEE", "Residence hall"),
    ("Library (University Library)", "LIB", "Main university library"),
    ("Liquid Crystal Institute (LCI)", "LCI", "Research institute"),
    ("Mancester Hall", "MAN", "Residence hall"),
    ("Mathematics & Computer Science Building (MSB)", "MSB", "Math and CS departments"),
    ("McDowell Hall", "MCD", "Residence hall"),
    ("McGilvrey Hall", "MCG", "Residence hall"),
    ("Moulton Hall", "MOU", "Academic building"),
    ("Munchies Market (Eastway)", "MUNCH", "Eastway convenience store"),
    ("Music & Speech Center", "MSC", "Music and speech programs"),
    ("Olives (Student Center)", "OLIV", "Student Center dining"),
    ("Oscar Ritchie Hall", "ORT", "Academic building"),
    ("Prentice Café", "PRCF", "Prentice Hall café"),
    ("Prentice Hall", "PRE", "Residence hall"),
    ("Recreation & Wellness Center", "RWC", "Fitness and recreation"),
    ("Residence Services Building", "RSB", "Housing services"),
    ("Risman Plaza", "RIS", "Campus plaza"),
    ("Rockwell Hall", "ROCK", "Fashion school"),
    ("Rosie's Diner & Market (Tri-Towers)", "ROSIE", "Tri-Towers dining and market"),
    ("Satterfield Hall", "SAT", "Residence hall"),
    ("Schwartz Center", "SCH", "Athletic and recreation"),
    ("Science Research Building", "SRB", "Research labs"),
    ("Smith Hall", "SMI", "Academic building"),
    ("Stopher Hall", "STO", "Residence hall"),
    ("Student Green", "GRN", "Campus green space"),
    ("Terrace Hall", "TER", "Residence hall"),
    ("The HUB (Student Center)", "HUB", "Student Center main hub"),
    ("The Market (DI Hub)", "DIHM", "DI Hub marketplace"),
    ("University College", "UC", "Academic programs"),
    ("Van Campen Hall", "VAN", "Residence hall"),
    ("White Hall", "WHI", "Music and arts"),
    ("Williamson House", "WIL", "Campus building"),
    ("Williams Hall", "WLM", "Honors College"),
    ("Wright Hall", "WRI", "Residence hall"),
    ("Zen Garden (Student Center)", "ZEN", "Student Center dining")
]

def add_kent_locations():
    """Add all Kent State buildings to locations table"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # First, check if we need to clear existing locations
        cursor.execute("SELECT COUNT(*) FROM locations")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print(f"⚠️  Found {count} existing locations. Clearing table...")
            cursor.execute("DELETE FROM locations")
            print("✅ Cleared existing locations")
        
        # Insert all Kent State locations
        print(f"\n📍 Adding {len(kent_locations)} Kent State locations...")
        
        for name, code, description in kent_locations:
            cursor.execute('''
                INSERT INTO locations (name, building_code, description, created_at)
                VALUES (?, ?, ?, datetime('now'))
            ''', (name, code, description))
            print(f"   ✓ {name} ({code})")
        
        conn.commit()
        conn.close()
        
        print(f"\n✅ Successfully added {len(kent_locations)} Kent State locations!")
        print("\n📊 Location Summary:")
        print(f"   Total locations: {len(kent_locations)}")
        print(f"   Residence halls: {len([l for l in kent_locations if 'Residence' in l[2] or 'hall' in l[0].lower()])}")
        print(f"   Academic buildings: {len([l for l in kent_locations if 'Academic' in l[2] or 'Building' in l[0]])}")
        print(f"   Dining locations: {len([l for l in kent_locations if 'dining' in l[2].lower() or 'café' in l[0].lower() or 'Diner' in l[0] or 'Market' in l[0]])}")
        
    except Exception as e:
        print(f"❌ Error adding locations: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("=" * 70)
    print("Kent State University - Location Setup")
    print("=" * 70)
    add_kent_locations()
