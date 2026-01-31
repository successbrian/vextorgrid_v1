import { Button } from './Button';
import { LogIn, UserPlus } from 'lucide-react';

interface PublicHeaderProps {
  onLogin?: () => void;
  onJoin?: () => void;
}

export function PublicHeader({ onLogin, onJoin }: PublicHeaderProps) {
  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      window.location.href = '/';
    }
  };

  const handleJoin = () => {
    if (onJoin) {
      onJoin();
    } else {
      window.location.href = '/join';
    }
  };

  return (
    <header className="bg-[#1a1a1a] border-b border-[#333]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/vextorgrid_logo_1a1a1a_background_12_25_2025.png"
              alt="VectorGrid Logo"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                VECTORGRID
              </h1>
              <p className="text-xs text-gray-400">Fleet Command Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleLogin} variant="secondary">
              <LogIn size={18} />
              <span>Login</span>
            </Button>
            <Button onClick={handleJoin}>
              <UserPlus size={18} />
              <span>Join the Grid</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
