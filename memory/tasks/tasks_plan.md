# Task Backlog and Project Progress

## Current Status:
- The project has been initialized, and the core memory files have been created.
- The Next.js frontend has been scaffolded with the basic directory structure and placeholder components.
- The core authentication flow (Login, Signup, Forgot Password) is complete and functional.
- The project is ready for Phase 1 (MVP Launch) development to continue.

---

## Phase 1: MVP Launch (P0 - Must-Haves)

### Epic 1: Foundation & Authentication (US-01)
- **Context:** The foundational step to allow users into the system.
- **Importance:** High
- **Dependencies:** None
- **Sub-Tasks:**
    - [x] **Task 1.1 (Database):** Set up Supabase project and configure the `profiles` table with RLS policies.
    - [x] **Task 1.2 (Frontend):** Create the UI for the login and sign-up pages using `shadcn/ui` components (`Card`, `Input`, `Button`).
    - [x] **Task 1.3 (Logic):** Implement the client-side logic to call `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`.
    - [x] **Task 1.4 (Routing):** Implement the authentication listener (`onAuthStateChange`) to handle redirects after login/logout.
    - [x] **Task 1.5 (Backend):** Create a Supabase database trigger to automatically create a `profiles` row when a new user signs up in `auth.users`.
    - [x] **Task 1.6 (Frontend):** Implement a global logout button and conditionally hide it on auth pages.
    - [x] **Task 1.7 (P0 - Critical):** Implement the full password reset ("Forgot Password") flow, including the necessary UI pages and Supabase logic.
    - [x] **Task 1.8 (P1 - Important):** Add loading indicators (e.g., spinners) and user-friendly feedback (e.g., toast notifications) to all authentication forms (login, signup, password reset).
    - [ ] **Task 1.9 (P2 - Nice-to-Have):** Implement Social Login with at least one provider (e.g., Google).
        - [ ] **Task 1.9.1 (Backend):** Configure Google as an OAuth provider in the Supabase dashboard.
        - [ ] **Task 1.9.2 (Frontend):** Add a "Sign in with Google" button to the login and signup pages.
        - [ ] **Task 1.9.3 (Logic):** Implement the `supabase.auth.signInWithOAuth()` function call.
        - [ ] **Task 1.9.4 (Testing):** Ensure the profile creation trigger works for OAuth sign-ups.

### Epic 2: Onboarding & Personalization Setup (US-02)
- **Context:** Critical for the initial feed personalization.
- **Importance:** High
- **Dependencies:** Epic 1
- **Sub-Tasks:**
    - [x] **Task 2.1 (Database):** Create `categories` and `user_preferred_categories` tables.
        - [x] **Task 2.1.1:** Define and create the `categories` table schema (id, name).
        - [x] **Task 2.1.2:** Define and create the `user_preferred_categories` table schema (user_id, category_id) with foreign keys.
        - [x] **Task 2.1.3:** Create a Supabase seed script to populate the `categories` table with initial data.
    - [x] **Task 2.2 (Frontend):** Build the onboarding page UI.
        - [x] **Task 2.2.1:** Create the route and page file for the onboarding screen (`/onboarding`).
        - [x] **Task 2.2.2:** Fetch and display categories as a list of selectable items (e.g., checkboxes).
        - [x] **Task 2.2.3:** Add a "Save" or "Continue" button.
    - [x] **Task 2.3 (Logic):** Implement logic to save user preferences.
        - [x] **Task 2.3.1:** On submit, collect the IDs of selected categories.
        - [x] **Task 2.3.2:** Insert the selections into the `user_preferred_categories` table.
        - [x] **Task 2.3.3:** Add and set a `has_completed_onboarding` flag in the user's `profiles` table.
        - [x] **Task 2.3.4:** Redirect the user to the main feed (`/saved`) after submission.
    - [x] **Task 2.4 (Routing):** Implement forced redirection for new users.
        - [x] **Task 2.4.1:** In the middleware, if a user is logged in, check the `has_completed_onboarding` flag on their profile.
        - [x] **Task 2.4.2:** If the flag is `false`, redirect the user to `/onboarding`.

