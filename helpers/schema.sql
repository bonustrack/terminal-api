CREATE TABLE accounts (
  id VARCHAR(12) NOT NULL,
  email VARCHAR(64) NOT NULL,
  phone VARCHAR(24) NOT NULL,
  email_verified INT DEFAULT 0,
  phone_verified INT DEFAULT 0,
  password VARCHAR(64) NOT NULL,
  name VARCHAR(32) NOT NULL,
  firstname VARCHAR(32) NOT NULL,
  lastname VARCHAR(32) NOT NULL,
  picture_url TEXT,
  about TEXT,
  locale VARCHAR(5) NOT NULL DEFAULT 'en',
  notifications_email INT DEFAULT 1,
  notifications_phone INT DEFAULT 1,
  is_pro INT DEFAULT 0,
  is_admin INT DEFAULT 0,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logged TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  KEY created (created),
  KEY logged (logged)
);

CREATE TABLE addresses (
  id VARCHAR(12) NOT NULL,
  account VARCHAR(12) NOT NULL,
  name VARCHAR(32) NOT NULL,
  country VARCHAR(2) NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY account (account)
);

CREATE TABLE connections (
  account VARCHAR(12) NOT NULL,
  provider VARCHAR(24) NOT NULL,
  provider_id VARCHAR(64) NOT NULL,
  refresh_token TEXT,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`provider`, `provider_id`),
  KEY account (account)
);

CREATE TABLE services (
  id VARCHAR(12) NOT NULL,
  slug VARCHAR(24) NOT NULL,
  name VARCHAR(24) NOT NULL,
  picture_url TEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY slug (`slug`)
);

CREATE TABLE projects (
  id VARCHAR(12) NOT NULL,
  account VARCHAR(12) NOT NULL,
  service VARCHAR(12) NOT NULL,
  address VARCHAR(12) NOT NULL,
  pro VARCHAR(12) NOT NULL,
  options JSON,
  is_done INT DEFAULT 0,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY account (account),
  KEY pro (pro)
);

INSERT INTO accounts (id, name, picture_url, about, is_pro) VALUES
('1', 'Caitlyn Kerluke', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWot499B5MpLOKauS1q9ApdyD8f2yR0zCpOObztuEULupBBaJwqA', 'Lorem ipsum dolor sit amet, ad dicta semper regione mea. Eu quo omnes scripta recusabo.', 1),
('2', 'Keegan Luettgen', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv19Qj4mTlOTEeC1j9hrT9_Ii7fiObpHwvQqab_PFYIwf-KET4', 'Eum fugit aliquid recteque et, vis at discere hendrerit, sit expetenda iudicabit ne.', 1),
('3', 'Kassandra Haley', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-6G-7y4k1SC43EIk2gXAWQXrPtswHDiVUlJYykZ_U6XkWkYAx', 'Virtute antiopam eu, labitur voluptatibus at sed, eum sonet legimus petentium iudicabit.', 1),
('4', 'Rowan Nikolaus', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtN9gmKVk2fAVkjfjvPfMxvKE-qsr_HgQLoo-rWlzPzT-x-Ie2', 'Vidit nostrum vis eu, ea nusquam instructior mel. Pri nibh possit ullamcorper ut, vis ullum.', 1);

INSERT INTO services (id, slug, name, picture_url) VALUES
('1', 'air-condition-repair', 'Air condition repair', 'https://www.81aircon.com/wp-content/uploads/2016/11/repair.jpg'),
('2', 'cat-grooming', 'Cat grooming', ''),
('3', 'dj', 'Dj', ''),
('4', 'dog-grooming', 'Dog grooming', ''),
('5', 'electrician', 'Electrician', ''),
('6', 'handyman', 'Handyman', 'https://zone-thebestsingapore-bhxtb9xxzrrdpzhqr.netdna-ssl.com/wp-content/uploads/2019/01/top-recommended-handyman-service-singapore.jpg'),
('7', 'house-cleaning', 'House cleaning', 'https://www.quickenloans.com/blog/wp-content/uploads/2019/01/WomanCleaningHouse.jpg'),
('8', 'logo-design', 'Logo design', ''),
('9', 'pastry-chef', 'Pastry chef', ''),
('10', 'plumbing', 'Plumbing', '');
