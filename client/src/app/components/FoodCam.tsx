import React, { useState } from 'react';
import { Camera, X, Check, Loader2, ScanLine, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FoodCamProps {
  onClose: () => void;
  onScan: (result: any) => void;
}

export const FoodCam: React.FC<FoodCamProps> = ({ onClose, onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [captured, setCaptured] = useState(false);

  const handleCapture = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setCaptured(true);
      // Mock result
      onScan({
        food: 'Avocado Toast with Egg',
        calories: 380,
        confidence: 0.98
      });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <button onClick={onClose}>
          <X className="w-8 h-8" />
        </button>
        <span className="font-semibold">AI Food Scanner</span>
        <div className="w-8" />
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative bg-slate-900 overflow-hidden">
        {/* Mock Camera Feed Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent">
          {/* In a real app this would be the video stream */}
          <div className="w-full h-full flex items-center justify-center text-slate-700">
            <span className="text-sm">Camera Stream Active</span>
          </div>
        </div>
        
        {/* Scanner Overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-full aspect-square max-w-sm border-2 border-white/50 rounded-3xl relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
            
            {scanning && (
              <motion.div 
                initial={{ top: 0 }}
                animate={{ top: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.5)]"
              />
            )}
          </div>
        </div>

        {/* Hints */}
        <div className="absolute bottom-8 left-0 right-0 text-center text-white/80 text-sm bg-black/40 py-2">
          Center food in frame for AI detection
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black p-8 pb-12 flex items-center justify-center relative">
        <button 
          onClick={handleCapture}
          disabled={scanning}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group"
        >
          <div className={`w-16 h-16 rounded-full bg-white transition-all duration-200 ${scanning ? 'scale-90 opacity-50' : 'group-active:scale-95'}`} />
        </button>
      </div>

      {/* Result Modal Overlay (Mock) */}
      <AnimatePresence>
        {captured && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-10"
          >
            {/* Streak Feedback */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 animate-bounce">
              <Flame className="w-4 h-4 fill-current" /> Streak Saved!
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="bg-green-100 p-3 rounded-xl">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Avocado Toast with Egg</h3>
                <p className="text-slate-500">Confidence: 98%</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Calories', val: '380' },
                { label: 'Protein', val: '12g' },
                { label: 'Carbs', val: '45g' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 p-3 rounded-xl text-center">
                  <div className="text-lg font-bold text-slate-900">{item.val}</div>
                  <div className="text-xs text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setCaptured(false); onClose(); }} className="flex-1 bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition-colors">
                Log Meal
              </button>
              <button onClick={() => setCaptured(false)} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold">
                Retake
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden usage to prevent unused variable warning if I removed them */}
      <div className="hidden">
        <Camera /> <ScanLine /> <Loader2 />
      </div>
    </div>
  );
};