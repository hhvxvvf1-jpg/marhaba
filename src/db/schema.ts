export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'traveler' CHECK (role IN (
    'traveler','partner_owner','partner_manager','partner_staff',
    'affiliate','support','finance','content_manager','admin','super_admin'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','banned')),
  email_verified INTEGER NOT NULL DEFAULT 0,
  preferred_lang TEXT NOT NULL DEFAULT 'fr',
  preferred_currency TEXT NOT NULL DEFAULT 'MAD',
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  travel_preferences_json TEXT NOT NULL DEFAULT '{}',
  privacy_settings_json TEXT NOT NULL DEFAULT '{"marketing_emails":true,"analytics":true}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT DEFAULT '',
  details_json TEXT NOT NULL DEFAULT '{}',
  ip_address TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  legal_type TEXT NOT NULL DEFAULT 'SARL',
  tax_id TEXT DEFAULT '',
  ice_number TEXT DEFAULT '',
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  rib_iban TEXT DEFAULT '',
  payout_schedule TEXT NOT NULL DEFAULT 'monthly' CHECK (payout_schedule IN ('weekly','biweekly','monthly','on_demand')),
  commission_override_pct REAL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','under_review','verified','rejected')),
  documents_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  legacy_id INTEGER UNIQUE,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'hotel','riad','resort','apartment','villa','guesthouse','car','experience','restaurant'
  )),
  marketplace_type TEXT NOT NULL CHECK (marketplace_type IN ('stay','car','exp','food')),
  city TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Morocco',
  country TEXT NOT NULL DEFAULT 'Morocco',
  address TEXT NOT NULL DEFAULT '',
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  star_rating INTEGER NOT NULL DEFAULT 4 CHECK (star_rating BETWEEN 1 AND 5),
  description TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  amenities_json TEXT NOT NULL DEFAULT '[]',
  images_json TEXT NOT NULL DEFAULT '[]',
  video_url TEXT DEFAULT '',
  check_in_time TEXT NOT NULL DEFAULT '15:00',
  check_out_time TEXT NOT NULL DEFAULT '12:00',
  cancellation_policy TEXT NOT NULL DEFAULT 'flexible' CHECK (cancellation_policy IN ('flexible','moderate','strict')),
  base_price_mad REAL NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'night',
  verified INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('draft','pending_approval','active','suspended','rejected')),
  featured INTEGER NOT NULL DEFAULT 0,
  sponsored INTEGER NOT NULL DEFAULT 0,
  instant_book INTEGER NOT NULL DEFAULT 1,
  commission_override_pct REAL,
  rating_avg REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  nearby_attractions_json TEXT NOT NULL DEFAULT '[]',
  policies_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(marketplace_type, category);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status, verified);

CREATE TABLE IF NOT EXISTS room_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  max_adults INTEGER NOT NULL DEFAULT 2,
  max_children INTEGER NOT NULL DEFAULT 1,
  extra_beds INTEGER NOT NULL DEFAULT 0,
  extra_bed_price_mad REAL NOT NULL DEFAULT 150,
  total_units INTEGER NOT NULL DEFAULT 1 CHECK (total_units >= 0),
  base_price_mad REAL NOT NULL,
  weekend_price_mad REAL,
  amenities_json TEXT NOT NULL DEFAULT '[]',
  images_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_room_types_prop ON room_types(property_id);

CREATE TABLE IF NOT EXISTS availability_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  available_units INTEGER,
  price_override_mad REAL,
  min_stay INTEGER NOT NULL DEFAULT 1,
  max_stay INTEGER NOT NULL DEFAULT 30,
  closed_to_arrival INTEGER NOT NULL DEFAULT 0,
  closed_to_departure INTEGER NOT NULL DEFAULT 0,
  is_blackout INTEGER NOT NULL DEFAULT 0,
  note TEXT DEFAULT '',
  UNIQUE(room_type_id, date)
);
CREATE INDEX IF NOT EXISTS idx_avail_room_date ON availability_overrides(room_type_id, date);

