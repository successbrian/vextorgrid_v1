import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Vehicle {
  id: string;
  name: string;
  current_odometer: number;
}

interface ReassignMissionModalProps {
  missionId: string;
  currentVehicleId: string;
  estimatedMiles: number;
  offerAmount: number;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReassignMissionModal({
  missionId,
  currentVehicleId,
  estimatedMiles,
  offerAmount,
  userId,
  onClose,
  onSuccess,
}: ReassignMissionModalProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, [userId]);

  const loadVehicles = async () => {
    try {
      const { data, error: vehiclesError } = await supabase
        .from('vextor_vehicles')
        .select('id, name, current_odometer')
        .eq('user_id', userId)
        .neq('id', currentVehicleId)
        .order('name', { ascending: true });

      if (vehiclesError) throw vehiclesError;
      setVehicles(data || []);
      if (data && data.length > 0) {
        setSelectedVehicleId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError('Failed to load vehicles');
    }
  };

  const handleReassign = async () => {
    if (!selectedVehicleId) {
      setError('Please select a vehicle');
      return;
    }

    setLoading(true);

    try {
      const costPerMile = offerAmount / estimatedMiles;

      const { error: updateError } = await supabase
        .from('vextor_missions')
        .update({
          vehicle_id: selectedVehicleId,
          cost_per_mile: costPerMile,
        })
        .eq('id', missionId);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error reassigning mission:', err);
      setError('Failed to reassign mission');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const cpm = offerAmount / estimatedMiles;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#008080]" style={{ fontFamily: 'monospace' }}>
            REASSIGN MISSION
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-[#333] p-3 rounded text-xs space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">DISTANCE</span>
              <span className="text-white font-bold">{estimatedMiles.toFixed(1)} mi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PAYOUT</span>
              <span className="text-white font-bold">${offerAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CPM</span>
              <span className="text-white font-bold">${cpm.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              SELECT VEHICLE
            </label>
            {vehicles.length === 0 ? (
              <div className="p-3 bg-yellow-900/20 border border-yellow-700 text-yellow-400 text-sm">
                No other vehicles available
              </div>
            ) : (
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
                disabled={loading}
              >
                <option value="">Choose a vehicle...</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedVehicle && (
            <div className="bg-[#0a0a0a] border border-[#333] p-3 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">CURRENT ODOMETER</span>
                <span className="text-white font-bold">{selectedVehicle.current_odometer} mi</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-700 p-3 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#333] text-gray-300 font-semibold hover:bg-[#444] transition-colors disabled:opacity-50"
              disabled={loading}
            >
              CANCEL
            </button>
            <Button
              onClick={handleReassign}
              className="flex-1"
              disabled={loading || !selectedVehicleId || vehicles.length === 0}
            >
              {loading ? 'REASSIGNING...' : 'REASSIGN'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
