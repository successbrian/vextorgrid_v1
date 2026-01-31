import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Activity, CreditCard as Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from './Button';
import { EditFuelLogModal } from './EditFuelLogModal';
import { EditMissionModal } from './EditMissionModal';
import { LogExpenseModal } from './LogExpenseModal';
import { ConfirmModal } from './ConfirmModal';

interface Vehicle {
  id: string;
  name: string;
}

interface MpgData {
  date: string;
  mpg: number;
  displayDate: string;
}

interface CpmData {
  totalFuelCost: number;
  totalMiles: number;
  cpm: number;
}

interface FuelLogStats {
  totalLogs: number;
  totalCost: number;
  averageMpg: number;
}

interface MissionStats {
  totalMissions: number;
  totalMiles: number;
  totalEarnings: number;
  earningsPerMile: number;
}

interface FuelLogEntry {
  id: string;
  created_at: string;
  gallons_added: number;
  total_cost: number;
  mpg: number;
  odometer_reading: number;
}

interface MissionEntry {
  id: string;
  created_at: string;
  destination: string;
  origin: string;
  estimated_miles: number;
  actual_miles: number;
  offer_amount: number;
  cost_per_mile?: number;
  pod_required?: boolean;
  proof_image_url?: string;
}

interface ExpenseEntry {
  id: string;
  created_at: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string;
}

interface AnalyticsProps {
  onRefreshAll?: () => void | Promise<void>;
}

