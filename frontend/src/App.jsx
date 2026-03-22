import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AddPaper from './pages/AddPaper';
import PaperDetails from './pages/PaperDetails';
import SearchResults from './pages/SearchResults';

function App() {
  return (
    <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white/60 to-indigo-50/30">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/papers/add" element={<AddPaper />} />
            <Route path="/papers/:id" element={<PaperDetails />} />
            <Route path="/search" element={<SearchResults />} />
          </Routes>
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#f8fafc' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
