# VextorGrid - December 2025

## Features

### User Management
- Email/password authentication via Supabase
- User profiles with WhatsApp contact, referral codes
- Admin role system
- Onboarding wizard

### Vehicle Fleet Management
- Add/manage vehicles (year, make, model)
- Track odometer readings
- Oil change interval tracking
- Usage type: personal, delivery, or mixed

### Mission Control
- Active missions with origin/destination tracking
- CPM (cost per mile) calculator
- Mission completion with proof upload
- Estimated vs actual miles tracking

### Supply Depot
- Inventory management system
- Shopping list with checkboxes
- Quantity tracking with units

### Fuel Tracking
- Fuel log entries per vehicle
- MPG calculation
- Cost and gallons tracking
- Trip miles between fill-ups

### Command HUD
- Real-time dashboard
- Customizable clock widgets (JSONB config)
- Last active tracking
- Fleet readiness status

### Communications
- Live feed shouts (user-to-platform messages)
- Field reports with image upload
- Report status workflow: PENDING → HOLD → PUBLISHED
- SEO metadata for published reports
- Contest entry flagging

### Site Updates & Engagement
- Admin-created announcements, features, bug fixes
- Like/dislike reactions per update
- User-to-admin messaging per update
- Threaded replies (admin responses to user messages)
- Message count display

### Analytics & Growth
- User referral tracking
- Validation system for field reports
- Admin notes for moderation

## Database Schema

### Core Tables

**profiles**
- User profile data, WhatsApp, role, admin flag, referral code
- Custom clock config (JSONB)
- Links to auth.users

**vehicles**
- Vehicle info: name, type, year, make, model
- Odometer and oil change tracking
- Usage type: personal/delivery/mixed

**fuel_logs**
- Odometer, gallons, cost, trip miles, MPG
- Links to user and vehicle

**missions**
- Destination, offer amount, estimated miles, fuel cost
- Status: active/completed
- Proof image, actual miles
- Links to user and vehicle

**active_missions**
- Origin, destination, estimated miles, pay amount, CPM
- Proof upload status
- Links to user and vehicle

**inventory_items**
- Item name, quantity, unit
- Per-user inventory

**shopping_list_items**
- Item name, checked status
- Per-user lists

**site_updates**
- Title, description, category
- Created/updated timestamps

**site_update_likes**
- Reaction: LIKE or DISLIKE
- Unique constraint: one reaction per user per update

**site_update_messages**
- User messages and admin replies
- Parent message ID for threading
- Links to update and user

**shouts**
- User broadcast messages
- Timestamp tracking

**field_reports**
- Image URL, caption
- Status: PENDING/HOLD/PUBLISHED
- SEO: slug, title, description
- Validation count, contest flag, admin notes

### Security
- RLS enabled on all tables
- Users access only their own data
- Admins can read/moderate all content
- Message threads visible to participants and admins

### Tech Stack
- Frontend: React + TypeScript + Tailwind CSS + Vite
- Backend: Supabase (PostgreSQL + Auth + Storage)
- State: React Context API
- Icons: Lucide React
