import { motion } from "motion/react";
import { Stethoscope, BookOpen, BarChart3, HeartPulse, Brain } from "lucide-react";

const screenshots = [
  {
    title: "Patient Simulation",
    img: "/mock-patient.png",
    desc: "Interact with AI virtual patients and diagnose real-world cases."
  },
  {
    title: "Knowledge Library",
    img: "/mock-library.png",
    desc: "Explore a comprehensive database of diseases, drugs, and clinical pearls."
  },
  {
    title: "Dashboard",
    img: "/mock-dashboard.png",
    desc: "Track your progress, streaks, and XP with a modern dashboard."
  },
  {
    title: "Report Page",
    img: "/mock-report.png",
    desc: "Get detailed feedback and performance insights after each diagnosis."
  }
];

export default function ScreenshotSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-100 via-indigo-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          Preview DiagnoSim in Action
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {screenshots.map((shot, idx) => (
            <motion.div
              key={shot.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-100 flex flex-col items-center hover:shadow-indigo-200 hover:-translate-y-2 transition-all"
            >
              <div className="mb-4 w-64 h-40 bg-gradient-to-br from-indigo-100 via-slate-50 to-white rounded-xl flex items-center justify-center shadow-inner">
                {/* Replace with real screenshots */}
                <span className="text-slate-400 text-lg">[Mock Screenshot]</span>
              </div>
              <div className="text-xl font-bold mb-2 text-indigo-700">{shot.title}</div>
              <div className="text-slate-500 text-sm mb-2">{shot.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
