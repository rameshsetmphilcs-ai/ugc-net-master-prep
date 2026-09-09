'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function UGCPlatform() {
  const [selectedPaper, setSelectedPaper] = useState('Paper 1');
  const [screen, setScreen] = useState('notes'); // 'notes' | 'test' | 'analytics'
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'questions' | 'history'
  const [selectedModalQ, setSelectedModalQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testHistory, setTestHistory] = useState([]);
  const [isRetestActive, setIsRetestActive] = useState(false);

  // வினாக்களை லோட் செய்தல்
  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('paper', selectedPaper)
        .eq('pool_type', 'poolA');

      if (!error && data) {
        setActiveQuestions(data);
      }
      setLoading(false);
    }
    fetchQuestions();
    setUserAnswers({});
    setCurrentQIndex(0);
    setIsRetestActive(false);
    setScreen('notes');
  }, [selectedPaper]);

  // முந்தைய தேர்வு வரலாற்றை லோட் செய்தல்
  const fetchTestHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTestHistory(data);
    }
  };

  useEffect(() => {
    fetchTestHistory();
  }, []);

  const handleSelect = (qId, option) => {
    setUserAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const totalQuestions = activeQuestions.length;
  const maxMarks = totalQuestions * 2;
  const correctCount = activeQuestions.filter(q => userAnswers[q.id] === q.correct_option).length;
  const wrongCount = activeQuestions.filter(q => userAnswers[q.id] && userAnswers[q.id] !== q.correct_option).length;
  const totalScore = correctCount * 2;
  const accuracy = (correctCount + wrongCount) > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
  
  // Concept Mastery Threshold: 80%
  const isConceptCleared = accuracy >= 80;

  // தேர்வை சமர்ப்பித்து Supabase test_attempts அட்டவணையில் பதிவு செய்தல்
  const handleSubmitAssessment = async () => {
    setScreen('analytics');

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('test_attempts').insert([
        {
          user_id: user.id,
          paper: selectedPaper,
          score: totalScore,
          max_marks: maxMarks,
          accuracy: accuracy,
          correct_count: correctCount,
          wrong_count: wrongCount,
          attempt_type: isRetestActive ? 'Adaptive Retest' : 'Standard Assessment'
        }
      ]);
      fetchTestHistory();
    }
  };

  // Adaptive Retest: தவறவிட்ட கேள்விகள் + புதிய Pool B வினாக்கள்
  const handleAdaptiveRetest = async () => {
    setLoading(true);
    const wrongList = activeQuestions.filter(q => userAnswers[q.id] !== q.correct_option);

    const { data: poolBData } = await supabase
      .from('questions')
      .select('*')
      .eq('paper', selectedPaper)
      .eq('pool_type', 'poolB');

    const mixedSet = [...wrongList, ...(poolBData || [])];
    setActiveQuestions(mixedSet);
    setUserAnswers({});
    setCurrentQIndex(0);
    setIsRetestActive(true);
    setLoading(false);
    setScreen('test');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Header Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center sticky top-0 z-40 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
            NET
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm leading-tight">MasterNET Adaptive Prep</h2>
            <p className="text-[11px] text-slate-500">Live Database & Tracking Active</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPaper}
            onChange={(e) => setSelectedPaper(e.target.value)}
            className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-indigo-600 cursor-pointer text-slate-700">
            <option value="Paper 1">Paper 1 (General Teaching & Research)</option>
            <option value="Computer Science">Paper 2 (Computer Science & Applications)</option>
            <option value="Commerce">Paper 2 (Commerce)</option>
          </select>

          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 hidden sm:inline-block">
            Device Verified
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-500">
            Loading Questions for {selectedPaper}...
          </div>
        ) : (
          <>
            {/* SCREEN 1: REVISION NOTES */}
            {screen === 'notes' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{selectedPaper} Assessment Module</span>
                  <h1 className="text-2xl font-black text-slate-900 mt-1">
                    {selectedPaper === 'Paper 1' && 'Teaching Aptitude: Levels of Teaching'}
                    {selectedPaper === 'Computer Science' && 'Computer Science: Core Systems & Theory'}
                    {selectedPaper === 'Commerce' && 'Commerce: Accounting, Finance & Economics'}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">Review concepts before starting the diagnostic test.</p>
                </div>

                {/* Notes Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  {selectedPaper === 'Paper 1' && (
                    <>
                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-sm mb-2">Memory Level (Herbart)</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">Focuses on rote memorization, recall, and factual structuring.</p>
                      </div>
                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-sm mb-2">Understanding Level (Morrison)</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">Focuses on mastering concepts and exemplars.</p>
                      </div>
                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-sm mb-2">Reflective Level (Hunt)</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">Highest cognitive plane: heuristic inquiry and problem-solving.</p>
                      </div>
                    </>
                  )}

                  {selectedPaper === 'Computer Science' && (
                    <>
                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-sm mb-2">Theory of Computation</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">Decidability, DFA minimization, and grammar hierarchies.</p>
                      </div>
                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-sm mb-2">Distributed Systems</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">Ricart-Agrawala mutual exclusion and logical timestamps.</p>
                      </div>
                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-sm mb-2">Computer Networks</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">Routing loops, subnet calculations, and TCP flow control.</p>
                      </div>
                    </>
                  )}

                  {selectedPaper === 'Commerce' && (
                    <>
                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-sm mb-2">Accounting Standards</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">Mandatory AS 22 provisions for corporate taxation.</p>
                      </div>
                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-sm mb-2">Financial Management</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">David Durand Net Income approach and WACC levers.</p>
                      </div>
                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-sm mb-2">Business Economics</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">Heckscher-Ohlin theorem and Monopsony market behaviors.</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-center gap-4 pt-2">
                  <button
                    onClick={() => setScreen('test')}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all">
                    Attempt {selectedPaper} Test ({activeQuestions.length} PYQs) ➔
                  </button>
                  <button
                    onClick={() => { setScreen('analytics'); setActiveTab('history'); }}
                    className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-all">
                    View Attempt History
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 2: MOCK TEST ENGINE */}
            {screen === 'test' && activeQuestions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase text-indigo-600">
                    Question {currentQIndex + 1} of {activeQuestions.length} {isRetestActive && '(Adaptive Retest)'}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                    PYQ {activeQuestions[currentQIndex].pyq_year} • {activeQuestions[currentQIndex].unit}
                  </span>
                </div>

                <p className="text-base font-bold text-slate-900 leading-relaxed">
                  {activeQuestions[currentQIndex].question_text}
                </p>

                <div className="space-y-3">
                  {[
                    { key: 'A', text: activeQuestions[currentQIndex].option_a },
                    { key: 'B', text: activeQuestions[currentQIndex].option_b },
                    { key: 'C', text: activeQuestions[currentQIndex].option_c },
                    { key: 'D', text: activeQuestions[currentQIndex].option_d }
                  ].map((opt) => {
                    const isSelected = userAnswers[activeQuestions[currentQIndex].id] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelect(activeQuestions[currentQIndex].id, opt.key)}
                        className={`w-full text-left p-3.5 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3 ${
                          isSelected ? 'bg-indigo-50 border-indigo-600 text-indigo-900' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200 text-slate-600'
                        }`}>{opt.key}</span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex(prev => prev - 1)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40">
                    ← Previous
                  </button>

                  {currentQIndex === activeQuestions.length - 1 ? (
                    <button
                      onClick={handleSubmitAssessment}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition">
                      Submit Assessment
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQIndex(prev => prev + 1)}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition">
                      Next Question →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 3: ANALYTICS, BREAKDOWN & HISTORY */}
            {screen === 'analytics' && (
              <div className="space-y-6">
                <div className={`p-6 rounded-2xl border ${isConceptCleared ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} shadow-sm flex flex-col md:flex-row justify-between items-center gap-4`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${isConceptCleared ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isConceptCleared ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {isConceptCleared ? 'Concepts Cleared' : 'Lack in Concept Identified'}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mt-1">
                      {isConceptCleared ? 'Mastery Achieved for this Unit' : 'Targeted Adaptive Retest Ready'}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Result has been synced and saved to your permanent tracking profile.
                    </p>
                  </div>

                  {!isConceptCleared ? (
                    <button
                      onClick={handleAdaptiveRetest}
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition whitespace-nowrap">
                      Attempt Mixed Retest Set ➔
                    </button>
                  ) : (
                    <button
                      onClick={() => { setScreen('notes'); setUserAnswers({}); setCurrentQIndex(0); }}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition whitespace-nowrap">
                      Back to Notes ➔
                    </button>
                  )}
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`pb-3 ${activeTab === 'summary' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>
                    Performance Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('questions')}
                    className={`pb-3 ${activeTab === 'questions' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>
                    Question Breakdown ({activeQuestions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 ${activeTab === 'history' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>
                    Attempt History ({testHistory.length})
                  </button>
                </div>

                {/* TAB 1: SUMMARY */}
                {activeTab === 'summary' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">Score</span>
                      <div className="text-2xl font-black text-indigo-600 mt-1">{totalScore} <span className="text-xs text-slate-400">/ {maxMarks}</span></div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">Accuracy</span>
                      <div className="text-2xl font-black text-emerald-600 mt-1">{accuracy}%</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">Correct</span>
                      <div className="text-2xl font-black text-emerald-500 mt-1">{correctCount}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">Incorrect</span>
                      <div className="text-2xl font-black text-rose-500 mt-1">{wrongCount}</div>
                    </div>
                  </div>
                )}

                {/* TAB 2: QUESTIONS BREAKDOWN */}
                {activeTab === 'questions' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Q.No</th>
                          <th className="py-3 px-4">Question</th>
                          <th className="py-3 px-4 text-center">Your Ans</th>
                          <th className="py-3 px-4 text-center">Key</th>
                          <th className="py-3 px-4 text-center">Marks</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeQuestions.map((q, idx) => {
                          const chosen = userAnswers[q.id] || "Not Answered";
                          const isCorrect = chosen === q.correct_option;
                          const isSkipped = chosen === "Not Answered";

                          return (
                            <tr key={q.id} className={isCorrect ? 'bg-emerald-50/40' : isSkipped ? 'bg-white' : 'bg-rose-50/40'}>
                              <td className="py-3 px-4 font-bold text-slate-700">Q{idx + 1}</td>
                              <td className="py-3 px-4 text-slate-800 max-w-xs truncate">{q.question_text}</td>
                              <td className={`py-3 px-4 text-center font-bold ${isCorrect ? 'text-emerald-600' : isSkipped ? 'text-slate-400' : 'text-rose-600'}`}>{chosen}</td>
                              <td className="py-3 px-4 text-center font-bold text-slate-800">{q.correct_option}</td>
                              <td className="py-3 px-4 text-center font-bold">
                                <span className={`px-2 py-0.5 rounded ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                                  {isCorrect ? '+2.0' : '0.0'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => setSelectedModalQ({ ...q, chosen })}
                                  className="px-2.5 py-1 rounded border border-slate-200 hover:bg-white text-indigo-600 font-bold shadow-sm transition">
                                  👁️ View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 3: ATTEMPT HISTORY */}
                {activeTab === 'history' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {testHistory.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 font-semibold">
                        No previous test attempts recorded yet.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Paper</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4 text-center">Score</th>
                            <th className="py-3 px-4 text-center">Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {testHistory.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-500">{new Date(item.created_at).toLocaleDateString()}</td>
                              <td className="py-3 px-4 font-bold text-slate-800">{item.paper}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                                  {item.attempt_type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-indigo-600">{item.score} / {item.max_marks}</td>
                              <td className="py-3 px-4 text-center font-bold text-emerald-600">{item.accuracy}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Explanation Modal */}
                {selectedModalQ && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-indigo-600 uppercase tracking-wider">Solution Breakdown ({selectedModalQ.pyq_year})</span>
                        <button onClick={() => setSelectedModalQ(null)} className="text-slate-400 hover:text-slate-700 font-black text-sm">✕</button>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{selectedModalQ.question_text}</p>
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-semibold">
                        <div>Your Choice: <span className={selectedModalQ.chosen === selectedModalQ.correct_option ? 'text-emerald-600' : 'text-rose-600'}>{selectedModalQ.chosen}</span></div>
                        <div>Correct Choice: <span className="text-emerald-600">{selectedModalQ.correct_option}</span></div>
                      </div>
                      <p className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-amber-950 leading-relaxed">
                        {selectedModalQ.explanation}
                      </p>
                      <button onClick={() => setSelectedModalQ(null)} className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl">Close</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}