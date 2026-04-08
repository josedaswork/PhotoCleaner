import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageNotFound() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <p className="text-6xl font-bold text-muted-foreground/30 mb-4">404</p>
      <p className="text-muted-foreground mb-8">Page not found</p>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-primary font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Go home
      </button>
    </motion.div>
  );
}
