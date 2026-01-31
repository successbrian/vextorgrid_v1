import { useState, useEffect } from 'react';
import { Card } from './Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check } from 'lucide-react';

interface PendingMission {
  id: string;
  origin: string;
  destination: string;
  delivery_timestamp: string;
  estimated_miles: number;
  offer_amount: number;
  vehicle_id: string;
}

interface Vehicle {
  id: string;
  name: string;
}

interface PendingTasksProps {
  onRefresh: () => void;
}

export function PendingTasks({ onRefresh }: PendingTasksProps) {
  const { user } = useAuth();
  const [pendingMissions, setPendingMissions] = useState<PendingMission[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPendingMissions();
      loadVehicles();
    }
  }, [user]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_vehicles')
        .select('id, name')
        .eq('user_id', user?.id);

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error('Error loading vehicles:', err);
    }
  };

  const loadPendingMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_missions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'pending_pod')
        .order('delivery_timestamp', { ascending: true });

      if (error) throw error;
      setPendingMissions(data || []);
    } catch (err) {
      console.error('Error loading pending missions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizePOD = async (missionId: string) => {
    setFinalizingId(missionId);

    try {
      const { error } = await supabase
        .from('vextor_missions')
        .update({ status: 'history' })
        .eq('id', missionId);

      if (error) throw error;

      setPendingMissions(pendingMissions.filter(m => m.id !== missionId));
      onRefresh();
    } catch (err) {
      console.error('Error finalizing POD:', err);
    } finally {
      setFinalizingId(null);
    }
  };

  if (loading) {
    return null;
  }

  if (pendingMissions.length === 0) {
    return null;
  }

  const getVehicleName = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId)?.name || 'Unknown';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-yellow-400 mb-2" style={{ fontFamily: 'monospace' }}>
          ACTION REQUIRED: PENDING POD
        </h3>
        <p className="text-sm text-gray-400">
          {pendingMissions.length} mission{pendingMissions.length !== 1 ? 's' : ''} awaiting proof of delivery confirmation
        </p>
      </div>

      <div className="space-y-3">
        {pendingMissions.map((mission) => (
          <div
            key={mission.id}
            className="bg-[#0a0a0a] border border-yellow-700/50 hover:border-yellow-700 p-4 rounded transition-colors"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <p className="text-gray-500 text-xs">VEHICLE</p>
                <p className="text-white font-bold text-sm">{getVehicleName(mission.vehicle_id)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">ROUTE</p>
                <p className="text-white font-bold text-sm">
                  {mission.origin.slice(0, 3)} → {mission.destination.slice(0, 3)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">DELIVERED</p>
                <p className="text-white font-bold text-sm">{formatTimestamp(mission.delivery_timestamp)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">PAYOUT</p>
                <p className="text-white font-bold text-sm">${mission.offer_amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleFinalizePOD(mission.id)}
                disabled={finalizingId === mission.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
              >
                <Check size={16} />
                {finalizingId === mission.id ? 'FINALIZING...' : 'FINALIZE POD'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
