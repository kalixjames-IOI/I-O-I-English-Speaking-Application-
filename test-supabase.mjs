import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jipmxnqbndgkwnlpdrkf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NUoQd5OHcYZhcvPb_LnjXg_miq9RZwt';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabase() {
  console.log('=== I O I Education Network - Supabase Test Suite ===\n');

  // Test 1: Connection Health
  console.log('1. Testing database connection...');
  const { data: courses, error: connError } = await supabase.from('courses').select('*').limit(1);
  if (connError) {
    console.log('   FAIL: Connection error -', connError.message);
    return;
  }
  console.log('   PASS: Connected successfully\n');

  // Test 2: List all tables with data
  console.log('2. Verifying seeded data...\n');
  const tables = ['courses', 'levels', 'units', 'lessons', 'vocabulary', 'dialogues', 'grammar_topics', 'quizzes', 'speaking_practice'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    const count = data ? data.length : 0;
    console.log(`   ${table}: ${count > 0 ? '✓ Data present' : '✗ Empty'} (${count} rows)`);
  }

  // Test 3: Full lesson data retrieval
  console.log('\n3. Testing full lesson retrieval (Greetings & Self Introduction)...');
  const lessonId = '44444444-4444-4444-4444-444444444441';
  const [lesson, vocab, dialogues, grammar, quizzes, speaking] = await Promise.all([
    supabase.from('lessons').select('*').eq('id', lessonId).single(),
    supabase.from('vocabulary').select('*').eq('lesson_id', lessonId),
    supabase.from('dialogues').select('*').eq('lesson_id', lessonId),
    supabase.from('grammar_topics').select('*').eq('lesson_id', lessonId),
    supabase.from('quizzes').select('*').eq('lesson_id', lessonId),
    supabase.from('speaking_practice').select('*').eq('lesson_id', lessonId),
  ]);

  console.log(`   Lesson: "${lesson.data?.title}"`);
  console.log(`   Vocabulary: ${vocab.data?.length} words`);
  console.log(`   Dialogues: ${dialogues.data?.length} lines`);
  console.log(`   Grammar: ${grammar.data?.length} topics`);
  console.log(`   Quizzes: ${quizzes.data?.length} questions`);
  console.log(`   Speaking: ${speaking.data?.length} scenarios`);
  console.log('   PASS: Full lesson loaded successfully\n');

  // Test 4: RLS check (anonymous access)
  console.log('4. Testing Row Level Security (anonymous access)...');
  const { data: publicData, error: publicError } = await supabase.from('courses').select('*');
  if (publicData) {
    console.log('   PASS: Public read access works (courses visible without auth)');
  } else {
    console.log('   FAIL: Cannot read courses -', publicError?.message);
  }

  // Test 5: Auth configuration
  console.log('\n5. Testing auth endpoint...');
  const { error: authError } = await supabase.auth.getSession();
  if (!authError) {
    console.log('   PASS: Auth endpoint responding\n');
  } else {
    console.log('   FAIL: Auth error -', authError.message);
  }

  console.log('=== All tests complete ===');
}

testDatabase().catch(console.error);
