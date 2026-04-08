import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { themeStore } from '@/lib/themeStore';
import PageTransition from '@/components/PageTransition';

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(themeStore.get());
  const presets = themeStore.getPresets();

  useEffect(() => {
    return themeStore.subscribe(() => setSettings(themeStore.get()));
  }, []);

  const hueToTailwind = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500',
  };

  return (
    <PageTransition className="min-h-screen flex flex-col bg-background safe-top safe-bottom">
      <header className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-border/50">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate('/')}
          className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <p className="text-sm font-semibold">Settings</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* Appearance */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Sun className="w-3.5 h-3.5" />
            Appearance
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {['light', 'dark'].map((mode) => (
              <motion.button
                key={mode}
                whileTap={{ scale: 0.97 }}
                onClick={() => themeStore.setMode(mode)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  settings.mode === mode
                    ? 'border-primary bg-accent'
                    : 'border-border bg-card'
                }`}
              >
                {mode === 'light' ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-400" />
                )}
                <span className="text-sm font-medium capitalize">{mode}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Color Palette */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Palette className="w-3.5 h-3.5" />
            Accent color
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(presets).map(([key, preset]) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => themeStore.setColor(key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  settings.color === key
                    ? 'border-primary bg-accent'
                    : 'border-border bg-card'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${hueToTailwind[key] || 'bg-gray-500'} shadow-sm`} />
                <span className="text-xs font-medium">{preset.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Preview */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Preview
          </h3>
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <div className="h-3 w-3/4 bg-primary/20 rounded-full" />
            <div className="h-3 w-1/2 bg-muted rounded-full" />
            <div className="flex gap-2 mt-4">
              <div className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium">
                Primary
              </div>
              <div className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-medium">
                Secondary
              </div>
              <div className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-xs font-medium">
                Delete
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
