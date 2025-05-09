-- Dodavanje osnovnih mirisa za svijeće ako ne postoje
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Lavanda') THEN
    INSERT INTO scents (name, description, active) VALUES ('Lavanda', 'Umirujući miris lavande za opuštanje', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Vanilija') THEN
    INSERT INTO scents (name, description, active) VALUES ('Vanilija', 'Slatki miris vanilije za ugodnu atmosferu', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Cimet') THEN
    INSERT INTO scents (name, description, active) VALUES ('Cimet', 'Topli miris cimeta za zimske večeri', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Jasmin') THEN
    INSERT INTO scents (name, description, active) VALUES ('Jasmin', 'Cvjetni miris jasmina za romantičnu atmosferu', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Sandalovina') THEN
    INSERT INTO scents (name, description, active) VALUES ('Sandalovina', 'Egzotični miris sandalovine za meditaciju', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Citrus') THEN
    INSERT INTO scents (name, description, active) VALUES ('Citrus', 'Osvježavajući miris citrusa za energiju', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Jabuka i cimet') THEN
    INSERT INTO scents (name, description, active) VALUES ('Jabuka i cimet', 'Ugodna kombinacija mirisa jabuke i cimeta', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Ruža') THEN
    INSERT INTO scents (name, description, active) VALUES ('Ruža', 'Elegantni miris ruže za posebne prilike', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Bor') THEN
    INSERT INTO scents (name, description, active) VALUES ('Bor', 'Svježi miris bora za blagdane', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Eukaliptus') THEN
    INSERT INTO scents (name, description, active) VALUES ('Eukaliptus', 'Proćišćavajući miris eukaliptusa', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Mint') THEN
    INSERT INTO scents (name, description, active) VALUES ('Mint', 'Svježi miris mente za fokus i koncentraciju', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM scents WHERE name = 'Kokonut') THEN
    INSERT INTO scents (name, description, active) VALUES ('Kokonut', 'Tropski miris kokosa za ljetnu atmosferu', true);
  END IF;
END $$;

-- Dodavanje osnovnih boja za svijeće
INSERT INTO colors (name, hex_value, active) VALUES
('Bijela', '#FFFFFF', true),
('Bež', '#F5F5DC', true),
('Zlatna', '#FFD700', true),
('Srebrna', '#C0C0C0', true),
('Crvena', '#FF0000', true),
('Zelena', '#008000', true),
('Plava', '#0000FF', true),
('Žuta', '#FFFF00', true),
('Ljubičasta', '#800080', true),
('Ružičasta', '#FFC0CB', true),
('Crna', '#000000', true),
('Narančasta', '#FFA500', true),
('Smeđa', '#A52A2A', true),
('Tirkizna', '#40E0D0', true)
ON CONFLICT (name) DO NOTHING;