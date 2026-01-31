import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { Fuel, X } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  current_odometer: number;
}

interface QuickFuelLogModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickFuelLogModal({ onClose, onSuccess }: QuickFuelLogModalProps) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [odometerReading, setOdometerReading] = useState('');
  const [gallonsAdded, setGallonsAdded] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [isOdometerOnly, setIsOdometerOnly] = useState(false);
  const [notes, setNotes] = useState('');
  const [merchant, setMerchant] = useState('');

  useEffect(() => {
    loadVehicles();
  }, [user]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_vehicles')
        .select('id, name, current_odometer')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
      if (data && data.length > 0) {
        setSelectedVehicleId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading vehicles:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicleId || !odometerReading) {
      setError('Please select a vehicle and enter odometer reading');
      return;
    }

    if (!isOdometerOnly && (!gallonsAdded || !totalCost)) {
      setError('Please fill in gallons and cost, or check "Odometer Only"');
      return;
    }

    const currentOdometer = parseInt(odometerReading);
    const gallons = gallonsAdded ? parseFloat(gallonsAdded) : null;
    const cost = totalCost ? parseFloat(totalCost) : null;

    if (currentOdometer <= 0) {
      setError('Odometer reading must be greater than zero');
      return;
    }

    if (!isOdometerOnly && (gallons === null || cost === null || gallons <= 0 || cost <= 0)) {
      setError('Gallons and cost must be greater than zero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: lastLog } = await supabase
        .from('vextor_fuel_logs')
        .select('odometer_reading')
        .eq('vehicle_id', selectedVehicleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let tripMiles: number | null = null;
      let mpg: number | null = null;

      if (lastLog) {
        if (currentOdometer <= lastLog.odometer_reading) {
          setError('Odometer reading must be greater than the previous reading');
          setLoading(false);
          return;
        }
        tripMiles = currentOdometer - lastLog.odometer_reading;
        if (gallons !== null && gallons > 0) {
          mpg = tripMiles / gallons;
        }
      }

      const { error: insertError } = await supabase
        .from('vextor_fuel_logs')
        .insert({
          user_id: user?.id,
          vehicle_id: selectedVehicleId,
          odometer_reading: currentOdometer,
          gallons_added: gallons,
          total_cost: cost,
          trip_miles: tripMiles,
          mpg: mpg,
          notes: notes,
          merchant: merchant || null,
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('vextor_vehicles')
        .update({ current_odometer: currentOdometer })
        .eq('id', selectedVehicleId);

      if (updateError) throw updateError;

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add fuel log');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  if (vehicles.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a1a] border-4 border-[#FF4500] max-w-md w-full">
          <div className="bg-[#FF4500] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fuel size={24} className="text-white" />
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
                ADD FUEL LOG
              </h3>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
          <div className="p-6 text-center">
            <Fuel size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No vehicles found. Please add a vehicle first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border-4 border-[#FF4500] max-w-md w-full">
        <div className="bg-[#FF4500] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fuel size={24} className="text-white" />
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
              ADD FUEL LOG
            </h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              VEHICLE
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#FF4500] transition-colors"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
            {selectedVehicle && (
              <p className="text-xs text-gray-500 mt-1">
                Last odometer: {selectedVehicle.current_odometer.toLocaleString()} miles
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              ODOMETER READING
            </label>
            <input
              type="number"
              value={odometerReading}
              onChange={(e) => setOdometerReading(e.target.value)}
              placeholder="50000"
              min="0"
              step="1"
              className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#FF4500] transition-colors"
              required
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-[#252525] border border-[#333]">
            <input
              type="checkbox"
              id="odometerOnly"
              checked={isOdometerOnly}
              onChange={(e) => {
                setIsOdometerOnly(e.target.checked);
                if (e.target.checked) {
                  setGallonsAdded('');
                  setTotalCost('');
                }
              }}
              className="w-4 h-4"
            />
            <label htmlFor="odometerOnly" className="text-sm text-gray-300 cursor-pointer flex-1">
              Odometer only (no fuel purchase)
            </label>
          </div>

          {!isOdometerOnly && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  GALLONS ADDED
                </label>
                <input
                  type="number"
                  value={gallonsAdded}
                  onChange={(e) => setGallonsAdded(e.target.value)}
                  placeholder="12.5"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#FF4500] transition-colors"
                  required={!isOdometerOnly}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  TOTAL COST ($)
                </label>
                <input
                  type="number"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  placeholder="45.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#FF4500] transition-colors"
                  required={!isOdometerOnly}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              REFERENCE / RECEIPT # (OPTIONAL)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Receipt #4452"
              className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#FF4500] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              MERCHANT (OPTIONAL)
            </label>
            <select
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#FF4500] transition-colors"
            >
              <option value="">Select or type merchant...</option>
              <option value="Loves">Loves Travel Stops</option>
              <option value="Pilot">Pilot Flying J</option>
              <option value="Flying J">Flying J</option>
              <option value="Shell">Shell</option>
              <option value="Chevron">Chevron</option>
              <option value="BP">BP</option>
              <option value="Speedway">Speedway</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'ADDING...' : 'ADD LOG'}
            </Button>
            <Button onClick={onClose} variant="ghost" fullWidth>
              CANCEL
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
