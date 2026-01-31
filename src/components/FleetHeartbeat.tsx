import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './Card';

interface Vehicle {
  id: string;
  name: string;
  year?: number;
  make?: string;
  model?: string;
}

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

const VEHICLE_COLORS: Record<number, string> = {
  0: '#3B82F6',
  1: '#F97316',
  2: '#14B8A6',
  3: '#8B5CF6',
};

export const FleetHeartbeat = forwardRef<{ refresh: () => void }>((props, ref) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [metric, setMetric] = useState<'mpg' | 'epm'>('mpg');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  useImperativeHandle(ref, () => ({
    refresh: loadChartData,
  }));

  useEffect(() => {
    if (user) {
      loadVehicles();
    }
  }, [user]);

  useEffect(() => {
    if (vehicles.length > 0) {
      loadChartData();
    }
  }, [currentDate, metric, vehicles]);

  const loadVehicles = async () => {
    try {
      const { data } = await supabase
        .from('vextor_vehicles')
        .select('id, name, year, make, model')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setVehicles(data || []);
    } catch (err) {
      console.error('Error loading vehicles:', err);
    }
  };

  const loadChartData = async () => {
    if (!user || vehicles.length === 0) return;

    setLoading(true);
    setHasData(false);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const chartDataMap = new Map<string, ChartDataPoint>();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = new Date(year, month, day).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        chartDataMap.set(dateStr, { date: dateStr });
      }

      if (metric === 'mpg') {
        await loadMPGData(chartDataMap);
      } else {
        await loadEPMData(chartDataMap);
      }

      const sortedData = Array.from(chartDataMap.values()).sort((a, b) => {
        const dateA = new Date(year, month, parseInt(a.date.split(' ')[1]));
        const dateB = new Date(year, month, parseInt(b.date.split(' ')[1]));
        return dateA.getTime() - dateB.getTime();
      });

      setChartData(sortedData);
    } catch (err) {
      console.error('Error loading chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMPGData = async (chartDataMap: Map<string, ChartDataPoint>) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1).toISOString();
    const monthEnd = new Date(year, month + 1, 0).toISOString();

    const { data: fuelLogs } = await supabase
      .from('vextor_fuel_logs')
      .select('*')
      .eq('user_id', user?.id)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)
      .order('created_at', { ascending: true });

    let dataPointCount = 0;

    vehicles.forEach((vehicle) => {
      const vehicleLogs = (fuelLogs || []).filter(log => log.vehicle_id === vehicle.id);
      const vehicleKey = vehicle.name;
      const dailyData = new Map<string, { values: number[]; count: number }>();

      vehicleLogs.forEach((log) => {
        if (log.mpg) {
          const dateStr = new Date(log.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          const current = dailyData.get(dateStr) || { values: [], count: 0 };
          current.values.push(log.mpg);
          current.count += 1;
          dailyData.set(dateStr, current);
          dataPointCount += 1;
        }
      });

      dailyData.forEach((data, dateStr) => {
        const average = data.values.reduce((a, b) => a + b, 0) / data.count;
        const existing = chartDataMap.get(dateStr) || { date: dateStr };
        existing[vehicleKey] = parseFloat(average.toFixed(2));
        chartDataMap.set(dateStr, existing);
      });
    });

    setHasData(dataPointCount > 0);
  };

  const loadEPMData = async (chartDataMap: Map<string, ChartDataPoint>) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1).toISOString();
    const monthEnd = new Date(year, month + 1, 0).toISOString();

    const { data: missions } = await supabase
      .from('vextor_missions')
      .select('*')
      .eq('user_id', user?.id)
      .eq('status', 'completed')
      .gte('completed_at', monthStart)
      .lte('completed_at', monthEnd)
      .order('completed_at', { ascending: true });

    let dataPointCount = 0;

    vehicles.forEach((vehicle) => {
      const vehicleMissions = (missions || []).filter(
        m => m.vehicle_id === vehicle.id && m.actual_miles && m.actual_miles > 0
      );

      const dailyData = new Map<string, { totalEarnings: number; totalMiles: number }>();

      vehicleMissions.forEach((mission) => {
        const dateStr = new Date(mission.completed_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        const current = dailyData.get(dateStr) || { totalEarnings: 0, totalMiles: 0 };
        current.totalEarnings += mission.offer_amount || 0;
        current.totalMiles += mission.actual_miles || 0;
        dailyData.set(dateStr, current);
        dataPointCount += 1;
      });

      dailyData.forEach((data, dateStr) => {
        const epm = data.totalMiles > 0 ? data.totalEarnings / data.totalMiles : 0;
        const existing = chartDataMap.get(dateStr) || { date: dateStr };
        existing[vehicle.name] = parseFloat(epm.toFixed(2));
        chartDataMap.set(dateStr, existing);
      });
    });

    setHasData(dataPointCount > 0);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const visibleVehicles = vehicles.slice(0, 4);

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-bold text-[#008080]" style={{ fontFamily: 'monospace' }}>
            FLEET HEARTBEAT
          </h2>

          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex items-center gap-3 bg-[#252525] border border-[#333] rounded px-4 py-2">
              <button
                onClick={handlePrevMonth}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="font-mono text-gray-300 min-w-48 text-center">
                {monthYearLabel}
              </span>
              <button
                onClick={handleNextMonth}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex gap-2 bg-[#252525] border border-[#333] rounded p-1">
              <button
                onClick={() => setMetric('mpg')}
                className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
                  metric === 'mpg'
                    ? 'bg-[#008080] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                MPG
              </button>
              <button
                onClick={() => setMetric('epm')}
                className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
                  metric === 'epm'
                    ? 'bg-[#008080] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                EPM
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
              LOADING FLEET DATA...
            </p>
          </div>
        ) : !hasData ? (
          <div className="relative w-full h-96 flex items-center justify-center bg-[#0a0a0a] border border-[#333] rounded">
            <p className="text-gray-500 text-center" style={{ fontFamily: 'monospace' }}>
              NO DATA RECORDED FOR THIS PERIOD
            </p>
          </div>
        ) : (
          <div className="relative bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a] rounded-xl p-6 shadow-lg border border-[#333]">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#999' }}
                  interval={Math.ceil(chartData.length / 10) - 1}
                />
                <YAxis
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#999' }}
                  label={{
                    value: metric === 'mpg' ? 'MPG' : 'EPM ($)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#999',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#999' }}
                  formatter={(value) => {
                    if (typeof value === 'number') {
                      return metric === 'mpg'
                        ? `${value.toFixed(1)} MPG`
                        : `$${value.toFixed(2)}`;
                    }
                    return value;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                {visibleVehicles.map((vehicle, idx) => (
                  <Line
                    key={vehicle.id}
                    type="monotone"
                    dataKey={vehicle.name}
                    stroke={VEHICLE_COLORS[idx]}
                    dot={{ fill: VEHICLE_COLORS[idx], r: 5 }}
                    activeDot={{ r: 7 }}
                    strokeWidth={2}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {vehicles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500" style={{ fontFamily: 'monospace' }}>
              ADD VEHICLES TO VIEW FLEET TRENDS
            </p>
          </div>
        )}
      </div>
    </Card>
  );
});

FleetHeartbeat.displayName = 'FleetHeartbeat';
