import { motion } from "motion/react";
import { Stethoscope, HeartPulse, Brain, Activity, ShieldCheck, BookOpen, BarChart3, Flame, Trophy, User, Star, BadgeCheck, Sun, Moon } from "lucide-react";

export default function GamificationSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-indigo-900 via-indigo-700 to-slate-900 text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-48 h-48 bg-indigo-500 opacity-30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-emerald-400 opacity-20 rounded-full blur-3xl"></div>
      </div>
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <h2 className="text-4xl font-bold mb-8 text-center">
          Gamification & Progress
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
          <motion.div whileHover={{ scale: 1.05 }} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl flex flex-col items-center">
            <Flame className="w-10 h-10 text-orange-400 mb-2" />
            <span className="text-2xl font-bold">Streak: <span className="text-orange-300">12</span></span>
            <p className="text-sm mt-2 text-orange-100">Keep your daily streak alive!</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl flex flex-col items-center">
            <Star className="w-10 h-10 text-yellow-300 mb-2" />
            <span className="text-2xl font-bold">XP: <span className="text-yellow-200">2,450</span></span>
            <p className="text-sm mt-2 text-yellow-100">Earn XP for every diagnosis.</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl flex flex-col items-center">
            <BadgeCheck className="w-10 h-10 text-indigo-300 mb-2" />
            <span className="text-2xl font-bold">Level: <span className="text-indigo-200">7</span></span>
            <p className="text-sm mt-2 text-indigo-100">Level up your clinical skills.</p>
          </motion.div>
        </div>
        <div className="flex flex-wrap justify-center gap-6 mt-14">
          <motion.div whileHover={{ scale: 1.08 }} className="bg-white/10 rounded-xl p-6 shadow-lg flex items-center gap-4">
            <Trophy className="w-8 h-8 text-rose-300" />
            <div>
              <div className="font-bold text-lg">Badges</div>
              <div className="text-sm text-rose-100">Unlock achievements for milestones</div>
            </div>
          </motion.div>
          <motion.div whileHover={{ scale: 1.08 }} className="bg-white/10 rounded-xl p-6 shadow-lg flex items-center gap-4">
            <Activity className="w-8 h-8 text-emerald-300" />
            <div>
              <div className="font-bold text-lg">Daily Challenge</div>
              <div className="text-sm text-emerald-100">Solve a new case every day</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
