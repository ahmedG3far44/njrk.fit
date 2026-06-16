import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Target } from 'lucide-react';

function getGoalDurationDays(user: any): number {
  if (!user?.goalDate) return 120;
  const start = user.createdAt ? new Date(user.createdAt) : new Date();
  const end = new Date(user.goalDate);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) || 120;
}

function getDaysElapsed(user: any): number {
  const start = user.createdAt ? new Date(user.createdAt) : new Date();
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function GoalProgressBar({ user }: { user: any }) {
  const { t } = useTranslation();
  const totalDays = getGoalDurationDays(user);
  const daysElapsed = getDaysElapsed(user);
  const progress = Math.min((daysElapsed / totalDays) * 100, 100);
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const isComplete = daysElapsed >= totalDays;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center">
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
              {t('goalProgress.title')}
            </h3>
          </div>
        </div>
        <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
          {isComplete
            ? t('goalProgress.goalAchieved')
            : t('goalProgress.daysRemaining', { days: daysRemaining })}
        </span>
      </div>

      <div className="h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] sm:text-xs text-slate-400">
          {t('goalProgress.daysElapsed', { days: daysElapsed })}
        </span>
        <span className="text-[10px] sm:text-xs font-semibold text-slate-500">
          {Math.round(progress)}% {t('goalProgress.ofDays', { total: totalDays })}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        {user?.createdAt && (
          <span className="text-[9px] sm:text-[10px] text-slate-400">
            {t('goalProgress.startDate', { date: formatDate(user.createdAt) })}
          </span>
        )}
        {user?.goalDate && (
          <span className="text-[9px] sm:text-[10px] text-slate-400">
            {t('goalProgress.targetDate', { date: formatDate(user.goalDate) })}
          </span>
        )}
      </div>
    </motion.div>
  );
}
