import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed, Dumbbell } from 'lucide-react'
import NjerkaLogo from '../components/NjerkaLogo'

const NotFoundPage = () => {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-20 right-20 w-72 h-72 bg-green-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative text-center max-w-md"
      >
        <div className="flex justify-center mb-10">
          <NjerkaLogo size="medium" text />
        </div>

        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mb-8"
        >
          <span className="text-[10rem] leading-none font-bold text-slate-900 tracking-tight select-none">
            404
          </span>
        </motion.div>

        <p className="text-lg text-slate-600 mb-2 leading-relaxed">
          Somewhere between meals and workouts, this page got lost.
        </p>

        <p className="text-sm text-slate-400 mb-10">
          Let's get you back on track.
        </p>

        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="bg-gradient-to-r from-green-800 to-green-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-green-200/60 transition-all relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            Back Home
          </motion.button>
        </Link>

        <div className="flex items-center justify-center gap-2 mt-12 text-slate-300">
          <UtensilsCrossed className="w-4 h-4" />
          <span className="text-xs font-medium">Njerka</span>
          <Dumbbell className="w-4 h-4" />
        </div>
      </motion.div>
    </div>
  )
}

export default NotFoundPage
