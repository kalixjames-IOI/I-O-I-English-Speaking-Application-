# Supabase Integration - I O I Education Network

## Overview

This document describes the complete Supabase database architecture and application integration for the **I O I Education Network** AI-powered English Speaking Learning Platform.

---

## Project Details

| Item | Value |
|------|-------|
| **Project URL** | Configured at deployment time via `SUPABASE_URL` / `VITE_SUPABASE_URL` |
| **Publishable Key** | Configured at deployment time via `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` |
| **Platform** | Android + iOS + Web |
| **Business Model** | Subscription-based |

---

## Database Schema (15 Tables)

### 1. profiles
Stores user information linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK, FK → auth.users) | User ID |
| email | TEXT (unique) | Email address |
| full_name | TEXT | Display name |
| avatar_url | TEXT | Profile picture URL |
| native_language | TEXT | User's native language |
| country | TEXT | Country code |
| created_at | TIMESTAMPTZ | Account creation time |
| updated_at | TIMESTAMPTZ | Last update time |

### 2. courses
Stores English courses available on the platform.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Course ID |
| title | TEXT | Course name |
| description | TEXT | Course description |
| level | TEXT | Target level (e.g., All Levels) |
| thumbnail_url | TEXT | Cover image URL |
| status | TEXT | active/inactive |
| created_at | TIMESTAMPTZ | Creation time |

### 3. levels
English learning levels within a course.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Level ID |
| course_id | UUID (FK → courses) | Parent course |
| name | TEXT | Level name (Basic, Intermediate, Advanced) |
| order_number | INTEGER | Display order |

### 4. units
Course units/modules.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unit ID |
| level_id | UUID (FK → levels) | Parent level |
| title | TEXT | Unit title |
| description | TEXT | Unit description |
| order_number | INTEGER | Display order |

### 5. lessons
Individual lessons within units.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Lesson ID |
| unit_id | UUID (FK → units) | Parent unit |
| title | TEXT | Lesson title |
| lesson_type | TEXT | Type (Speaking, Vocabulary, etc.) |
| content | JSONB | Rich lesson content |
| video_url | TEXT | Associated video |
| audio_url | TEXT | Associated audio |
| ai_prompt | TEXT | AI generation prompt |
| order_number | INTEGER | Display order |
| created_at | TIMESTAMPTZ | Creation time |

### 6. vocabulary
Vocabulary words for lessons.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Entry ID |
| lesson_id | UUID (FK → lessons) | Parent lesson |
| word | TEXT | The word/phrase |
| pronunciation | TEXT | IPA pronunciation |
| meaning | TEXT | Definition |
| example_sentence | TEXT | Example usage |
| audio_url | TEXT | Pronunciation audio |

### 7. dialogues
Conversation dialogues for practice.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Entry ID |
| lesson_id | UUID (FK → lessons) | Parent lesson |
| speaker | TEXT | Speaker name |
| text | TEXT | Dialogue text |
| audio_url | TEXT | Audio recording |
| order_number | INTEGER | Line order |

### 8. grammar_topics
Grammar explanations for lessons.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Entry ID |
| lesson_id | UUID (FK → lessons) | Parent lesson |
| topic | TEXT | Grammar topic name |
| explanation | TEXT | Detailed explanation |
| examples | TEXT | Example sentences |

### 9. quizzes
Quiz questions for lessons.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Question ID |
| lesson_id | UUID (FK → lessons) | Parent lesson |
| question | TEXT | Question text |
| option_a | TEXT | Option A |
| option_b | TEXT | Option B |
| option_c | TEXT | Option C |
| option_d | TEXT | Option D |
| correct_answer | TEXT | Correct option text |
| order_number | INTEGER | Question order |

### 10. speaking_practice
AI speaking practice scenarios.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Scenario ID |
| lesson_id | UUID (FK → lessons) | Parent lesson |
| scenario | TEXT | Scenario description |
| ai_instruction | TEXT | AI behavior instructions |
| difficulty_level | TEXT | beginner/intermediate/advanced |

### 11. user_progress
Tracks individual learner progress.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Progress ID |
| user_id | UUID (FK → auth.users) | Learner ID |
| lesson_id | UUID (FK → lessons) | Lesson ID |
| completion_status | TEXT | in_progress/completed |
| score | INTEGER | Quiz score (0-100) |
| speaking_score | INTEGER | Speaking assessment score |
| last_accessed | TIMESTAMPTZ | Last access time |

### 12. subscriptions
Manages paid user subscriptions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Subscription ID |
| user_id | UUID (FK → auth.users) | User ID |
| plan_name | TEXT | Plan name (free/premium/professional) |
| status | TEXT | active/cancelled/expired |
| start_date | DATE | Subscription start |
| end_date | DATE | Subscription end |
| payment_provider | TEXT | Stripe/PayPal/etc. |
| created_at | TIMESTAMPTZ | Creation time |

