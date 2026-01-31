import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Users, Briefcase, DollarSign, Plus, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

interface ClockConfig {
  timezone: string;
  label: string;
  timeFormat?: '12h' | '24h';
}

interface WeatherData {
  temp: number;
  condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'wind';
  location: string;
}

interface CommandHUDProps {
  onStartMission?: () => void;
  onLogFuel?: () => void;
  onLogExpense?: () => void;
  onExportReports?: () => void;
}

export function CommandHUD({ onStartMission, onLogFuel, onLogExpense, onExportReports }: CommandHUDProps = {}) {
  const { user } = useAuth();
  const [activeUserCount, setActiveUserCount] = useState<number>(0);
  const [activeMissionsCount, setActiveMissionsCount] = useState<number>(0);
  const [paidEarnings, setPaidEarnings] = useState<number>(0);
  const [unpaidEarnings, setUnpaidEarnings] = useState<number>(0);
  const [pendingPODCount, setPendingPODCount] = useState<number>(0);
  const [clockConfig, setClockConfig] = useState<ClockConfig[]>([]);
  const [weather, setWeather] = useState<WeatherData>({
    temp: 72,
    condition: 'clear',
    location: 'Home Base'
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadUserProfile();
    loadActiveUsers();
    loadMissionStats();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const activeInterval = setInterval(() => {
      loadActiveUsers();
      loadMissionStats();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(activeInterval);
    };
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('vextor_profiles')
      .select('home_zip_code, clock_config')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setClockConfig(data.clock_config || []);
      if (data.home_zip_code) {
        loadWeather(data.home_zip_code);
      }
    }
  };

  const loadWeather = async (zipCode: string) => {
    try {
      console.log('Loading weather for zip:', zipCode);
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-weather`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ zipCode }),
      });

      console.log('Weather API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Weather data received:', data);
        setWeather(data);
      } else {
        const errorData = await response.text();
        console.error('Weather API error:', response.status, errorData);
      }
    } catch (error) {
      console.error('Failed to load weather:', error);
    }
  };

  const loadActiveUsers = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('vextor_profiles')
      .select('id')
      .gte('last_active_at', thirtyMinutesAgo);

    if (!error && data) {
      setActiveUserCount(data.length);
    }
  };

  const loadMissionStats = async () => {
    if (!user) return;

    try {
      const { data: activeMissions, error: activeMissionsError } = await supabase
        .from('vextor_missions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!activeMissionsError && activeMissions) {
        setActiveMissionsCount(activeMissions.length);
      }

      const { data: pendingPOD, error: pendingPODError } = await supabase
        .from('vextor_missions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending_pod');

      if (!pendingPODError && pendingPOD) {
        setPendingPODCount(pendingPOD.length);
      }

      const { data: completedMissions, error: completedMissionsError } = await supabase
        .from('vextor_missions')
        .select('offer_amount, is_paid')
        .eq('user_id', user.id)
        .in('status', ['completed', 'history']);

      if (!completedMissionsError && completedMissions) {
        const paid = completedMissions
          .filter((m) => m.is_paid)
          .reduce((sum, mission) => sum + (mission.offer_amount || 0), 0);
        const unpaid = completedMissions
          .filter((m) => !m.is_paid)
          .reduce((sum, mission) => sum + (mission.offer_amount || 0), 0);
        setPaidEarnings(paid);
        setUnpaidEarnings(unpaid);
      }
    } catch (error) {
      console.error('Error loading mission stats:', error);
    }
  };

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case 'rain':
        return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'snow':
        return <CloudSnow className="w-4 h-4 text-blue-200" />;
      case 'wind':
        return <Wind className="w-4 h-4 text-gray-400" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-gray-400" />;
      case 'clear':
      default:
        return <Sun className="w-4 h-4 text-yellow-400" />;
    }
  };

  const formatTime = (date: Date, timezone?: string, timeFormat: '12h' | '24h' = '24h'): { time: string; day: string } => {
    const is12Hour = timeFormat === '12h';
    try {
      const dayOfWeek = date.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'short',
      }).toUpperCase();

      const time = date.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: is12Hour,
      });

      return { time, day: dayOfWeek };
    } catch {
      const dayOfWeek = date.toLocaleDateString('en-US', {
        weekday: 'short',
      }).toUpperCase();

      const time = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: is12Hour,
      });

      return { time, day: dayOfWeek };
    }
  };

  return (
    <div className="bg-[#0a0a0a] border-b border-[#008080] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            {getWeatherIcon()}
            <span className="text-[#00FF00] font-bold text-sm" style={{ fontFamily: 'monospace' }}>
              {weather.temp}°F
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-4 flex-1 justify-center">
            <div className="flex items-center gap-1 px-3 py-1 bg-[#1a1a1a] rounded border border-gray-700">
              <span className="text-[#008080] text-xs uppercase mr-2" style={{ fontFamily: 'monospace' }}>
                LOCAL
              </span>
              <span className="text-[#00FF00] text-sm font-bold" style={{ fontFamily: 'monospace' }}>
                {formatTime(currentTime).time}
              </span>
              <span className="text-[#008080] text-xs ml-1" style={{ fontFamily: 'monospace' }}>
                {formatTime(currentTime).day}
              </span>
            </div>

            {clockConfig.map((clock, index) => {
              const { time, day } = formatTime(currentTime, clock.timezone, clock.timeFormat || '24h');
              return (
                <div
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 bg-[#1a1a1a] rounded border border-gray-700"
                >
                  <span className="text-[#008080] text-xs uppercase mr-2" style={{ fontFamily: 'monospace' }}>
                    {clock.label}
                  </span>
                  <span className="text-[#00FF00] text-sm font-bold" style={{ fontFamily: 'monospace' }}>
                    {time}
                  </span>
                  <span className="text-[#008080] text-xs ml-1" style={{ fontFamily: 'monospace' }}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00FF00] rounded-full animate-pulse"></div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-[#008080]" />
                <span className="text-[#00FF00] font-extrabold text-sm" style={{ fontFamily: 'monospace' }}>
                  {activeUserCount}
                </span>
                <span className="text-gray-500 text-xs hidden sm:inline" style={{ fontFamily: 'monospace' }}>
                  ACTIVE
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] rounded border border-gray-700">
              <Briefcase className="w-4 h-4 text-[#FF4500]" />
              <span className="text-[#00FF00] font-extrabold text-sm" style={{ fontFamily: 'monospace' }}>
                {activeMissionsCount}
              </span>
              <span className="text-gray-500 text-xs" style={{ fontFamily: 'monospace' }}>
                MISSIONS
              </span>
            </div>

            {pendingPODCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] rounded border border-yellow-700">
                <span className="text-yellow-400 font-extrabold text-sm" style={{ fontFamily: 'monospace' }}>
                  {pendingPODCount}
                </span>
                <span className="text-yellow-600 text-xs" style={{ fontFamily: 'monospace' }}>
                  ACTION
                </span>
              </div>
            )}

            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] rounded border border-green-700">
                <DollarSign className="w-4 h-4 text-[#00FF00]" />
                <span className="text-[#00FF00] font-extrabold text-sm" style={{ fontFamily: 'monospace' }}>
                  ${paidEarnings.toFixed(0)}
                </span>
                <span className="text-green-600 text-xs" style={{ fontFamily: 'monospace' }}>
                  PAID
                </span>
              </div>
              {unpaidEarnings > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] rounded border border-orange-700">
                  <DollarSign className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 font-extrabold text-sm" style={{ fontFamily: 'monospace' }}>
                    ${unpaidEarnings.toFixed(0)}
                  </span>
                  <span className="text-orange-600 text-xs" style={{ fontFamily: 'monospace' }}>
                    A/R
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(onStartMission || onLogFuel || onLogExpense || onExportReports) && (
        <div className="border-t border-[#008080]">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {onStartMission && (
                <button
                  onClick={onStartMission}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-lg text-sm transition-all duration-200 hover:shadow-lg hover:shadow-[#008080]/30 hover:-translate-y-0.5"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">MISSION</span>
                </button>
              )}
              {onLogFuel && (
                <button
                  onClick={onLogFuel}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-[#FF4500] hover:bg-[#E63E00] text-white font-semibold rounded-lg text-sm transition-all duration-200 hover:shadow-lg hover:shadow-[#FF4500]/30 hover:-translate-y-0.5"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">FUEL</span>
                </button>
              )}
              {onLogExpense && (
                <button
                  onClick={onLogExpense}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-semibold rounded-lg text-sm transition-all duration-200 hover:shadow-lg hover:shadow-[#D32F2F]/30 hover:-translate-y-0.5"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">EXPENSE</span>
                </button>
              )}
              {onExportReports && (
                <button
                  onClick={onExportReports}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1a1a1a] hover:bg-[#252525] text-[#00FF00] font-semibold rounded-lg text-sm border border-[#333] hover:border-[#00FF00]/50 transition-all duration-200 hover:shadow-lg hover:shadow-[#00FF00]/20 hover:-translate-y-0.5"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">EXPORT</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
