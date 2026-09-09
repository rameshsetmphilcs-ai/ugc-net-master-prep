import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// உங்கள் .env.local கோப்பில் உள்ள விவரங்களை இங்கே வைக்கவும்
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-or-service-role-key";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadQuestions() {
  try {
    const rawData = fs.readFileSync('pyq_data.json', 'utf8');
    const questions = JSON.parse(rawData);

    console.log(`Total questions to upload: ${questions.length}`);

    // ஒரே நேரத்தில் 50 வினாக்கள் வீதம் தொகுப்பாக (Batch) ஏற்றுதல்
    const chunkSize = 50;
    for (let i = 0; i < questions.length; i += chunkSize) {
      const chunk = questions.slice(i, i + chunkSize);
      
      const { data, error } = await supabase
        .from('questions')
        .upsert(chunk, { onConflict: 'paper,pyq_year,question_text' });

      if (error) {
        console.error(`Error uploading batch ${i / chunkSize + 1}:`, error.message);
      } else {
        console.log(`Batch ${i / chunkSize + 1} uploaded successfully (${chunk.length} items)`);
      }
    }

    console.log("All PYQ questions ingested successfully!");
  } catch (err) {
    console.error("Failed to run uploader:", err.message);
  }
}

uploadQuestions();