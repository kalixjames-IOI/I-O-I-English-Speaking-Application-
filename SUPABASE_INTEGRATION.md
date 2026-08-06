# Supabase Integration - I O I Education Network

## Overview

This document describes the complete Supabase database architecture and application integration for the **I O I Education Network** AI-powered English Speaking Learning Platform.

---

## Project Details

| Item | Value |
|------|-------|
| **Project URL** | `https://jipmxnqbndgkwnlpdrkf.supabase.co` |
| **Publishable Key** | `sb_publishable_NUoQd5OHcYZhcvPb_LnjXg_miq9RZwt` |
| **Platform** | Android + iOS + Web |
| **Business Model** | Subscription-based |

---

## Database Schema (12 Tables)

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

---

## Authentication

- **Email/Password**: Users can sign up with email and password
- **Google OAuth**: One-click Google sign-in
- **Auto Profile Creation**: Trigger automatically creates a `profiles` row when a user signs up
- **Profile Sync**: Updates to auth metadata sync to the profiles table

---

## Row Level Security (RLS)

All 12 tables have RLS enabled with the following policy structure:

| Table | Read Access | Write Access |
|-------|------------|--------------|
| profiles | Own profile only | Own profile only |
| courses | Public (all users) | Authenticated users |
| levels | Public (all users) | Authenticated users |
| units | Public (all users) | Authenticated users |
| lessons | Public (all users) | Authenticated users |
| vocabulary | Public (all users) | Authenticated users |
| dialogues | Public (all users) | Authenticated users |
| grammar_topics | Public (all users) | Authenticated users |
| quizzes | Public (all users) | Authenticated users |
| speaking_practice | Public (all users) | Authenticated users |
| user_progress | Own data only | Own data only |
| subscriptions | Own data only | Own data only |

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
VITE_SUPABASE_URL=https://jipmxnqbndgkwnlpdrkf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_NUoQd5OHcYZhcvPb_LnjXg_miq9RZwt
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

## Testing Results

All 5 test categories passed:

1. **Database Connection**: Connected successfully
2. **Seeded Data**: All 9 content tables contain data
3. **Full Lesson Retrieval**: 6 vocab, 8 dialogues, 3 grammar, 5 quizzes, 3 speaking scenarios loaded
4. **RLS (Anonymous)**: Public read access works correctly
5. **Auth Endpoint**: Responding correctly
