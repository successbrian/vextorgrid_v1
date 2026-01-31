import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { MapPin, X } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
}

interface QuickMissionModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickMissionModal({ onClose, onSuccess }: QuickMissionModalProps) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    miles: '',
    payout: '',
    podRequired: false,
    notes: '',
    loadId: '',
    isFactored: false,
  });

  useEffect(() => {
    loadVehicles();
  }, [user]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_vehicles')
        .select('id, name')
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedVehicleId || !formData.origin || !formData.destination || !formData.miles || !formData.payout) {
      setError('Please fill in all fields');
      return;
    }

    const estimatedMiles = parseFloat(formData.miles);
    const offerAmount = parseFloat(formData.payout);

    if (estimatedMiles <= 0 || offerAmount <= 0) {
      setError('Miles and payout must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const costPerMile = offerAmount / estimatedMiles;

      const { error: insertError } = await supabase
        .from('vextor_missions')
        .insert({
          user_id: user?.id,
          vehicle_id: selectedVehicleId,
          origin: formData.origin,
          destination: formData.destination,
          estimated_miles: estimatedMiles,
          offer_amount: offerAmount,
          cost_per_mile: costPerMile,
          fuel_cost_per_gallon: 0,
          estimated_profit: offerAmount,
          status: 'active',
          pod_required: formData.podRequired,
          notes: formData.notes,
          load_id: formData.loadId || null,
          is_factored: formData.isFactored,
        });

      if (insertError) throw insertError;

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mission');
    } finally {
      setLoading(false);
    }
  };

  if (vehicles.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a1a] border-4 border-[#008080] max-w-md w-full">
          <div className="bg-[#008080] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin size={24} className="text-white" />
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
                NEW MISSION
              </h3>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
          <div className="p-6 text-center">
            <MapPin size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No vehicles found. Please add a vehicle first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border-4 border-[#008080] max-w-md w-full">
        <div className="bg-[#008080] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin size={24} className="text-white" />
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
              NEW MISSION
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
              className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              ORIGIN
            </label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
              placeholder="Starting location"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              DESTINATION
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
              placeholder="Delivery destination"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                MILES
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.miles}
                onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
                className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                PAYOUT
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.payout}
                onChange={(e) => setFormData({ ...formData, payout: e.target.value })}
                className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
                placeholder="$0.00"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#333] rounded">
            <input
              type="checkbox"
              id="podRequired"
              checked={formData.podRequired}
              onChange={(e) => setFormData({ ...formData, podRequired: e.target.checked })}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="podRequired" className="text-sm font-semibold text-gray-400 cursor-pointer flex-1">
              REQUIRE PROOF OF DELIVERY (POD)
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              REFERENCE / NOTES (OPTIONAL)
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
              placeholder="e.g., Broker Load ID: XYZ-123"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              LOAD ID / RATE CON # (OPTIONAL)
            </label>
            <input
              type="text"
              value={formData.loadId}
              onChange={(e) => setFormData({ ...formData, loadId: e.target.value })}
              className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
              placeholder="e.g., LC-123456"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#333] rounded">
            <input
              type="checkbox"
              id="isFactored"
              checked={formData.isFactored}
              onChange={(e) => setFormData({ ...formData, isFactored: e.target.checked })}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isFactored" className="text-sm font-semibold text-gray-400 cursor-pointer flex-1">
              SENT TO FACTORING
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'CREATING...' : 'CREATE MISSION'}
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
