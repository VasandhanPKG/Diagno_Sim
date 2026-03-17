import { useState, useEffect, useMemo } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { UserProfile, StudentAttempt, PatientCase } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { format, subYears, eachDayOfInterval, isSameDay, startOfWeek, isToday, eachMonthOfInterval } from "date-fns";
import { 
  User, Mail, School, Hash, Trophy, Target, Brain, Zap, 
  MessageSquare, Flame, CheckCircle2, PlayCircle, Edit2, 
  Save, X, Camera, Award, Activity, ChevronRight, Calendar
} from "lucide-react";

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [recentCases, setRecentCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    institution: "",
    photoURL: ""
  });
  const [globalRank, setGlobalRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!auth.currentUser) return;
      setLoading(true);
      try {
        // Fetch User Profile
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          
          // Auto-generate studentId if missing
          if (!userData.studentId) {
            const newStudentId = `STU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
              studentId: newStudentId
            });
            userData.studentId = newStudentId;
          }
          
          setProfile(userData);
          setEditForm({
            name: userData.name,
            institution: userData.institution || "",
            photoURL: userData.photoURL || ""
          });
        }

        // Fetch User Attempts
        const attemptsSnap = await getDocs(
          query(collection(db, "attempts"), where("userId", "==", auth.currentUser.uid))
        );
        const attemptsData = attemptsSnap.docs
          .map(doc => doc.data() as StudentAttempt)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAttempts(attemptsData);

        // Fetch Recent Cases
        const casesSnap = await getDocs(
          query(
            collection(db, "cases"), 
            where("studentId", "==", auth.currentUser.uid)
          )
        );
        const casesData = casesSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as PatientCase))
          .filter(c => c.status === "completed")
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentCases(casesData);

        // Calculate Rank (Fetch all users and attempts to calculate global rank)
        const allUsersSnap = await getDocs(collection(db, "users"));
        const allUsers = allUsersSnap.docs.map(doc => doc.data() as UserProfile);
        const allAttemptsSnap = await getDocs(collection(db, "attempts"));
        const allAttempts = allAttemptsSnap.docs.map(doc => doc.data() as StudentAttempt);

        const leaderboard = allUsers.map(u => {
          const uAttempts = allAttempts.filter(a => a.userId === u.uid);
          const sims = uAttempts.length;
          const correct = uAttempts.filter(a => a.isCorrect).length;
          
          const avgAcc = sims > 0 ? uAttempts.reduce((s, a) => s + (a.metrics?.accuracy || 0), 0) / sims : 0;
          const avgReas = sims > 0 ? uAttempts.reduce((s, a) => s + (a.metrics?.reasoning || 0), 0) / sims : 0;
          const avgEff = sims > 0 ? uAttempts.reduce((s, a) => s + (a.metrics?.efficiency || 0), 0) / sims : 0;
          const avgComm = sims > 0 ? uAttempts.reduce((s, a) => s + (a.metrics?.communication || 0), 0) / sims : 0;

          const points = Math.round(
            (avgAcc * 1.0) + (avgReas * 0.6) + (avgEff * 0.4) + (avgComm * 0.4) + 
            (correct * 10) + (sims * 3) + (u.streak * 2)
          );

          return { uid: u.uid, points };
        }).sort((a, b) => b.points - a.points);

        const rank = leaderboard.findIndex(u => u.uid === auth.currentUser?.uid) + 1;
        setGlobalRank(rank > 0 ? rank : null);

      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser || !profile) return;
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        name: editForm.name,
        institution: editForm.institution,
        photoURL: editForm.photoURL
      });
      setProfile({
        ...profile,
        name: editForm.name,
        institution: editForm.institution,
        photoURL: editForm.photoURL
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const stats = useMemo(() => {
    const sims = attempts.length;
    const correct = attempts.filter(a => a.isCorrect).length;
    
    const avgAcc = sims > 0 ? attempts.reduce((s, a) => s + (a.metrics?.accuracy || 0), 0) / sims : 0;
    const avgReas = sims > 0 ? attempts.reduce((s, a) => s + (a.metrics?.reasoning || 0), 0) / sims : 0;
    const avgEff = sims > 0 ? attempts.reduce((s, a) => s + (a.metrics?.efficiency || 0), 0) / sims : 0;
    const avgComm = sims > 0 ? attempts.reduce((s, a) => s + (a.metrics?.communication || 0), 0) / sims : 0;

    const points = Math.round(
      (avgAcc * 1.0) + (avgReas * 0.6) + (avgEff * 0.4) + (avgComm * 0.4) + 
      (correct * 10) + (sims * 3) + (profile?.streak || 0) * 2
    );

    return {
      sims,
      correct,
      points,
      accuracy: Math.round(avgAcc),
      reasoning: Math.round(avgReas),
      efficiency: Math.round(avgEff),
      communication: Math.round(avgComm)
    };
  }, [attempts, profile]);

  const achievements = [
    { id: 'first_diag', title: 'First Diagnosis', icon: <Target className="w-5 h-5" />, unlocked: stats.sims > 0 },
    { id: 'streak_5', title: '5 Day Streak', icon: <Flame className="w-5 h-5" />, unlocked: (profile?.streak || 0) >= 5 },
    { id: 'correct_10', title: '10 Correct Diagnoses', icon: <CheckCircle2 className="w-5 h-5" />, unlocked: stats.correct >= 10 },
    { id: 'acc_master', title: 'Accuracy Master', icon: <Award className="w-5 h-5" />, unlocked: stats.accuracy >= 90 && stats.sims >= 5 },
    { id: 'top_rank', title: 'Top Leaderboard Rank', icon: <Trophy className="w-5 h-5" />, unlocked: globalRank !== null && globalRank <= 10 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <div className="relative group">
            <img 
              src={profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`} 
              alt={profile.name} 
              className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-black text-slate-900">{profile.name}</h1>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600"
              >
                {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <School className="w-4 h-4" />
                <span>{profile.institution || "No Institution Set"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">{profile.studentId}</span>
              </div>
            </div>
          </div>
        </div>
        
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl w-full md:w-96 space-y-4"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
              <input 
                type="text" 
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institution</label>
              <input 
                type="text" 
                value={editForm.institution}
                onChange={(e) => setEditForm({...editForm, institution: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Photo URL</label>
              <input 
                type="text" 
                value={editForm.photoURL}
                onChange={(e) => setEditForm({...editForm, photoURL: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button 
              onClick={handleSave}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard icon={<PlayCircle className="text-indigo-600" />} label="Simulations" value={stats.sims} />
        <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="Correct" value={stats.correct} />
        <StatCard icon={<Flame className="text-orange-600" />} label="Streak" value={`${profile.streak}d`} />
        <StatCard icon={<Trophy className="text-amber-600" />} label="Total Points" value={stats.points} />
        <StatCard icon={<Award className="text-rose-600" />} label="Rank" value={globalRank ? `#${globalRank}` : "N/A"} />
      </div>

      {/* Activity Tracker Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Activity Tracker
            </h2>
            <p className="text-slate-500 text-sm font-medium">Your diagnostic simulation activity over the past year</p>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Submissions</span>
              <span className="text-lg font-black text-slate-900">{attempts.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Days</span>
              <span className="text-lg font-black text-slate-900">{new Set(attempts.map(a => format(new Date(a.timestamp), 'yyyy-MM-dd'))).size}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Streak</span>
              <span className="text-lg font-black text-slate-900">{profile.streak} days</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="inline-grid grid-flow-col grid-rows-7 gap-1.5 min-w-max">
            {(() => {
              const now = new Date();
              const startDate = startOfWeek(subYears(now, 1));
              const days = eachDayOfInterval({ start: startDate, end: now });
              
              return days.map(day => {
                const dayAttempts = attempts.filter(a => isSameDay(new Date(a.timestamp), day));
                const count = dayAttempts.length;
                
                // Color logic based on activity count (shades of green)
                let bgColor = 'bg-slate-100'; // No activity (light gray)
                if (count > 0 && count <= 2) bgColor = 'bg-emerald-200'; // Low activity (light green)
                else if (count > 2 && count <= 5) bgColor = 'bg-emerald-400'; // Medium activity (green)
                else if (count > 5) bgColor = 'bg-emerald-600'; // High activity (dark green)

                return (
                  <motion.div 
                    key={day.toString()} 
                    whileHover={{ scale: 1.3, zIndex: 10 }}
                    className={`w-3.5 h-3.5 rounded-[3px] cursor-pointer transition-colors ${bgColor} ${isToday(day) ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                    title={`${format(day, 'MMM d, yyyy')}: ${count} submissions`}
                  />
                );
              });
            })()}
          </div>
          
          {/* Month Labels */}
          <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            {(() => {
              const now = new Date();
              const startDate = subYears(now, 1);
              const months = eachMonthOfInterval({ start: startDate, end: now });
              return months.map(month => (
                <span key={month.toString()}>{format(month, 'MMM')}</span>
              ));
            })()}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-[2px] bg-slate-100"></div>
            <div className="w-3 h-3 rounded-[2px] bg-emerald-200"></div>
            <div className="w-3 h-3 rounded-[2px] bg-emerald-400"></div>
            <div className="w-3 h-3 rounded-[2px] bg-emerald-600"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Competency Breakdown */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Brain className="w-6 h-6 text-indigo-600" />
              Competency Breakdown
            </h2>
            <div className="space-y-8">
              <ProgressBar label="Diagnostic Accuracy" value={stats.accuracy} color="bg-emerald-500" />
              <ProgressBar label="Clinical Reasoning" value={stats.reasoning} color="bg-indigo-500" />
              <ProgressBar label="Diagnostic Efficiency" value={stats.efficiency} color="bg-amber-500" />
              <ProgressBar label="Communication" value={stats.communication} color="bg-rose-500" />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Activity className="w-6 h-6 text-indigo-600" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentCases.length > 0 ? (
                recentCases.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        {c.patientName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{c.patientName}</div>
                        <div className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        c.severity === 'severe' ? 'bg-rose-50 text-rose-600' : 
                        c.severity === 'moderate' ? 'bg-amber-50 text-amber-600' : 
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {c.severity}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 font-medium">
                  No recent activity found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Achievements */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-500" />
              Achievements
            </h2>
            <div className="space-y-6">
              {achievements.map((ach) => (
                <div key={ach.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  ach.unlocked ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100 opacity-50 grayscale'
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    ach.unlocked ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {ach.icon}
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${ach.unlocked ? 'text-slate-900' : 'text-slate-500'}`}>{ach.title}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {ach.unlocked ? 'Unlocked' : 'Locked'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2">
      <div className="text-2xl">{icon}</div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className="text-lg font-black text-slate-900">{value}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
