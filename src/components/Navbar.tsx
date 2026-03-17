import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Stethoscope, LayoutDashboard, BookOpen, BarChart3, LogOut, Brain, Bookmark, Trophy, User, Flame } from "lucide-react";
import { motion } from "motion/react";
import { UserProfile } from "../types";

export default function Navbar() {
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      }
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: "/adaptive-learning", label: "Adaptive Learning", icon: <Brain className="w-4 h-4" /> },
    { path: "/leaderboard", label: "Leaderboard", icon: <Trophy className="w-4 h-4" /> },
    { path: "/cognitive-training", label: "Cognitive Training", icon: <Brain className="w-4 h-4" /> },
    { path: "/library", label: "Library", icon: <BookOpen className="w-4 h-4" /> },
    { path: "/notes", label: "My Notes", icon: <Bookmark className="w-4 h-4" /> },
  ];

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 px-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-8">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-100"
          >
            <Stethoscope className="w-5 h-5 text-white" />
          </motion.div>
          <span className="font-bold text-xl tracking-tight group-hover:text-indigo-600 transition-colors">DiagnoSim</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 group ${
                location.pathname === item.path
                  ? "text-indigo-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="nav-active"
                  className="absolute inset-0 bg-slate-100 rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {profile && profile.streak > 0 && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100 text-orange-600"
          >
            <Flame className="w-4 h-4 fill-orange-500" />
            <span className="text-xs font-bold">{profile.streak}</span>
          </motion.div>
        )}
        <Link to="/profile">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 hover:bg-slate-100 transition-colors"
          >
            <img 
              src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName}`} 
              alt="Profile" 
              className="w-6 h-6 rounded-full ring-2 ring-white"
            />
            <span className="text-xs font-semibold text-slate-700">{auth.currentUser?.displayName?.split(" ")[0]}</span>
          </motion.div>
        </Link>
        <motion.button
          whileHover={{ scale: 1.1, color: "#e11d48" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => signOut(auth)}
          className="p-2 text-slate-400 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.nav>
  );
}
