import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CompleteMissionModalProps {
  missionId: string;
  vehicleId: string;
  currentOdometer: number;
  estimatedMiles: number;
  podRequired: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CompleteMissionModal({
  missionId,
  vehicleId,
  currentOdometer,
  estimatedMiles,
  podRequired,
  onClose,
  onSuccess,
}: CompleteMissionModalProps) {
  const [finalOdometer, setFinalOdometer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setError('');

    const finalOdometerNum = parseFloat(finalOdometer);

    if (!finalOdometer || isNaN(finalOdometerNum)) {
      setError('Please enter a valid odometer reading');
      return;
    }

    if (finalOdometerNum <= currentOdometer) {
      setError(`Odometer must be greater than current reading (${currentOdometer})`);
      return;
    }

    setLoading(true);

    try {
      const actualMiles = finalOdometerNum - currentOdometer;
      const deliveryTimestamp = new Date().toISOString();

      let missionStatus = 'completed';
      if (podRequired) {
        missionStatus = 'pending_pod';
      }

      const { error: updateMissionError } = await supabase
        .from('vextor_missions')
        .update({
          status: missionStatus,
          actual_miles: actualMiles,
          delivery_timestamp: deliveryTimestamp,
          completed_at: deliveryTimestamp,
        })
        .eq('id', missionId);

      if (updateMissionError) throw updateMissionError;

      const { error: updateVehicleError } = await supabase
        .from('vextor_vehicles')
        .update({ current_odometer: finalOdometerNum })
        .eq('id', vehicleId);

      if (updateVehicleError) throw updateVehicleError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error completing mission:', err);
      setError('Failed to complete mission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#008080]" style={{ fontFamily: 'monospace' }}>
            COMPLETE MISSION
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#0a0a0a] border border-[#333] p-3 rounded text-xs space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">CURRENT ODOMETER</span>
              <span className="text-white font-bold">{currentOdometer} mi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ESTIMATED DISTANCE</span>
              <span className="text-white font-bold">{estimatedMiles.toFixed(1)} mi</span>
            </div>
            {podRequired && (
              <div className="border-t border-[#333] pt-2 mt-2 flex items-center gap-2">
                <span className="text-yellow-400">POD Required</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              FINAL ODOMETER READING
            </label>
            <input
              type="number"
              step="0.1"
              value={finalOdometer}
              onChange={(e) => setFinalOdometer(e.target.value)}
              placeholder={`Must be greater than ${currentOdometer}`}
              className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white placeholder-gray-600 focus:outline-none focus:border-[#008080] transition-colors"
              disabled={loading}
            />
          </div>

          {finalOdometer && !isNaN(parseFloat(finalOdometer)) && (
            <div className="bg-[#0a0a0a] border border-[#333] p-3 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">ACTUAL MILES</span>
                <span className="text-white font-bold">
                  {(parseFloat(finalOdometer) - currentOdometer).toFixed(1)} mi
                </span>
              </div>
              <div className="border-t border-[#333] pt-2 mt-2">
                <span className="text-gray-500 text-[10px]">
                  {podRequired
                    ? 'Mission will move to "Pending POD" after completion'
                    : 'Mission will move to "History" after completion'}
                </span>
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
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#333] text-gray-300 font-semibold hover:bg-[#444] transition-colors disabled:opacity-50"
              disabled={loading}
            >
              CANCEL
            </button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading || !finalOdometer}
            >
              {loading ? 'COMPLETING...' : 'COMPLETE'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
