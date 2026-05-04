import React, { useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import Home from '@/pages/Home';
import CleanFolder from '@/pages/CleanFolder';
import Duplicates from '@/pages/Duplicates';
import Settings from '@/pages/Settings';
import PageNotFound from '@/lib/PageNotFound';

function FrozenRoutes({ location }) {
  // Freeze location on mount so exit animation keeps the OLD page rendered
  const frozenLocation = useRef(location).current;
  return (
    <motion.div
      initial={{ opacity: 0, pointerEvents: 'none' }}
      animate={{ opacity: 1, pointerEvents: 'auto' }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      transition={{ duration: 0.15 }}
    >
      <Routes location={frozenLocation}>
        <Route path="/" element={<Home />} />
        <Route path="/clean" element={<CleanFolder />} />
        <Route path="/duplicates" element={<Duplicates />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
      <AnimatePresence>
        <FrozenRoutes key={location.pathname} location={location} />
      </AnimatePresence>
    </div>
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
