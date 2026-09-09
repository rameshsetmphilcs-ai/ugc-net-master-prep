'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// முழுமையான 10 அலகுகள் (Paper 1, CS, Commerce)
const SYLLABUS_DATA = {
  'Paper 1': [
    {
      unit: 'Unit 1: Teaching Aptitude',
      topics: [
        { name: 'Levels of Teaching', concept: 'Memory Level (Herbart: recall, facts), Understanding Level (Morrison: relationships, examples), Reflective Level (Hunt: problem-solving, heuristic inquiry).' },
        { name: 'Learner Characteristics', concept: 'Adolescent and adult learners (academic, social, emotional, cognitive). Field-dependent (holistic) vs Field-independent (analytical).' },
        { name: 'Factors Affecting Teaching & Methods', concept: 'Teacher-centered vs Learner-centered methods. Offline vs Online methods (SWAYAM, Swayam Prabha, MOOCs).' },
        { name: 'Evaluation Systems', concept: 'Formative (during process), Summative (end term), Norm-referenced, Criterion-referenced. CBCS and Computer Based Testing.' }
      ]
    },
    {
      unit: 'Unit 2: Research Aptitude',
      topics: [
        { name: 'Types & Approaches of Research', concept: 'Fundamental (theory building), Applied (practical solutions), Action Research (immediate classroom problem solving). Positivism vs Post-positivism.' },
        { name: 'Methods & Steps of Research', concept: 'Experimental, Descriptive, Historical, Qualitative vs Quantitative. Hypothesis formulation, sampling methods, APA/MLA referencing.' },
        { name: 'Research Ethics & Plagiarism', concept: 'UGC Plagiarism Regulations: Level 0 (<=10%), Level 1 (10-40%), Level 2 (40-60% withdrawal), Level 3 (>60% disciplinary action).' }
      ]
    },
    {
      unit: 'Unit 3: Comprehension',
      topics: [
        { name: 'Reading Comprehension', concept: 'Passage decoding, thematic extraction, factual inference, and contextual analysis.' }
      ]
    },
    {
      unit: 'Unit 4: Communication',
      topics: [
        { name: 'Communication: Meaning & Types', concept: 'Verbal and Non-verbal, Interpersonal, Intrapersonal, Group, and Mass-media communication.' },
        { name: 'Classroom Communication & Barriers', concept: 'Pedagogical communication, psychological, semantic, physical, and socio-cultural barriers.' }
      ]
    },
    {
      unit: 'Unit 5: Mathematical Reasoning & Aptitude',
      topics: [
        { name: 'Number & Letter Series', concept: 'Number series patterns, alphabet series, coding-decoding, and relationship networks.' },
        { name: 'Mathematical Concepts', concept: 'Fraction, Time & Distance, Ratio & Proportion, Percentage, Profit & Loss, Simple & Compound Interest, Averages.' }
      ]
    },
    {
      unit: 'Unit 6: Logical Reasoning',
      topics: [
        { name: 'Square of Opposition & Deductive Logic', concept: 'Categorical propositions: Contradictories, Contraries, Sub-contraries, Subalternation. Fallacies and Syllogisms.' },
        { name: 'Indian Logic: Pramanas', concept: 'Pratyaksha (Perception), Anumana (Inference), Upamana (Comparison), Sabda (Word/Testimony), Arthapatti (Implication), Anupalabdhi (Non-apprehension).' },
        { name: 'Structure of Anumana & Hetvabhasa', concept: 'Vyapti (invariable relation between Hetu and Sadhya), Paksha. Fallacies of inference (Hetvabhasa).' }
      ]
    },
    {
      unit: 'Unit 7: Data Interpretation',
      topics: [
        { name: 'Quantitative & Qualitative Data', concept: 'Data sources, acquisition, and classification.' },
        { name: 'Graphical Mapping & Calculation', concept: 'Bar charts, Histograms, Pie charts, Table charts, Line charts. Percentage and ratio based data interpretation.' }
      ]
    },
    {
      unit: 'Unit 8: Information & Communication Technology (ICT)',
      topics: [
        { name: 'ICT Abbreviations & Basics', concept: 'General digital terms, hardware/software taxonomy, memory units (Byte, KB, MB, GB, TB, PB).' },
        { name: 'Internet, Intranet & Web Protocols', concept: 'IP address, DNS, HTTP, HTTPS, FTP, SMTP, POP3, IMAP. Video conferencing systems.' },
        { name: 'Digital Initiatives in Higher Education', concept: 'SWAYAM, SWAYAM Prabha, National Digital Library (NDL), Shodhganga, Shodhgangotri, e-PG Pathshala.' }
      ]
    },
    {
      unit: 'Unit 9: People, Development & Environment',
      topics: [
        { name: 'MDGs & SDGs', concept: 'Millennium Development Goals (8 goals by 2015), Sustainable Development Goals (17 goals, 169 targets by 2030).' },
        { name: 'Environmental Pollution & Hazards', concept: 'Air, water, soil, and noise pollutants. Primary vs Secondary pollutants. Climate change and global warming.' },
        { name: 'International Agreements & Policies', concept: 'EPA 1986, Montreal Protocol, Kyoto Protocol, Paris Agreement, International Solar Alliance (ISA).' }
      ]
    },
    {
      unit: 'Unit 10: Higher Education System',
      topics: [
        { name: 'Ancient Higher Learning Institutions', concept: 'Takshashila, Nalanda, Valabhi, Vikramashila. Ancient education systems and foreign travelers accounts.' },
        { name: 'Post-Independence Higher Education Evolution', concept: 'Radhakrishnan Commission (1948), Mudaliar Commission (1952), Kothari Commission (1964), NEP 1986, and NEP 2020.' },
        { name: 'Regulatory Bodies & Governance', concept: 'Role of UGC, AICTE, NAAC, NIRF. Higher Education Commission of India (HECI) under NEP 2020.' }
      ]
    }
  ],

  'Computer Science': [
    {
      unit: 'Unit 1: Discrete Structures & Optimization',
      topics: [
        { name: 'Sets, Logic & Relations', concept: 'Propositional & Predicate Logic, Equivalence Relations, Partial Orders, Lattices, Boolean Algebra.' },
        { name: 'Graph Theory & Combinatorics', concept: 'Euler & Hamiltonian Graphs, Planar Graphs, Graph Coloring, Spanning Trees, Pigeonhole Principle.' },
        { name: 'Optimization & Linear Programming', concept: 'Simplex Method, Duality, Transportation & Assignment Problems.' }
      ]
    },
    {
      unit: 'Unit 2: Computer System Architecture',
      topics: [
        { name: 'Digital Logic & Circuit Design', concept: 'Combinational (Adders, Multiplexers, Decoders) and Sequential circuits (Flip-flops, Registers, Counters).' },
        { name: 'Instruction Pipelining & Hazards', concept: 'Pipelining hazards: Structural, Data (RAW, WAR, WAW), Control. Branch prediction, RISC vs CISC.' },
        { name: 'Memory Hierarchy & I/O', concept: 'Direct, Associative, Set-associative Cache Mapping. Cache coherence, DMA, Interrupt handling.' }
      ]
    },
    {
      unit: 'Unit 3: Programming Languages & Graphics',
      topics: [
        { name: 'Programming Paradigms & OOP', concept: 'Imperative, Functional, Object-Oriented paradigms. Polymorphism, Inheritance, Encapsulation in C++ and Java.' },
        { name: 'Computer Graphics & Transformations', concept: 'Raster scan, Bresenham line and circle algorithms, 2D/3D affine transformations, Cohen-Sutherland clipping.' }
      ]
    },
    {
      unit: 'Unit 4: Database Management Systems',
      topics: [
        { name: 'ER Modeling & Relational Algebra', concept: 'Entity-Relationship models, Relational algebra operators, Tuple Relational Calculus.' },
        { name: 'Normalization & Functional Dependencies', concept: '1NF, 2NF, 3NF, BCNF, 4NF, 5NF. Dependency preservation, Lossless join decomposition.' },
        { name: 'Transactions & Concurrency Control', concept: 'ACID properties, Serializability (Conflict & View), 2-Phase Locking (2PL), Deadlock handling, Timestamp ordering.' }
      ]
    },
    {
      unit: 'Unit 5: System Software & Operating Systems',
      topics: [
        { name: 'Process Synchronization & Semaphores', concept: 'Critical section, Mutex, Counting semaphores, Classical synchronization problems (Producer-Consumer, Dining Philosophers).' },
        { name: 'CPU Scheduling & Deadlocks', concept: 'FCFS, SJF, Round Robin, Priority scheduling. Banker algorithm, Resource Allocation Graphs, Deadlock avoidance.' },
        { name: 'Memory Management & Paging', concept: 'Paging, Segmentation, TLB hit ratio, Page fault handling. Belady anomaly in FIFO, Optimal vs LRU page replacement.' }
      ]
    },
    {
      unit: 'Unit 6: Software Engineering',
      topics: [
        { name: 'Process Models & Agile', concept: 'Waterfall, Spiral, V-model, Agile Manifesto, Scrum principles.' },
        { name: 'Software Estimation & Quality Metrics', concept: 'COCOMO (Basic, Intermediate, Detailed), Function Points, Cyclomatic Complexity V(G) = E - N + 2P.' },
        { name: 'Testing Techniques', concept: 'Black-box vs White-box, Boundary Value Analysis, Equivalence Partitioning, Integration and Regression testing.' }
      ]
    },
    {
      unit: 'Unit 7: Data Structures & Algorithms',
      topics: [
        { name: 'Trees, Graphs & Heaps', concept: 'Binary Search Trees, AVL Trees, B-Trees, B+ Trees, Min/Max Heaps, Trie structures.' },
        { name: 'Algorithm Paradigms & Complexity', concept: 'Divide & Conquer, Dynamic Programming, Greedy Method, Backtracking, Branch & Bound. Asymptotic notations.' },
        { name: 'Graph Algorithms & NP-Completeness', concept: 'Dijkstra (O(E + V log V) with Fibonacci Heap), Bellman-Ford, Kruskal, Prim. P, NP, NP-Complete, NP-Hard proofs.' }
      ]
    },
    {
      unit: 'Unit 8: Theory of Computation & Compilers',
      topics: [
        { name: 'Finite Automata & Regular Languages', concept: 'DFA, NFA, Regular Expressions, Pumping Lemma for regular sets. Decidability and closure properties.' },
        { name: 'Context-Free Languages & Pushdown Automata', concept: 'CFGs, Ambiguity, Chomsky Normal Form (CNF), Greibach Normal Form (GNF), Deterministic vs Non-deterministic PDA.' },
        { name: 'Turing Machines & Decidability', concept: 'Chomsky Hierarchy. Halting Problem is Recursively Enumerable but undecidable. Post Correspondence Problem (PCP).' },
        { name: 'Compiler Phases & Parsing', concept: 'Lexical analysis, LL(1) parsing, LR parsing (SLR, CLR, LALR), Intermediate representations, Code optimization.' }
      ]
    },
    {
      unit: 'Unit 9: Data Communication & Networks',
      topics: [
        { name: 'Network Models & Physical Layer', concept: 'OSI 7-layer architecture, TCP/IP protocol suite, Transmission media, Modulation techniques.' },
        { name: 'Data Link & Network Protocols', concept: 'Error detection/correction (CRC, Hamming), Sliding Window (Stop-and-Wait, Go-Back-N, Selective Repeat). IPv4/IPv6, CIDR Subnetting.' },
        { name: 'Transport Layer & Security', concept: 'TCP 3-way handshake, UDP, Flow control (Leaky Bucket, Token Bucket), Congestion control, RSA, AES, Digital Signatures.' }
      ]
    },
    {
      unit: 'Unit 10: Artificial Intelligence',
      topics: [
        { name: 'Search Algorithms', concept: 'Uninformed (BFS, DFS) vs Informed search. A* algorithm: f(n) = g(n) + h(n). Admissible (never overestimates) and Monotonic heuristics.' },
        { name: 'Adversarial Search & Fuzzy Systems', concept: 'Minimax algorithm, Alpha-Beta pruning. Fuzzy sets, Membership functions, Defuzzification methods.' },
        { name: 'Machine Learning Fundamentals', concept: 'Supervised, Unsupervised, Reinforcement Learning. Perceptrons, Multi-layer feedforward networks, Backpropagation.' }
      ]
    }
  ],

  'Commerce': [
    {
      unit: 'Unit 1: Business Environment & International Business',
      topics: [
        { name: 'Business Environment Elements', concept: 'Economic systems, Micro & macro environment, Consumer Protection Act 2019, FEMA provisions.' },
        { name: 'International Trade Theories', concept: 'Absolute Advantage, Comparative Advantage, Heckscher-Ohlin Theory, Product Life Cycle Theory.' },
        { name: 'International Economic Institutions', concept: 'WTO, IMF, World Bank, UNCTAD, Regional trading blocs (EU, NAFTA, ASEAN, SAARC).' }
      ]
    },
    {
      unit: 'Unit 2: Accounting & Auditing',
      topics: [
        { name: 'Accounting Standards & Corporate Accounts', concept: 'Ind AS, IFRS, Share valuation, Accounting for corporate restructuring, Amalgamation.' },
        { name: 'Cost & Management Accounting', concept: 'Marginal costing, Break-even analysis, Standard costing, Variance analysis, Budgetary control.' },
        { name: 'Auditing Standards & Procedures', concept: 'Types of audit, Audit report types, Internal check & control, Vouching, Environmental and forensic audit.' }
      ]
    },
    {
      unit: 'Unit 3: Business Economics',
      topics: [
        { name: 'Demand & Consumer Equilibrium', concept: 'Law of Demand, Elasticity of demand, Indifference curve analysis, Consumer surplus, MRSxy = Px/Py.' },
        { name: 'Production, Cost & Market Structures', concept: 'Law of Variable Proportions, Isoquants, Perfect competition, Monopoly, Monopolistic competition, Oligopoly models.' }
      ]
    },
    {
      unit: 'Unit 4: Business Finance',
      topics: [
        { name: 'Cost of Capital & Capital Structure', concept: 'Cost of debt, equity, preference shares. WACC. Net Income, Net Operating Income, Traditional, MM Hypothesis.' },
        { name: 'Capital Budgeting Decisions', concept: 'Payback period, NPV, IRR, Profitability Index. Working capital management strategies.' }
      ]
    },
    {
      unit: 'Unit 5: Business Statistics & Research Methods',
      topics: [
        { name: 'Descriptive Statistics & Probability', concept: 'Central tendency, Dispersion, Skewness, Binomial, Poisson, Normal distributions.' },
        { name: 'Hypothesis Testing', concept: 'Parametric tests (Z-test, t-test, ANOVA), Non-parametric tests (Chi-square, Mann-Whitney U test).' }
      ]
    },
    {
      unit: 'Unit 6: Business Management & HRM',
      topics: [
        { name: 'Management Principles & Functions', concept: 'Planning, Organizing, Directing, Controlling, Span of control, Decision making models.' },
        { name: 'Human Resource Management', concept: 'Recruitment, Selection, Training, Performance appraisal, Job evaluation, Motivation theories.' }
      ]
    },
    {
      unit: 'Unit 7: Banking & Financial Institutions',
      topics: [
        { name: 'Indian Banking System & RBI', concept: 'Commercial banks, RRBs, Cooperative banks, RBI monetary policy instruments (Repo, Reverse Repo, CRR, SLR).' },
        { name: 'Financial Markets & Reforms', concept: 'Money vs Capital market, SEBI regulations, Basel I, II, III norms, NPA resolution frameworks, UPI and digital banking.' }
      ]
    },
    {
      unit: 'Unit 8: Marketing Management',
      topics: [
        { name: 'Marketing Concepts & STP', concept: 'Marketing mix (4Ps and 7Ps), Segmentation, Targeting, Positioning strategies.' },
        { name: 'Product & Pricing Decisions', concept: 'Product Life Cycle (PLC), New product development, Pricing methods, Promotion mix, Distribution channels.' }
      ]
    },
    {
      unit: 'Unit 9: Legal Aspects of Business',
      topics: [
        { name: 'Contract & Commercial Acts', concept: 'Indian Contract Act 1872, Sale of Goods Act 1930, Negotiable Instruments Act 1881.' },
        { name: 'Company Law & IPR', concept: 'Companies Act 2013, Competition Act 2002, Patents, Copyrights, Trademarks, IT Act 2000.' }
      ]
    },
    {
      unit: 'Unit 10: Income-tax & Corporate Tax Planning',
      topics: [
        { name: 'Residential Status & Income Heads', concept: 'Section 6 residential status (ROR, RNOR, NR). 5 Heads of income: Salary, House Property, PGBP, Capital Gains, Other Sources.' },
        { name: 'Deductions, MAT & Tax Planning', concept: 'Section 80C to 80U deductions (80D medical premium), Minimum Alternate Tax (MAT), Tax avoidance vs evasion vs planning.' }
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
              <p className="text-[10px] text-slate-500">10-Unit Complete Syllabus & Diagnostic System</p>
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
            {/* SCREEN 1: SYLLABUS BROWSER & ALL 10 UNITS */}
            {screen === 'syllabus' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">{selectedPaper} • Complete 10 Units</span>
                    <button 
                      onClick={() => { setSelectedTopic('All'); fetchQuestions('All'); setScreen('test'); }}
                      className="text-xs font-bold text-indigo-600 hover:underline">
                      Mock Test All Units Combined ➔
                    </button>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">Select Unit & Topic to Master</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Choose any topic below to read its core concepts and practice verified PYQs.</p>
                </div>

                <div className="space-y-4">
                  {SYLLABUS_DATA[selectedPaper]?.map((unitItem, uIdx) => (
                    <div key={uIdx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
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

            {/* SCREEN 2: TOPIC CONCEPT CAPSULE */}
            {screen === 'notes' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setScreen('syllabus')}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800">
                      ← Back to Syllabus Map
                    </button>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Topic Focus
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{selectedTopic}</h2>
                  <p className="text-xs text-slate-500">Review concept summary before attempting questions.</p>
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

            {/* SCREEN 3: TEST ENGINE */}
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

            {/* SCREEN 4: ANALYTICS & HISTORY */}
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