export const Analytics = forwardRef<{ refresh: () => void }, AnalyticsProps>(({ onRefreshAll }, ref) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [mpgData, setMpgData] = useState<MpgData[]>([]);
  const [cpmData, setCpmData] = useState<CpmData | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [loading, setLoading] = useState(false);
  const [fuelLogStats, setFuelLogStats] = useState<FuelLogStats | null>(null);
  const [missionStats, setMissionStats] = useState<MissionStats | null>(null);
  const [lastFuelLogs, setLastFuelLogs] = useState<FuelLogEntry[]>([]);
  const [lastMissions, setLastMissions] = useState<MissionEntry[]>([]);
  const [showEditFuelModal, setShowEditFuelModal] = useState(false);
  const [showEditMissionModal, setShowEditMissionModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingFuelLog, setEditingFuelLog] = useState<FuelLogEntry | null>(null);
  const [editingMission, setEditingMission] = useState<MissionEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'fuel' | 'mission' | 'expense'; id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lastExpenses, setLastExpenses] = useState<ExpenseEntry[]>([]);

  useImperativeHandle(ref, () => ({
    refresh: loadMpgData,
  }));

  useEffect(() => {
    loadVehicles();
  }, [user]);

  useEffect(() => {
    if (selectedVehicleId) {
      loadMpgData();
    }
  }, [selectedVehicleId]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_vehicles')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);

      if (data && data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading vehicles:', err);
    }
  };

  const loadMpgData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vextor_fuel_logs')
        .select('mpg, created_at, total_cost')
        .eq('vehicle_id', selectedVehicleId)
        .not('mpg', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedData: MpgData[] = data.map((log) => ({
          date: log.created_at,
          mpg: log.mpg,
          displayDate: new Date(log.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        }));

        setMpgData(formattedData);

        if (formattedData.length >= 3) {
          const recentMpg = formattedData.slice(-3).reduce((sum, d) => sum + d.mpg, 0) / 3;
          const olderMpg = formattedData.slice(-6, -3);
          if (olderMpg.length > 0) {
            const olderAvg = olderMpg.reduce((sum, d) => sum + d.mpg, 0) / olderMpg.length;
            const difference = ((recentMpg - olderAvg) / olderAvg) * 100;

            if (difference < -5) {
              setTrend('down');
            } else if (difference > 5) {
              setTrend('up');
            } else {
              setTrend('stable');
            }
          }
        }
      } else {
        setMpgData([]);
        setTrend('stable');
      }

      await loadCpmData();
      await loadFuelLogStats();
      await loadMissionStats();
      await loadLastFuelLogs();
      await loadLastMissions();
      await loadLastExpenses();
    } catch (err) {
      console.error('Error loading MPG data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCpmData = async () => {
    try {
      const { data: fuelLogs, error: fuelError } = await supabase
        .from('vextor_fuel_logs')
        .select('total_cost')
        .eq('vehicle_id', selectedVehicleId);

      if (fuelError) throw fuelError;

      const { data: missions, error: missionsError } = await supabase
        .from('vextor_missions')
        .select('actual_miles')
        .eq('vehicle_id', selectedVehicleId)
        .in('status', ['completed', 'history']);

      if (missionsError) throw missionsError;

      if (fuelLogs && missions) {
        const totalFuelCost = fuelLogs.reduce((sum, log) => sum + (log.total_cost || 0), 0);
        const totalMiles = missions.reduce((sum, mission) => sum + (mission.actual_miles || 0), 0);

        if (totalMiles > 0) {
          const cpm = totalFuelCost / totalMiles;
          setCpmData({ totalFuelCost, totalMiles, cpm });
        } else {
          setCpmData(null);
        }
      }
    } catch (err) {
      console.error('Error loading CPM data:', err);
    }
  };

  const loadFuelLogStats = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_fuel_logs')
        .select('mpg, total_cost')
        .eq('vehicle_id', selectedVehicleId);

      if (error) throw error;

      if (data && data.length > 0) {
        const totalLogs = data.length;
        const totalCost = data.reduce((sum, log) => sum + (log.total_cost || 0), 0);
        const logsWithMpg = data.filter((log) => log.mpg !== null);
        const averageMpg = logsWithMpg.length > 0
          ? logsWithMpg.reduce((sum, log) => sum + (log.mpg || 0), 0) / logsWithMpg.length
          : 0;

        setFuelLogStats({ totalLogs, totalCost, averageMpg });
      } else {
        setFuelLogStats(null);
      }
    } catch (err) {
      console.error('Error loading fuel log stats:', err);
    }
  };

  const loadMissionStats = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_missions')
        .select('actual_miles, offer_amount')
        .eq('vehicle_id', selectedVehicleId)
        .in('status', ['completed', 'history']);

      if (error) throw error;

      if (data && data.length > 0) {
        const totalMissions = data.length;
        const totalMiles = data.reduce((sum, mission) => sum + (mission.actual_miles || 0), 0);
        const totalEarnings = data.reduce((sum, mission) => sum + (mission.offer_amount || 0), 0);
        const earningsPerMile = totalMiles > 0 ? totalEarnings / totalMiles : 0;

        setMissionStats({ totalMissions, totalMiles, totalEarnings, earningsPerMile });
      } else {
        setMissionStats(null);
      }
    } catch (err) {
      console.error('Error loading mission stats:', err);
    }
  };

  const loadLastFuelLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_fuel_logs')
        .select('id, created_at, gallons_added, total_cost, mpg, odometer_reading')
        .eq('vehicle_id', selectedVehicleId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setLastFuelLogs(data || []);
    } catch (err) {
      console.error('Error loading last fuel logs:', err);
    }
  };

  const loadLastMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_missions')
        .select('id, created_at, destination, origin, estimated_miles, actual_miles, offer_amount, cost_per_mile, pod_required, proof_image_url')
        .eq('vehicle_id', selectedVehicleId)
        .in('status', ['completed', 'history'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLastMissions(data || []);
    } catch (err) {
      console.error('Error loading last missions:', err);
    }
  };

  const loadLastExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_expenses')
        .select('id, created_at, category, amount, expense_date, notes')
        .eq('vehicle_id', selectedVehicleId)
        .order('expense_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLastExpenses(data || []);
    } catch (err) {
      console.error('Error loading last expenses:', err);
    }
  };

  const handleEditFuelLog = (log: FuelLogEntry) => {
    setEditingFuelLog(log);
    setShowEditFuelModal(true);
  };

  const handleEditMission = (mission: MissionEntry) => {
    setEditingMission(mission);
    setShowEditMissionModal(true);
  };

  const handleDeleteClick = (type: 'fuel' | 'mission', id: string) => {
    setDeleteTarget({ type, id });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      if (deleteTarget.type === 'fuel') {
        const { error } = await supabase
          .from('vextor_fuel_logs')
          .delete()
          .eq('id', deleteTarget.id);

        if (error) throw error;
      } else if (deleteTarget.type === 'mission') {
        const { error } = await supabase
          .from('vextor_missions')
          .delete()
          .eq('id', deleteTarget.id);

        if (error) throw error;
      } else if (deleteTarget.type === 'expense') {
        const { error } = await supabase
          .from('vextor_expenses')
          .delete()
          .eq('id', deleteTarget.id);

        if (error) throw error;
      }

      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      loadMpgData();
    } catch (err) {
      console.error('Error deleting:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditFuelModal(false);
    setShowEditMissionModal(false);
    setEditingFuelLog(null);
    setEditingMission(null);
    loadMpgData();
  };

  if (vehicles.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#252525] border-2 border-[#333] flex items-center justify-center mb-6 mx-auto">
              <Activity size={48} className="text-[#008080]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
              NO VEHICLES FOUND
            </h2>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              Please add a vehicle in the Vehicle Garage before viewing analytics.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Vehicle
        </label>
        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className="w-full max-w-md px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white focus:border-[#008080] focus:outline-none"
        >
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.name}
            </option>
          ))}
        </select>
      </div>

      {trend === 'down' && mpgData.length >= 3 && (
        <div className="p-4 bg-red-900 bg-opacity-20 border border-red-700 rounded-lg flex items-start gap-3">
          <TrendingDown size={24} className="text-red-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-red-400 font-bold mb-1" style={{ fontFamily: 'monospace' }}>
              EFFICIENCY DROPPING
            </h3>
            <p className="text-red-300 text-sm">
              Check Maintenance - Your MPG trend is declining. Consider inspecting tire pressure, air filter, and engine performance.
            </p>
          </div>
        </div>
      )}

      {trend === 'up' && mpgData.length >= 3 && (
        <div className="p-4 bg-green-900 bg-opacity-20 border border-green-700 rounded-lg flex items-start gap-3">
          <TrendingUp size={24} className="text-green-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-green-400 font-bold mb-1" style={{ fontFamily: 'monospace' }}>
              EFFICIENCY IMPROVING
            </h3>
            <p className="text-green-300 text-sm">
              Your MPG trend is improving. Great work maintaining your vehicle!
            </p>
          </div>
        </div>
      )}

      <Card>
        <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
          MPG TREND ANALYSIS
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-400">
            Loading analytics...
          </div>
        ) : mpgData.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Activity size={48} className="mx-auto mb-4 text-gray-600" />
            <p>No MPG data available yet. Start logging fuel to see your efficiency trends.</p>
          </div>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mpgData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="displayDate"
                  stroke="#666"
                  style={{ fontSize: '12px', fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="#666"
                  style={{ fontSize: '12px', fontFamily: 'monospace' }}
                  label={{ value: 'MPG', angle: -90, position: 'insideLeft', fill: '#666' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                  }}
                  labelStyle={{ color: '#008080' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="mpg"
                  stroke="#008080"
                  strokeWidth={3}
                  dot={{ fill: '#008080', r: 4 }}
                  activeDot={{ r: 6, fill: '#FF4500' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {mpgData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#252525] border border-[#333] p-4 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>
                AVERAGE MPG
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                {(mpgData.reduce((sum, d) => sum + d.mpg, 0) / mpgData.length).toFixed(1)}
              </div>
            </div>

            <div className="bg-[#252525] border border-[#333] p-4 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>
                BEST MPG
              </div>
              <div className="text-2xl font-bold text-[#008080]" style={{ fontFamily: 'monospace' }}>
                {Math.max(...mpgData.map(d => d.mpg)).toFixed(1)}
              </div>
            </div>

            <div className="bg-[#252525] border border-[#333] p-4 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>
                WORST MPG
              </div>
              <div className="text-2xl font-bold text-[#FF4500]" style={{ fontFamily: 'monospace' }}>
                {Math.min(...mpgData.map(d => d.mpg)).toFixed(1)}
              </div>
            </div>
          </div>
        )}
      </Card>

      {cpmData && (
        <Card>
          <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'monospace' }}>
            TRUE COST PER MILE
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#252525] border border-[#333] p-4 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>
                COST PER MILE
              </div>
              <div className="text-3xl font-bold text-[#00FF00]" style={{ fontFamily: 'monospace' }}>
                ${cpmData.cpm.toFixed(2)}
              </div>
            </div>

            <div className="bg-[#252525] border border-[#333] p-4 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>
                TOTAL FUEL COST
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                ${cpmData.totalFuelCost.toFixed(2)}
              </div>
            </div>

            <div className="bg-[#252525] border border-[#333] p-4 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>
                TOTAL MISSION MILES
              </div>
              <div className="text-2xl font-bold text-[#008080]" style={{ fontFamily: 'monospace' }}>
                {cpmData.totalMiles.toFixed(0)}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
          FUEL LOGS
        </h2>
        {lastFuelLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>DATE</th>
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>GALLONS</th>
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>COST</th>
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>MPG</th>
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>ODOMETER</th>
                  <th className="text-center py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {lastFuelLogs.map((log) => (
                  <tr key={log.id} className="border-b border-[#252525] hover:bg-[#252525] transition-colors">
                    <td className="py-2 px-3 text-white">
                      {new Date(log.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-2 px-3 text-white">{log.gallons_added ? log.gallons_added.toFixed(2) : 'N/A'} gal</td>
                    <td className="py-2 px-3 text-[#FF4500]">${log.total_cost ? log.total_cost.toFixed(2) : '0.00'}</td>
                    <td className="py-2 px-3 text-[#00FF00]">{log.mpg ? log.mpg.toFixed(1) : 'N/A'}</td>
                    <td className="py-2 px-3 text-white">{log.odometer_reading ? log.odometer_reading.toLocaleString() : 'N/A'}</td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditFuelLog(log)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick('fuel', log.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#252525] border border-[#333] p-4 rounded-lg text-center text-gray-400">
            <Activity size={24} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm">No fuel logs available</p>
          </div>
        )}
        {fuelLogStats && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-[#252525] border border-[#333] p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>TOTAL LOGS</div>
              <div className="text-lg font-bold text-white">{fuelLogStats.totalLogs}</div>
            </div>
            <div className="bg-[#252525] border border-[#333] p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>TOTAL COST</div>
              <div className="text-lg font-bold text-[#FF4500]">${fuelLogStats.totalCost.toFixed(2)}</div>
            </div>
            <div className="bg-[#252525] border border-[#333] p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>AVG MPG</div>
              <div className="text-lg font-bold text-[#00FF00]">{fuelLogStats.averageMpg.toFixed(1)}</div>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
          COMPLETED MISSIONS
        </h2>
        {lastMissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>ROUTE</th>
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>DATE</th>
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>PLANNED MI</th>
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>ACTUAL MI</th>
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>PAYOUT</th>
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>POD</th>
                  <th className="text-center py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {lastMissions.map((mission) => (
                  <tr key={mission.id} className="border-b border-[#252525] hover:bg-[#252525] transition-colors">
                    <td className="py-2 px-3 text-white font-semibold">
                      {mission.origin?.split(' ')[0]} → {mission.destination?.split(' ')[0]}
                    </td>
                    <td className="py-2 px-3 text-white">
                      {new Date(mission.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-2 px-3 text-gray-300">{mission.estimated_miles ? mission.estimated_miles.toFixed(0) : '0'}</td>
                    <td className="py-2 px-3 text-[#008080]">{mission.actual_miles ? mission.actual_miles.toFixed(0) : '0'}</td>
                    <td className="py-2 px-3 text-[#00FF00]">${mission.offer_amount ? mission.offer_amount.toFixed(2) : '0.00'}</td>
                    <td className="py-2 px-3">
                      {mission.pod_required ? (
                        mission.proof_image_url ? (
                          <a
                            href={mission.proof_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#008080] hover:text-[#00FFFF] underline text-xs"
                            style={{ fontFamily: 'monospace' }}
                          >
                            VIEW
                          </a>
                        ) : (
                          <span className="text-[#FF4500] text-xs" style={{ fontFamily: 'monospace' }}>PENDING</span>
                        )
                      ) : (
                        <span className="text-gray-500 text-xs" style={{ fontFamily: 'monospace' }}>NOT REQUIRED</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditMission(mission)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick('mission', mission.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#252525] border border-[#333] p-4 rounded-lg text-center text-gray-400">
            <Activity size={24} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm">No completed missions available</p>
          </div>
        )}
        {missionStats && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-[#252525] border border-[#333] p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>TOTAL EARNINGS</div>
              <div className="text-lg font-bold text-[#00FF00]">${missionStats.totalEarnings.toFixed(2)}</div>
            </div>
            <div className="bg-[#252525] border border-[#333] p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>ACTUAL MILES</div>
              <div className="text-lg font-bold text-[#008080]">{missionStats.totalMiles.toFixed(0)}</div>
            </div>
            <div className="bg-[#252525] border border-[#333] p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>EARNINGS/MILE</div>
              <div className="text-lg font-bold text-[#FF4500]">${missionStats.earningsPerMile.toFixed(2)}</div>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
            EXPENSES
          </h2>
          <Button onClick={() => setShowExpenseModal(true)} variant="secondary" className="flex items-center gap-2 whitespace-nowrap">
            <Plus size={18} />
            LOG
          </Button>
        </div>
        {lastExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>DATE</th>
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>CATEGORY</th>
                  <th className="text-left py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>NOTES</th>
                  <th className="text-right py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>AMOUNT</th>
                  <th className="text-center py-2 px-3 text-gray-400" style={{ fontFamily: 'monospace' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {lastExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-[#252525] hover:bg-[#252525] transition-colors">
                    <td className="py-2 px-3 text-white">
                      {new Date(expense.expense_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-2 px-3 text-gray-300">{expense.category}</td>
                    <td className="py-2 px-3 text-gray-400 max-w-xs truncate">{expense.notes || '—'}</td>
                    <td className="py-2 px-3 text-red-400 font-bold text-right">${expense.amount.toFixed(2)}</td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDeleteClick('expense', expense.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#252525] border border-[#333] p-4 rounded-lg text-center text-gray-400">
            <Activity size={24} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm">No expenses logged</p>
          </div>
        )}
        {lastExpenses.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="bg-[#252525] border border-[#333] p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>TOTAL EXPENSES</div>
              <div className="text-lg font-bold text-red-400">${lastExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}</div>
            </div>
          </div>
        )}
      </Card>

      {editingFuelLog && (
        <EditFuelLogModal
          isOpen={showEditFuelModal}
          onClose={() => {
            setShowEditFuelModal(false);
            setEditingFuelLog(null);
          }}
          fuelLogId={editingFuelLog.id}
          vehicleId={selectedVehicleId}
          currentOdometer={editingFuelLog.odometer_reading}
          currentGallons={editingFuelLog.gallons_added}
          currentCost={editingFuelLog.total_cost}
          currentDate={editingFuelLog.created_at}
          currentNotes={editingFuelLog.notes}
          currentMerchant={editingFuelLog.merchant}
          onSuccess={handleEditSuccess}
          onRefreshAll={onRefreshAll}
        />
      )}

      {editingMission && (
        <EditMissionModal
          isOpen={showEditMissionModal}
          onClose={() => {
            setShowEditMissionModal(false);
            setEditingMission(null);
          }}
          missionId={editingMission.id}
          currentOrigin={editingMission.origin}
          currentDestination={editingMission.destination}
          currentEstimatedMiles={editingMission.estimated_miles}
          currentOfferAmount={editingMission.offer_amount}
          currentDate={editingMission.created_at}
          currentNotes={editingMission.notes}
          currentLoadId={editingMission.load_id}
          currentIsFactored={editingMission.is_factored}
          onSuccess={handleEditSuccess}
          onRefreshAll={onRefreshAll}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${deleteTarget?.type === 'fuel' ? 'fuel log' : deleteTarget?.type === 'mission' ? 'mission' : 'expense'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        isDangerous={true}
      />

      {showExpenseModal && (
        <LogExpenseModal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => {
            loadMpgData();
            setShowExpenseModal(false);
          }}
        />
      )}
    </div>
  );
});

Analytics.displayName = 'Analytics';
