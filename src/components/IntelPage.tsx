import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { PublicHeader } from './PublicHeader';
import { Footer } from './Footer';
import { Leaderboard } from './Leaderboard';
import { LiveFeed } from './LiveFeed';
import { Button } from './Button';
import { ThumbsUp, Calendar, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface IntelPageProps {
  slug: string;
}

interface FieldReport {
  id: string;
  image_url: string;
  caption: string;
  seo_title: string;
  seo_desc: string;
  validations: number;
  published_at: string;
  profiles: {
    username: string;
    rank: string;
  };
}

export function IntelPage({ slug }: IntelPageProps) {
  const [report, setReport] = useState<FieldReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadReport();
  }, [slug]);

  const loadReport = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_field_reports')
        .select(`
          id,
          image_url,
          caption,
          seo_title,
          seo_desc,
          validations,
          published_at,
          profiles!inner(username, rank)
        `)
        .eq('slug', slug)
        .eq('status', 'PUBLISHED')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
      } else {
        setReport(data as any);
      }
    } catch (err) {
      console.error('Error loading report:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
              INTEL NOT FOUND
            </h1>
            <p className="text-gray-400 mb-6">
              This report doesn't exist or hasn't been published yet.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Return to Base
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{report.seo_title || report.caption.substring(0, 60)}</title>
        <meta
          name="description"
          content={report.seo_desc || report.caption.substring(0, 160)}
        />
        <meta property="og:title" content={report.seo_title || report.caption} />
        <meta property="og:description" content={report.seo_desc || report.caption} />
        <meta property="og:image" content={report.image_url} />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
        <PublicHeader />

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#252525] border border-[#333] p-2">
                <div className="text-center text-xs text-gray-400 py-12 border-2 border-dashed border-gray-700">
                  AD SPACE - 728x90
                </div>
              </div>

              <div className="bg-[#252525] border-2 border-[#008080] p-6 space-y-6">
                <img
                  src={report.image_url}
                  alt={report.caption}
                  className="w-full h-auto border border-[#333]"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                  }}
                />

                <div className="space-y-4">
                  <h1 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: 'monospace' }}>
                    {report.seo_title || report.caption}
                  </h1>

                  <div className="flex items-center gap-6 text-sm text-gray-400 pb-4 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span className="text-white font-semibold">{report.profiles.username}</span>
                      <span>•</span>
                      <span>{report.profiles.rank}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{formatDate(report.published_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#008080]">
                      <ThumbsUp size={16} />
                      <span className="font-bold">{report.validations} Validations</span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                    {report.caption}
                  </p>
                </div>
              </div>

              <div className="bg-[#252525] border border-[#333] p-2">
                <div className="text-center text-xs text-gray-400 py-12 border-2 border-dashed border-gray-700">
                  AD SPACE - 728x90
                </div>
              </div>

              <div className="bg-[#252525] border-2 border-[#008080] p-6 text-center space-y-4">
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                  JOIN THE GRID
                </h2>
                <p className="text-gray-300">
                  Share your field reports, compete in weekly contests, and climb the leaderboard.
                </p>
                <Button onClick={() => window.location.href = '/join'}>
                  Sign Up Now
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <Leaderboard />
              <LiveFeed />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
