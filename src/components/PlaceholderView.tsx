import { Card } from './Card';
import { LucideIcon } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderView({ title, description, icon: Icon }: PlaceholderViewProps) {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>
          {title}
        </h1>
        <div className="h-1 w-24 bg-[#FF4500]"></div>
      </div>

      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-[#252525] border-2 border-[#333] flex items-center justify-center mb-6">
            <Icon size={48} className="text-[#008080]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
            MODULE OFFLINE
          </h2>
          <p className="text-gray-400 max-w-md">
            {description}
          </p>
          <div className="mt-8 px-6 py-3 bg-[#252525] border border-[#333]">
            <p className="text-[#FF4500] text-sm font-bold" style={{ fontFamily: 'monospace' }}>
              COMING SOON
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
