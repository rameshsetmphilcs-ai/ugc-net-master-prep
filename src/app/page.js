'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// அதிகாரப்பூர்வ UGC NET பாடத்திட்டம் & முக்கிய தலைப்புகள்
const SYLLABUS_DATA = {
  'Paper 1': [
    {
      unit: 'Unit 1: Teaching Aptitude',
      topics: [
        { name: 'Levels of Teaching', concept: 'Memory (Herbart: recall, facts), Understanding (Morrison: relationships, examples), Reflective (Hunt: problem-solving, heuristic inquiry).' },
        { name: 'Learner Characteristics', concept: 'Cognitive, affective, social traits. Field-Dependent (holistic, cooperative) vs Field-Independent (analytical, independent).' },
        { name: 'Methods & Evaluation', concept: 'Teacher-centered vs Learner-centered. CBCS grading system, Formative (during process) vs Summative (end term) evaluation.' }
      ]
    },
    {
      unit: 'Unit 2: Research Aptitude',
      topics: [
        { name: 'Types of Research', concept: 'Fundamental (theory creation), Applied (solution testing), Action research (immediate classroom problem solving - Plan-Act-Observe-Reflect).' },
        { name: 'Research Ethics & Plagiarism', concept: 'UGC Plagiarism Levels: Level 0 (<=10%), Level 1 (10-40% penalties), Level 2 (40-60% withdrawal), Level 3 (>60% suspension).' }
      ]
    },
    {
      unit: 'Unit 6: Logical Reasoning',
      topics: [
        { name: 'Indian Logic: Pramanas', concept: 'Pratyaksha (Perception), Anumana (Inference), Upamana (Comparison), Sabda (Word/Authority), Arthapatti (Presumption), Anupalabdhi (Non-apprehension). Vyapti: invariable relation between Hetu and Sadhya.' }
      ]
    }
  ],
  'Computer Science': [
    {
      unit: 'Unit 8: Theory of Computation',
      topics: [
        { name: 'Regular Languages & Automata', concept: 'DFA vs NFA equivalence. Regular expressions, Pumping Lemma for regular languages. Decidable: Emptiness, Finiteness, Equivalence, Membership.' },
        { name: 'Decidability & Turing Machines', concept: 'Chomsky Hierarchy (Type 3 to Type 0). Halting Problem is Recursively Enumerable but undecidable. Post Correspondence Problem (PCP) is undecidable.' }
      ]
    },
    {
      unit: 'Unit 5: Operating Systems',
      topics: [
        { name: 'Deadlock & Concurrency', concept: '4 Necessary conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait. Safe state check: Bankers Algorithm. Deadlock condition: Sum(Max_i) < R + N.' },
        { name: 'Memory & Virtual Memory', concept: 'Paging, TLB hit ratio, Page fault handling. Belady Anomaly in FIFO (more frames = more page faults). LRU stack property.' }
      ]
    },
    {
      unit: 'Unit 10: Artificial Intelligence',
      topics: [
        { name: 'Heuristic Search (A*)', concept: 'A* evaluation f(n) = g(n) + h(n). Admissible: h(n) <= h*(n) (never overestimates). Monotonicity/Consistency guarantees optimal path.' }
      ]
    }
  ],
  'Commerce': [
    {
      unit: 'Unit 2: Accounting and Auditing',
      topics: [
        { name: 'Corporate Valuation & Standards', concept: 'Ind AS 115 5-step revenue model. AS 22 accounting for income taxes. Ratio analysis (Liquidity, Solvency, Turnover, Profitability).' }
      ]
    },
    {
      unit: 'Unit 3: Business Economics',
      topics: [
        { name: 'Consumer Behavior & Indifference Curves', concept: 'Law of Diminishing Marginal Utility. Consumer equilibrium: MRS_xy = Px/Py (tangency condition with convexity).' }
      ]
    },
    {
      unit: 'Unit 10: Income Tax & Corporate Tax',
      topics: [
        { name: 'Residential Status & Tax Scope', concept: 'Section 6: Resident (182 days OR 60+365 days). ROR criteria: Resident in >= 2 of 10 years AND 730 days in 7 preceding years. Section 80D medical deductions.' }
      ]
    }
  ]
};

