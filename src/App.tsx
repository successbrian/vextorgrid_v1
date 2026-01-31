import { useState } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PlaceholderView } from './components/PlaceholderView';
import { AuthForm } from './components/AuthForm';
import { GridOps } from './components/GridOps';
import { SupplyDepot } from './components/SupplyDepot';
import { Settings } from './components/Settings';
import { CommandHUD } from './components/CommandHUD';
import { Footer } from './components/Footer';
import { SiteUpdates } from './components/SiteUpdates';
import { IntelPage } from './components/IntelPage';
import { FieldReports } from './components/FieldReports';
import { IntelCommand } from './components/IntelCommand';
import { CircleDollarSign, Shield } from 'lucide-react';
import { QuickMissionModal } from './components/QuickMissionModal';
import { QuickFuelLogModal } from './components/QuickFuelLogModal';
import { LogExpenseModal } from './components/LogExpenseModal';
import { ExportReportsModal } from './components/ExportReportsModal';

function IntelPageWrapper() {
  const { slug } = useParams<{ slug: string }>();
  return <IntelPage slug={slug || ''} />;
}

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeView, setActiveView] = useState('dashboard');
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#008080] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#008080] font-bold" style={{ fontFamily: 'monospace' }}>
            INITIALIZING SYSTEMS...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage onGetStarted={(mode) => {
          setAuthMode(mode);
          setShowAuthForm(true);
        }} />
        {showAuthForm && <AuthForm initialMode={authMode} onClose={() => setShowAuthForm(false)} />}
      </>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'supply-depot':
        return <SupplyDepot />;
      case 'grid-ops':
        return <GridOps />;
      case 'field-reports':
        return <FieldReports />;
      case 'intel-command':
        return <IntelCommand />;
      case 'asset-command':
        return (
          <PlaceholderView
            title="ASSET COMMAND"
            description="Monitor income, track expenses, and build your financial command center. Manage wealth and hard assets."
            icon={CircleDollarSign}
          />
        );
      case 'comsec':
        return (
          <PlaceholderView
            title="COMSEC"
            description="Secure your data with backup and recovery systems. Protect your operational security."
            icon={Shield}
          />
        );
      case 'site-updates':
        return <SiteUpdates />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-auto flex flex-col">
        <CommandHUD
          onStartMission={activeView === 'dashboard' ? () => setShowMissionModal(true) : undefined}
          onLogFuel={activeView === 'dashboard' ? () => setShowFuelModal(true) : undefined}
          onLogExpense={activeView === 'dashboard' ? () => setShowExpenseModal(true) : undefined}
          onExportReports={activeView === 'dashboard' ? () => setShowExportModal(true) : undefined}
        />
        <div className="flex-1">
          {renderView()}
        </div>
        <Footer variant="internal" />

        {/* Global Modals */}
        {showMissionModal && (
          <QuickMissionModal
            onClose={() => setShowMissionModal(false)}
            onSuccess={() => {
              setShowMissionModal(false);
            }}
          />
        )}
        {showFuelModal && (
          <QuickFuelLogModal
            onClose={() => setShowFuelModal(false)}
            onSuccess={() => {
              setShowFuelModal(false);
            }}
          />
        )}
        <LogExpenseModal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => {
            setShowExpenseModal(false);
          }}
        />
        <ExportReportsModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/intel/:slug" element={<IntelPageWrapper />} />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
