import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Radio, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Shout {
  id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
    rank: string;
  };
}

export function LiveFeed() {
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShouts();
  }, []);

  const loadShouts = async () => {
    try {
      const { data, error } = await supabase
        .from('shouts')
        .select(`
          id,
          message,
          created_at,
          profiles!inner(username, rank)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setShouts(data || []);
    } catch (err) {
      console.error('Error loading shouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
          <Radio size={20} className="text-[#008080]" />
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
            LIVE FEED
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : shouts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No shouts yet. Be the first!
          </div>
        ) : (
          <div className="space-y-3">
            {shouts.map((shout) => (
              <div
                key={shout.id}
                className="p-3 bg-[#252525] border border-[#333] space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#1a1a1a] border border-[#008080] flex items-center justify-center">
                      <User size={16} className="text-[#008080]" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {shout.profiles.username}
                      </div>
                      <div className="text-xs text-gray-500">
                        {shout.profiles.rank}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(shout.created_at)}
                  </div>
                </div>
                <p className="text-sm text-gray-300">{shout.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Real-time updates from the community
          </p>
        </div>
      </div>
    </Card>
  );
}
