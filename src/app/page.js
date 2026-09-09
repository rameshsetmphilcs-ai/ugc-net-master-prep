'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export default function UGCPlatform() {
  const [selectedPaper, setSelectedPaper] = useState('Paper 1');
  const [screen, setScreen] = useState('notes');
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedModalQ, setSelectedModalQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testHistory, setTestHistory] = useState([]);
  const [isRetestActive, setIsRetestActive] = useState(false);

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
  const isConceptCleared = accuracy >= 80;

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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Mobile-Optimized Header */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow">
              NET
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-sm leading-tight">MasterNET Prep</h1>
              <p className="text-[10px] text-slate-500">Adaptive Diagnostic Engine</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 sm:hidden">
            Online
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPaper}
            onChange={(e) => setSelectedPaper(e.target.value)}
            aria-label="Select Paper"
            className="w-full sm:w-auto text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-2 sm:py-1.5 focus:outline-indigo-600 cursor-pointer text-slate-700">
            <option value="Paper 1">Paper 1 (General Teaching & Research)</option>
            <option value="Computer Science">Paper 2 (Computer Science)</option>
            <option value="Commerce">Paper 2 (Commerce)</option>
          </select>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 hidden sm:inline-block">
            Device Verified
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-4 sm:mt-6">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-500 text-sm">
            Fetching Questions from Supabase...
          </div>
        ) : (
          <>
            {/* SCREEN 1: REVISION NOTES */}
            {screen === 'notes' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">{selectedPaper} Overview</span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {selectedPaper === 'Paper 1' && 'Teaching & Research Aptitude'}
                    {selectedPaper === 'Computer Science' && 'Systems, Algorithms & Automata'}
                    {selectedPaper === 'Commerce' && 'Accounting, Finance & Corporate Tax'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Review core concepts before launching the diagnostic assessment.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedPaper === 'Paper 1' && (
                    <>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Levels of Teaching</h3>
                        <p className="text-xs text-slate-600">Herbart (Memory), Morrison (Understanding), and Hunt (Reflective).</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Research Types</h3>
                        <p className="text-xs text-slate-600">Action research for immediate problem solving; stratified sampling for diverse strata.</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Higher Learning</h3>
                        <p className="text-xs text-slate-600">Ancient universities (Nalanda, Taxila) and regulatory policies.</p>
                      </div>
                    </>
                  )}

                  {selectedPaper === 'Computer Science' && (
                    <>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Automata & Grammars</h3>
                        <p className="text-xs text-slate-600">Decidable properties of regular sets; LBA parsing for Type-1 languages.</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">OS & Distributed</h3>
                        <p className="text-xs text-slate-600">Ricart-Agrawala mutual exclusion; Belady anomaly in FIFO paging.</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Algorithms</h3>
                        <p className="text-xs text-slate-600">Dijkstra with Fibonacci Heap runtime: O(E + V log V).</p>
                      </div>
                    </>
                  )}

                  {selectedPaper === 'Commerce' && (
                    <>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Accounting & Tax</h3>
                        <p className="text-xs text-slate-600">Mandatory AS 22 provisions; Section 80D medical premium deductions.</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Financial Management</h3>
                        <p className="text-xs text-slate-600">Durand Net Income approach and Capital Budgeting criteria.</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Banking & Markets</h3>
                        <p className="text-xs text-slate-600">Monopsony markets and Reserve Bank monetary mechanisms.</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    onClick={() => setScreen('test')}
                    className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition">
                    Attempt {selectedPaper} Test ({activeQuestions.length} PYQs) ➔
                  </button>
                  <button
                    onClick={() => { setScreen('analytics'); setActiveTab('history'); }}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition">
                    View Attempt History
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 2: MOCK TEST ENGINE */}
            {screen === 'test' && activeQuestions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase text-indigo-600">
                    Q {currentQIndex + 1} of {activeQuestions.length} {isRetestActive && '(Retest)'}
                  </span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                    PYQ {activeQuestions[currentQIndex].pyq_year}
                  </span>
                </div>

                <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                  {activeQuestions[currentQIndex].question_text}
                </p>

                <div className="space-y-2.5">
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
                        className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-start gap-3 ${
                          isSelected ? 'bg-indigo-50 border-indigo-600 text-indigo-900' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                        <span className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-black ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200 text-slate-600'
                        }`}>{opt.key}</span>
                        <span className="pt-0.5">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <button
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex(prev => prev - 1)}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30">
                    ← Prev
                  </button>

                  {currentQIndex === activeQuestions.length - 1 ? (
                    <button
                      onClick={handleSubmitAssessment}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition">
                      Submit Assessment
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQIndex(prev => prev + 1)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition">
                      Next →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 3: ANALYTICS & HISTORY */}
            {screen === 'analytics' && (
              <div className="space-y-5">
                <div className={`p-4 sm:p-6 rounded-2xl border ${isConceptCleared ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3`}>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isConceptCleared ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {isConceptCleared ? 'Mastery Confirmed' : 'Needs Reinforcement'}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {isConceptCleared ? 'Unit Successfully Cleared' : 'Targeted Retest Generated'}
                    </h2>
                  </div>

                  {!isConceptCleared ? (
                    <button
                      onClick={handleAdaptiveRetest}
                      className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition">
                      Attempt Retest ➔
                    </button>
                  ) : (
                    <button
                      onClick={() => { setScreen('notes'); setUserAnswers({}); setCurrentQIndex(0); }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition">
                      Back to Notes ➔
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 gap-4 text-xs font-bold overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`pb-2.5 whitespace-nowrap ${activeTab === 'summary' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('questions')}
                    className={`pb-2.5 whitespace-nowrap ${activeTab === 'questions' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>
                    Breakdown ({activeQuestions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2.5 whitespace-nowrap ${activeTab === 'history' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>
                    History ({testHistory.length})
                  </button>
                </div>

                {/* Summary View */}
                {activeTab === 'summary' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Score</span>
                      <div className="text-xl font-black text-indigo-600 mt-0.5">{totalScore} <span className="text-xs text-slate-400">/ {maxMarks}</span></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Accuracy</span>
                      <div className="text-xl font-black text-emerald-600 mt-0.5">{accuracy}%</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Correct</span>
                      <div className="text-xl font-black text-emerald-500 mt-0.5">{correctCount}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Wrong</span>
                      <div className="text-xl font-black text-rose-500 mt-0.5">{wrongCount}</div>
                    </div>
                  </div>
                )}

                {/* Questions Breakdown */}
                {activeTab === 'questions' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Q.No</th>
                          <th className="py-2.5 px-3">Question</th>
                          <th className="py-2.5 px-3 text-center">Your Ans</th>
                          <th className="py-2.5 px-3 text-center">Key</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeQuestions.map((q, idx) => {
                          const chosen = userAnswers[q.id] || "Skipped";
                          const isCorrect = chosen === q.correct_option;
                          return (
                            <tr key={q.id} className={isCorrect ? 'bg-emerald-50/40' : chosen === "Skipped" ? 'bg-white' : 'bg-rose-50/40'}>
                              <td className="py-2.5 px-3 font-bold">Q{idx + 1}</td>
                              <td className="py-2.5 px-3 text-slate-700 max-w-[200px] truncate">{q.question_text}</td>
                              <td className={`py-2.5 px-3 text-center font-bold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>{chosen}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-800">{q.correct_option}</td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => setSelectedModalQ({ ...q, chosen })}
                                  className="px-2 py-1 rounded border border-slate-200 hover:bg-white text-indigo-600 font-bold text-[11px] shadow-sm">
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Attempt History */}
                {activeTab === 'history' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                    {testHistory.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">No attempts logged yet.</div>
                    ) : (
                      <table className="w-full text-left text-xs min-w-[400px]">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Paper</th>
                            <th className="py-2.5 px-3 text-center">Score</th>
                            <th className="py-2.5 px-3 text-center">Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {testHistory.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2.5 px-3 text-slate-500">{new Date(item.created_at).toLocaleDateString()}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">{item.paper}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-indigo-600">{item.score} / {item.max_marks}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{item.accuracy}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Solution Modal */}
                {selectedModalQ && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-xl border border-slate-100 space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-indigo-600 uppercase">Solution ({selectedModalQ.pyq_year})</span>
                        <button onClick={() => setSelectedModalQ(null)} className="text-slate-400 hover:text-slate-700 font-black text-sm">✕</button>
                      </div>
                      <p className="font-bold text-slate-900">{selectedModalQ.question_text}</p>
                      <div className="p-2.5 bg-slate-50 rounded-lg space-y-0.5 font-semibold">
                        <div>Your Answer: <span className={selectedModalQ.chosen === selectedModalQ.correct_option ? 'text-emerald-600' : 'text-rose-600'}>{selectedModalQ.chosen}</span></div>
                        <div>Correct Answer: <span className="text-emerald-600">{selectedModalQ.correct_option}</span></div>
                      </div>
                      <p className="p-2.5 bg-amber-50 rounded-lg text-amber-950 leading-relaxed">
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