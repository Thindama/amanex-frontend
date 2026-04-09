import { useState } from 'react';
import './index.css';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import { auth } from './api/client';

export default function App() {
  const [user, setUser] = useState(() => auth.getUser());
  const [lang, setLang] = useState('de');
  const [botOn, setBotOn] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  const handleLogout = () => {
    auth.logout();
    setUser(null);
  };

  return (
    <div className="app">
      <Sidebar
        lang={lang}
        page="p1"
        setPage={() => setSidebarOpen(false)}
        botOn={botOn}
        setBotOn={setBotOn}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main">
        <Topbar
          lang={lang}
          setLang={setLang}
          page="p1"
          onMenu={() => setSidebarOpen(true)}
          onLogout={handleLogout}
          user={user}
        />
        <Dashboard lang={lang} botOn={botOn} setBotOn={setBotOn} />
      </div>
    </div>
  );
}
