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

  // தலைப்புக்கான வினாக்களைப் பெறுதல்
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

  // தயார்நிலைக் கணக்கீடுகள்
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
      {/* Header */}
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
          className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-indigo-600">
          <option value="Paper 1">Paper 1 (General Teaching & Research)</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Commerce">Commerce</option>
        </select>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* இடதுபுறம்: 10 அலகுகளின் பாடத்திட்ட வழிசெலுத்தல் (Topic Selector) */}
        <aside className="md:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm h-[80vh] overflow-y-auto space-y-4">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">Course Syllabus Navigator</h2>
          {SYLLABUS_DATA[selectedPaper]?.map((unitItem, uIdx) => (
            <div key={uIdx} className="space-y-1.5">
              <div className="text-[11px] font-extrabold text-slate-900 bg-slate-100 px-2 py-1 rounded">
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

        {/* வலதுபுறம்: முதன்மை செயல்பாடு (Learn -> Test -> Readiness) */}
        <main className="md:col-span-8 space-y-5">
          {/* STEP 1: முழுமையான பாடம் & கோட்பாடு (LEARN STAGE) */}
          {stage === 'learn' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">Phase 1: Full Concept Mastery</span>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{selectedTopic}</h2>
                </div>
                {completedTopics[selectedTopic] && (
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full">
                    ✓ Previously Cleared
                  </span>
                )}
              </div>

              {/* விரிவான குறிப்புப் பகுதி */}
              <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 text-indigo-950 font-medium">
                  <h4 className="font-black text-indigo-900 uppercase text-xs mb-1">Core Theoretical Framework</h4>
                  {currentTopicData?.concept || 'Comprehensive conceptual module explaining principles, classification taxonomies, structural flow, and exam-relevant models.'}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase">Key Exam Focus Points</h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs font-medium">
                    <li>Major proponents, historic timeline, and foundational postulates.</li>
                    <li>Direct discrimination between critical attributes and contrasting models.</li>
                    <li>Recurring pattern analysis based on 2004–2026 examination cycles.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Finished reading? Test your readiness now.</span>
                <button
                  onClick={handleLaunchTest}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition">
                  Launch Topic Mock Test ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: மாதிரித் தேர்வு (TEST STAGE) */}
          {stage === 'test' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              {loading ? (
                <div className="text-center py-12 text-xs font-bold text-slate-400">Loading topic test items...</div>
              ) : activeQuestions.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-sm font-bold text-slate-600">No questions found for this topic yet.</p>
                  <button onClick={() => setStage('learn')} className="text-xs text-indigo-600 font-bold hover:underline">
                    ← Return to Study Module
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

          {/* STEP 3: தயார்நிலை அறிக்கை (READINESS STATUS REPORT) */}
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
                    ? 'Congratulations! You met the 80% benchmark criteria on authentic past-year questions. You are ready to proceed to the next syllabus module.' 
                    : 'Your score fell below the required 80% mastery threshold. Review the concept lesson and retake the diagnostic test.'}
                </p>
              </div>

              {/* மதிப்பெண் அட்டவணை */}
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
                  <span className="text-[10px] uppercase font-bold text-slate-400">Result</span>
                  <div className="text-xl font-black text-slate-800">{correctCount}W / {wrongCount}L</div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setStage('learn')}
                  className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition">
                  ← Revise Concept Notes
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