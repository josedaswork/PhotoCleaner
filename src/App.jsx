import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import Home from '@/pages/Home';
import CleanFolder from '@/pages/CleanFolder';
import Duplicates from '@/pages/Duplicates';
import Settings from '@/pages/Settings';
import PageNotFound from '@/lib/PageNotFound';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/clean" element={<CleanFolder />} />
        <Route path="/duplicates" element={<Duplicates />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
      <Toaster
        richColors
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '16px',
            fontSize: '14px',
            fontFamily: 'var(--font-inter)',
          },
        }}
      />
    </Router>
  );
}

export default App;
