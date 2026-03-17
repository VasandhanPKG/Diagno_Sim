import { motion } from "motion/react";
import { Stethoscope, Activity, ShieldCheck, BookOpen, BarChart3, Flame, Star, Trophy, Brain } from "lucide-react";

const features = [
  {
    icon: <Activity className="w-8 h-8 text-indigo-500" />,
    title: "AI Virtual Patients",
    desc: "Realistic patient simulations with dynamic symptom progression and natural language interaction."
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
    title: "Clinical Accuracy Engine",
    desc: "Built on medical logic and probabilistic models to ensure realistic lab results and vitals."
  },
  {
    icon: <BookOpen className="w-8 h-8 text-amber-500" />,
    title: "Knowledge Library",
    desc: "Access a comprehensive database of diseases, drugs, and clinical case studies."
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-rose-500" />,
    title: "Performance Insights",
    desc: "Detailed feedback on your diagnostic accuracy, speed, and clinical reasoning skills."
  },
  {
    icon: <Flame className="w-8 h-8 text-orange-500" />,
    title: "Daily Challenge & Streak",
    desc: "Solve new cases daily and keep your streak alive."
  },
  {
    icon: <Brain className="w-8 h-8 text-indigo-400" />,
    title: "Curriculum Mode",
    desc: "Structured learning path to master clinical diagnosis."
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-white via-indigo-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px 8px #6366f1" }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8 flex flex-col items-center hover:shadow-indigo-200 transition-all group"
            >
              <div className="mb-4 bg-gradient-to-br from-indigo-100 via-white to-slate-50 p-4 rounded-xl shadow-inner group-hover:shadow-indigo-200">
                {feature.icon}
              </div>
              <div className="text-xl font-bold mb-2 text-indigo-700">{feature.title}</div>
              <div className="text-slate-500 text-sm mb-2">{feature.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
