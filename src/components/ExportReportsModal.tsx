import { X, FileText, Calendar } from 'lucide-react';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportReportsModal({ isOpen, onClose }: ExportReportsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#008080] rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-[#008080]" />
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
              EXPORT REPORTS
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] border border-[#008080] rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <Calendar size={48} className="text-[#008080]" />
            </div>
            <h3 className="text-center text-lg font-bold text-[#00FF00] mb-3" style={{ fontFamily: 'monospace' }}>
              COMING SOON
            </h3>
            <p className="text-center text-gray-400 text-sm leading-relaxed mb-4">
              Monthly PDF & CSV Exports
            </p>
            <p className="text-center text-gray-500 text-xs" style={{ fontFamily: 'monospace' }}>
              Our team is finalizing the automated accounting suite for V2.0!
            </p>
          </div>

          <div className="mt-6 p-4 bg-[#0a0a0a] border border-[#333] rounded space-y-3">
            <h4 className="text-sm font-bold text-[#008080] uppercase" style={{ fontFamily: 'monospace' }}>
              Coming Features
            </h4>
            <ul className="text-xs text-gray-400 space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#008080] rounded-full"></div>
                Monthly PDF Reports
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#008080] rounded-full"></div>
                CSV Data Exports
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#008080] rounded-full"></div>
                Automated Accounting Suite
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#008080] rounded-full"></div>
                Tax Form Generation
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-[#333]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#008080] text-white font-semibold rounded hover:bg-[#006666] transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