CREATE TABLE IF NOT EXISTS pricing_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('seasonal','weekend','holiday','long_stay','early_bird','last_minute')),
  adjustment_pct REAL NOT NULL DEFAULT 0,
  adjustment_fixed_mad REAL NOT NULL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  min_nights INTEGER,
  days_before_checkin INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_ref TEXT NOT NULL UNIQUE,
  traveler_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  nights INTEGER NOT NULL DEFAULT 1,
  adults INTEGER NOT NULL DEFAULT 2,
  children INTEGER NOT NULL DEFAULT 0,
  children_ages_json TEXT NOT NULL DEFAULT '[]',
  units_booked INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'draft','pending','pending_payment','confirmed','cancelled','rejected',
    'failed','completed','no_show','refund_pending','refunded','partially_refunded'
  )),
  currency TEXT NOT NULL DEFAULT 'MAD',
  fx_rate REAL NOT NULL DEFAULT 1,
  subtotal_mad REAL NOT NULL,
  discount_mad REAL NOT NULL DEFAULT 0,
  promo_code TEXT DEFAULT '',
  taxes_mad REAL NOT NULL DEFAULT 0,
  service_fee_mad REAL NOT NULL DEFAULT 0,
  total_mad REAL NOT NULL,
  commission_pct REAL NOT NULL,
  commission_mad REAL NOT NULL,
  partner_net_mad REAL NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  special_requests TEXT DEFAULT '',
  cancellation_reason TEXT DEFAULT '',
  cancelled_at TEXT,
  hold_expires_at TEXT,
  affiliate_id INTEGER,
  referral_code TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings(room_type_id, check_in, check_out, status);
CREATE INDEX IF NOT EXISTS idx_bookings_traveler ON bookings(traveler_id);
CREATE INDEX IF NOT EXISTS idx_bookings_partner ON bookings(partner_id);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('sandbox_card','stripe','paypal','cmi','pay_at_property')),
  provider_tx_id TEXT NOT NULL,
  amount_mad REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MAD',
  status TEXT NOT NULL CHECK (status IN ('initiated','authorized','captured','failed','refunded','partially_refunded')),
  method_summary TEXT DEFAULT '',
  raw_metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
  amount_mad REAL NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','processed','rejected')),
  processed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('booking_gross','commission','tax','fee','partner_payable','refund','payout','adjustment')),
  amount_mad REAL NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('credit','debit')),
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ledger_partner ON ledger_entries(partner_id);

CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  amount_mad REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','processing','paid','failed','rejected')),
  bank_reference TEXT DEFAULT '',
  period_start TEXT DEFAULT '',
  period_end TEXT DEFAULT '',
  requested_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER NOT NULL DEFAULT 5 CHECK (cleanliness_rating BETWEEN 1 AND 5),
  location_rating INTEGER NOT NULL DEFAULT 5 CHECK (location_rating BETWEEN 1 AND 5),
  value_rating INTEGER NOT NULL DEFAULT 5 CHECK (value_rating BETWEEN 1 AND 5),
  service_rating INTEGER NOT NULL DEFAULT 5 CHECK (service_rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  partner_reply TEXT DEFAULT '',
  partner_replied_at TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','pending_moderation','flagged','hidden')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  traveler_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_url TEXT DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','escalated','resolved','closed')),
  assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  discount_pct REAL NOT NULL DEFAULT 0,
  discount_fixed_mad REAL NOT NULL DEFAULT 0,
  min_booking_mad REAL NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 1000,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  category_filter TEXT DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS affiliates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  commission_pct REAL NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','suspended')),
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  total_earned_mad REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referred_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  reward_mad REAL NOT NULL DEFAULT 150,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','qualified','paid')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  language TEXT NOT NULL DEFAULT 'fr',
  status TEXT NOT NULL DEFAULT 'subscribed',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Morocco',
  summary TEXT NOT NULL,
  summary_fr TEXT NOT NULL,
  summary_ar TEXT NOT NULL,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  trending INTEGER NOT NULL DEFAULT 1,
  featured_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cms_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  content_json TEXT NOT NULL DEFAULT '{}',
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS channel_integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('siteminder','cloudbeds','beds24','hotelbeds','ical')),
  external_property_id TEXT DEFAULT '',
  ical_import_url TEXT DEFAULT '',
  ical_export_token TEXT NOT NULL,
  sync_availability INTEGER NOT NULL DEFAULT 1,
  sync_rates INTEGER NOT NULL DEFAULT 1,
  sync_reservations INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'needs_credentials' CHECK (status IN ('configured','needs_credentials','active','error')),
  last_sync_at TEXT,
  last_sync_message TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_id INTEGER NOT NULL REFERENCES channel_integrations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wishlists (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, property_id)
);

