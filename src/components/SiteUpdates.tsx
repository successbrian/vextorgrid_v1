import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from './Card';
import { Button } from './Button';
import { Megaphone, Calendar, Tag, Plus, Edit2, Trash2, X, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SiteUpdate {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface UpdateLikes {
  likes: number;
  dislikes: number;
  userReaction: 'LIKE' | 'DISLIKE' | null;
}

interface Message {
  id: string;
  update_id: string;
  user_id: string;
  message: string;
  is_admin_reply: boolean;
  parent_message_id: string | null;
  created_at: string;
}

export function SiteUpdates() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<SiteUpdate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'announcement'
  });
  const [likesData, setLikesData] = useState<Record<string, UpdateLikes>>({});
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [showMessaging, setShowMessaging] = useState<string | null>(null);

  useEffect(() => {
    loadUpdates();
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (updates.length > 0 && user) {
      loadLikesData();
      loadMessageCounts();
    }
  }, [updates, user]);

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

  const loadUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_site_updates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (err) {
      console.error('Error loading site updates:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLikesData = async () => {
    if (!user) return;

    try {
      const { data: allLikes, error } = await supabase
        .from('vextor_site_update_likes')
        .select('*');

      if (error) throw error;

      const likesMap: Record<string, UpdateLikes> = {};

      updates.forEach((update) => {
        const updateLikes = allLikes?.filter(like => like.update_id === update.id) || [];
        const userLike = updateLikes.find(like => like.user_id === user.id);

        likesMap[update.id] = {
          likes: updateLikes.filter(like => like.reaction === 'LIKE').length,
          dislikes: updateLikes.filter(like => like.reaction === 'DISLIKE').length,
          userReaction: userLike ? userLike.reaction : null,
        };
      });

      setLikesData(likesMap);
    } catch (err) {
      console.error('Error loading likes:', err);
    }
  };

  const loadMessageCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('vextor_site_update_messages')
        .select('update_id');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((msg) => {
        counts[msg.update_id] = (counts[msg.update_id] || 0) + 1;
      });

      setMessageCounts(counts);
    } catch (err) {
      console.error('Error loading message counts:', err);
    }
  };

  const handleReaction = async (updateId: string, reaction: 'LIKE' | 'DISLIKE') => {
    if (!user) return;

    try {
      const currentReaction = likesData[updateId]?.userReaction;

      if (currentReaction === reaction) {
        const { error } = await supabase
          .from('vextor_site_update_likes')
          .delete()
          .eq('update_id', updateId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else if (currentReaction) {
        const { error } = await supabase
          .from('vextor_site_update_likes')
          .update({ reaction })
          .eq('update_id', updateId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vextor_site_update_likes')
          .insert([{
            user_id: user.id,
            update_id: updateId,
            reaction,
          }]);

        if (error) throw error;
      }

      await loadLikesData();
    } catch (err) {
      console.error('Error handling reaction:', err);
      alert('Failed to update reaction');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature':
        return 'text-[#008080] border-[#008080] bg-[#008080] bg-opacity-10';
      case 'bugfix':
        return 'text-[#FF4500] border-[#FF4500] bg-[#FF4500] bg-opacity-10';
      case 'announcement':
        return 'text-yellow-500 border-yellow-500 bg-yellow-500 bg-opacity-10';
      default:
        return 'text-gray-400 border-gray-400 bg-gray-400 bg-opacity-10';
    }
  };

  const handleAddNew = () => {
    setEditingUpdate(null);
    setFormData({ title: '', description: '', category: 'announcement' });
    setShowForm(true);
  };

  const handleEdit = (update: SiteUpdate) => {
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      description: update.description,
      category: update.category
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this update?')) return;

    try {
      const { error } = await supabase
        .from('site_updates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadUpdates();
    } catch (err) {
      console.error('Error deleting update:', err);
      alert('Failed to delete update');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUpdate) {
        const { error } = await supabase
          .from('site_updates')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUpdate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_updates')
          .insert([formData]);

        if (error) throw error;
      }

      setShowForm(false);
      await loadUpdates();
    } catch (err) {
      console.error('Error saving update:', err);
      alert('Failed to save update');
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 border-4 border-[#008080] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#008080] font-bold" style={{ fontFamily: 'monospace' }}>
            LOADING UPDATES...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#252525] border-2 border-[#008080] flex items-center justify-center">
              <Megaphone size={24} className="text-[#008080]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                SITE UPDATES
              </h1>
              <p className="text-gray-400 text-sm">
                Stay informed about new features, improvements, and announcements
              </p>
            </div>
          </div>
          {isAdmin && !showForm && (
            <Button onClick={handleAddNew}>
              <Plus size={20} />
              <span>Add Update</span>
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                {editingUpdate ? 'EDIT UPDATE' : 'NEW UPDATE'}
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
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white focus:border-[#008080] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white focus:border-[#008080] focus:outline-none"
                >
                  <option value="announcement">Announcement</option>
                  <option value="feature">Feature</option>
                  <option value="bugfix">Bug Fix</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white focus:border-[#008080] focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit">
                  {editingUpdate ? 'Update' : 'Create'}
                </Button>
                <Button variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {updates.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <Megaphone size={64} className="mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
              NO UPDATES YET
            </h2>
            <p className="text-gray-400">
              Check back soon for new features and announcements.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <Card key={update.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                    {update.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-bold ${getCategoryColor(update.category)}`}>
                      <Tag size={12} />
                      <span>{update.category.toUpperCase()}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(update)}
                          className="p-2 text-[#008080] hover:bg-[#252525] transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(update.id)}
                          className="p-2 text-[#FF4500] hover:bg-[#252525] transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {update.description}
                </p>

                <div className="space-y-3 pt-3 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>
                          Posted: {new Date(update.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {update.updated_at !== update.created_at && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>
                            Updated: {new Date(update.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {user && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReaction(update.id, 'LIKE')}
                          className={`flex items-center gap-1 px-3 py-1 border transition-colors ${
                            likesData[update.id]?.userReaction === 'LIKE'
                              ? 'bg-[#008080] border-[#008080] text-white'
                              : 'border-[#333] text-gray-400 hover:border-[#008080] hover:text-[#008080]'
                          }`}
                          title="Like this update"
                        >
                          <ThumbsUp size={14} />
                          <span className="text-xs font-bold">
                            {likesData[update.id]?.likes || 0}
                          </span>
                        </button>

                        <button
                          onClick={() => handleReaction(update.id, 'DISLIKE')}
                          className={`flex items-center gap-1 px-3 py-1 border transition-colors ${
                            likesData[update.id]?.userReaction === 'DISLIKE'
                              ? 'bg-[#FF4500] border-[#FF4500] text-white'
                              : 'border-[#333] text-gray-400 hover:border-[#FF4500] hover:text-[#FF4500]'
                          }`}
                          title="Dislike this update"
                        >
                          <ThumbsDown size={14} />
                          <span className="text-xs font-bold">
                            {likesData[update.id]?.dislikes || 0}
                          </span>
                        </button>

                        <button
                          onClick={() => setShowMessaging(showMessaging === update.id ? null : update.id)}
                          className="flex items-center gap-1 px-3 py-1 border border-[#333] text-gray-400 hover:border-[#008080] hover:text-[#008080] transition-colors"
                          title="Message about this update"
                        >
                          <MessageSquare size={14} />
                          <span className="text-xs font-bold">
                            {messageCounts[update.id] || 0}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {showMessaging === update.id && (
                    <div className="pt-3 border-t border-gray-800">
                      <UpdateMessaging
                        updateId={update.id}
                        isAdmin={isAdmin}
                        onMessageSent={loadMessageCounts}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface UpdateMessagingProps {
  updateId: string;
  isAdmin: boolean;
  onMessageSent: () => void;
}

function UpdateMessaging({ updateId, isAdmin, onMessageSent }: UpdateMessagingProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [updateId]);

  const loadMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('site_update_messages')
        .select('*')
        .eq('update_id', updateId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('site_update_messages')
        .insert([{
          update_id: updateId,
          user_id: user.id,
          message: newMessage.trim(),
          is_admin_reply: isAdmin,
          parent_message_id: replyTo,
        }]);

      if (error) throw error;

      setNewMessage('');
      setReplyTo(null);
      await loadMessages();
      onMessageSent();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const getThreadMessages = () => {
    const threads: { parent: Message; replies: Message[] }[] = [];
    const parentMessages = messages.filter(m => !m.parent_message_id);

    parentMessages.forEach(parent => {
      const replies = messages.filter(m => m.parent_message_id === parent.id);
      threads.push({ parent, replies });
    });

    return threads;
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-400">Loading messages...</div>;
  }

  const threads = getThreadMessages();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'monospace' }}>
        MESSAGES
      </h3>

      {threads.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {threads.map(({ parent, replies }) => (
            <div key={parent.id} className="space-y-2">
              <div className={`p-3 border ${
                parent.is_admin_reply
                  ? 'border-[#008080] bg-[#008080] bg-opacity-5'
                  : 'border-[#333] bg-[#1a1a1a]'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-xs font-bold ${
                    parent.is_admin_reply ? 'text-[#008080]' : 'text-gray-400'
                  }`}>
                    {parent.is_admin_reply ? 'ADMIN' : 'USER'} • {new Date(parent.created_at).toLocaleString()}
                  </span>
                  {isAdmin && !parent.is_admin_reply && (
                    <button
                      onClick={() => setReplyTo(replyTo === parent.id ? null : parent.id)}
                      className="text-xs text-[#008080] hover:underline"
                    >
                      {replyTo === parent.id ? 'Cancel Reply' : 'Reply'}
                    </button>
                  )}
                </div>
                <p className="text-gray-300 text-sm">{parent.message}</p>
              </div>

              {replies.length > 0 && (
                <div className="ml-6 space-y-2">
                  {replies.map(reply => (
                    <div
                      key={reply.id}
                      className="p-3 border border-[#008080] bg-[#008080] bg-opacity-5"
                    >
                      <div className="text-xs font-bold text-[#008080] mb-2">
                        ADMIN REPLY • {new Date(reply.created_at).toLocaleString()}
                      </div>
                      <p className="text-gray-300 text-sm">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {replyTo && (
          <div className="text-xs text-[#008080] font-bold">
            Replying to user message...
          </div>
        )}
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isAdmin ? "Reply to user messages..." : "Send a message about this update..."}
          rows={3}
          className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] text-white text-sm focus:border-[#008080] focus:outline-none resize-none"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting || !newMessage.trim()}>
            {submitting ? 'Sending...' : 'Send Message'}
          </Button>
          {replyTo && (
            <Button variant="secondary" onClick={() => setReplyTo(null)}>
              Cancel Reply
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
