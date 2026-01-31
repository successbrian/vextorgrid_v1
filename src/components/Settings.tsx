import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { Card } from './Card';
import { VehicleGarage } from './VehicleGarage';
import { ReferralEngine } from './ReferralEngine';

interface ClockConfig {
  timezone: string;
  label: string;
  timeFormat?: '12h' | '24h';
}

const TIMEZONE_OPTIONS = [
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'Europe/London', label: 'London / GMT' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Manila', label: 'Philippines / Manila' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Dubai', label: 'Dubai / UAE' },
  { value: 'Africa/Lagos', label: 'Nigeria / Lagos' },
  { value: 'Africa/Nairobi', label: 'Kenya / Nairobi' },
  { value: 'Africa/Johannesburg', label: 'South Africa' },
  { value: 'Australia/Sydney', label: 'Sydney / AEST' },
  { value: 'Pacific/Auckland', label: 'Auckland' },
];

export function Settings() {
  const { user, signOut } = useAuth();
  const [homeZipCode, setHomeZipCode] = useState('');
  const [clockConfig, setClockConfig] = useState<ClockConfig[]>([]);
  const [newClockLabel, setNewClockLabel] = useState('');
  const [newClockTimezone, setNewClockTimezone] = useState('America/Los_Angeles');
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editTimezone, setEditTimezone] = useState('');
  const [editTimeFormat, setEditTimeFormat] = useState<'12h' | '24h'>('24h');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('vextor_profiles')
      .select('home_zip_code, clock_config')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setHomeZipCode(data.home_zip_code || '');
      const clocks = (data.clock_config || []).map((clock: ClockConfig) => ({
        ...clock,
        timeFormat: clock.timeFormat || '24h',
      }));
      setClockConfig(clocks);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vextor_profiles')
        .update({
          home_zip_code: homeZipCode,
          clock_config: clockConfig,
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddClock = () => {
    if (clockConfig.length >= 5) return;
    if (!newClockLabel.trim()) return;

    setClockConfig([
      ...clockConfig,
      { timezone: newClockTimezone, label: newClockLabel.trim(), timeFormat: '24h' },
    ]);
    setNewClockLabel('');
    setNewClockTimezone('America/Los_Angeles');
  };

  const handleRemoveClock = (index: number) => {
    setClockConfig(clockConfig.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newConfig = [...clockConfig];
    [newConfig[index - 1], newConfig[index]] = [newConfig[index], newConfig[index - 1]];
    setClockConfig(newConfig);
  };

  const handleMoveDown = (index: number) => {
    if (index === clockConfig.length - 1) return;
    const newConfig = [...clockConfig];
    [newConfig[index], newConfig[index + 1]] = [newConfig[index + 1], newConfig[index]];
    setClockConfig(newConfig);
  };

  const handleStartEdit = (index: number) => {
    const clock = clockConfig[index];
    setEditingIndex(index);
    setEditLabel(clock.label);
    setEditTimezone(clock.timezone);
    setEditTimeFormat(clock.timeFormat || '24h');
  };

  const handleSaveEdit = (index: number) => {
    if (!editLabel.trim()) return;
    const newConfig = [...clockConfig];
    newConfig[index] = {
      label: editLabel.trim(),
      timezone: editTimezone,
      timeFormat: editTimeFormat,
    };
    setClockConfig(newConfig);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleUpdateTimeFormat = (index: number, format: '12h' | '24h') => {
    const newConfig = [...clockConfig];
    newConfig[index] = {
      ...newConfig[index],
      timeFormat: format,
    };
    setClockConfig(newConfig);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
          SETTINGS
        </h1>
        <div className="h-1 w-24 bg-[#FF4500]"></div>
      </div>

      <div className="space-y-6">
        <Card>
          <h3 className="text-lg font-bold text-[#008080] mb-4" style={{ fontFamily: 'monospace' }}>
            COMMAND CENTER CONFIG
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'monospace' }}>
                HOME ZIP CODE
              </label>
              <input
                type="text"
                value={homeZipCode}
                onChange={(e) => setHomeZipCode(e.target.value)}
                placeholder="Enter zip code for weather"
                maxLength={10}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 text-white focus:border-[#008080] focus:outline-none"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>
                  TIME ZONES ({clockConfig.length}/5)
                </label>
              </div>

              {clockConfig.length > 0 && (
                <div className="space-y-2 mb-4">
                  {clockConfig.map((clock, index) => (
                    <div
                      key={index}
                      className="bg-[#0a0a0a] border border-gray-700 p-3"
                    >
                      {editingIndex === index ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>
                                LABEL
                              </label>
                              <input
                                type="text"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value.toUpperCase())}
                                maxLength={10}
                                className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 text-white focus:border-[#008080] focus:outline-none text-sm"
                                style={{ fontFamily: 'monospace' }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>
                                TIME ZONE
                              </label>
                              <select
                                value={editTimezone}
                                onChange={(e) => setEditTimezone(e.target.value)}
                                className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 text-white focus:border-[#008080] focus:outline-none text-sm"
                                style={{ fontFamily: 'monospace' }}
                              >
                                {TIMEZONE_OPTIONS.map((tz) => (
                                  <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>
                              TIME FORMAT
                            </label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditTimeFormat('12h')}
                                className={`flex-1 px-3 py-2 border text-sm transition-colors ${
                                  editTimeFormat === '12h'
                                    ? 'bg-[#008080] border-[#008080] text-white'
                                    : 'bg-[#0a0a0a] border-gray-700 text-gray-400 hover:border-[#008080]'
                                }`}
                                style={{ fontFamily: 'monospace' }}
                              >
                                12 HOUR
                              </button>
                              <button
                                onClick={() => setEditTimeFormat('24h')}
                                className={`flex-1 px-3 py-2 border text-sm transition-colors ${
                                  editTimeFormat === '24h'
                                    ? 'bg-[#008080] border-[#008080] text-white'
                                    : 'bg-[#0a0a0a] border-gray-700 text-gray-400 hover:border-[#008080]'
                                }`}
                                style={{ fontFamily: 'monospace' }}
                              >
                                24 HOUR
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(index)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#008080] text-white hover:bg-[#006666] transition-colors"
                              style={{ fontFamily: 'monospace' }}
                            >
                              <Check size={16} />
                              SAVE
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                              style={{ fontFamily: 'monospace' }}
                            >
                              <X size={16} />
                              CANCEL
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[#00FF00] font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                {clock.label}
                              </span>
                              <span className="text-gray-500 text-xs" style={{ fontFamily: 'monospace' }}>
                                {TIMEZONE_OPTIONS.find((tz) => tz.value === clock.timezone)?.label || clock.timezone}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateTimeFormat(index, '12h')}
                                className={`px-2 py-1 border text-[10px] transition-colors ${
                                  clock.timeFormat === '12h'
                                    ? 'bg-[#008080] border-[#008080] text-white'
                                    : 'bg-[#0a0a0a] border-gray-700 text-gray-500 hover:border-[#008080]'
                                }`}
                                style={{ fontFamily: 'monospace' }}
                              >
                                12H
                              </button>
                              <button
                                onClick={() => handleUpdateTimeFormat(index, '24h')}
                                className={`px-2 py-1 border text-[10px] transition-colors ${
                                  clock.timeFormat === '24h'
                                    ? 'bg-[#008080] border-[#008080] text-white'
                                    : 'bg-[#0a0a0a] border-gray-700 text-gray-500 hover:border-[#008080]'
                                }`}
                                style={{ fontFamily: 'monospace' }}
                              >
                                24H
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-[#008080] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronUp size={18} />
                            </button>
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={index === clockConfig.length - 1}
                              className="p-1 text-gray-400 hover:text-[#008080] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronDown size={18} />
                            </button>
                            <button
                              onClick={() => handleStartEdit(index)}
                              className="p-1 text-gray-400 hover:text-[#008080] transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleRemoveClock(index)}
                              className="p-1 text-red-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {clockConfig.length < 5 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>
                        LABEL
                      </label>
                      <input
                        type="text"
                        value={newClockLabel}
                        onChange={(e) => setNewClockLabel(e.target.value.toUpperCase())}
                        placeholder="HQ, TARGET, BASE"
                        maxLength={10}
                        className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 text-white focus:border-[#008080] focus:outline-none text-sm"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'monospace' }}>
                        TIME ZONE
                      </label>
                      <select
                        value={newClockTimezone}
                        onChange={(e) => setNewClockTimezone(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 text-white focus:border-[#008080] focus:outline-none text-sm"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleAddClock}
                    disabled={!newClockLabel.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#008080] text-white hover:bg-[#006666] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ fontFamily: 'monospace' }}
                  >
                    <Plus size={16} />
                    ADD CLOCK
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-700">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'SAVING...' : 'SAVE CONFIGURATION'}
              </Button>
            </div>
          </div>
        </Card>

        <VehicleGarage />

        <ReferralEngine />

        <Card>
          <h3 className="text-lg font-bold text-[#008080] mb-4" style={{ fontFamily: 'monospace' }}>
            ACCOUNT CONTROL
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-2">OPERATOR ID</p>
              <p className="text-white font-mono text-sm break-all">{user?.id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">EMAIL</p>
              <p className="text-white font-mono text-sm">{user?.email}</p>
            </div>
            <div className="pt-4">
              <Button onClick={signOut} variant="ghost">
                SIGN OUT
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
