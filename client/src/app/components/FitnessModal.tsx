import { memo } from "react";
import { motion } from "motion/react";
import {
  Target,
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { PROGRAM_SPLIT_OPTIONS } from "./FitnessProgramOptions";
import { Button } from './ui/button';

interface FitnessModalProps {
  onClose: () => void;
  trainingDays: number;
  setTrainingDays: (v: number) => void;
  duration: number;
  setDuration: (v: number) => void;
  trainingProgram: string;
  setTrainingProgram: (v: any) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

const FitnessModalInner = ({
  onClose,
  trainingDays,
  setTrainingDays,
  duration,
  setDuration,
  trainingProgram,
  setTrainingProgram,
  startDate,
  setStartDate,
  isGenerating,
  onGenerate,
}: FitnessModalProps) => {
  const { t } = useTranslation();

  return (
    <motion.div
      key="fitness-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed w-full h-full top-0 start-0 bg-black/60 z-50 flex items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white w-full h-full sm:max-w-md sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="bg-gradient-to-br from-green-900 to-green-700 p-4 sm:p-6 text-white text-center relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_70%)]" />
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 relative z-10 shadow-lg"
          >
            <Target className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </motion.div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 relative z-10">
            {t("fitness.generateTitle")}
          </h2>
          <p className="text-green-200 text-xs sm:text-sm relative z-10">
            {t("fitness.generateSubtitle")}
          </p>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-3 right-3 z-10 bg-white/10 hover:bg-white/20">
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Training Days */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">
              {t("fitness.trainingDays")}
            </label>
            <div className="flex items-center gap-3 sm:gap-4">
              <input
                type="range"
                min="1"
                max="7"
                value={trainingDays}
                onChange={(e) => setTrainingDays(Number(e.target.value))}
                className="flex-1 h-1.5 sm:h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <span className="text-base sm:text-lg font-bold text-green-700 w-6 sm:w-8 text-center">
                {trainingDays}
              </span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">
              {t("fitness.sessionDuration")}
            </label>
            <div className="flex items-center gap-3 sm:gap-4">
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1 h-1.5 sm:h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <span className="text-base sm:text-lg font-bold text-green-700 w-10 sm:w-12 text-center">
                {duration}
              </span>
            </div>
          </div>

          {/* Training Program Split */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">
              {t("fitness.trainingProgram")}
            </label>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {PROGRAM_SPLIT_OPTIONS(t).map((program) => (
                <Button
                  key={program.value}
                  variant={trainingProgram === program.value ? 'primary' : 'ghost'}
                  size="sm"
                  className={`w-full text-start justify-start flex-col items-start gap-0.5 sm:gap-1 h-auto py-2.5 sm:py-3 border ${trainingProgram === program.value ? 'border-green-500' : 'border-slate-200'}`}
                  onClick={() => setTrainingProgram(program.value as any)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs sm:text-sm">
                      {program.label}
                    </span>
                    {trainingProgram === program.value && (
                      <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-500 leading-normal sm:leading-snug">
                    {program.desc}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">
              {t("fitness.startDate")}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none text-xs sm:text-sm"
            />
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-slate-100 flex-shrink-0">
            <Button variant="secondary" size="default" className="flex-1" onClick={onClose}>
              {t("fitness.cancel")}
            </Button>
            <Button variant="primary" size="default" className="flex-1" loading={isGenerating} onClick={onGenerate}>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t("fitness.generatePlan")}
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FitnessModal = memo(FitnessModalInner);
export default FitnessModal;
