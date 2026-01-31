/*
  # Update Vextor Expenses Table

  1. Changes
    - Add `vehicle_id` column (foreign key to vextor_vehicles)
    - Add `expense_date` column (date field for when expense occurred)

  2. Indexes
    - Add index on vehicle_id for efficient querying
    - Add index on expense_date
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vextor_expenses' AND column_name = 'vehicle_id'
  ) THEN
    ALTER TABLE vextor_expenses ADD COLUMN vehicle_id uuid REFERENCES vextor_vehicles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vextor_expenses' AND column_name = 'expense_date'
  ) THEN
    ALTER TABLE vextor_expenses ADD COLUMN expense_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS vextor_expenses_vehicle_id_idx ON vextor_expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS vextor_expenses_expense_date_idx ON vextor_expenses(expense_date);
CREATE INDEX IF NOT EXISTS vextor_expenses_user_id_expense_date_idx ON vextor_expenses(user_id, expense_date);
