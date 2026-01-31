import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './Card';
import { Button } from './Button';
import { MapPin, DollarSign, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface Mission {
  id: string;
  origin: string;
  destination: string;
  estimated_miles: number;
  pay_amount: number;
  estimated_cpm: number;
  status: string;
  created_at: string;
  vehicle_id: string;
}

interface Vehicle {
  id: string;
  name: string;
}

interface ActiveMissionsProps {
  onComplete: (mission: Mission) => void;
}

export function ActiveMissions({ onComplete }: ActiveMissionsProps) {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMissions();
    loadVehicles();
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

  const loadMissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vextor_active_missions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (err) {
      console.error('Error loading missions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.name || 'Unknown Vehicle';
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-400">
          Loading active missions...
        </div>
      </Card>
    );
  }

  if (missions.length === 0) {
    return (
      <Card>
        <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
          ACTIVE MISSIONS
        </h2>
        <div className="text-center py-8 text-gray-400">
          <Clock size={48} className="mx-auto mb-4 text-gray-600" />
          <p>No active missions. Accept a mission to start tracking.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
        ACTIVE MISSIONS ({missions.length})
      </h2>

      <div className="space-y-4">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-[#008080]" />
                  <span className="text-sm font-bold text-white" style={{ fontFamily: 'monospace' }}>
                    {mission.origin} → {mission.destination}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Vehicle: {getVehicleName(mission.vehicle_id)}
                </div>
                <div className="text-xs text-gray-500">
                  Started: {new Date(mission.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#252525] border border-[#333] p-3 rounded">
                <div className="text-xs text-gray-500 mb-1">EST. MILES</div>
                <div className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  {mission.estimated_miles.toLocaleString()}
                </div>
              </div>

              <div className="bg-[#252525] border border-[#333] p-3 rounded">
                <div className="text-xs text-gray-500 mb-1">PAY</div>
                <div className="text-lg font-bold text-[#008080]" style={{ fontFamily: 'monospace' }}>
                  ${mission.pay_amount.toFixed(2)}
                </div>
              </div>

              <div className="bg-[#252525] border border-[#333] p-3 rounded">
                <div className="text-xs text-gray-500 mb-1">EST. CPM</div>
                <div className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  ${mission.estimated_cpm.toFixed(3)}
                </div>
              </div>
            </div>

            <Button
              onClick={() => onComplete(mission)}
              className="w-full bg-[#008080] hover:bg-[#006666]"
            >
              <CheckCircle size={16} className="mr-2" />
              COMPLETE MISSION
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
