import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  year: number;
  make: string;
  model: string;
  vehicle_type: string;
  current_odometer: number;
  oil_change_interval: number;
  last_oil_change_odometer: number;
}

interface VehicleWithStats extends Vehicle {
  avgMpg: number | null;
  oilStatus: 'good' | 'warning' | 'overdue';
  milesUntilOilChange: number;
  healthScore: number;
  isStaleIntel: boolean;
  lastFuelLogDate: Date | null;
  healthStatus: 'combat_ready' | 'maintenance_required' | 'grounded';
}

export const FleetReadiness = forwardRef(function FleetReadiness(_props, ref) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [efficiencyTrend, setEfficiencyTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useImperativeHandle(ref, () => ({
    refresh: () => {
      if (user) {
        loadVehiclesWithStats();
      }
    },
  }));

  useEffect(() => {
    if (user) {
      loadVehiclesWithStats();
    }
  }, [user]);

  const loadVehiclesWithStats = async () => {
    try {
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vextor_vehicles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;

      const vehiclesWithStats = await Promise.all(
        (vehiclesData || []).map(async (vehicle) => {
          const { data: fuelLogs } = await supabase
            .from('vextor_fuel_logs')
            .select('*')
            .eq('vehicle_id', vehicle.id)
            .order('created_at', { ascending: true });

          let avgMpg: number | null = null;
          let lastFuelLogDate: Date | null = null;

          if (fuelLogs && fuelLogs.length > 0) {
            const totalMiles = fuelLogs.reduce((sum, log) => sum + (log.trip_miles || 0), 0);
            const totalGallons = fuelLogs.reduce((sum, log) => sum + parseFloat(log.gallons_added), 0);
            avgMpg = totalGallons > 0 ? totalMiles / totalGallons : null;

            const lastLog = fuelLogs[fuelLogs.length - 1];
            lastFuelLogDate = new Date(lastLog.created_at);
          }

          const milesSinceOilChange = vehicle.current_odometer - vehicle.last_oil_change_odometer;
          const milesUntilOilChange = vehicle.oil_change_interval - milesSinceOilChange;

          let oilStatus: 'good' | 'warning' | 'overdue' = 'good';
          if (milesUntilOilChange < 0) {
            oilStatus = 'overdue';
          } else if (milesUntilOilChange < 1000) {
            oilStatus = 'warning';
          }

          const healthScore = calculateVehicleHealthScore(oilStatus, lastFuelLogDate);
          const isStaleIntel = isDataStale(lastFuelLogDate);
          const healthStatus = getHealthStatus(healthScore);

          return {
            ...vehicle,
            avgMpg,
            oilStatus,
            milesUntilOilChange,
            healthScore,
            isStaleIntel,
            lastFuelLogDate,
            healthStatus,
          };
        })
      );

      setVehicles(vehiclesWithStats);
      await calculateEfficiencyTrend();
    } catch (err) {
      console.error('Error loading vehicles with stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateEfficiencyTrend = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentLogs } = await supabase
        .from('vextor_fuel_logs')
        .select('mpg, created_at')
        .eq('user_id', user?.id)
        .not('mpg', 'is', null)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (!recentLogs || recentLogs.length < 3) {
        setEfficiencyTrend('stable');
        return;
      }

      const halfPoint = Math.floor(recentLogs.length / 2);
      const olderLogs = recentLogs.slice(0, halfPoint);
      const newerLogs = recentLogs.slice(halfPoint);

      const olderAvg = olderLogs.reduce((sum, log) => sum + log.mpg, 0) / olderLogs.length;
      const newerAvg = newerLogs.reduce((sum, log) => sum + log.mpg, 0) / newerLogs.length;

      const difference = ((newerAvg - olderAvg) / olderAvg) * 100;

      if (difference < -3) {
        setEfficiencyTrend('down');
      } else if (difference > 3) {
        setEfficiencyTrend('up');
      } else {
        setEfficiencyTrend('stable');
      }
    } catch (err) {
      console.error('Error calculating efficiency trend:', err);
      setEfficiencyTrend('stable');
    }
  };

  const calculateVehicleHealthScore = (
    oilStatus: 'good' | 'warning' | 'overdue',
    lastFuelLogDate: Date | null
  ): number => {
    let score = 100;

    if (oilStatus === 'overdue') {
      score = 0;
    } else if (oilStatus === 'warning') {
      score = 70;
    }

    if (isDataStale(lastFuelLogDate)) {
      score = Math.min(score, 50);
    }

    return score;
  };

  const isDataStale = (lastFuelLogDate: Date | null): boolean => {
    if (!lastFuelLogDate) return true;

    const now = new Date();
    const daysSinceLastLog = (now.getTime() - lastFuelLogDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastLog > 14;
  };

  const getHealthStatus = (score: number): 'combat_ready' | 'maintenance_required' | 'grounded' => {
    if (score >= 80) return 'combat_ready';
    if (score >= 50) return 'maintenance_required';
    return 'grounded';
  };

  const calculateFleetAverage = (): number => {
    if (vehicles.length === 0) return 0;
    const totalScore = vehicles.reduce((sum, vehicle) => sum + vehicle.healthScore, 0);
    return Math.round(totalScore / vehicles.length);
  };

  const getFleetStatusColor = (score: number): string => {
    if (score >= 80) return 'text-[#00FF00]';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFleetStatusBarColor = (score: number): string => {
    if (score >= 80) return 'from-[#00FF00] to-[#00CC00]';
    if (score >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getFleetStatusLabel = (score: number): string => {
    if (score >= 80) return 'COMBAT READY';
    if (score >= 50) return 'MAINTENANCE REQUIRED';
    return 'GROUNDED';
  };

  const getVehicleStatusIndicator = (healthStatus: 'combat_ready' | 'maintenance_required' | 'grounded') => {
    switch (healthStatus) {
      case 'combat_ready':
        return <div className="w-3 h-3 bg-[#00FF00] rounded-full"></div>;
      case 'maintenance_required':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>;
      case 'grounded':
        return <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>;
    }
  };

  const fleetScore = calculateFleetAverage();

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-[#008080] mb-2" style={{ fontFamily: 'monospace' }}>
          FLEET READINESS
        </h3>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-400" style={{ fontFamily: 'monospace' }}>
          LOADING...
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm" style={{ fontFamily: 'monospace' }}>
            NO VEHICLES CONFIGURED
          </p>
          <p className="text-gray-600 text-xs mt-1">Add vehicles to track readiness</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm" style={{ fontFamily: 'monospace' }}>
                FLEET HEALTH SCORE
              </span>
              <span
                className={`font-bold text-2xl ${getFleetStatusColor(fleetScore)}`}
                style={{ fontFamily: 'monospace' }}
              >
                {fleetScore}%
              </span>
            </div>

            <div className="w-full bg-[#252525] h-4 overflow-hidden rounded-lg">
              <div
                className={`h-full bg-gradient-to-r ${getFleetStatusBarColor(fleetScore)} transition-all duration-500`}
                style={{ width: `${fleetScore}%` }}
              ></div>
            </div>

            <p
              className={`text-xs mt-2 font-bold ${getFleetStatusColor(fleetScore)}`}
              style={{ fontFamily: 'monospace' }}
            >
              {getFleetStatusLabel(fleetScore)}
            </p>
          </div>

          <div className="border-t border-gray-700 pt-3 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                7-DAY EFFICIENCY TREND
              </span>
              <div className="flex items-center gap-2">
                {efficiencyTrend === 'up' && (
                  <>
                    <TrendingUp size={16} className="text-[#00FF00]" />
                    <span className="text-[#00FF00] text-xs font-bold" style={{ fontFamily: 'monospace' }}>
                      UP
                    </span>
                  </>
                )}
                {efficiencyTrend === 'down' && (
                  <>
                    <TrendingDown size={16} className="text-red-500" />
                    <span className="text-red-500 text-xs font-bold" style={{ fontFamily: 'monospace' }}>
                      DOWN
                    </span>
                  </>
                )}
                {efficiencyTrend === 'stable' && (
                  <>
                    <Minus size={16} className="text-gray-400" />
                    <span className="text-gray-400 text-xs font-bold" style={{ fontFamily: 'monospace' }}>
                      STABLE
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="text-xs text-gray-400 mb-3 uppercase" style={{ fontFamily: 'monospace' }}>
              Vehicle Status
            </div>
            <div className="space-y-2">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-700 hover:border-[#008080] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getVehicleStatusIndicator(vehicle.healthStatus)}
                      <div>
                        <h4 className="text-white font-bold text-xs">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h4>
                        {vehicle.isStaleIntel && (
                          <div className="text-[10px] text-orange-400 mt-0.5" style={{ fontFamily: 'monospace' }}>
                            STALE INTEL - Update fuel logs
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${getFleetStatusColor(vehicle.healthScore)}`}
                        style={{ fontFamily: 'monospace' }}
                      >
                        {vehicle.healthScore}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">MPG:</span>
                      <span className="text-gray-300 ml-1 font-bold">
                        {vehicle.avgMpg !== null ? vehicle.avgMpg.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Oil:</span>
                      <span
                        className={`ml-1 font-bold ${
                          vehicle.oilStatus === 'overdue'
                            ? 'text-red-500'
                            : vehicle.oilStatus === 'warning'
                            ? 'text-orange-500'
                            : 'text-[#00FF00]'
                        }`}
                      >
                        {vehicle.oilStatus === 'overdue'
                          ? 'OVERDUE'
                          : vehicle.oilStatus === 'warning'
                          ? 'Due Soon'
                          : 'OK'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
});
