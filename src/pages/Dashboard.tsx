import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, where, getDocs, addDoc, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { PatientCase, UserProfile } from "../types";
import { Plus, Clock, ChevronRight, Activity, AlertCircle, Lock, Unlock, Trophy, Calendar, BookOpen, Flame, Brain } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { geminiService } from "../services/gemini";
import curriculumData from "../data/curriculum.json";
import { motion, AnimatePresence } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
} as const;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
} as const;

export default function Dashboard() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<React.ReactNode>(null);
  const [medicalTerm, setMedicalTerm] = useState<{ term: string; definition: string } | null>(null);
  const [isGeneratingTerm, setIsGeneratingTerm] = useState(false);
  const [showTermDefinition, setShowTermDefinition] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchMedicalTerm();
  }, []);

  const fetchMedicalTerm = async (force = false) => {
    // Check cache first
    const cached = localStorage.getItem("medical_term_cache");
    if (cached && !force) {
      const { term, timestamp } = JSON.parse(cached);
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp < oneDay) {
        setMedicalTerm(term);
        return;
      }
    }

    setIsGeneratingTerm(true);
    try {
      const term = await geminiService.generateMedicalTerm();
      setMedicalTerm(term);
      localStorage.setItem("medical_term_cache", JSON.stringify({
        term,
        timestamp: Date.now()
      }));
    } catch (err) {
      // Error is already handled/silenced in geminiService fallback
    } finally {
      setIsGeneratingTerm(false);
    }
  };

  const fetchData = async () => {
    if (!auth.currentUser) return;
    try {
      // Fetch User Profile
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
      }

      // Fetch Cases
      const q = query(
        collection(db, "cases"),
        where("studentId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const casesData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as PatientCase))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCases(casesData);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      if (err.message?.includes("requires an index")) {
        const urlMatch = err.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
        setError(
          <div className="flex flex-col gap-2">
            <p>This view requires a database index to be created.</p>
            {urlMatch && (
              <a 
                href={urlMatch[0]} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 underline font-bold"
              >
                Click here to create the index in Firebase Console
              </a>
            )}
          </div>
        );
      } else {
        handleFirestoreError(err, OperationType.LIST, "cases");
      }
    } finally {
      setLoading(false);
    }
  };

  const startCurriculumCase = async (level: number, disease: string) => {
    if (!auth.currentUser || !userProfile) return;
    if (level > (userProfile.unlockedLevel || 1)) return;

    setIsStarting(true);
    setError(null);
    try {
      const caseData = await geminiService.generateCase(disease);
      
      const docRef = await addDoc(collection(db, "cases"), {
        ...caseData,
        diseaseId: disease,
        studentId: auth.currentUser.uid,
        status: "active",
        type: "curriculum",
        level,
        chatLimit: 10 + (level * 2), // Increasing difficulty
        chatCount: 0,
        createdAt: new Date().toISOString()
      });
      
      navigate(`/simulation/${docRef.id}`);
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        setError("The AI service is currently busy. Please wait a moment and try again.");
      } else {
        setError(err.message || "Failed to start simulation.");
      }
      setIsStarting(false);
    }
  };

  const startDailyChallenge = async () => {
    if (!auth.currentUser) return;
    setIsStarting(true);
    setError(null);
    try {
      // Check if daily challenge already exists for today
      const today = format(new Date(), "yyyy-MM-dd");
      const q = query(
        collection(db, "cases"),
        where("studentId", "==", auth.currentUser.uid),
        where("type", "==", "daily")
      );
      const snap = await getDocs(q);
      
      const todayChallenge = snap.docs.find(doc => doc.data().createdAt >= today);
      
      if (todayChallenge) {
        navigate(`/simulation/${todayChallenge.id}`);
        return;
      }

      const randomDisease = curriculumData[Math.floor(Math.random() * curriculumData.length)].disease;
      const caseData = await geminiService.generateCase(randomDisease);
      
      const docRef = await addDoc(collection(db, "cases"), {
        ...caseData,
        diseaseId: randomDisease,
        studentId: auth.currentUser.uid,
        status: "active",
        type: "daily",
        chatLimit: 15,
        chatCount: 0,
        createdAt: new Date().toISOString()
      });
      
      navigate(`/simulation/${docRef.id}`);
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        setError("The AI service is currently busy. Please wait a moment and try again.");
      } else {
        setError(err.message || "Failed to start daily challenge.");
      }
      setIsStarting(false);
    }
  };

  const unlockedLevel = userProfile?.unlockedLevel || 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading Dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="max-w-7xl mx-auto px-6 py-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Medical Simulation Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, Dr. {auth.currentUser?.displayName?.split(" ")[0]}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startDailyChallenge}
              disabled={isStarting}
              className="bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-100 disabled:opacity-50"
            >
              <Calendar className="w-5 h-5" />
              Daily Challenge
            </motion.button>
          </div>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-3 max-w-md"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-rose-700 text-sm font-medium leading-tight">{error}</div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Learning Path */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <Trophy className="w-5 h-5 text-indigo-600" />
              Curriculum Progression
            </div>
            <div className="text-sm font-medium text-slate-500">
              Level {unlockedLevel} / 50
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {curriculumData.slice(0, Math.min(unlockedLevel + 2, 50)).map((item) => {
              const isLocked = item.level > unlockedLevel;
              const isCompleted = item.level < unlockedLevel;

              return (
                <motion.div
                  key={item.level}
                  whileHover={!isLocked ? { y: -4, scale: 1.01 } : {}}
                  whileTap={!isLocked ? { scale: 0.98 } : {}}
                  onClick={() => !isLocked && startCurriculumCase(item.level, item.disease)}
                  className={`p-6 rounded-2xl border transition-all relative overflow-hidden group ${
                    isLocked 
                      ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed" 
                      : "bg-white border-slate-100 shadow-sm hover:shadow-md cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase tracking-widest ${isLocked ? 'text-slate-400' : 'text-indigo-600'}`}>
                      Level {item.level}
                    </span>
                    {isLocked ? <Lock className="w-4 h-4 text-slate-400" /> : isCompleted ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />}
                  </div>
                  <h3 className={`font-bold text-lg ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>{item.title}</h3>
                  <p className={`text-sm mt-1 line-clamp-2 ${isLocked ? 'text-slate-300' : 'text-slate-500'}`}>{item.description}</p>
                  
                  {!isLocked && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Start Simulation <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Sidebar: Recent Activity & Stats */}
        <div className="space-y-6">
          {/* Adaptive Learning Teaser */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4 }}
            onClick={() => navigate("/adaptive-learning")}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Brain className="w-24 h-24 text-indigo-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <Brain className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900">Adaptive Learning</h3>
              </div>
              <p className="text-slate-500 text-sm mb-4">Personalized practice based on your performance.</p>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                View Recommendations <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </motion.div>

          {/* Medical Term of the Day */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden relative group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Term of the Day
              </h3>
              <button 
                onClick={() => fetchMedicalTerm(true)}
                disabled={isGeneratingTerm}
                className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                title="Generate New Term"
              >
                <Plus className={`w-4 h-4 text-slate-400 ${isGeneratingTerm ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {medicalTerm ? (
              <div className="space-y-3">
                <button 
                  onClick={() => setShowTermDefinition(!showTermDefinition)}
                  className="w-full text-left p-4 bg-indigo-50 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all group/term"
                >
                  <div className="text-indigo-700 font-black text-lg tracking-tight group-hover/term:scale-[1.02] transition-transform">
                    {medicalTerm.term}
                  </div>
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                    Click to {showTermDefinition ? 'hide' : 'reveal'} definition
                  </div>
                </button>
                
                <AnimatePresence>
                  {showTermDefinition && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
                        <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                          {medicalTerm.definition}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </motion.div>

          {/* Knowledge Library Quick Access */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4 }}
            onClick={() => navigate("/library")}
            className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <BookOpen className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Knowledge Library</h3>
              <p className="text-indigo-100 text-sm mb-4">Explore diseases, drugs, and more.</p>
              <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1.5 rounded-lg">
                Open Library <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <div className="text-3xl font-bold mb-1 tracking-tight">{value}</div>
      <div className="text-slate-400 text-sm font-medium">{label}</div>
    </div>
  );
}
