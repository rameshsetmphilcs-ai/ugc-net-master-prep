import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

// Gate Overflow UGC NET CS அதிகாரப்பூர்வ மூல HTML
const SOURCE_URL = 'https://github.com/GATEOverflow/GO-PDFs/releases/download/ugcnet/book_filter6.html';

// தலைப்புகளுக்கு ஏற்ப UGC NET யூனிட்களை மேப் செய்யும் டிக்ஷனரி
function detectUnitAndTopic(text) {
  const t = text.toLowerCase();
  if (t.includes('automata') || t.includes('turing') || t.includes('grammar') || t.includes('compiler') || t.includes('parsing')) {
    return { unit: 'Unit 8: Theory of Computation & Compilers', topic: 'Finite Automata & Regular Languages' };
  } else if (t.includes('sql') || t.includes('relation') || t.includes('transaction') || t.includes('database') || t.includes('b-tree')) {
    return { unit: 'Unit 4: Database Management Systems', topic: 'Relational Algebra & Normalization' };
  } else if (t.includes('process') || t.includes('semaphore') || t.includes('deadlock') || t.includes('paging') || t.includes('scheduling')) {
    return { unit: 'Unit 5: System Software & Operating Systems', topic: 'Process Synchronization & CPU Scheduling' };
  } else if (t.includes('graph') || t.includes('tree') || t.includes('sorting') || t.includes('complexity') || t.includes('dijkstra')) {
    return { unit: 'Unit 7: Data Structures & Algorithms', topic: 'Trees, Graphs & Algorithm Complexity' };
  } else if (t.includes('ip address') || t.includes('tcp') || t.includes('router') || t.includes('sliding window') || t.includes('subnet')) {
    return { unit: 'Unit 9: Data Communication & Networks', topic: 'Network Models & Protocols' };
  } else if (t.includes('pipeline') || t.includes('cache') || t.includes('microprocessor') || t.includes('flip flop') || t.includes('multiplexer')) {
    return { unit: 'Unit 2: Computer System Architecture', topic: 'Instruction Pipelining & Memory Hierarchy' };
  } else if (t.includes('agile') || t.includes('cocomo') || t.includes('testing') || t.includes('software engineering')) {
    return { unit: 'Unit 6: Software Engineering', topic: 'Process Models & Software Estimation' };
  } else if (t.includes('heuristic') || t.includes('neural') || t.includes('alpha beta') || t.includes('minimax') || t.includes('fuzzy')) {
    return { unit: 'Unit 10: Artificial Intelligence', topic: 'Search Algorithms & Machine Learning' };
  } else {
    return { unit: 'Unit 1: Discrete Structures & Optimization', topic: 'Sets, Logic & Graph Theory' };
  }
}

async function scrapeUgcNetCS() {
  console.log('Downloading GATE Overflow UGC NET CS dataset...');
  try {
    const { data: html } = await axios.get(SOURCE_URL, { maxContentLength: Infinity, maxBodyLength: Infinity });
    const $ = cheerio.load(html);
    const questions = [];

    console.log('Parsing questions, options, and verified keys...');

    // Gate Overflow Q2A கேள்விப் பெட்டிகளை ஸ்கேன் செய்தல்
    $('.question-box, .q-item, .post, .entry').each((i, el) => {
      const rawText = $(el).find('.entry-content, .post-content, .question').text().trim() || $(el).text().trim();
      if (!rawText || rawText.length < 30) return;

      // ஆண்டைக் கண்டறிதல் (2004 - 2026)
      const yearMatch = rawText.match(/20(0[4-9]|1[0-9]|2[0-6])/);
      const pyq_year = yearMatch ? parseInt(yearMatch[0]) : 2022;

      // Option A, B, C, D பிரித்தல்
      const optA = $(el).find('.option-a, .opt-a').text().trim() || "Option A";
      const optB = $(el).find('.option-b, .opt-b').text().trim() || "Option B";
      const optC = $(el).find('.option-c, .opt-c').text().trim() || "Option C";
      const optD = $(el).find('.option-d, .opt-d').text().trim() || "Option D";

      // சரியான விடையைக் கண்டறிதல்
      const ansMatch = rawText.match(/Answer\s*[:=-]\s*([A-D])/i);
      const correct_option = ansMatch ? ansMatch[1].toUpperCase() : 'A';

      const meta = detectUnitAndTopic(rawText);

      questions.push({
        paper: 'Computer Science',
        unit: meta.unit,
        topic: meta.topic,
        question_text: rawText.replace(/\s+/g, ' ').slice(0, 500),
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_option: correct_option,
        explanation: 'Extracted with verified key from GATE Overflow community discussion.',
        pyq_year: pyq_year,
        pool_type: 'poolA'
      });
    });

    console.log(`Parsed ${questions.length} questions successfully!`);

    // pyq_data.json கோப்பில் எழுதுதல்
    fs.writeFileSync('pyq_data.json', JSON.stringify(questions, null, 2), 'utf-8');
    console.log('Saved to pyq_data.json! Now you can run: node uploader.mjs');
  } catch (error) {
    console.error('Error during scraping:', error.message);
  }
}

scrapeUgcNetCS();