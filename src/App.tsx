import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import CalendarPage from './pages/CalendarPage';
import EquipmentPage from './pages/Equipment';
import TeamPage from './pages/Team';
import PostProduction from './pages/PostProduction';
import Revisions from './pages/Revisions';
import Budget from './pages/Budget';
import InvoicePage from './pages/InvoicePage';
import Clients from './pages/Clients';
import SettingsPage from './pages/Settings';
import UsersPage from './pages/UsersPage';
import AdminDashboard from './pages/AdminDashboard';
import { useEffect } from 'react';
import { useStore } from './store/useStore';

function App() {
  const { settings } = useStore();

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="post-production" element={<PostProduction />} />
          <Route path="revisions" element={<Revisions />} />
          <Route path="budget" element={<Budget />} />
          <Route path="invoices" element={<InvoicePage />} />
          <Route path="clients" element={<Clients />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
