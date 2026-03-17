import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, where, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
import { UserProfile, PatientCase } from "../types";
import { adaptiveLearningService, PerformanceAnalysis, Recommendation } from "../services/adaptiveLearningService";
import { geminiService } from "../services/gemini";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  ChevronRight, 
  Activity, 
  MessageSquare, 
  FlaskConical, 
  ClipboardCheck,
  Award,
  BarChart3,
  Calendar,
  Flame,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import curriculumData from "../data/curriculum.json";

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

export default function AdaptiveLearning() {
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    try {
      // Fetch User Profile
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const profile = { uid: userSnap.id, ...userSnap.data() } as UserProfile;
        setUserProfile(profile);
        
        // Analyze performance
        const result = await adaptiveLearningService.analyzePerformance(auth.currentUser.uid);
        setAnalysis({ ...result, streak: profile.streak || 0 });
      }
    } catch (err: any) {
      console.error("Error fetching adaptive learning data:", err);
      handleFirestoreError(err, OperationType.LIST, "attempts");
    } finally {
      setLoading(false);
    }
  };

  const startPractice = async (disease: string) => {
    if (!auth.currentUser || !userProfile) return;
    setIsStarting(true);
    setError(null);
    try {
      const caseData = await geminiService.generateCase(disease);
      
      const docRef = await addDoc(collection(db, "cases"), {
        ...caseData,
        diseaseId: disease,
        studentId: auth.currentUser.uid,
        status: "active",
        type: "daily", // Using daily type for practice
        chatLimit: 15,
        chatCount: 0,
        createdAt: new Date().toISOString()
      });
      
      navigate(`/simulation/${docRef.id}`);
    } catch (err: any) {
      console.error("Failed to start adaptive practice:", err);
      setError(err.message || "Failed to start simulation. Please try again.");
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Analyzing your performance...</p>
        </motion.div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-6 py-8 pb-20"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
              <Brain className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Adaptive Learning</h1>
          </div>
          <p className="text-slate-500 font-medium">Personalized recommendations based on your clinical performance.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Streak</span>
              <span className="text-xl font-black text-slate-900">{analysis.streak} Days</span>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
              <Flame className="w-6 h-6" />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Performance Overview */}
        <div className="lg:col-span-8 space-y-8">
          {/* Competency Radar Teaser / Stats */}
          <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Core Competency Metrics
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <MetricCard 
                label="Accuracy" 
                value={analysis.overallAccuracy} 
                icon={<Target className="w-5 h-5 text-emerald-500" />} 
                color="emerald"
              />
              <MetricCard 
                label="Reasoning" 
                value={analysis.overallReasoning} 
                icon={<Brain className="w-5 h-5 text-indigo-500" />} 
                color="indigo"
              />
              <MetricCard 
                label="Efficiency" 
                value={analysis.overallEfficiency} 
                icon={<Activity className="w-5 h-5 text-amber-500" />} 
                color="amber"
              />
              <MetricCard 
                label="Communication" 
                value={analysis.overallCommunication} 
                icon={<MessageSquare className="w-5 h-5 text-rose-500" />} 
                color="rose"
              />
            </div>
          </motion.div>

          {/* Recommendations Section */}
          <div className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <Award className="w-6 h-6 text-indigo-600" />
                Smart Recommendations
              </h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Based on {analysis.totalSimulations} Simulations
              </span>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.weakAreas.length > 0 ? (
                analysis.weakAreas.map((area, idx) => (
                  <RecommendationCard 
                    key={idx} 
                    recommendation={area} 
                    onStart={() => {
                      // If it's a category, we pick a disease from it
                      // If it's a skill, we pick a random recommended disease
                      const disease = analysis.recommendedDiseases[0];
                      if (disease) startPractice(disease);
                    }}
                    isStarting={isStarting}
                  />
                ))
              ) : (
                <div className="col-span-2 bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-emerald-900 mb-2">Excellent Performance!</h3>
                  <p className="text-emerald-700 font-medium">You're showing strong clinical skills across all areas. Keep practicing to maintain your proficiency.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Recommended Simulations */}
        <div className="lg:col-span-4 space-y-8">
          <motion.div variants={itemVariants} className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <TrendingUp className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-400" />
                Recommended Simulations
              </h3>
              
              <div className="space-y-4">
                {analysis.recommendedDiseases.map((diseaseName, idx) => {
                  const diseaseInfo = curriculumData.find(c => c.disease === diseaseName);
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.1)" }}
                      onClick={() => !isStarting && startPractice(diseaseName)}
                      disabled={isStarting}
                      className="w-full text-left p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                          {diseaseInfo ? `Level ${diseaseInfo.level}` : 'Practice'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                      </div>
                      <h4 className="font-bold text-lg">{diseaseName}</h4>
                      <p className="text-xs text-white/50 mt-1 line-clamp-1">
                        {diseaseInfo?.description || "Targeted practice for clinical improvement."}
                      </p>
                    </motion.button>
                  );
                })}
              </div>

              {error && (
                <div className="mt-6 p-4 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-rose-100 text-xs font-medium leading-tight">{error}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Progress Tracking */}
          <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Improvement Tracking
            </h3>
            
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Progress</div>
                    <div className="text-2xl font-black text-slate-900">
                      {Math.round((analysis.overallAccuracy + analysis.overallReasoning + analysis.overallEfficiency + analysis.overallCommunication) / 4 * 10)}%
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +12%
                  </div>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(analysis.overallAccuracy + analysis.overallReasoning + analysis.overallEfficiency + analysis.overallCommunication) / 4 * 10}%` }}
                    className="h-full bg-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Gains</h4>
                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                  <span className="text-xs font-bold text-slate-600">Diagnostic Accuracy</span>
                  <span className="text-xs font-black text-emerald-600">↑ 8%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                  <span className="text-xs font-bold text-slate-600">Clinical Reasoning</span>
                  <span className="text-xs font-black text-emerald-600">↑ 15%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-50",
    indigo: "text-indigo-600 bg-indigo-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50"
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-black text-slate-900 mb-1">{value.toFixed(1)}</div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="w-full h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(value / 10) * 100}%` }}
          className={`h-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'indigo' ? 'bg-indigo-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}
        />
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation, onStart, isStarting }: { recommendation: Recommendation, onStart: () => void, isStarting: boolean }) {
  const isHigh = recommendation.priority === 'high';
  
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between ${
        isHigh 
          ? "bg-rose-50 border-rose-100 shadow-lg shadow-rose-100/50" 
          : "bg-white border-slate-100 shadow-sm"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
            isHigh ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {recommendation.priority} Priority
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {recommendation.type}
          </div>
        </div>
        
        <h3 className="text-xl font-black text-slate-900 mb-2">{recommendation.name}</h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
          {recommendation.reason}
        </p>
      </div>

      <button
        onClick={onStart}
        disabled={isStarting}
        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
          isHigh 
            ? "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200" 
            : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200"
        } disabled:opacity-50`}
      >
        {isStarting ? "Initializing..." : "Start Practice"}
        <Play className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
