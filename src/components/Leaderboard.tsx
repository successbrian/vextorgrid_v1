import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  rank: string;
  total_validations: number;
}

export function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('vextor_field_reports')
        .select(`
          user_id,
          validations,
          profiles!inner(username, rank)
        `)
        .eq('status', 'PUBLISHED')
        .gte('published_at', oneWeekAgo.toISOString());

      if (error) throw error;

      const userValidations = new Map<string, LeaderboardEntry>();

      data?.forEach((report: any) => {
        const userId = report.user_id;
        const existing = userValidations.get(userId);

        if (existing) {
          existing.total_validations += report.validations;
        } else {
          userValidations.set(userId, {
            user_id: userId,
            username: report.profiles.username,
            rank: report.profiles.rank,
            total_validations: report.validations,
          });
        }
      });

      const sortedLeaders = Array.from(userValidations.values())
        .sort((a, b) => b.total_validations - a.total_validations)
        .slice(0, 10);

      setLeaders(sortedLeaders);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0:
        return 'text-yellow-400';
      case 1:
        return 'text-gray-300';
      case 2:
        return 'text-amber-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
          <Trophy size={20} className="text-[#008080]" />
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'monospace' }}>
            TOP OPERATORS
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No data yet. Be the first!
          </div>
        ) : (
          <div className="space-y-2">
            {leaders.map((leader, index) => (
              <div
                key={leader.user_id}
                className="flex items-center gap-3 p-2 bg-[#252525] border border-[#333] hover:border-[#008080] transition-colors"
              >
                <div className={`w-8 text-center font-bold ${getMedalColor(index)}`}>
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">{leader.username}</div>
                  <div className="text-xs text-gray-400">{leader.rank}</div>
                </div>
                <div className="flex items-center gap-1 text-[#008080]">
                  <TrendingUp size={14} />
                  <span className="font-bold">{leader.total_validations}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Based on validations this week
          </p>
        </div>
      </div>
    </Card>
  );
}
