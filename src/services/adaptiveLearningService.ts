import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy, limit, doc } from "firebase/firestore";
import { StudentAttempt, PatientCase, Disease } from "../types";
import { DISEASE_DATA } from "../data/diseases";
import curriculumData from "../data/curriculum.json";

export interface Recommendation {
  type: 'category' | 'disease' | 'skill';
  name: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  score?: number;
  improvement?: number;
}

export interface PerformanceAnalysis {
  overallAccuracy: number;
  overallReasoning: number;
  overallEfficiency: number;
  overallCommunication: number;
  totalSimulations: number;
  streak: number;
  weakAreas: Recommendation[];
  strongAreas: Recommendation[];
  recommendedDiseases: string[];
}

class AdaptiveLearningService {
  async analyzePerformance(userId: string): Promise<PerformanceAnalysis> {
    const attemptsQuery = query(
      collection(db, "attempts"),
      where("userId", "==", userId)
    );
    const attemptsSnap = await getDocs(attemptsQuery);
    // Sort in memory to avoid composite index requirement
    const attempts = attemptsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as StudentAttempt))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (attempts.length === 0) {
      return {
        overallAccuracy: 0,
        overallReasoning: 0,
        overallEfficiency: 0,
        overallCommunication: 0,
        totalSimulations: 0,
        streak: 0,
        weakAreas: [],
        strongAreas: [],
        recommendedDiseases: curriculumData.slice(0, 3).map(c => c.disease)
      };
    }

    // Fetch cases to get disease IDs and categories
    const caseIds = Array.from(new Set(attempts.map(a => a.caseId)));
    const cases: Record<string, PatientCase> = {};
    
    // Firestore 'in' query limit is 10, so we might need to chunk or just fetch all cases for user
    const casesQuery = query(
      collection(db, "cases"),
      where("studentId", "==", userId)
    );
    const casesSnap = await getDocs(casesQuery);
    casesSnap.docs.forEach(doc => {
      cases[doc.id] = { id: doc.id, ...doc.data() } as PatientCase;
    });

    // Calculate overall metrics
    let totalAccuracy = 0;
    let totalReasoning = 0;
    let totalEfficiency = 0;
    let totalCommunication = 0;
    
    const categoryStats: Record<string, { total: number; count: number; correct: number }> = {};
    const diseaseStats: Record<string, { total: number; count: number; correct: number }> = {};

    attempts.forEach(attempt => {
      totalAccuracy += attempt.metrics.accuracy;
      totalReasoning += attempt.metrics.reasoning;
      totalEfficiency += attempt.metrics.efficiency;
      totalCommunication += attempt.metrics.communication;

      const patientCase = cases[attempt.caseId];
      if (patientCase) {
        const diseaseId = patientCase.diseaseId;
        const diseaseInfo = DISEASE_DATA.find(d => d.name === diseaseId);
        const category = diseaseInfo?.category || "General";

        // Category stats
        if (!categoryStats[category]) categoryStats[category] = { total: 0, count: 0, correct: 0 };
        categoryStats[category].total += attempt.score;
        categoryStats[category].count += 1;
        if (attempt.isCorrect) categoryStats[category].correct += 1;

        // Disease stats
        if (!diseaseStats[diseaseId]) diseaseStats[diseaseId] = { total: 0, count: 0, correct: 0 };
        diseaseStats[diseaseId].total += attempt.score;
        diseaseStats[diseaseId].count += 1;
        if (attempt.isCorrect) diseaseStats[diseaseId].correct += 1;
      }
    });

    const avgAccuracy = totalAccuracy / attempts.length;
    const avgReasoning = totalReasoning / attempts.length;
    const avgEfficiency = totalEfficiency / attempts.length;
    const avgCommunication = totalCommunication / attempts.length;

    const weakAreas: Recommendation[] = [];
    const strongAreas: Recommendation[] = [];

    // Analyze categories
    Object.entries(categoryStats).forEach(([name, stats]) => {
      const avgScore = stats.total / stats.count;
      const accuracyRate = stats.correct / stats.count;
      
      if (avgScore < 70 || accuracyRate < 0.7) {
        weakAreas.push({
          type: 'category',
          name,
          reason: `Average score of ${Math.round(avgScore)}% in ${name} cases.`,
          priority: avgScore < 50 ? 'high' : 'medium',
          score: avgScore
        });
      } else {
        strongAreas.push({
          type: 'category',
          name,
          reason: `Strong performance in ${name} with ${Math.round(avgScore)}% average.`,
          priority: 'low',
          score: avgScore
        });
      }
    });

    // Analyze skills
    const skills = [
      { name: 'Diagnostic Accuracy', score: avgAccuracy, reason: 'Focus on identifying the correct underlying pathology.' },
      { name: 'Clinical Reasoning', score: avgReasoning, reason: 'Improve your differential diagnosis and evidence linking.' },
      { name: 'Diagnostic Efficiency', score: avgEfficiency, reason: 'Try to reach a diagnosis with fewer unnecessary tests.' },
      { name: 'Communication', score: avgCommunication, reason: 'Work on your patient interviewing and empathy.' }
    ];

    skills.forEach(skill => {
      if (skill.score < 7) {
        weakAreas.push({
          type: 'skill',
          name: skill.name,
          reason: skill.reason,
          priority: skill.score < 5 ? 'high' : 'medium',
          score: skill.score * 10
        });
      }
    });

    // Recommended diseases
    // Prioritize diseases in weak categories or diseases with low scores
    const recommendedDiseases: string[] = [];
    
    // 1. Diseases with low scores
    Object.entries(diseaseStats)
      .filter(([_, stats]) => (stats.total / stats.count) < 70)
      .sort((a, b) => (a[1].total / a[1].count) - (b[1].total / b[1].count))
      .forEach(([name]) => recommendedDiseases.push(name));

    // 2. Diseases from weak categories that haven't been tried much
    weakAreas.filter(w => w.type === 'category').forEach(weakCat => {
      const diseasesInCat = DISEASE_DATA.filter(d => d.category === weakCat.name).map(d => d.name);
      diseasesInCat.forEach(d => {
        if (!diseaseStats[d] && !recommendedDiseases.includes(d)) {
          recommendedDiseases.push(d);
        }
      });
    });

    // 3. Next curriculum level
    const userRef = doc(db, "users", userId);
    // Note: In a real app we'd fetch the user profile here, but we can pass it in or fetch it.
    // For simplicity, let's just use the curriculum data if we need more.
    if (recommendedDiseases.length < 3) {
      curriculumData.forEach(c => {
        if (!diseaseStats[c.disease] && !recommendedDiseases.includes(c.disease)) {
          recommendedDiseases.push(c.disease);
        }
      });
    }

    return {
      overallAccuracy: avgAccuracy,
      overallReasoning: avgReasoning,
      overallEfficiency: avgEfficiency,
      overallCommunication: avgCommunication,
      totalSimulations: attempts.length,
      streak: 0, // Will be updated from profile
      weakAreas: weakAreas.sort((a, b) => (a.priority === 'high' ? -1 : 1)),
      strongAreas,
      recommendedDiseases: recommendedDiseases.slice(0, 5)
    };
  }
}

export const adaptiveLearningService = new AdaptiveLearningService();
