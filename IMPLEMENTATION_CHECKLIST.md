# I O I English Speaking — Internal Implementation Checklist

The referenced Full Project Audit PDF was not present in the uploaded files or cloned repository. This checklist therefore uses the supplied production prompt plus direct repository inspection as the baseline.

| Requirement | Status before work | Evidence / action |
|---|---|---|
| Preserve existing application | ✅ COMPLETE | Existing React/Vite/Supabase app cloned and retained. |
| Main navigation: Home, Course, Teachers, AI Tutor, Community, Profile | 🟡 PARTIALLY COMPLETE | Existing tabs expose teachers, curriculum, voice, labs, analytics; refactor shell to required six destinations while preserving tools. |
| CEFR A1, A2, B1, B2, C1 | 🟡 PARTIALLY COMPLETE | Types include levels; UI labels Basic/Intermediate and includes C2; normalize to A1–C1 and handle legacy rows. |
| A1 15-unit taxonomy | 🟡 PARTIALLY COMPLETE | UI is DB-driven but does not verify/display the required taxonomy; add canonical fallback catalog and display unit names. |
| Level → Unit → Lesson hierarchy | 🟡 PARTIALLY COMPLETE | DB helpers exist; curriculum query chaining is broken and has no robust fallback/error/empty states. |
| Lesson content | 🟡 PARTIALLY COMPLETE | Vocabulary, dialogue, grammar, speaking, quiz exist; add video/listening/goal/review flow. |
| Video integration without generating assets | 🟡 PARTIALLY COMPLETE | Lesson video URL exists in schema; add safe preview stage and explicit not-ready state. |
| Vocabulary | ✅ COMPLETE | Database loader and UI exist; add empty/error states and speech playback where useful. |
| Grammar | ✅ COMPLETE | Database loader and UI exist; add robust rendering for JSON content. |
| Dialogue | ✅ COMPLETE | Database loader and UI exist; add audio playback/fallback. |
| Listening practice | ❌ MISSING | Add listening stage using audio URL or browser speech fallback and comprehension support. |
| Speaking practice | 🟡 PARTIALLY COMPLETE | Scenario cards exist; connect to speech assessment and save speaking score. |
| Quiz system | 🔴 BROKEN | Existing percentage double-counts current answer and completion depends on last answer being correct. Fix scoring and final persistence. |
| Progress tracking | 🟡 PARTIALLY COMPLETE | Progress writes exist but are not loaded/displayed reliably; add lesson progress hydration and completion summary. |
| XP reward | 🟡 PARTIALLY COMPLETE | Local XP increments only; make completion calculation deterministic and user-visible. |
| AI Tutor integration | 🟡 PARTIALLY COMPLETE | Gemini-backed voice chat route/component exists; expose as required destination with loading/error handling. |
| Teacher system | ✅ COMPLETE | Teacher data/cards and voice chat exist; preserve and improve navigation. |
| Community system | ❌ MISSING | Add a usable local-first community view with clear sign-in state and safe placeholder behavior. |
| Profile system | 🟡 PARTIALLY COMPLETE | Analytics view is local-only; add profile edit/auth state and persisted progress summary where available. |
| Authentication | 🟡 PARTIALLY COMPLETE | Supabase auth exists; fix profile creation/refresh and degraded offline configuration behavior. |
| Mobile responsiveness | 🟡 PARTIALLY COMPLETE | Phone-frame simulator exists; improve layout semantics and prevent broken viewport behavior. |
| Loading and error states | 🟡 PARTIALLY COMPLETE | Some loaders exist; add shared states to data-backed curriculum and lesson flows. |
| TypeScript | 🔴 BROKEN | Missing Vite `ImportMetaEnv` typing. |
| Production build | ✅ COMPLETE WITH WARNING | Vite and esbuild build complete; reduce chunk warning through code splitting if practical. |
| Android / Capacitor setup | ❌ MISSING | No Capacitor dependency or Android project detected; add configuration and documented build commands without generating video. |
| Security / config | 🔴 BROKEN | Supabase URL and anon key are hard-coded fallbacks; use environment-only configuration with safe demo fallback behavior. |
| AI Teacher videos | ⏸️ NOT STARTED BY REQUIREMENT | Do not generate assets; keep manifest/pre-production tools only. |

## Release gate

Complete all actionable 🟡, ❌, and 🔴 items that do not require unavailable external credentials or assets. Final report must state: `NON-VIDEO PRODUCTION COMPLETE — READY FOR VIDEO PRODUCTION.` and `VIDEO PRODUCTION NOT STARTED` only if all non-video work is verified.

## Post-implementation status

Actionable course, lesson, navigation, auth configuration, TypeScript, mobile-shell, Android packaging, loading/error, speaking, quiz, and progress gaps were addressed. The only intentional holds are external: production Supabase credentials, payment provider configuration, community backend persistence, release signing credentials, and the user-directed video generation step.

Verification completed: `pnpm lint` passed; `pnpm build` passed with a non-blocking bundle-size warning; `pnpm exec cap sync android` passed; `/api/health` smoke test passed; `git diff --check` passed; `./gradlew assembleDebug --no-daemon` passed and generated `android/app/build/outputs/apk/debug/app-debug.apk`. No video assets were created.
