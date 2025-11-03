-- Insert Categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Phones, laptops, tablets, headphones, chargers, and other electronic devices'),
('Bags & Backpacks', 'Backpacks, purses, handbags, messenger bags, laptop bags'),
('Keys', 'Car keys, house keys, dorm keys, keychains, key fobs'),
('Wallets & Purses', 'Wallets, purses, money clips, card holders'),
('Clothing', 'Jackets, shirts, pants, shoes, hats, scarves, gloves'),
('Books & School Supplies', 'Textbooks, notebooks, calculators, pens, pencils'),
('Jewelry & Accessories', 'Rings, necklaces, earrings, watches, bracelets'),
('Sports Equipment', 'Balls, rackets, gym equipment, athletic wear'),
('Water Bottles & Containers', 'Water bottles, coffee cups, lunch containers'),
('Glasses & Sunglasses', 'Prescription glasses, sunglasses, reading glasses'),
('Transportation', 'Bicycles, skateboards, scooters, helmets'),
('Personal Care', 'Makeup, toiletries, medical devices, inhalers'),
('Documents & IDs', 'Student IDs, driver licenses, passports, important papers'),
('Art & Craft Supplies', 'Art materials, craft supplies, musical instruments'),
('Office Supplies', 'Staplers, folders, USB drives, office accessories'),
('Other', 'Items that don\'t fit into other categories');

-- Insert Kent State Campus Locations (based on the campus map)
INSERT INTO locations (name, building_code, category, description) VALUES
-- Academic Buildings
('Library', 'LIB', 'Academic', 'Main University Library building with multiple floors and study areas'),
('Student Center', 'SC', 'Student Life', 'Hub of student activities, dining, and services'),
('Math & Sciences Building', 'MS', 'Academic', 'Mathematics and Science departments and classrooms'),
('Business Administration Building', 'BA', 'Academic', 'College of Business Administration'),
('Art Building', 'ART', 'Academic', 'School of Art and creative programs'),
('Music & Speech Building', 'MSP', 'Academic', 'School of Music and Speech programs'),
('Education Building', 'ED', 'Academic', 'College of Education and Human Development'),
('Nursing Building', 'NUR', 'Academic', 'College of Nursing'),
('Architecture Building', 'ARCH', 'Academic', 'School of Architecture and Environmental Design'),
('Technology Building', 'TECH', 'Academic', 'College of Technology'),

-- Residence Halls
('Verder Hall', 'VH', 'Residence', 'First-year residence hall'),
('Leebrick Hall', 'LH', 'Residence', 'First-year residence hall'),
('Engleman Hall', 'EH', 'Residence', 'First-year residence hall'),
('Fletcher Hall', 'FH', 'Residence', 'First-year residence hall'),
('Johnson Hall', 'JH', 'Residence', 'Upper-class residence hall'),
('McDowell Hall', 'MH', 'Residence', 'Upper-class residence hall'),
('Centennial Court A', 'CCA', 'Residence', 'Apartment-style housing'),
('Centennial Court B', 'CCB', 'Residence', 'Apartment-style housing'),
('Centennial Court C', 'CCC', 'Residence', 'Apartment-style housing'),
('University Village', 'UV', 'Residence', 'Graduate and family housing'),

-- Dining & Recreation
('Hub Dining Hall', 'HUB', 'Dining', 'Main campus dining facility'),
('Eastway Center', 'EW', 'Dining', 'Student dining and market'),
('Rec Center', 'REC', 'Recreation', 'Campus Recreation Center with gym and fitness facilities'),
('Kent State Golf Course', 'GOLF', 'Recreation', 'University golf course and clubhouse'),
('Memorial Athletic and Convocation Center', 'MAC', 'Athletics', 'Main athletic facility and arena'),

-- Outdoor Spaces
('Risman Plaza', 'RP', 'Outdoor', 'Central campus plaza and gathering space'),
('Esplanade', 'ESP', 'Outdoor', 'Main campus walkway'),
('Commons Lawn', 'CL', 'Outdoor', 'Large open lawn area for events'),
('Dix Stadium', 'DIX', 'Athletics', 'Football stadium'),
('Olson Field', 'OF', 'Athletics', 'Baseball field'),

-- Parking Areas
('Visitor Parking Deck', 'VPD', 'Parking', 'Multi-level visitor parking structure'),
('Terrace Drive Parking', 'TDP', 'Parking', 'Surface parking lot on Terrace Drive'),
('Summit Street Parking', 'SSP', 'Parking', 'Parking areas along Summit Street'),
('Theater Parking', 'TP', 'Parking', 'Parking near University Theater'),
('Library Parking', 'LP', 'Parking', 'Parking areas near the Library'),

-- Other Important Locations
('Bookstore', 'BOOK', 'Services', 'University bookstore and retail'),
('Health Services', 'HS', 'Services', 'Campus health and medical services'),
('Counseling Services', 'CS', 'Services', 'Student counseling and psychological services'),
('University Theater', 'UT', 'Academic', 'Performing arts theater'),
('Cartwright Hall', 'CH', 'Academic', 'Classroom and office building'),
('McGilvrey Hall', 'MGH', 'Academic', 'Classroom and office building'),
('Bowman Hall', 'BH', 'Academic', 'Psychology and social sciences'),
('Satterfield Hall', 'SH', 'Academic', 'Communication and journalism'),
('Franklin Hall', 'FRH', 'Academic', 'English and modern languages'),
('Lowry Hall', 'LWH', 'Academic', 'History and philosophy'),

-- Transportation & Entrances
('Main Campus Entrance', 'MCE', 'Entrance', 'Primary campus entrance from Summit Street'),
('East Campus Entrance', 'ECE', 'Entrance', 'Eastern campus entrance'),
('South Campus Entrance', 'SCE', 'Entrance', 'Southern campus entrance'),
('Bus Stop - Student Center', 'BS-SC', 'Transportation', 'Main campus bus stop'),
('Bus Stop - Terrace Drive', 'BS-TD', 'Transportation', 'Terrace Drive bus stop'),
('Bike Rack - Library', 'BR-LIB', 'Transportation', 'Bicycle parking near Library'),
('Bike Rack - Student Center', 'BR-SC', 'Transportation', 'Bicycle parking near Student Center');