### 13. community_posts
Stores authenticated learner posts with ownership and timestamps.

### 14. community_comments
Stores replies attached to community posts with ownership and timestamps.

### 15. community_post_reactions
Stores one reaction per user and post.

---

## Authentication

- **Email/Password**: Users can sign up with email and password
- **Google OAuth**: One-click Google sign-in
- **Auto Profile Creation**: The versioned migration creates a trigger, and the client also performs an idempotent profile bootstrap after authentication.
- **Profile Sync**: The authenticated client updates only its own profile row.

---

## Row Level Security (RLS)

All 12 tables have RLS enabled with the following policy structure:

| Table | Read Access | Write Access |
|-------|------------|--------------|
| profiles | Own profile only | Own profile only |
| courses | Public (active rows) | No client write; content is managed by trusted deployment tooling |
| levels | Public (all rows) | No client write; content is managed by trusted deployment tooling |
| units | Public (all rows) | No client write; content is managed by trusted deployment tooling |
| lessons | Public (all rows) | No client write; content is managed by trusted deployment tooling |
| vocabulary | Public (all rows) | No client write; content is managed by trusted deployment tooling |
| dialogues | Public (all rows) | No client write; content is managed by trusted deployment tooling |
| grammar_topics | Public (all rows) | No client write; content is managed by trusted deployment tooling |
| quizzes | Public (all rows) | No client write; content is managed by trusted deployment tooling |
| speaking_practice | Public (all rows) | No client write; content is managed by trusted deployment tooling |
| user_progress | Own data only | Own data only |
| subscriptions | Own data only | Read-only client access; billing writes are server/webhook controlled |
| community_posts | Public | Authenticated owner only |
| community_comments | Public | Authenticated owner only |
| community_post_reactions | Public | Authenticated owner only |

---

## Initial Seed Data

The database is seeded with the following course structure:

```
Course: English Speaking Mastery
├── Level: Basic
│   ├── Unit 1: Personal Identity
│   │   ├── Lesson 1: Greetings and Self Introduction
│   │   │   ├── 6 Vocabulary Words
│   │   │   ├── 8 Dialogue Lines
│   │   │   ├── 3 Grammar Topics
│   │   │   ├── 5 Quiz Questions
│   │   │   └── 3 Speaking Practice Scenarios
│   │   └── Lesson 2: Numbers, Age, and Where You Are From
│   └── Unit 2: Daily Life
├── Level: Intermediate
└── Level: Advanced
```

---

## Frontend Integration Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client, auth helpers, database query helpers |
| `src/lib/database.types.ts` | TypeScript types generated from Supabase schema |
| `src/lib/AuthContext.tsx` | React context for authentication state management |
| `src/components/AuthModal.tsx` | Login/Signup modal with email and Google OAuth |
| `src/components/CurriculumDatabaseView.tsx` | Database-driven curriculum browser |
| `src/components/LessonDatabasePlayer.tsx` | Full lesson player loading data from Supabase |

---

## API Reference (Frontend)

```typescript
import { auth, db, loadFullLesson } from './lib/supabase';

// Authentication
await auth.signUp(email, password, fullName);
await auth.signIn(email, password);
await auth.signInWithGoogle();
await auth.signOut();

// Database queries
await db.getCourses();
await db.getLevels(courseId);
await db.getUnits(levelId);
await db.getLessons(unitId);
await db.getVocabulary(lessonId);
await db.getDialogues(lessonId);
await db.getGrammarTopics(lessonId);
await db.getQuizzes(lessonId);
await db.getSpeakingPractice(lessonId);

// User progress
await db.upsertProgress(userId, lessonId, { completion_status, score });

// Full lesson (all related data)
const lessonData = await loadFullLesson(lessonId);
```

---

## Environment Variables

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

---

## Database Functions

| Function | Purpose | Access |
|----------|---------|--------|
| `handle_new_user()` | Creates profile on signup | Trigger only |
| `handle_updated_user()` | Syncs auth updates to profile | Trigger only |
| `update_updated_at_column()` | Auto-updates timestamp | Trigger only |
| `get_user_subscription_status(uuid)` | Returns active subscription | Authenticated |
| `get_user_progress_summary(uuid)` | Returns progress JSON | Authenticated |

---

## Security Fixes Applied

- Revoked `EXECUTE` on all `SECURITY DEFINER` functions from `PUBLIC` role
- Set explicit `search_path = 'public'` on all functions
- Only `authenticated` role can call helper RPC functions
- All user-owned tables (progress, subscriptions) restrict access to `auth.uid() = user_id`

---

## Verification Notes

The repository contains a versioned migration at `supabase/migrations/0001_production_schema.sql` and an environment-driven smoke test at `test-supabase.mjs`. The selected Supabase project was discovered but reported `INACTIVE`; remote table and migration verification therefore timed out and must be repeated after the project is restored. Do not treat this document as evidence that the remote schema or seed data is currently live.
