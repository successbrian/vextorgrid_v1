import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';

interface EditFuelLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  fuelLogId: string;
  vehicleId: string;
  currentOdometer: number;
  currentGallons: number | null;
  currentCost: number | null;
  currentDate?: string;
  currentNotes?: string;
  currentMerchant?: string;
  onSuccess: () => void;
  onRefreshAll?: () => void | Promise<void>;
}

export function EditFuelLogModal({
  isOpen,
  onClose,
  fuelLogId,
  vehicleId,
  currentOdometer,
  currentGallons,
  currentCost,
  currentDate,
  currentNotes,
  currentMerchant,
  onSuccess,
  onRefreshAll,
}: EditFuelLogModalProps) {
  const [editOdometer, setEditOdometer] = useState(currentOdometer.toString());
  const [editGallons, setEditGallons] = useState(currentGallons?.toString() || '');
  const [editCost, setEditCost] = useState(currentCost?.toString() || '');
  const [editDate, setEditDate] = useState(() => {
    if (currentDate) {
      const date = new Date(currentDate);
      return date.toLocaleDateString('en-CA');
    }
    return new Date().toLocaleDateString('en-CA');
  });
  const [editNotes, setEditNotes] = useState(currentNotes || '');
  const [editMerchant, setEditMerchant] = useState(currentMerchant || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allFuelLogs, setAllFuelLogs] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && vehicleId) {
      loadAllFuelLogs();
    }
  }, [isOpen, vehicleId]);

  const loadAllFuelLogs = async () => {
    try {
      const { data } = await supabase
        .from('vextor_fuel_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });
      setAllFuelLogs(data || []);
    } catch (err) {
      console.error('Error loading fuel logs:', err);
    }
  };

  const handleSave = async () => {
    if (!editOdometer) {
      setError('Odometer reading is required');
      return;
    }

    const newOdometer = parseInt(editOdometer);
    const newGallons = editGallons ? parseFloat(editGallons) : null;
    const newCost = editCost ? parseFloat(editCost) : null;

    if (newOdometer <= 0) {
      setError('Odometer must be greater than zero');
      return;
    }

    if (newGallons !== null && newGallons <= 0) {
      setError('Gallons must be greater than zero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const previousLog = allFuelLogs.find(l => l.id === fuelLogId);
      if (!previousLog) throw new Error('Log not found');

      const nextLog = allFuelLogs.find(l =>
        new Date(l.created_at) > new Date(previousLog.created_at)
      );

      if (nextLog && newOdometer >= nextLog.odometer_reading) {
        setError('Odometer cannot be greater than the next fuel log reading');
        setLoading(false);
        return;
      }

      const previousPreviousLog = allFuelLogs
        .filter(l => new Date(l.created_at) < new Date(previousLog.created_at))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      let tripMiles: number | null = null;
      let mpg: number | null = null;

      if (previousPreviousLog) {
        if (newOdometer <= previousPreviousLog.odometer_reading) {
          setError('Odometer must be greater than the previous fuel log reading');
          setLoading(false);
          return;
        }
        tripMiles = newOdometer - previousPreviousLog.odometer_reading;
        if (newGallons !== null && newGallons > 0) {
          mpg = tripMiles / newGallons;
        }
      }

      const dateObj = new Date(editDate + 'T00:00:00');

      const { error: updateError } = await supabase
        .from('vextor_fuel_logs')
        .update({
          odometer_reading: newOdometer,
          gallons_added: newGallons,
          total_cost: newCost,
          trip_miles: tripMiles,
          mpg: mpg,
          created_at: dateObj.toISOString(),
          notes: editNotes,
          merchant: editMerchant || null,
        })
        .eq('id', fuelLogId);

      if (updateError) throw updateError;

      onSuccess();
      if (onRefreshAll) {
        await onRefreshAll();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fuel log');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
            EDIT FUEL LOG
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Odometer Reading
            </label>
            <input
              type="number"
              value={editOdometer}
              onChange={(e) => setEditOdometer(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Gallons Added (optional)
            </label>
            <input
              type="number"
              step="0.1"
              value={editGallons}
              onChange={(e) => setEditGallons(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Cost (optional)
            </label>
            <input
              type="number"
              step="0.01"
              value={editCost}
              onChange={(e) => setEditCost(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reference / Receipt # (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Receipt #4452"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Merchant (optional)
            </label>
            <select
              value={editMerchant}
              onChange={(e) => setEditMerchant(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white"
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
        </div>

        <div className="flex gap-3 p-6 border-t border-[#333]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#333] text-gray-300 hover:bg-[#444] rounded font-medium"
          >
            Cancel
          </button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'SAVING...' : 'SAVE CHANGES'}
          </Button>
        </div>
      </div>
    </div>
  );
}