### Epic 3: Core News Feed Experience (US-03, US-04, US-05)
- **Context:** The central feature of the application.
- **Importance:** High
- **Dependencies:** Epic 1, Epic 2
- **Sub-Tasks:**
    - [ ] **Task 3.1 (Backend):** Set up the data ingestion pipeline.
        - [ ] **Task 3.1.1 (Database):** Define and create `sources`, `articles`, and `article_categories` tables.
        - [ ] **Task 3.1.2 (Data):** Create a seed script to populate the `sources` table with initial RSS URLs.
        - [ ] **Task 3.1.3 (Edge Function):** Create a Supabase Edge Function `news-ingestion`.
        - [ ] **Task 3.1.4 (Logic):** Implement logic in the function to fetch, parse, and store articles from sources, avoiding duplicates.
        - [ ] **Task 3.1.5 (Scheduling):** Set up a cron job to invoke the Edge Function periodically.
    - [ ] **Task 3.2 (Frontend):** Build the main feed page UI.
        - [ ] **Task 3.2.1:** Implement a server component on the feed page (`/saved`) to fetch articles based on user preferences.
        - [ ] **Task 3.2.2:** Use the `ArticleCard` component to display each article in a list.
        - [ ] **Task 3.2.3:** Implement pagination or infinite scroll.
    - [ ] **Task 3.3 (Filtering - US-03):** Implement category filtering.
        - [ ] **Task 3.3.1:** Create the `FeedFilters` UI component to display selectable categories.
        - [ ] **Task 3.3.2:** Implement state management to track the selected filter.
        - [ ] **Task 3.3.3:** Update the data fetching logic to re-query articles based on the filter.
    - [ ] **Task 3.4 (Liking - US-04):** Implement "Like" functionality.
        - [ ] **Task 3.4.1 (Database):** Create the `likes` table (user_id, article_id).
        - [ ] **Task 3.4.2 (Frontend):** Add a "Like" button to `ArticleCard` and implement optimistic UI updates.
        - [ ] **Task 3.4.3 (Logic):** Implement the background logic to insert/delete a row in the `likes` table.
    - [ ] **Task 3.5 (Saving - US-05):** Implement "Save for later" functionality.
        - [ ] **Task 3.5.1 (Database):** Create the `saved_articles` table (user_id, article_id).
        - [ ] **Task 3.5.2 (Frontend):** Add a "Save" button to `ArticleCard` with optimistic UI.
        - [ ] **Task 3.5.3 (Logic):** Implement the background logic to insert/delete a row in the `saved_articles` table.
        - [ ] **Task 3.5.4 (Page):** Build the "Saved Articles" page (`/saved`) to display a list of the user's saved articles.

---

## Phase 2: Engagement & Refinement (P1 - Important)

### Epic 4: Social & Community Features (US-06, US-09)
- **Context:** Features to drive user engagement.
- **Importance:** Medium
- **Dependencies:** Epic 3
- **Sub-Tasks:**
    - [ ] **Task 4.1 (Sharing - US-06):** Implement a "Share" button using the Web Share API with a fallback.
    - [ ] **Task 4.2 (Commenting - US-09):**
        - [ ] **Task 4.2.1 (Database):** Create the `comments` table with support for threading (`parent_comment_id`).
        - [ ] **Task 4.2.2 (UI):** Build the `CommentSection` component with a form and a list to display comments.
        - [ ] **Task 4.2.3 (Logic):** Implement logic to post new comments.
        - [ ] **Task 4.2.4 (Realtime):** Use Supabase Realtime to display new comments live without a page refresh.

### Epic 5: Advanced Personalization (US-07, US-08)
- **Context:** Enhancing the feed's relevance.
- **Importance:** Medium
- **Dependencies:** Epic 3
- **Sub-Tasks:**
    - [ ] **Task 5.1 (Muting - US-07):**
        - [ ] **Task 5.1.1 (Database):** Create the `muted_sources` table.
        - [ ] **Task 5.1.2 (UI/Logic):** Add a "Mute source" option to articles.
        - [ ] **Task 5.1.3 (Backend):** Update feed queries to exclude articles from muted sources.
    - [ ] **Task 5.2 (Algorithmic Feed - US-08):**
        - [ ] **Task 5.2.1 (Database):** Develop a `get_personalized_feed` database function (RPC) to rank articles.
        - [ ] **Task 5.2.2 (Integration):** Update the main feed to use the new RPC function for fetching articles.

---

## Phase 3: Quality of Life & Accessibility (P2 - Nice-to-Haves)

### Epic 6: UI Customization & Accessibility (US-10, US-11)
- **Context:** Polishing the application.
- **Importance:** Low
- **Dependencies:** Epic 3
- **Sub-Tasks:**
    - [ ] **Task 6.1 (Theme Toggle - US-10):**
        - [ ] **Task 6.1.1 (Database):** Add a `theme` preference column to the `profiles` table.
        - [ ] **Task 6.1.2 (UI/Logic):** Implement a light/dark mode toggle that persists the user's preference.
    - [ ] **Task 6.2 (Font Size - US-11):**
        - [ ] **Task 6.2.1 (Database):** Add a `font_size_preference` column to the `profiles` table.
        - [ ] **Task 6.2.2 (UI/Logic):** Implement a font size selector that persists the user's preference.