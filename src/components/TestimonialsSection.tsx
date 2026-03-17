import { motion } from "motion/react";

const testimonials = [
  {
    name: "Priya S.",
    role: "Medical Student",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    text: "DiagnoSim made clinical reasoning fun and engaging. The AI patients feel real and the feedback is instant!"
  },
  {
    name: "Dr. Rahul K.",
    role: "Doctor",
    avatar: "https://randomuser.me/api/portraits/men/44.jpg",
    text: "I recommend DiagnoSim to my interns. The gamified approach helps build diagnostic skills quickly."
  },
  {
    name: "Ananya M.",
    role: "Intern",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    text: "The daily challenges and streaks keep me motivated. Love the curriculum mode and leaderboard!"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-indigo-50 via-white to-slate-100">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          What Our Users Say
        </h2>
        <div className="flex flex-col md:flex-row gap-10 justify-center items-center">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 flex flex-col items-center hover:shadow-indigo-200 hover:-translate-y-2 transition-all w-80"
            >
              <img src={t.avatar} alt={t.name} className="w-16 h-16 rounded-full mb-4 shadow-lg" />
              <div className="text-lg font-bold mb-1 text-indigo-700">{t.name}</div>
              <div className="text-xs text-slate-500 mb-2">{t.role}</div>
              <div className="text-slate-600 text-sm">"{t.text}"</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