export default function UGCPlatform() {
  const [selectedPaper, setSelectedPaper] = useState('Paper 1');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [screen, setScreen] = useState('syllabus'); // 'syllabus' | 'notes' | 'test' | 'analytics'
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedModalQ, setSelectedModalQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testHistory, setTestHistory] = useState([]);
  const [isRetestActive, setIsRetestActive] = useState(false);

  // வினாக்களை லோட் செய்தல் (Paper மற்றும் Topic-wise filtering)
  const fetchQuestions = async (topicFilter = 'All') => {
    setLoading(true);
    let query = supabase.from('questions').select('*').eq('paper', selectedPaper);
    
    if (topicFilter !== 'All') {
      query = query.eq('topic', topicFilter);
    } else {
      query = query.eq('pool_type', 'poolA');
    }

    const { data, error } = await query;
    if (!error && data) {
      setActiveQuestions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    setSelectedTopic('All');
    fetchQuestions('All');
    setUserAnswers({});
    setCurrentQIndex(0);
    setIsRetestActive(false);
    setScreen('syllabus');
  }, [selectedPaper]);

  const fetchTestHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setTestHistory(data);
  };

  useEffect(() => {
    fetchTestHistory();
  }, []);

  const handleSelectTopic = (topicName) => {
    setSelectedTopic(topicName);
    fetchQuestions(topicName);
    setScreen('notes');
  };

  const handleSelectAnswer = (qId, option) => {
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
          paper: `${selectedPaper} (${selectedTopic})`,
          score: totalScore,
          max_marks: maxMarks,
          accuracy: accuracy,
          correct_count: correctCount,
          wrong_count: wrongCount,
          attempt_type: isRetestActive ? 'Adaptive Retest' : 'Topic Assessment'
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

    setActiveQuestions([...wrongList, ...(poolBData || [])]);
    setUserAnswers({});
    setCurrentQIndex(0);
    setIsRetestActive(true);
    setLoading(false);
    setScreen('test');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow">
              UGC
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-sm leading-tight">MasterNET Prep Engine</h1>
              <p className="text-[10px] text-slate-500">Syllabus & Topic-wise Diagnostic System</p>
            </div>
          </div>
          <button 
            onClick={() => setScreen('syllabus')}
            className="text-[11px] font-bold text-indigo-600 sm:hidden">
            📚 Syllabus
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPaper}
            onChange={(e) => setSelectedPaper(e.target.value)}
            className="w-full sm:w-auto text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-2 sm:py-1.5 focus:outline-indigo-600 cursor-pointer text-slate-700">
            <option value="Paper 1">Paper 1 (General Teaching & Research)</option>
            <option value="Computer Science">Paper 2 (Computer Science)</option>
            <option value="Commerce">Paper 2 (Commerce)</option>
          </select>
          <button
            onClick={() => setScreen('syllabus')}
            className="hidden sm:block text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100">
            Syllabus Map
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-4 sm:mt-6">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-500 text-sm">
            Connecting to Syllabus Engine & Questions...
          </div>
        ) : (
          <>
            {/* SCREEN 1: SYLLABUS BROWSER & UNIT SELECTION */}
            {screen === 'syllabus' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">{selectedPaper} Syllabus Structure</span>
                    <button 
                      onClick={() => { setSelectedTopic('All'); fetchQuestions('All'); setScreen('test'); }}
                      className="text-xs font-bold text-indigo-600 hover:underline">
                      Practice All Units Combined ({activeQuestions.length} PYQs) ➔
                    </button>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">Select Unit & Topic to Master</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Choose an individual topic to review concepts and solve topic-specific PYQs.</p>
                </div>

                <div className="space-y-4">
                  {SYLLABUS_DATA[selectedPaper]?.map((unitItem, uIdx) => (
                    <div key={uIdx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                          {uIdx + 1}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm">{unitItem.unit}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {unitItem.topics.map((t, tIdx) => (
                          <div 
                            key={tIdx}
                            onClick={() => handleSelectTopic(t.name)}
                            className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 transition cursor-pointer flex flex-col justify-between gap-2">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-800 text-xs">{t.name}</h4>
                                <span className="text-[10px] font-bold text-indigo-600">Start ➔</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{t.concept}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCREEN 2: TOPIC CONCEPT CAPSULE & PRE-TEST BRIEF */}
            {screen === 'notes' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setScreen('syllabus')}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800">
                      ← Back to Syllabus
                    </button>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Topic Focus
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{selectedTopic}</h2>
                  <p className="text-xs text-slate-500">Review concept brief before beginning the topic-focused assessment.</p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-indigo-600 uppercase">Core Concept Capsule</h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
                    {SYLLABUS_DATA[selectedPaper]
                      ?.flatMap(u => u.topics)
                      ?.find(t => t.name === selectedTopic)?.concept || 'Key concepts for this unit focus on analytical derivations and exam-level classification frameworks.'}
                  </p>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setScreen('test')}
                    className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition">
                    Attempt Topic PYQ Assessment ({activeQuestions.length} Questions) ➔
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 3: TOPIC-WISE TEST ENGINE */}
            {screen === 'test' && activeQuestions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase text-indigo-600">
                    Q {currentQIndex + 1} of {activeQuestions.length} {isRetestActive && '(Adaptive Retest)'}
                  </span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                    {activeQuestions[currentQIndex].topic || selectedTopic} • {activeQuestions[currentQIndex].pyq_year}
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
                        onClick={() => handleSelectAnswer(activeQuestions[currentQIndex].id, opt.key)}
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

            {/* SCREEN 4: TOPIC DIAGNOSTIC ANALYTICS */}
            {screen === 'analytics' && (
              <div className="space-y-5">
                <div className={`p-4 sm:p-6 rounded-2xl border ${isConceptCleared ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3`}>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isConceptCleared ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {isConceptCleared ? 'Topic Cleared' : 'Reinforcement Needed'}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {isConceptCleared ? `Mastery Verified: ${selectedTopic}` : 'Targeted Retest Set Ready'}
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
                      onClick={() => setScreen('syllabus')}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition">
                      Next Topic from Syllabus ➔
                    </button>
                  )}
                </div>

                <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
                  <button onClick={() => setActiveTab('summary')} className={`pb-2.5 ${activeTab === 'summary' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Score</button>
                  <button onClick={() => setActiveTab('questions')} className={`pb-2.5 ${activeTab === 'questions' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Breakdown</button>
                  <button onClick={() => setActiveTab('history')} className={`pb-2.5 ${activeTab === 'history' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>History</button>
                </div>

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

                {activeTab === 'questions' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Q</th>
                          <th className="py-2.5 px-3">Question</th>
                          <th className="py-2.5 px-3 text-center">Ans</th>
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

                {activeTab === 'history' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[400px]">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Subject / Topic</th>
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
                  </div>
                )}

                {/* Explanation Modal */}
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