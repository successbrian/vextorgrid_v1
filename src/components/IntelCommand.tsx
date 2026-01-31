import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { FileSearch, Eye, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FieldReport {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  status: 'PENDING' | 'HOLD' | 'PUBLISHED';
  slug?: string;
  seo_title?: string;
  seo_desc?: string;
  admin_notes?: string;
  created_at: string;
  profiles: {
    username: string;
    rank: string;
  };
}

export function IntelCommand() {
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<FieldReport | null>(null);
  const [editData, setEditData] = useState({
    caption: '',
    seo_title: '',
    seo_desc: '',
    slug: '',
    admin_notes: '',
  });
  const [userWeeklyCount, setUserWeeklyCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [overrideLimit, setOverrideLimit] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (selectedReport) {
      setEditData({
        caption: selectedReport.caption,
        seo_title: selectedReport.seo_title || '',
        seo_desc: selectedReport.seo_desc || '',
        slug: selectedReport.slug || '',
        admin_notes: selectedReport.admin_notes || '',
      });
      checkUserWeeklyLimit(selectedReport.user_id);
    }
  }, [selectedReport]);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_field_reports')
        .select(`
          id,
          user_id,
          image_url,
          caption,
          status,
          slug,
          seo_title,
          seo_desc,
          admin_notes,
          created_at,
          profiles!inner(username, rank)
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReports(data as any || []);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkUserWeeklyLimit = async (userId: string) => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('vextor_field_reports')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'PUBLISHED')
        .gte('published_at', oneWeekAgo.toISOString());

      if (error) throw error;
      setUserWeeklyCount(data?.length || 0);
    } catch (err) {
      console.error('Error checking user limit:', err);
      setUserWeeklyCount(0);
    }
  };

  const handlePublish = async () => {
    if (!selectedReport) return;
    if (userWeeklyCount >= 3 && !overrideLimit) return;

    setProcessing(true);
    try {
      let finalSlug = editData.slug;

      if (!finalSlug && editData.seo_title) {
        const { data, error } = await supabase
          .rpc('generate_slug_from_title', {
            title: editData.seo_title,
            report_id: selectedReport.id
          });

        if (error) throw error;
        finalSlug = data;
      }

      const { error } = await supabase
        .from('vextor_field_reports')
        .update({
          caption: editData.caption,
          seo_title: editData.seo_title,
          seo_desc: editData.seo_desc,
          slug: finalSlug,
          admin_notes: editData.admin_notes,
          status: 'PUBLISHED',
          published_at: new Date().toISOString(),
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      setSelectedReport(null);
      setOverrideLimit(false);
      await loadReports();
    } catch (err) {
      console.error('Error publishing report:', err);
      alert('Failed to publish report');
    } finally {
      setProcessing(false);
    }
  };

  const handleHold = async () => {
    if (!selectedReport) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('vextor_field_reports')
        .update({
          status: 'HOLD',
          admin_notes: editData.admin_notes,
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      setSelectedReport(null);
      await loadReports();
    } catch (err) {
      console.error('Error updating report:', err);
      alert('Failed to update report');
    } finally {
      setProcessing(false);
    }
  };

  const canPublish = overrideLimit || userWeeklyCount < 3;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-[#252525] border-2 border-[#008080] flex items-center justify-center">
            <FileSearch size={24} className="text-[#008080]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
              INTEL COMMAND
            </h1>
            <p className="text-gray-400 text-sm">
              Review and approve field reports for publication
            </p>
          </div>
        </div>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#1a1a1a] border-2 border-[#008080] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#333] p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                REVIEW REPORT
              </h2>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setOverrideLimit(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#252525] border border-[#333]">
                <div>
                  <span className="text-sm text-gray-400">Submitted by:</span>
                  <div className="text-white font-bold">{selectedReport.profiles.username}</div>
                  <div className="text-sm text-gray-400">{selectedReport.profiles.rank}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Weekly Published:</span>
                  <div className="text-white font-bold">
                    {userWeeklyCount} / 3
                  </div>
                  {userWeeklyCount >= 3 && (
                    <div className="text-xs text-[#FF4500] flex items-center gap-1 mt-1">
                      <AlertTriangle size={12} />
                      <span>Limit reached</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <img
                  src={selectedReport.image_url}
                  alt="Report"
                  className="w-full border border-[#333]"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Caption (User's Original)
                </label>
                <textarea
                  value={editData.caption}
                  onChange={(e) => setEditData({ ...editData, caption: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#252525] border border-[#333] text-white focus:border-[#008080] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  SEO Title (For Public Page)
                </label>
                <input
                  type="text"
                  value={editData.seo_title}
                  onChange={(e) => setEditData({ ...editData, seo_title: e.target.value })}
                  placeholder="Compelling title for search engines"
                  className="w-full px-4 py-2 bg-[#252525] border border-[#333] text-white focus:border-[#008080] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  SEO Description (Meta Description)
                </label>
                <textarea
                  value={editData.seo_desc}
                  onChange={(e) => setEditData({ ...editData, seo_desc: e.target.value })}
                  rows={3}
                  placeholder="Brief description for search results (150-160 chars)"
                  className="w-full px-4 py-2 bg-[#252525] border border-[#333] text-white focus:border-[#008080] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  URL Slug (Leave blank to auto-generate)
                </label>
                <input
                  type="text"
                  value={editData.slug}
                  onChange={(e) => setEditData({ ...editData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="my-awesome-report"
                  className="w-full px-4 py-2 bg-[#252525] border border-[#333] text-white focus:border-[#008080] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Admin Notes (Visible to User)
                </label>
                <textarea
                  value={editData.admin_notes}
                  onChange={(e) => setEditData({ ...editData, admin_notes: e.target.value })}
                  rows={3}
                  placeholder="Notes for the user if holding for revision..."
                  className="w-full px-4 py-2 bg-[#252525] border border-[#333] text-white focus:border-[#008080] focus:outline-none resize-none"
                />
              </div>

              {userWeeklyCount >= 3 && (
                <div className="p-4 bg-[#FF4500] bg-opacity-10 border border-[#FF4500]">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-[#FF4500] flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-bold text-[#FF4500] mb-1">
                        USER LIMIT REACHED
                      </div>
                      <p className="text-sm text-gray-300 mb-3">
                        This user has already published 3 reports this week. Publishing more may violate contest rules.
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={overrideLimit}
                          onChange={(e) => setOverrideLimit(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-white">Override limit and publish anyway</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handlePublish}
                  disabled={!canPublish || processing}
                  className="flex-1"
                >
                  <CheckCircle size={20} />
                  <span>{processing ? 'Publishing...' : 'Publish'}</span>
                </Button>
                <Button
                  onClick={handleHold}
                  disabled={processing}
                  variant="secondary"
                  className="flex-1"
                >
                  <Clock size={20} />
                  <span>{processing ? 'Processing...' : 'Hold for Revision'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <Card>
            <div className="text-center py-16 text-gray-400">Loading...</div>
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <FileSearch size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Queue Empty</h3>
              <p className="text-gray-400">
                No pending reports to review at this time.
              </p>
            </div>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-48 flex-shrink-0">
                  <img
                    src={report.image_url}
                    alt="Report thumbnail"
                    className="w-full h-32 object-cover border border-[#333]"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/200x150?text=Image';
                    }}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">
                        {report.profiles.username}
                      </div>
                      <div className="text-sm text-gray-400">
                        {report.profiles.rank}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {report.caption}
                  </p>
                  <Button onClick={() => setSelectedReport(report)}>
                    <Eye size={16} />
                    <span>Review</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
