import { useState, FormEvent } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { useAuth } from '../contexts/AuthContext';
import { Truck, X } from 'lucide-react';

interface AuthFormProps {
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthForm({ onClose, initialMode = 'login' }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message || 'Failed to send reset email');
        } else {
          setSuccessMessage('Password reset email sent! Check your inbox.');
          setTimeout(() => {
            setIsForgotPassword(false);
            setSuccessMessage('');
          }, 3000);
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message || 'Failed to sign in');
        } else {
          onClose();
        }
      } else {
        if (!fullName.trim()) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, whatsappNumber);
        if (error) {
          setError(error.message || 'Failed to sign up');
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Truck className="text-[#FF4500]" size={32} />
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                {isForgotPassword ? 'RESET PASSWORD' : isLogin ? 'LOGIN' : 'REGISTER'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-400 mb-2">
                    OPERATOR NAME
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="whatsappNumber" className="block text-sm font-semibold text-gray-400 mb-2">
                    WHATSAPP NUMBER (OPTIONAL)
                  </label>
                  <input
                    id="whatsappNumber"
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-400 mb-2">
                EMAIL
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
                placeholder="operator@vextorgrid.com"
                required
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-400 mb-2">
                  PASSWORD
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-[#333] text-white focus:outline-none focus:border-[#008080] transition-colors"
                  placeholder="Enter password"
                  required
                  minLength={6}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500 text-red-200 text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-900/30 border border-green-500 text-green-200 text-sm">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={loading}
            >
              {loading ? 'PROCESSING...' : isForgotPassword ? 'SEND RESET LINK' : isLogin ? 'DEPLOY' : 'INITIALIZE'}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            {isLogin && !isForgotPassword && (
              <button
                onClick={() => {
                  setIsForgotPassword(true);
                  setError('');
                }}
                className="block w-full text-sm text-gray-400 hover:text-[#008080] transition-colors"
              >
                Forgot Password?
              </button>
            )}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setIsForgotPassword(false);
                setError('');
                setSuccessMessage('');
              }}
              className="text-sm text-[#008080] hover:text-[#009999] transition-colors"
            >
              {isForgotPassword
                ? 'Back to Login'
                : isLogin
                ? "Don't have an account? Register"
                : 'Already have an account? Login'
              }
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
