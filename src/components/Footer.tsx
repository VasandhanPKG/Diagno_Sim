import { motion } from "motion/react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-indigo-900 via-indigo-700 to-slate-900 text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-2">
          <span className="font-bold text-xl">DiagnoSim</span>
          <span className="text-sm text-indigo-200">Version 1.0.0</span>
          <span className="text-xs text-slate-300">© 2026 DiagnoSim. For educational purposes only.</span>
        </div>
        <div className="flex flex-col md:flex-row gap-6 text-sm">
          <a href="#about" className="hover:text-indigo-300 transition">About</a>
          <a href="#contact" className="hover:text-indigo-300 transition">Contact</a>
          <a href="#privacy" className="hover:text-indigo-300 transition">Privacy</a>
          <a href="#terms" className="hover:text-indigo-300 transition">Terms</a>
          <a href="https://github.com/vasan/DiagnoSim" target="_blank" rel="noopener" className="hover:text-indigo-300 transition">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
