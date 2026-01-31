import { useState, useEffect, FormEvent } from 'react';
import { Card } from './Card';
import { MapPin, DollarSign, Clock, Plus, X, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { MissionDebriefModal } from './MissionDebriefModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Mission {
  id: string;
  destination: string;
  origin: string;
  offer_amount: number;
  estimated_miles: number;
  estimated_profit: number;
  fuel_cost_per_gallon: number;
  actual_miles: number | null;
  is_paid: boolean;
  status: 'active' | 'completed';
  created_at: string;
  completed_at: string | null;
}

interface Vehicle {
  id: string;
  name: string;
  current_odometer: number;
}

interface MissionControlProps {
  vehicleId?: string;
  onMissionUpdate?: () => void;
}

export function MissionControl({ vehicleId, onMissionUpdate }: MissionControlProps) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewMissionForm, setShowNewMissionForm] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleId || '');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    miles: '',
    payout: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    miles: '',
    payout: '',
  });

  useEffect(() => {
    if (user) {
      loadVehicles();
      loadMissions();
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedVehicleId) {
      loadMissions();
    }
  }, [selectedVehicleId, user]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_vehicles')
        .select('id, name, current_odometer')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
      if (data && data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadMissions = async () => {
    try {
      const query = selectedVehicleId
        ? supabase.from('vextor_missions').select('*').eq('vehicle_id', selectedVehicleId)
        : supabase.from('vextor_missions').select('*').eq('user_id', user?.id);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const active = (data || []).filter(m => m.status === 'active');
      const completed = (data || []).filter(m => m.status === 'completed');

      setActiveMissions(active);
      setCompletedMissions(completed);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMissionSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedVehicleId || !formData.origin || !formData.destination || !formData.miles || !formData.payout) {
      setFormError('Please fill in all fields');
      return;
    }

    const estimatedMiles = parseFloat(formData.miles);
    const offerAmount = parseFloat(formData.payout);

    if (estimatedMiles <= 0 || offerAmount <= 0) {
      setFormError('Miles and payout must be greater than 0');
      return;
    }

    try {
      const costPerMile = offerAmount / estimatedMiles;

      const { error } = await supabase
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
        });

      if (error) throw error;

      setFormData({ origin: '', destination: '', miles: '', payout: '' });
      setShowNewMissionForm(false);
      loadMissions();
    } catch (error) {
      console.error('Error creating mission:', error);
      setFormError('Failed to create mission');
    }
  };

  const handleCompleteMission = async (missionId: string, actualMiles: number) => {
    try {
      const mission = activeMissions.find(m => m.id === missionId);
      if (!mission) return;

      const vehicle = vehicles.find(v => v.id === mission.vehicle_id);
      if (vehicle && actualMiles < 0) {
        alert('Error: Actual miles cannot be negative');
        return;
      }

      const newOdometer = vehicle ? vehicle.current_odometer + actualMiles : 0;
      if (vehicle && newOdometer < vehicle.current_odometer) {
        alert('Error: Odometer cannot decrease. The new odometer reading would be lower than current vehicle mileage.');
        setSelectedMission(null);
        return;
      }

      const { error: updateError } = await supabase
        .from('vextor_missions')
        .update({
          status: 'completed',
          actual_miles: actualMiles,
          completed_at: new Date().toISOString(),
          delivery_timestamp: new Date().toISOString(),
        })
        .eq('id', missionId);

      if (updateError) throw updateError;

      if (vehicle) {
        const { error: odometerError } = await supabase
          .from('vextor_vehicles')
          .update({ current_odometer: newOdometer })
          .eq('id', mission.vehicle_id);

        if (odometerError) throw odometerError;
      }

      setActiveMissions(activeMissions.filter((m) => m.id !== missionId));
      setSelectedMission(null);
      loadVehicles();
      loadMissions();

      if (onMissionUpdate) {
        onMissionUpdate();
      }
    } catch (error) {
      console.error('Error completing mission:', error);
    }
  };

  const handleStartEditMission = (mission: Mission) => {
    setEditingId(mission.id);
    setEditData({
      miles: mission.estimated_miles.toString(),
      payout: mission.offer_amount.toString(),
    });
  };

  const handleSaveEditMission = async (missionId: string) => {
    if (!editData.miles || !editData.payout) {
      setFormError('Please fill in all fields');
      return;
    }

    const newMiles = parseFloat(editData.miles);
    const newPayout = parseFloat(editData.payout);

    if (newMiles <= 0 || newPayout <= 0) {
      setFormError('Miles and payout must be greater than 0');
      return;
    }

    try {
      const costPerMile = newPayout / newMiles;
      const { error } = await supabase
        .from('vextor_missions')
        .update({
          estimated_miles: newMiles,
          offer_amount: newPayout,
          cost_per_mile: costPerMile,
        })
        .eq('id', missionId);

      if (error) throw error;

      setEditingId(null);
      setEditData({ miles: '', payout: '' });
      loadMissions();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update mission');
    }
  };

  const handleDeleteMission = async (missionId: string, isCompleted: boolean) => {
    if (!confirm(`Are you sure you want to delete this ${isCompleted ? 'completed' : 'active'} mission?`)) return;

    try {
      const { error } = await supabase
        .from('vextor_missions')
        .delete()
        .eq('id', missionId);

      if (error) throw error;
      loadMissions();
    } catch (err) {
      console.error('Error deleting mission:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to delete mission');
    }
  };

  const handleTogglePaid = async (missionId: string, currentPaidStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vextor_missions')
        .update({ is_paid: !currentPaidStatus })
        .eq('id', missionId);

      if (error) throw error;
      loadMissions();
    } catch (err) {
      console.error('Error updating mission payment status:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to update payment status');
    }
  };

  const getTimeElapsed = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    }
    return `${diffMins}m`;
  };

  if (loading) {
    return (
      <Card>
        <h2 className="text-xl font-bold text-[#008080] mb-6" style={{ fontFamily: 'monospace' }}>
          MISSION CONTROL
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
            LOADING...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!showNewMissionForm && (
        <div className="flex justify-end">
          <Button onClick={() => setShowNewMissionForm(true)} variant="secondary" className="flex items-center gap-2">
            <Plus size={20} />
            NEW MISSION
          </Button>
        </div>
      )}

      {showNewMissionForm && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#008080]" style={{ fontFamily: 'monospace' }}>
              NEW MISSION
            </h2>
            <button onClick={() => setShowNewMissionForm(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleNewMissionSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                VEHICLE
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
              >
                <option value="">Select a vehicle</option>
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

            <div className="grid grid-cols-2 gap-4">
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

            {formError && (
              <div className="p-3 bg-red-900/30 border border-red-500 text-red-200 text-sm">
                {formError}
              </div>
            )}

            <Button type="submit" fullWidth>
              CREATE MISSION
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-bold text-[#008080] mb-6" style={{ fontFamily: 'monospace' }}>
          ACTIVE MISSIONS ({activeMissions.length})
        </h2>

        {activeMissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 border-4 border-[#333] rounded-full flex items-center justify-center mb-4 mx-auto">
              <MapPin size={32} className="text-gray-600" />
            </div>
            <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
              NO ACTIVE MISSIONS
            </p>
            <p className="text-gray-600 text-sm mt-2">Create a new mission to begin tracking</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeMissions.map((mission) => (
              <div
                key={mission.id}
                className="bg-[#252525] border-2 border-[#008080] p-4 hover:border-[#00FF00] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={20} className="text-[#FF4500]" />
                      <h3 className="text-white font-bold text-lg" style={{ fontFamily: 'monospace' }}>
                        {mission.origin} → {mission.destination}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} className="text-[#00FF00]" />
                        <span className="text-gray-400">Payout:</span>
                        <span className="text-white font-bold">${mission.offer_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} className="text-[#FF4500]" />
                        <span className="text-gray-400">{getTimeElapsed(mission.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'monospace' }}>
                      MILES
                    </p>
                    <p className="text-2xl font-bold text-[#00FF00]" style={{ fontFamily: 'monospace' }}>
                      {mission.estimated_miles}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#333]">
                  <Button
                    onClick={() => setSelectedMission(mission)}
                    variant="secondary"
                    className="whitespace-nowrap flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    COMPLETE
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {completedMissions.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-[#008080] mb-6" style={{ fontFamily: 'monospace' }}>
            MISSION HISTORY ({completedMissions.length})
          </h2>
          <div className="space-y-4">
            {completedMissions.slice(0, 5).map((mission) => (
              <div key={mission.id}>
                {editingId === mission.id ? (
                  <div className="bg-[#252525] border-2 border-[#008080] p-4">
                    <h3 className="text-white font-bold mb-3 text-sm">Edit Mission</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Miles</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editData.miles}
                          onChange={(e) => setEditData({ ...editData, miles: e.target.value })}
                          className="w-full px-2 py-1 bg-[#1a1a1a] border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Payout</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editData.payout}
                          onChange={(e) => setEditData({ ...editData, payout: e.target.value })}
                          className="w-full px-2 py-1 bg-[#1a1a1a] border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEditMission(mission.id)}
                        className="flex-1 px-2 py-1 bg-[#008080] text-white text-sm rounded hover:bg-[#006666]"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 px-2 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#252525] border-2 border-[#333] p-4 opacity-75 hover:opacity-100 transition-opacity">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={20} className="text-[#00FF00]" />
                          <h3 className="text-gray-400 font-bold" style={{ fontFamily: 'monospace' }}>
                            {mission.origin} → {mission.destination}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign size={16} className="text-[#00FF00]" />
                            <span className="text-gray-500">${mission.offer_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">{mission.estimated_miles} miles</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleTogglePaid(mission.id, mission.is_paid)}
                            className={`text-xs px-2 py-1 rounded font-medium ${
                              mission.is_paid
                                ? 'bg-green-900/30 border border-green-600 text-green-400'
                                : 'bg-orange-900/30 border border-orange-600 text-orange-400'
                            }`}
                          >
                            {mission.is_paid ? '✓ PAID' : 'UNPAID'}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEditMission(mission)}
                          className="p-1 hover:bg-[#1a1a1a] rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} className="text-[#008080]" />
                        </button>
                        <button
                          onClick={() => handleDeleteMission(mission.id, true)}
                          className="p-1 hover:bg-[#1a1a1a] rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedMission && (
        <MissionDebriefModal
          mission={selectedMission}
          onComplete={handleCompleteMission}
          onClose={() => setSelectedMission(null)}
        />
      )}
    </div>
  );
}
