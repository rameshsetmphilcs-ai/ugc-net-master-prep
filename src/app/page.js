'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { SYLLABUS_DATA } from './syllabusData';

export default function UGCPlatform() {
  const [selectedPaper, setSelectedPaper] = useState('Paper 1');
  const [selectedTopic, setSelectedTopic] = useState('Levels of Teaching');
  const [stage, setStage] = useState('learn'); // 'learn' | 'test' | 'readiness'
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [completedTopics, setCompletedTopics] = useState({});

  const fetchTopicQuestions = async (topicName) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('paper', selectedPaper)
      .eq('topic', topicName);

    if (!error && data) {
      setActiveQuestions(data);
    }
    setLoading(false);
  };

  const handleStartLearning = (topicName) => {
    setSelectedTopic(topicName);
    setUserAnswers({});
    setCurrentQIndex(0);
    setStage('learn');
  };

  const handleLaunchTest = () => {
    fetchTopicQuestions(selectedTopic);
    setUserAnswers({});
    setCurrentQIndex(0);
    setStage('test');
  };

  const handleSelectAnswer = (qId, option) => {
    setUserAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const totalQuestions = activeQuestions.length;
  const maxMarks = totalQuestions * 2;
  const correctCount = activeQuestions.filter(q => userAnswers[q.id] === q.correct_option).length;
  const wrongCount = activeQuestions.filter(q => userAnswers[q.id] && userAnswers[q.id] !== q.correct_option).length;
  const totalScore = correctCount * 2;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const isExamReady = accuracy >= 80;

  const handleFinishTest = async () => {
    setStage('readiness');
    if (isExamReady) {
      setCompletedTopics(prev => ({ ...prev, [selectedTopic]: true }));
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('test_attempts').insert([
        {
          user_id: user.id,
          paper: `${selectedPaper} - ${selectedTopic}`,
          score: totalScore,
          max_marks: maxMarks,
          accuracy: accuracy,
          correct_count: correctCount,
          wrong_count: wrongCount,
          readiness_status: isExamReady ? 'EXAM READY' : 'NOT READY'
        }
      ]);
    }
  };

  const currentTopicData = SYLLABUS_DATA[selectedPaper]
    ?.flatMap(u => u.topics)
    ?.find(t => t.name === selectedTopic);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-20">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-600 text-white font-black px-2.5 py-1 rounded-md text-xs">UGC</span>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-none">UGC NET Concept-to-Readiness Engine</h1>
            <p className="text-[11px] text-slate-500 font-medium">Read Concept ➔ Solve Mock ➔ Check Exam Readiness</p>
          </div>
        </div>
        <select
          value={selectedPaper}
          onChange={(e) => { setSelectedPaper(e.target.value); setStage('learn'); }}
          className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-indigo-600 cursor-pointer">
          <option value="Paper 1">Paper 1 (General Teaching & Research)</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Commerce">Commerce</option>
        </select>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Sidebar: 10 Units Syllabus Navigation */}
        <aside className="md:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm h-[82vh] overflow-y-auto space-y-4">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">Course Syllabus Navigator</h2>
          {SYLLABUS_DATA[selectedPaper]?.map((unitItem, uIdx) => (
            <div key={uIdx} className="space-y-1.5">
              <div className="text-[11px] font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded">
                {unitItem.unit}
              </div>
              <div className="space-y-1 pl-1">
                {unitItem.topics.map((t, tIdx) => {
                  const isSelected = selectedTopic === t.name;
                  const isReady = completedTopics[t.name];
                  return (
                    <button
                      key={tIdx}
                      onClick={() => handleStartLearning(t.name)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between ${
                        isSelected ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'
                      }`}>
                      <span className="truncate pr-2">{t.name}</span>
                      {isReady ? (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black">READY</span>
                      ) : (
                        <span className="text-[9px] text-slate-400">➔</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Main Stage: Learn -> Test -> Readiness */}
        <main className="md:col-span-8 space-y-5">
          {/* STEP 1: VISUAL CONCEPT CAPSULE */}
          {stage === 'learn' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-8">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                      {selectedPaper}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">15-Year High Frequency Focus</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{selectedTopic}</h2>
                </div>
                <button
                  onClick={handleLaunchTest}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition self-start sm:self-auto flex items-center gap-1.5">
                  <span>Take Diagnostic Mock</span>
                  <span>➔</span>
                </button>
              </div>

              {selectedTopic === 'Levels of Teaching' ? (
                <>
                  {/* Visual 1: 3-Tier Cognitive Hierarchy Cards */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <span>🧠</span> Cognitive Hierarchy Model (Morris L. Bigge Continuum)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50/60 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded w-max inline-block mb-2">
                            LEVEL 1 • RECALL
                          </span>
                          <h4 className="text-sm font-extrabold text-amber-950">Memory Level (MLT)</h4>
                          <p className="text-xs font-bold text-amber-800 mt-0.5">Johann Friedrich Herbart</p>
                          <p className="text-[11px] text-amber-900/80 mt-2 leading-relaxed">
                            Thoughtless teaching focused on <strong>rote memorization</strong>, drill, and signal learning. Teacher-dominated.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-amber-200/60 text-[10px] font-bold text-amber-800">
                          Bloom Tier: Knowledge
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/60 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black bg-blue-200 text-blue-900 px-2 py-0.5 rounded w-max inline-block mb-2">
                            LEVEL 2 • RELATIONS
                          </span>
                          <h4 className="text-sm font-extrabold text-blue-950">Understanding Level (ULT)</h4>
                          <p className="text-xs font-bold text-blue-800 mt-0.5">Henry C. Morrison</p>
                          <p className="text-[11px] text-blue-900/80 mt-2 leading-relaxed">
                            Thoughtful teaching. Seeing <strong>patterns & principles</strong>. Discriminating positive vs negative exemplars.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-blue-200/60 text-[10px] font-bold text-blue-800">
                          Bloom Tier: Comprehension & Application
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded w-max inline-block mb-2">
                            LEVEL 3 • PROBLEM SOLVING
                          </span>
                          <h4 className="text-sm font-extrabold text-emerald-950">Reflective Level (RLT)</h4>
                          <p className="text-xs font-bold text-emerald-800 mt-0.5">Maurice P. Hunt</p>
                          <p className="text-[11px] text-emerald-900/80 mt-2 leading-relaxed">
                            Highly thoughtful. <strong>Formulating hypotheses</strong>, open inquiry, and resolving unstudied real-world dilemmas.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] font-bold text-emerald-800">
                          Bloom Tier: Analysis, Evaluation & Creation
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual 2: Morrison's 5-Phase Sequence Stepper */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <span>🔄</span> Morrison's 5-Phase Mastery Cycle (Order is strictly examined)
                    </h3>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] inline-flex items-center justify-center mb-1">1</span>
                          <div className="font-extrabold text-slate-800 text-xs">Exploration</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Pre-test & Readiness</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] inline-flex items-center justify-center mb-1">2</span>
                          <div className="font-extrabold text-slate-800 text-xs">Presentation</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Structural Delivery</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] inline-flex items-center justify-center mb-1">3</span>
                          <div className="font-extrabold text-slate-800 text-xs">Assimilation</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Deep Lab & Study</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] inline-flex items-center justify-center mb-1">4</span>
                          <div className="font-extrabold text-slate-800 text-xs">Organization</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Systematic Outline</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] inline-flex items-center justify-center mb-1">5</span>
                          <div className="font-extrabold text-emerald-950 text-xs">Recitation</div>
                          <div className="text-[9px] text-emerald-700 mt-0.5">Oral Defense</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual 3: Comparative Matrix */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <span>📊</span> 360° Comparative Matrix
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Dimension</th>
                            <th className="py-2.5 px-3 text-amber-900 bg-amber-50/50">Memory (Herbart)</th>
                            <th className="py-2.5 px-3 text-blue-900 bg-blue-50/50">Understanding (Morrison)</th>
                            <th className="py-2.5 px-3 text-emerald-900 bg-emerald-50/50">Reflective (Hunt)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-slate-900">Classroom Climate</td>
                            <td className="py-2.5 px-3 bg-amber-50/20">Authoritarian & Rigid</td>
                            <td className="py-2.5 px-3 bg-blue-50/20">Controlled & Guided</td>
                            <td className="py-2.5 px-3 bg-emerald-50/20 font-bold text-emerald-700">Open & Democratic</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-slate-900">Student Role</td>
                            <td className="py-2.5 px-3 bg-amber-50/20">Passive Listener</td>
                            <td className="py-2.5 px-3 bg-blue-50/20">Active Inquirer</td>
                            <td className="py-2.5 px-3 bg-emerald-50/20">Primary Driver & Creator</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-slate-900">Assessment Tool</td>
                            <td className="py-2.5 px-3 bg-amber-50/20">Recall, Matching, True/False</td>
                            <td className="py-2.5 px-3 bg-blue-50/20">Explain relationships, Essay</td>
                            <td className="py-2.5 px-3 bg-emerald-50/20">Problem-solving, Real Projects</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Visual 4: Exam Trap Alert Box */}
                  <div className="p-4 rounded-xl border-l-4 border-rose-500 bg-rose-50/60 flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="text-xs text-rose-950 space-y-1">
                      <span className="font-black uppercase tracking-wide text-rose-900">NTA UGC NET Exam Trap Alert</span>
                      <p className="leading-relaxed">
                        NTA often sets statements like: <em>&quot;Reflective level can operate without prior levels.&quot;</em> — this is <strong>False</strong>. Herbart&apos;s Memory Level and Morrison&apos;s Understanding Level form the essential foundational baseline before attempting Hunt&apos;s Reflective Level.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-indigo-50/60 p-5 rounded-xl border border-indigo-100 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                  {currentTopicData?.concept || 'Comprehensive theoretical framework for this unit.'}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleLaunchTest}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2">
                  <span>Attempt Verified PYQ Mock Test</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MOCK TEST ENGINE */}
          {stage === 'test' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              {loading ? (
                <div className="text-center py-12 text-xs font-bold text-slate-400">Loading topic test items...</div>
              ) : activeQuestions.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-sm font-bold text-slate-600">No questions found in database for this topic yet.</p>
                  <button onClick={() => setStage('learn')} className="text-xs text-indigo-600 font-bold hover:underline">
                    ← Return to Concept Module
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-xs font-extrabold text-indigo-600">
                      Question {currentQIndex + 1} of {activeQuestions.length}
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                      PYQ {activeQuestions[currentQIndex].pyq_year}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                    {activeQuestions[currentQIndex].question_text}
                  </p>

                  <div className="space-y-2.5">
                    {[
                      { key: 'A', text: activeQuestions[currentQIndex].option_a },
                      { key: 'B', text: activeQuestions[currentQIndex].option_b },
                      { key: 'C', text: activeQuestions[currentQIndex].option_c },
                      { key: 'D', text: activeQuestions[currentQIndex].option_d }
                    ].map((opt) => {
                      const isChosen = userAnswers[activeQuestions[currentQIndex].id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelectAnswer(activeQuestions[currentQIndex].id, opt.key)}
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-start gap-3 ${
                            isChosen ? 'bg-indigo-50 border-indigo-600 text-indigo-900' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                          <span className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-black ${
                            isChosen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>{opt.key}</span>
                          <span className="pt-0.5">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button
                      disabled={currentQIndex === 0}
                      onClick={() => setCurrentQIndex(prev => prev - 1)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-30">
                      ← Previous
                    </button>
                    {currentQIndex === activeQuestions.length - 1 ? (
                      <button
                        onClick={handleFinishTest}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow">
                        Submit & Verify Readiness
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentQIndex(prev => prev + 1)}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow">
                        Next Question →
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: READINESS ANALYTICS REPORT */}
          {stage === 'readiness' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className={`p-6 rounded-2xl border text-center space-y-2 ${
                isExamReady ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${
                  isExamReady ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {isExamReady ? 'STATUS: EXAM READY' : 'STATUS: NOT READY'}
                </span>
                <h2 className="text-2xl font-black">{isExamReady ? 'Topic Mastered!' : 'Needs Conceptual Revision'}</h2>
                <p className="text-xs max-w-md mx-auto opacity-80">
                  {isExamReady 
                    ? 'Target 80% benchmark achieved on verified past-year questions. You are ready for the next topic.' 
                    : 'Your score fell below the 80% threshold. Re-read the visual capsules and retake the test.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                  <div className="text-xl font-black text-slate-800">{totalScore} / {maxMarks}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Accuracy</span>
                  <div className="text-xl font-black text-indigo-600">{accuracy}%</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Questions</span>
                  <div className="text-xl font-black text-slate-800">{correctCount} Correct / {wrongCount} Wrong</div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setStage('learn')}
                  className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition">
                  ← Revise Concept Module
                </button>
                <button
                  onClick={handleLaunchTest}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition">
                  Retake Mock Test ➔
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}