CREATE TABLE IF NOT EXISTS flight_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_ref TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  trip_type TEXT NOT NULL DEFAULT 'round_trip' CHECK (trip_type IN ('one_way','round_trip')),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date TEXT NOT NULL,
  return_date TEXT DEFAULT '',
  cabin_class TEXT NOT NULL DEFAULT 'economy' CHECK (cabin_class IN ('economy','business')),
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  extra_baggage INTEGER NOT NULL DEFAULT 0,
  flexible_dates INTEGER NOT NULL DEFAULT 0,
  contact_phone TEXT NOT NULL,
  contact_email TEXT DEFAULT '',
  quoted_price_mad REAL,
  admin_notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending_quote' CHECK (status IN ('pending_quote','quoted','confirmed','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transport_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_ref TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'intercity' CHECK (mode IN ('intercity','intracity')),
  carrier_type TEXT NOT NULL DEFAULT 'train_oncf' CHECK (carrier_type IN ('train_oncf','bus_ctm','supratours','taxi_transfer')),
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  travel_date TEXT NOT NULL,
  passengers INTEGER NOT NULL DEFAULT 1,
  indicative_price_mad REAL NOT NULL DEFAULT 0,
  contact_phone TEXT NOT NULL,
  admin_notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending_quote' CHECK (status IN ('pending_quote','quoted','confirmed','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transport_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_code TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL DEFAULT 'intercity' CHECK (mode IN ('intercity','intracity')),
  carrier_type TEXT NOT NULL CHECK (carrier_type IN ('train_oncf','bus_ctm','supratours','bus_regional','taxi_transfer')),
  carrier_brand TEXT NOT NULL,
  line_name TEXT NOT NULL,
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  origin_station TEXT NOT NULL,
  destination_station TEXT NOT NULL,
  dep_time TEXT NOT NULL,
  arr_time TEXT NOT NULL,
  duration_mins INTEGER NOT NULL,
  distance_km INTEGER NOT NULL,
  fare_mad REAL NOT NULL,
  stops INTEGER NOT NULL DEFAULT 0,
  amenities_json TEXT NOT NULL DEFAULT '[]',
  seats_left INTEGER NOT NULL DEFAULT 10,
  is_high_speed INTEGER NOT NULL DEFAULT 0,
  source_portal TEXT NOT NULL,
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold_out','removed','expired')),
  valid_until TEXT NOT NULL,
  last_checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  check_failures INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_transport_offers_route ON transport_offers(origin_city, destination_city, status);

CREATE TABLE IF NOT EXISTS esim_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_ref TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  package_code TEXT NOT NULL,
  data_gb INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  price_mad REAL NOT NULL,
  customer_email TEXT NOT NULL,
  device_unlocked_confirmed INTEGER NOT NULL DEFAULT 1,
  qr_payload TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending_provider' CHECK (status IN ('pending_provider','qr_issued','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS itineraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_ref TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  city TEXT NOT NULL,
  days_count INTEGER NOT NULL,
  travelers INTEGER NOT NULL DEFAULT 2,
  budget_mad REAL NOT NULL,
  estimated_total_mad REAL NOT NULL,
  include_car INTEGER NOT NULL DEFAULT 1,
  interests TEXT DEFAULT '',
  plan_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','requested','partially_confirmed','confirmed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS beta_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_ref TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('bug','design','confusing','missing','slow','booking','language','suggestion')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  page_url TEXT DEFAULT '',
  locale TEXT DEFAULT 'en',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','triaged','resolved','wont_fix')),
  admin_notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
