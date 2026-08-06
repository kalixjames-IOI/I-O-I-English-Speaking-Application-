import React, { useState, useEffect } from 'react';
import { db, loadFullLesson } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { BookOpen, CheckCircle, Lock, ChevronRight, Sparkles, Loader2 } from 'lucide-react';

interface CurriculumDatabaseViewProps {
  onSelectLesson: (lessonId: string) => void;
}

export const CurriculumDatabaseView: React.FC<CurriculumDatabaseViewProps> = ({ onSelectLesson }) => {
  const { user } = useAuth();
  const [levels, setLevels] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState<string | null>(null);

  // Load levels
  useEffect(() => {
    const fetchLevels = async () => {
      const { data, error } = await db.getLevels().select('*').limit(10);
      if (!error && data) setLevels(data);
      setLoading(false);
    };
    fetchLevels();
  }, []);

  // Load units when level selected
  useEffect(() => {
    if (!selectedLevel) return;
    const fetchUnits = async () => {
      const { data } = await db.getUnits(selectedLevel).select('*');
      if (data) setUnits(data);
    };
    fetchUnits();
  }, [selectedLevel]);

  // Load lessons when unit selected
  useEffect(() => {
    if (!selectedUnit) return;
    const fetchLessons = async () => {
      const { data } = await db.getLessons(selectedUnit).select('*');
      if (data) setLessons(data);
    };
    fetchLessons();
  }, [selectedUnit]);

  const handleLessonClick = async (lessonId: string) => {
    setLessonLoading(lessonId);
    try {
      // Save progress - mark as started
      if (user) {
        await db.upsertProgress(user.id, lessonId, {
          completion_status: 'in_progress',
        });
      }
      onSelectLesson(lessonId);
    } catch (err) {
      console.error('Error saving progress:', err);
    } finally {
      setLessonLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-cyan-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">English Speaking Mastery</h2>
        </div>
        <p className="text-xs text-slate-300">AI-powered course with structured learning paths</p>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1 text-xs">
        <button
          onClick={() => { setSelectedLevel(null); setSelectedUnit(null); setLessons([]); }}
          className="text-indigo-400 hover:text-indigo-300 font-medium"
        >
          Levels
        </button>
        {selectedLevel && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <button
              onClick={() => { setSelectedUnit(null); setLessons([]); }}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Units
            </button>
          </>
        )}
        {selectedUnit && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span className="text-slate-400">Lessons</span>
          </>
        )}
      </div>

      {/* Level Selection */}
      {!selectedUnit && (
        <div className="space-y-2">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className="w-full flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-indigo-500/50 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  level.name === 'Basic' ? 'bg-green-500/20 text-green-400' :
                  level.name === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{level.name}</div>
                  <div className="text-xs text-slate-400">Tap to view units</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
            </button>
          ))}
        </div>
      )}

      {/* Unit Selection */}
      {selectedLevel && !selectedUnit && (
        <div className="space-y-2">
          {units.map((unit) => (
            <button
              key={unit.id}
              onClick={() => setSelectedUnit(unit.id)}
              className="w-full flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-indigo-500/50 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  {unit.order_number}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{unit.title}</div>
                  <div className="text-xs text-slate-400">{unit.description}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
            </button>
          ))}
        </div>
      )}

      {/* Lesson Selection */}
      {selectedUnit && (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => handleLessonClick(lesson.id)}
              disabled={lessonLoading === lesson.id}
              className="w-full flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-green-500/50 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  {lessonLoading === lesson.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{lesson.title}</div>
                  <div className="text-xs text-slate-400">{lesson.lesson_type || 'Lesson'}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
