import React, { useState, useEffect } from 'react';
import { loadFullLesson, db } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import {
  X, BookOpen, Volume2, MessageSquare, Brain, Mic, HelpCircle,
  ChevronLeft, ChevronRight, CheckCircle, Loader2, Trophy, Star
} from 'lucide-react';

interface LessonDatabasePlayerProps {
  lessonId: string;
  onClose: () => void;
  onComplete?: (xpGained: number) => void;
}

type TabType = 'vocabulary' | 'dialogue' | 'grammar' | 'speaking' | 'quiz';

export const LessonDatabasePlayer: React.FC<LessonDatabasePlayerProps> = ({
  lessonId,
  onClose,
  onComplete,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('vocabulary');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const lessonData = await loadFullLesson(lessonId);
      setData(lessonData);
      setLoading(false);
    };
    fetchData();
  }, [lessonId]);

  const handleQuizSubmit = async () => {
    if (!data || !data.quizzes[quizIndex]) return;
    const quiz = data.quizzes[quizIndex];
    const isCorrect = selectedOption === quiz.correct_answer;

    if (isCorrect) setQuizScore(prev => prev + 1);
    setQuizAnswered(true);

    // Update progress
    if (user) {
      const currentScore = isCorrect ? quizScore + 1 : quizScore;
      const totalQuizzes = data.quizzes.length;
      const percentage = Math.round(((currentScore + (isCorrect ? 1 : 0)) / totalQuizzes) * 100);

      await db.upsertProgress(user.id, lessonId, {
        completion_status: quizIndex === totalQuizzes - 1 && isCorrect ? 'completed' : 'in_progress',
        score: percentage,
      });
    }
  };

  const handleNextQuiz = () => {
    if (quizIndex < data.quizzes.length - 1) {
      setQuizIndex(prev => prev + 1);
      setSelectedOption(null);
      setQuizAnswered(false);
    } else {
      setShowResults(true);
      if (onComplete) {
        const finalScore = quizScore;
        const xpGained = Math.round((finalScore / data.quizzes.length) * 100);
        onComplete(xpGained);
      }
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'vocabulary', label: 'Vocabulary', icon: <BookOpen className="w-4 h-4" />, count: data?.vocabulary?.length || 0 },
    { id: 'dialogue', label: 'Dialogue', icon: <MessageSquare className="w-4 h-4" />, count: data?.dialogues?.length || 0 },
    { id: 'grammar', label: 'Grammar', icon: <Brain className="w-4 h-4" />, count: data?.grammar?.length || 0 },
    { id: 'speaking', label: 'Speaking', icon: <Mic className="w-4 h-4" />, count: data?.speakingPractice?.length || 0 },
    { id: 'quiz', label: 'Quiz', icon: <HelpCircle className="w-4 h-4" />, count: data?.quizzes?.length || 0 },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Loading lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-4 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-300 hover:text-white transition">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h2 className="text-sm font-bold text-white truncate max-w-[60%]">
            {data?.lesson?.title || 'Lesson'}
          </h2>
          <div className="w-16" />
        </div>
      </div>

      {/* Lesson Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Lesson Info */}
        {data?.lesson?.content && (
          <div className="bg-gradient-to-r from-indigo-900/50 to-cyan-900/50 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              {typeof data.lesson.content === 'object' ? data.lesson.content.explanation : data.lesson.content}
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-[10px]">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Vocabulary Tab */}
        {activeTab === 'vocabulary' && data?.vocabulary && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              Key Vocabulary ({data.vocabulary.length})
            </h3>
            {data.vocabulary.map((word: any, i: number) => (
              <div key={word.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">{word.word}</span>
                  <span className="text-xs text-indigo-400 font-mono">{word.pronunciation}</span>
                </div>
                <p className="text-sm text-slate-300">{word.meaning}</p>
                <p className="text-xs text-slate-500 italic">"{word.example_sentence}"</p>
              </div>
            ))}
          </div>
        )}

        {/* Dialogue Tab */}
        {activeTab === 'dialogue' && data?.dialogues && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Conversation Practice
            </h3>
            {data.dialogues.map((d: any, i: number) => (
              <div key={d.id} className={`flex gap-3 p-3 rounded-xl ${
                d.speaker === 'Learner'
                  ? 'bg-indigo-900/30 border border-indigo-800/50 ml-8'
                  : 'bg-slate-800/50 border border-slate-700 mr-8'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  d.speaker === 'Learner' ? 'bg-indigo-600 text-white' : 'bg-cyan-600 text-white'
                }`}>
                  {d.speaker[0]}
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400">{d.speaker}</span>
                  <p className="text-sm text-white mt-0.5">{d.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grammar Tab */}
        {activeTab === 'grammar' && data?.grammar && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-yellow-400" />
              Grammar Focus
            </h3>
            {data.grammar.map((g: any, i: number) => (
              <div key={g.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-bold text-yellow-400">{g.topic}</h4>
                <p className="text-sm text-slate-300">{g.explanation}</p>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Examples:</p>
                  <p className="text-sm text-green-400">{g.examples}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Speaking Practice Tab */}
        {activeTab === 'speaking' && data?.speakingPractice && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-green-400" />
              Speaking Practice Scenarios
            </h3>
            {data.speakingPractice.map((sp: any, i: number) => (
              <div key={sp.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-green-400">{sp.scenario}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    sp.difficulty_level === 'beginner' ? 'bg-green-900/30 text-green-400' :
                    sp.difficulty_level === 'intermediate' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {sp.difficulty_level}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{sp.ai_instruction}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && data?.quizzes && (
          <div className="space-y-4">
            {!showResults ? (
              <>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  Knowledge Check
                </h3>
                <div className="text-xs text-slate-400">
                  Question {quizIndex + 1} of {data.quizzes.length}
                </div>

                {data.quizzes[quizIndex] && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
                    <h4 className="text-base font-bold text-white">
                      {data.quizzes[quizIndex].question}
                    </h4>

                    <div className="space-y-2">
                      {[
                        data.quizzes[quizIndex].option_a,
                        data.quizzes[quizIndex].option_b,
                        data.quizzes[quizIndex].option_c,
                        data.quizzes[quizIndex].option_d,
                      ].map((option, idx) => {
                        const optionLabels = ['A', 'B', 'C', 'D'];
                        const isSelected = selectedOption === option;
                        const isCorrect = quizAnswered && option === data.quizzes[quizIndex].correct_answer;
                        const isWrong = quizAnswered && isSelected && option !== data.quizzes[quizIndex].correct_answer;

                        return (
                          <button
                            key={idx}
                            onClick={() => !quizAnswered && setSelectedOption(option)}
                            disabled={quizAnswered}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition ${
                              isCorrect
                                ? 'bg-green-900/30 border-green-600 text-green-300'
                                : isWrong
                                ? 'bg-red-900/30 border-red-600 text-red-300'
                                : isSelected
                                ? 'bg-indigo-900/30 border-indigo-500 text-white'
                                : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCorrect ? 'bg-green-600 text-white' :
                              isWrong ? 'bg-red-600 text-white' :
                              isSelected ? 'bg-indigo-600 text-white' :
                              'bg-slate-700 text-slate-400'
                            }`}>
                              {isCorrect ? <CheckCircle className="w-4 h-4" /> :
                               isWrong ? <X className="w-4 h-4" /> :
                               optionLabels[idx]}
                            </span>
                            <span className="text-sm">{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    {!quizAnswered ? (
                      <button
                        onClick={handleQuizSubmit}
                        disabled={!selectedOption}
                        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition disabled:opacity-50"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuiz}
                        className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition flex items-center justify-center gap-2"
                      >
                        {quizIndex < data.quizzes.length - 1 ? 'Next Question' : 'See Results'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center space-y-4 py-8">
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">Quiz Complete!</h3>
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-2xl font-bold text-white">
                    {quizScore}/{data.quizzes.length}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  You scored {Math.round((quizScore / data.quizzes.length) * 100)}%
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-lg"
                >
                  Continue Learning
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
