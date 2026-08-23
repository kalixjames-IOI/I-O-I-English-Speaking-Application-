import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("SKIP: SUPABASE_URL and SUPABASE_ANON_KEY are not configured.");
  process.exit(0);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const contentTables = ["courses", "levels", "units", "lessons", "vocabulary", "dialogues", "grammar_topics", "quizzes", "speaking_practice"];

async function testDatabase() {
  console.log("=== I O I Education Network — Supabase smoke test ===");
  const { data: courses, error: connectionError } = await supabase.from("courses").select("id,title,status").limit(1);
  if (connectionError) throw new Error(`Connection failed: ${connectionError.message}`);
  console.log(`PASS: public course query responded (${courses?.length ?? 0} row sample)`);

  for (const table of contentTables) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    console.log(`${error ? "FAIL" : "PASS"}: ${table} (${error ? error.message : `${data?.length ?? 0} row sample`})`);
  }

  const { data: lesson, error: lessonError } = await supabase.from("lessons").select("id,title").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (lessonError || !lesson) {
    console.log(`INFO: No lesson sample available (${lessonError?.message ?? "empty table"}).`);
  } else {
    const [vocabulary, dialogues, grammar, quizzes, speaking] = await Promise.all([
      supabase.from("vocabulary").select("id").eq("lesson_id", lesson.id).limit(20),
      supabase.from("dialogues").select("id").eq("lesson_id", lesson.id).limit(20),
      supabase.from("grammar_topics").select("id").eq("lesson_id", lesson.id).limit(20),
      supabase.from("quizzes").select("id").eq("lesson_id", lesson.id).limit(20),
      supabase.from("speaking_practice").select("id").eq("lesson_id", lesson.id).limit(20),
    ]);
    console.log(`PASS: lesson sample “${lesson.title}” — vocab ${vocabulary.data?.length ?? 0}, dialogue ${dialogues.data?.length ?? 0}, grammar ${grammar.data?.length ?? 0}, quiz ${quizzes.data?.length ?? 0}, speaking ${speaking.data?.length ?? 0}`);
  }

  const { error: authError } = await supabase.auth.getSession();
  if (authError) throw new Error(`Auth endpoint failed: ${authError.message}`);
  console.log("PASS: auth endpoint responded");
}

testDatabase().catch((error) => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
