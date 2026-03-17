import { motion } from "motion/react";
import { Stethoscope, HeartPulse, Brain, Activity, ShieldCheck, BookOpen, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: <Stethoscope className="w-8 h-8 text-indigo-500" />,
    title: "Choose Case",
    desc: "Select a patient scenario from our AI-driven library."
  },
  {
    icon: <HeartPulse className="w-8 h-8 text-rose-500" />,
    title: "Diagnose Patient",
    desc: "Analyze symptoms, labs, and history to make your diagnosis."
  },
  {
    icon: <Brain className="w-8 h-8 text-emerald-500" />,
    title: "Get AI Feedback",
    desc: "Receive instant feedback and clinical reasoning tips."
  },
  {
    icon: <Activity className="w-8 h-8 text-yellow-500" />,
    title: "Improve Skills",
    desc: "Track progress, learn, and master clinical diagnosis."
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-slate-50 via-indigo-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          How DiagnoSim Works
        </h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-10">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="flex flex-col items-center bg-white rounded-2xl shadow-xl p-8 mx-2 w-64 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all"
            >
              <div className="mb-4">{step.icon}</div>
              <div className="text-xl font-semibold mb-2 text-indigo-700">Step {idx + 1}</div>
              <div className="text-lg font-bold mb-2">{step.title}</div>
              <div className="text-slate-500 text-sm">{step.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
