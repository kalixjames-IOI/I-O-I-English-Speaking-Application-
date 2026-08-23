# Phase 6/8/9/10 Audit Notes

## Production Supabase project

- Project: `jipmxnqbndgkwnlpdrkf` — I O I English Speaking Course App.
- Region: `ap-northeast-1`.
- Status during audit: `ACTIVE_HEALTHY`.
- Public relational tables: `courses`, `levels`, `units`, `lessons`, `vocabulary`, `dialogues`, `grammar_topics`, `quizzes`, `speaking_practice`, `user_progress`, `subscriptions`, `community_posts`, `community_comments`, `community_post_reactions`, and `profiles`.
- All inspected public tables had RLS enabled.
- The inspected database currently contained zero rows in the curriculum/content tables, so seed work must be idempotent and preserve the local canonical catalog rather than assume production rows exist.
- `lessons.content` is JSONB; relational learning-content tables use foreign keys from vocabulary, dialogues, grammar topics, quizzes, and speaking practice to lessons.
- `user_progress` supports `completion_status`, `score`, `speaking_score`, `xp_earned`, and `last_accessed`.
- `profiles` supports `native_language`, `current_level`, `target_goal`, `daily_minutes_goal`, `learning_style`, `fluency_score`, `plan`, and `roadmap` JSONB.

## Gemini documentation reference

Google’s current models page lists `gemini-3.7-flash` as a stable production model and documents its endpoint ID as `gemini-3.7-flash`: https://ai.google.dev/gemini-api/docs/models

Google’s structured-output guidance documents JSON response schemas for structured generation: https://ai.google.dev/gemini-api/docs/structured-output

## Existing implementation findings

- `CurriculumDatabaseView` uses the Supabase hierarchy `levels → units → lessons` and falls back to the local canonical catalog when Supabase is unavailable.
- `LessonDatabasePlayer` uses relational lesson bundles and renders vocabulary, grammar, listening/dialogue, speaking, and quiz stages.
- `VoiceChatStudio` and `PronunciationStudio` use authenticated `apiFetch`, but the audit identified fabricated client-side fallback responses that violate the new requirement against fake speech scores/replies in production.
- `CommunityView` and the server-side Gemini gateway already use authenticated infrastructure, but all new changes must preserve those boundaries.
- No video assets are to be generated in this task.
