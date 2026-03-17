import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { Stethoscope, HeartPulse, Brain, Activity, ShieldCheck, BookOpen, BarChart3, Flame, Trophy, Star, BadgeCheck, Sun, Moon } from "lucide-react";
import Navbar from "../components/Navbar";
import FeaturesSection from "../components/FeaturesSection";
import GamificationSection from "../components/GamificationSection";
import HowItWorksSection from "../components/HowItWorksSection";
import ScreenshotSection from "../components/ScreenshotSection";
import TestimonialsSection from "../components/TestimonialsSection";
import Footer from "../components/Footer";

export default function Landing() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: "student",
          unlockedLevel: 1,
          streak: 0,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 dark:from-slate-900 dark:via-indigo-900 dark:to-slate-900 transition-colors duration-500">
      <Navbar />
      {/* Hero Section */}
      <section className="relative pt-32 pb-36 flex flex-col items-center px-4 overflow-hidden">
        {/* Gradient and blur shapes */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-500 opacity-30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-400 opacity-20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-200 opacity-10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        {/* Animated medical icons */}
        <motion.div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-12 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
            <Stethoscope className="w-12 h-12 text-indigo-600 drop-shadow-lg" />
          </motion.div>
          <motion.div animate={{ y: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <HeartPulse className="w-12 h-12 text-rose-500 drop-shadow-lg" />
          </motion.div>
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
            <Brain className="w-12 h-12 text-emerald-500 drop-shadow-lg" />
          </motion.div>
          <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}>
            <Activity className="w-12 h-12 text-yellow-500 drop-shadow-lg" />
          </motion.div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl z-20 mt-32"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Diagno<span className="text-indigo-600 dark:text-indigo-400 animate-gradient">Sim</span>
          </h1>
          <p className="text-2xl text-slate-700 dark:text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            <span className="bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500 bg-clip-text text-transparent font-bold">AI-powered clinical diagnosis simulation</span> for medical students and doctors.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
            <button
              onClick={handleLogin}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl shadow-indigo-200 transition-all focus:ring-2 focus:ring-indigo-400 ripple"
            >
              Get Started with Google
            </button>
            <a href="#demo" className="bg-white/80 hover:bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-xl shadow-indigo-100 transition-all border border-indigo-200 focus:ring-2 focus:ring-indigo-400 ripple">
              Watch Demo
            </a>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-300 mt-2">
            <span className="bg-white/60 px-3 py-1 rounded-full shadow">Used by medical students and doctors</span>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Gamification Section */}
      <GamificationSection />

      {/* Screenshot/Preview Section */}
      <ScreenshotSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// ...existing code...
