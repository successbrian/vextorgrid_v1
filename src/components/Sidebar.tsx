import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Package,
  Truck,
  CircleDollarSign,
  Shield,
  Settings,
  Menu,
  X,
  Megaphone,
  FileImage,
  FileSearch,
  LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'DASHBOARD', icon: Home },
  { id: 'grid-ops', label: 'GRID OPS', icon: Truck, badge: true },
  { id: 'supply-depot', label: 'SUPPLY DEPOT', icon: Package },
  { id: 'field-reports', label: 'FIELD REPORTS', icon: FileImage },
  { id: 'asset-command', label: 'ASSET COMMAND', icon: CircleDollarSign },
  { id: 'comsec', label: 'COMSEC', icon: Shield },
  { id: 'site-updates', label: 'SITE UPDATES', icon: Megaphone, badge: true },
  { id: 'settings', label: 'SETTINGS', icon: Settings },
];

const adminMenuItems = [
  { id: 'intel-command', label: 'INTEL COMMAND', icon: FileSearch, adminOnly: true },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showGridOpsBadge, setShowGridOpsBadge] = useState(false);
  const [showSiteUpdatesBadge, setShowSiteUpdatesBadge] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkVehiclesNeedingAttention();
      checkForNewSiteUpdates();
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  };

  const checkVehiclesNeedingAttention = async () => {
    try {
      const { data: vehicles, error } = await supabase
        .from('vextor_vehicles')
        .select('id, current_odometer')
        .eq('user_id', user?.id);

      if (error) throw error;

      if (!vehicles || vehicles.length === 0) {
        setShowGridOpsBadge(false);
        return;
      }

      for (const vehicle of vehicles) {
        if (vehicle.current_odometer === 0) {
          setShowGridOpsBadge(true);
          return;
        }

        const { data: lastLog } = await supabase
          .from('vextor_fuel_logs')
          .select('created_at')
          .eq('vehicle_id', vehicle.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastLog) {
          const daysSinceLastReading = (Date.now() - new Date(lastLog.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastReading >= 7) {
            setShowGridOpsBadge(true);
            return;
          }
        } else {
          setShowGridOpsBadge(true);
          return;
        }
      }

      setShowGridOpsBadge(false);
    } catch (err) {
      console.error('Error checking vehicles:', err);
      setShowGridOpsBadge(false);
    }
  };

  const checkForNewSiteUpdates = async () => {
    try {
      const { data: updates, error } = await supabase
        .from('vextor_site_updates')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!updates) {
        setShowSiteUpdatesBadge(false);
        return;
      }

      const lastReadUpdate = localStorage.getItem('vextor_last_read_update');

      if (!lastReadUpdate) {
        setShowSiteUpdatesBadge(true);
        return;
      }

      const latestUpdateTime = new Date(updates.updated_at).getTime();
      const lastReadTime = new Date(lastReadUpdate).getTime();

      setShowSiteUpdatesBadge(latestUpdateTime > lastReadTime);
    } catch (err) {
      console.error('Error checking site updates:', err);
      setShowSiteUpdatesBadge(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1a1a1a] border border-[#333] text-[#008080]"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-[#1a1a1a] border-r border-[#333]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-[#333]">
            <img
              src="/vextorgrid_logo_1a1a1a_background_12_25_2025.png"
              alt="VextorGrid.com"
              className="w-full"
            />
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const shouldShowBadge =
                (item.id === 'grid-ops' && showGridOpsBadge) ||
                (item.id === 'site-updates' && showSiteUpdatesBadge);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'site-updates') {
                      localStorage.setItem('vextor_last_read_update', new Date().toISOString());
                      setShowSiteUpdatesBadge(false);
                    }
                    onViewChange(item.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3
                    transition-all duration-200 relative
                    ${isActive
                      ? 'bg-[#FF4500] text-white border-l-4 border-[#008080]'
                      : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-semibold text-sm tracking-wide flex-1 text-left">
                    {item.label}
                  </span>
                  {shouldShowBadge && (
                    <span className="flex items-center justify-center w-2 h-2 bg-[#FF4500] rounded-full animate-pulse">
                    </span>
                  )}
                </button>
              );
            })}
            {isAdmin && (
              <>
                <div className="border-t border-[#333] my-2 pt-2">
                  <div className="px-4 py-2 text-xs text-gray-500 font-bold tracking-wider">
                    ADMIN
                  </div>
                </div>
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onViewChange(item.id);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3
                        transition-all duration-200 relative
                        ${isActive
                          ? 'bg-[#FF4500] text-white border-l-4 border-[#008080]'
                          : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                        }
                      `}
                    >
                      <Icon size={20} />
                      <span className="font-semibold text-sm tracking-wide flex-1 text-left">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </nav>

          <div className="border-t border-[#333] p-4 space-y-4">
            <button
              onClick={async () => {
                await signOut();
                setIsOpen(false);
                navigate('/');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF4500] hover:bg-[#E63E00] text-white font-semibold text-sm tracking-wide transition-colors duration-200 rounded"
            >
              <LogOut size={18} />
              LOGOUT
            </button>
            <div className="text-xs text-gray-500 text-center" style={{ fontFamily: 'monospace' }}>
              v1.0.0 | OPERATIONAL
            </div>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
}
