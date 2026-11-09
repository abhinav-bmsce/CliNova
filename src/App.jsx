import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DatasetProvider } from './context/DatasetContext';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

// 14 Functional Pages
import DashboardOverview from './pages/DashboardOverview';
import ProjectsPage from './pages/ProjectsPage';
import DatasetsPage from './pages/DatasetsPage';
import EdaPage from './pages/EdaPage';
import PreprocessingPage from './pages/PreprocessingPage';
import AssociationRulesPage from './pages/AssociationRulesPage';
import ClusteringPage from './pages/ClusteringPage';
import ReadmissionPage from './pages/ReadmissionPage';
import KnowledgeDiscoveryPage from './pages/KnowledgeDiscoveryPage';
import AiAssistantPage from './pages/AiAssistantPage';
import VisualAnalyticsPage from './pages/VisualAnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import AnalysisHistoryPage from './pages/AnalysisHistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview onNavigateTab={setActiveTab} />;
      case 'projects':
        return <ProjectsPage onSelectProject={() => setActiveTab('dashboard')} />;
      case 'datasets':
        return <DatasetsPage onNavigateEDA={() => setActiveTab('eda')} />;
      case 'eda':
        return <EdaPage />;
      case 'preprocessing':
        return <PreprocessingPage />;
      case 'association_rules':
        return <AssociationRulesPage onNavigateTab={setActiveTab} />;
      case 'clustering':
        return <ClusteringPage onNavigateTab={setActiveTab} />;
      case 'readmission':
        return <ReadmissionPage onNavigateTab={setActiveTab} />;
      case 'knowledge_discovery':
        return <KnowledgeDiscoveryPage onNavigateTab={setActiveTab} />;
      case 'ai_assistant':
        return <AiAssistantPage onNavigateTab={setActiveTab} />;
      case 'visual_analytics':
        return <VisualAnalyticsPage onNavigateTab={setActiveTab} />;
      case 'reports':
        return <ReportsPage />;
      case 'history':
        return <AnalysisHistoryPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <DashboardOverview onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-[#35463B] flex antialiased">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onNavigateTab={setActiveTab} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DatasetProvider>
        <MainApp />
      </DatasetProvider>
    </AuthProvider>
  );
}
