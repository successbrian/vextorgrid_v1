/*
  # Rename all tables with vextor_ prefix

  1. Tables Renamed
    - `profiles` → `vextor_profiles`
    - `vehicles` → `vextor_vehicles`
    - `missions` → `vextor_missions`
    - `fuel_logs` → `vextor_fuel_logs`
    - `active_missions` → `vextor_active_missions`
    - `site_updates` → `vextor_site_updates`
    - `site_update_likes` → `vextor_site_update_likes`
    - `site_update_messages` → `vextor_site_update_messages`
    - `field_reports` → `vextor_field_reports`
    - `inventory_items` → `vextor_inventory_items`
    - `shopping_list_items` → `vextor_shopping_list_items`

  2. Important Notes
    - All data is preserved during the rename
    - Foreign key constraints are automatically updated by PostgreSQL
    - RLS policies remain intact
    - All table relationships are maintained
*/

ALTER TABLE IF EXISTS profiles RENAME TO vextor_profiles;
ALTER TABLE IF EXISTS vehicles RENAME TO vextor_vehicles;
ALTER TABLE IF EXISTS missions RENAME TO vextor_missions;
ALTER TABLE IF EXISTS fuel_logs RENAME TO vextor_fuel_logs;
ALTER TABLE IF EXISTS active_missions RENAME TO vextor_active_missions;
ALTER TABLE IF EXISTS site_updates RENAME TO vextor_site_updates;
ALTER TABLE IF EXISTS site_update_likes RENAME TO vextor_site_update_likes;
ALTER TABLE IF EXISTS site_update_messages RENAME TO vextor_site_update_messages;
ALTER TABLE IF EXISTS field_reports RENAME TO vextor_field_reports;
ALTER TABLE IF EXISTS inventory_items RENAME TO vextor_inventory_items;
ALTER TABLE IF EXISTS shopping_list_items RENAME TO vextor_shopping_list_items;