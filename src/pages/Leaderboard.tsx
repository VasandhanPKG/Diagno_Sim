import { useState, useEffect, useMemo } from "react";
import { db, auth } from "../firebase";
import { collection, query, getDocs, orderBy, where, Timestamp } from "firebase/firestore";
import { StudentAttempt, UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, Medal, Target, Brain, Zap, MessageSquare, 
  Flame, CheckCircle2, PlayCircle, Filter, ChevronUp, 
  ChevronDown, Minus, Search, User as UserIcon,
  Calendar, Globe, TrendingUp
} from "lucide-react";
import { startOfWeek, startOfMonth, subDays, parseISO, isAfter } from "date-fns";

interface LeaderboardEntry {
  userId: string;
  name: string;
  photoURL: string;
  accuracy: number;
  reasoning: number;
  efficiency: number;
  communication: number;
  simulationsCompleted: number;
  correctDiagnoses: number;
  streak: number;
  totalPoints: number;
  rank: number;
  previousRank?: number;
}

export default function Leaderboard() {
  const [filter, setFilter] = useState<'global' | 'weekly' | 'monthly'>('global');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = usersSnap.docs.map(doc => doc.data() as UserProfile);
        setUsers(usersData);

        const attemptsSnap = await getDocs(collection(db, "attempts"));
        const attemptsData = attemptsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as StudentAttempt));
        setAttempts(attemptsData);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const leaderboardData = useMemo(() => {
    const now = new Date();
    let filteredAttempts = attempts;

    if (filter === 'weekly') {
      const weekStart = startOfWeek(now);
      filteredAttempts = attempts.filter(a => isAfter(parseISO(a.timestamp), weekStart));
    } else if (filter === 'monthly') {
      const monthStart = startOfMonth(now);
      filteredAttempts = attempts.filter(a => isAfter(parseISO(a.timestamp), monthStart));
    }

    const userStats = users.map(user => {
      const userAttempts = filteredAttempts.filter(a => a.userId === user.uid);
      const simulationsCompleted = userAttempts.length;
      const correctDiagnoses = userAttempts.filter(a => a.isCorrect).length;

      const avgAccuracy = simulationsCompleted > 0 
        ? userAttempts.reduce((sum, a) => sum + (a.metrics?.accuracy || 0), 0) / simulationsCompleted 
        : 0;
      const avgReasoning = simulationsCompleted > 0 
        ? userAttempts.reduce((sum, a) => sum + (a.metrics?.reasoning || 0), 0) / simulationsCompleted 
        : 0;
      const avgEfficiency = simulationsCompleted > 0 
        ? userAttempts.reduce((sum, a) => sum + (a.metrics?.efficiency || 0), 0) / simulationsCompleted 
        : 0;
      const avgCommunication = simulationsCompleted > 0 
        ? userAttempts.reduce((sum, a) => sum + (a.metrics?.communication || 0), 0) / simulationsCompleted 
        : 0;

      // Scoring Logic:
      // Accuracy (High weight: 1.0)
      // Reasoning (Med weight: 0.6)
      // Efficiency (Med weight: 0.4)
      // Communication (Med weight: 0.4)
      // Correct Diagnosis: +10 pts
      // Simulation Completed: +3 pts
      // Streak: +2 pts per day
      const totalPoints = Math.round(
        (avgAccuracy * 1.0) + 
        (avgReasoning * 0.6) + 
        (avgEfficiency * 0.4) + 
        (avgCommunication * 0.4) + 
        (correctDiagnoses * 10) + 
        (simulationsCompleted * 3) + 
        (user.streak * 2)
      );

      return {
        userId: user.uid,
        name: user.name,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
        accuracy: Math.round(avgAccuracy),
        reasoning: Math.round(avgReasoning),
        efficiency: Math.round(avgEfficiency),
        communication: Math.round(avgCommunication),
        simulationsCompleted,
        correctDiagnoses,
        streak: user.streak,
        totalPoints,
      };
    });

    // Sort by total points
    const sorted = userStats
      .filter(u => u.totalPoints > 0 || u.simulationsCompleted > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
        // Mocking previous rank for visual indicator
        previousRank: index + 1 + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)
      }));

    return sorted;
  }, [users, attempts, filter]);

  const filteredLeaderboard = leaderboardData.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUserRank = leaderboardData.find(u => u.userId === auth.currentUser?.uid);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <Trophy className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Leaderboard</h1>
          </div>
          <p className="text-slate-500 font-medium max-w-md">
            Ranking the top medical students based on diagnostic precision, clinical reasoning, and consistent practice.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none w-full sm:w-64 transition-all"
            />
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <FilterButton 
              active={filter === 'global'} 
              onClick={() => setFilter('global')} 
              icon={<Globe className="w-3.5 h-3.5" />}
              label="Global" 
            />
            <FilterButton 
              active={filter === 'weekly'} 
              onClick={() => setFilter('weekly')} 
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Weekly" 
            />
            <FilterButton 
              active={filter === 'monthly'} 
              onClick={() => setFilter('monthly')} 
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              label="Monthly" 
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Current User ONLY */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          {/* Current User Rank Card */}
          {currentUserRank && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={currentUserRank.photoURL} alt={currentUserRank.name} className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-lg" />
                    <div className="absolute -bottom-2 -right-2 bg-white text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md">
                      #{currentUserRank.rank}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">Your Performance</div>
                    <div className="text-xl font-bold truncate max-w-[150px]">{currentUserRank.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black">{currentUserRank.totalPoints}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Pts</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Accuracy" value={`${currentUserRank.accuracy}%`} />
                <StatCard label="Streak" value={`${currentUserRank.streak}d`} />
                <StatCard label="Reasoning" value={`${currentUserRank.reasoning}%`} />
                <StatCard label="Efficiency" value={`${currentUserRank.efficiency}%`} />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 opacity-60" />
                  <span className="text-sm font-bold">{currentUserRank.simulationsCompleted} Sims</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-bold">{currentUserRank.correctDiagnoses} Correct</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Leaderboard Table */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rank</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Points</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Metrics</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {filteredLeaderboard.map((user) => (
                      <motion.tr 
                        key={user.userId}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`group hover:bg-slate-50/50 transition-colors ${user.userId === auth.currentUser?.uid ? 'bg-indigo-50/30' : ''}`}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <span className={`text-lg font-black ${user.rank <= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                              #{user.rank}
                            </span>
                            <RankIndicator current={user.rank} previous={user.previousRank} />
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <img src={user.photoURL} alt={user.name} className="w-10 h-10 rounded-xl shadow-sm" />
                            <div>
                              <div className="font-bold text-slate-900">{user.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medical Student</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-xl font-black text-slate-900">{user.totalPoints}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <MetricBadge icon={<Target className="w-3 h-3" />} value={user.accuracy} label="Acc" color="emerald" />
                            <MetricBadge icon={<Brain className="w-3 h-3" />} value={user.reasoning} label="Reas" color="indigo" />
                            <MetricBadge icon={<Zap className="w-3 h-3" />} value={user.efficiency} label="Eff" color="amber" />
                            <MetricBadge icon={<MessageSquare className="w-3 h-3" />} value={user.communication} label="Comm" color="rose" />
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <PlayCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm font-bold text-slate-600">{user.simulationsCompleted}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-sm font-bold text-slate-600">{user.correctDiagnoses}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 w-fit">
                            <Flame className="w-3.5 h-3.5" />
                            <span className="text-sm font-black">{user.streak}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
      <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function FilterButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
          : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MetricBadge({ icon, value, label, color }: { icon: React.ReactNode, value: number, label: string, color: string }) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${colors[color]}`}>
      {icon}
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-black">{value}%</span>
        <span className="text-[7px] font-bold uppercase tracking-tighter opacity-70">{label}</span>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string, value: string | number, icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center md:items-start">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-lg font-black">{value}</div>
    </div>
  );
}

function RankIndicator({ current, previous }: { current: number, previous?: number }) {
  if (!previous || current === previous) return <Minus className="w-3 h-3 text-slate-300" />;
  
  const diff = previous - current;
  if (diff > 0) {
    return (
      <div className="flex items-center text-emerald-500">
        <ChevronUp className="w-3 h-3" />
        <span className="text-[10px] font-bold">{diff}</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-rose-500">
        <ChevronDown className="w-3 h-3" />
        <span className="text-[10px] font-bold">{Math.abs(diff)}</span>
      </div>
    );
  }
}
