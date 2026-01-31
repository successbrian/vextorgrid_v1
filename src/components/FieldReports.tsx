import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { FileImage, Plus, X, Clock, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FieldReport {
  id: string;
  image_url: string;
  caption: string;
  status: 'PENDING' | 'HOLD' | 'PUBLISHED';
  admin_notes?: string;
  created_at: string;
  published_at?: string;
}

export function FieldReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    caption: '',
  });

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vextor_field_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('field-reports')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('field-reports')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    setSubmitting(true);
    setUploadProgress(0);

    try {
      setUploadProgress(30);
      const imageUrl = await uploadImage();

      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      setUploadProgress(70);

      const { error } = await supabase
        .from('vextor_field_reports')
        .insert([{
          user_id: user.id,
          image_url: imageUrl,
          caption: formData.caption,
          status: 'PENDING',
        }]);

      if (error) throw error;

      setUploadProgress(100);
      setFormData({ caption: '' });
      setSelectedFile(null);
      setPreviewUrl('');
      setShowForm(false);
      await loadReports();
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={16} className="text-yellow-500" />;
      case 'HOLD':
        return <AlertCircle size={16} className="text-[#FF4500]" />;
      case 'PUBLISHED':
        return <CheckCircle size={16} className="text-[#008080]" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-500 border-yellow-500 bg-yellow-500 bg-opacity-10';
      case 'HOLD':
        return 'text-[#FF4500] border-[#FF4500] bg-[#FF4500] bg-opacity-10';
      case 'PUBLISHED':
        return 'text-[#008080] border-[#008080] bg-[#008080] bg-opacity-10';
      default:
        return 'text-gray-400 border-gray-400 bg-gray-400 bg-opacity-10';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#252525] border-2 border-[#008080] flex items-center justify-center">
              <FileImage size={24} className="text-[#008080]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                FIELD REPORTS
              </h1>
              <p className="text-gray-400 text-sm">
                Share your experiences and compete in weekly contests
              </p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus size={20} />
              <span>Submit Report</span>
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                NEW FIELD REPORT
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Upload Image
                </label>

                {!previewUrl ? (
                  <label className="block cursor-pointer">
                    <div className="w-full px-4 py-12 bg-[#1a1a1a] border-2 border-dashed border-[#333] hover:border-[#008080] transition-colors flex flex-col items-center justify-center gap-3">
                      <Upload size={48} className="text-gray-600" />
                      <div className="text-center">
                        <p className="text-white font-semibold mb-1">
                          Click to upload image
                        </p>
                        <p className="text-xs text-gray-500">
                          JPG, PNG, GIF, or WebP (Max 5MB)
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover border border-[#333]"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 p-2 bg-[#FF4500] text-white hover:bg-[#cc3700] transition-colors"
                    >
                      <X size={20} />
                    </button>
                    {selectedFile && (
                      <div className="mt-2 text-xs text-gray-400">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Caption
                </label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  required
                  rows={6}
                  placeholder="Describe your experience, insights, or field observations..."
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white focus:border-[#008080] focus:outline-none resize-none"
                />
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Uploading...</span>
                    <span className="text-[#008080] font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#1a1a1a] border border-[#333]">
                    <div
                      className="h-full bg-[#008080] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting || !selectedFile}>
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedFile(null);
                    setPreviewUrl('');
                    setFormData({ caption: '' });
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <Card>
            <div className="text-center py-16 text-gray-400">Loading...</div>
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <FileImage size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Reports Yet</h3>
              <p className="text-gray-400 mb-6">
                Submit your first field report to get started!
              </p>
            </div>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-bold ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span>{report.status}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <img
                      src={report.image_url}
                      alt="Field report"
                      className="w-full h-48 object-cover border border-[#333]"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-300 leading-relaxed">
                      {report.caption}
                    </p>
                    {report.admin_notes && (
                      <div className="mt-3 p-3 bg-[#1a1a1a] border border-[#FF4500]">
                        <div className="text-xs font-bold text-[#FF4500] mb-1">
                          ADMIN NOTES
                        </div>
                        <p className="text-sm text-gray-400">{report.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
