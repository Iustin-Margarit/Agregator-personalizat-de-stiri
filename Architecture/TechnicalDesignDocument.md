---

### 1. Introduction & Overview

This document outlines the technical architecture and implementation plan for the Personalized News Aggregator, a web application designed to provide users with a curated, clutter-free, and personalized news consumption experience.

The primary goal is to build a scalable, secure, and performant platform based on the user stories and requirements defined in the PRD. The architecture prioritizes rapid development and iteration by leveraging a modern, serverless technology stack.

Core Technical Objectives:

* Implement a robust user authentication and profile management system.
* Develop a flexible data model to store articles, user preferences, and interactions.
* Build a performant and interactive frontend that is fully mobile-responsive and accessible.
* Create a reliable data ingestion pipeline for aggregating news from various sources.
* Ensure the system is secure by default, protecting user data and privacy.

### 2. System Architecture

The application will follow a Jamstack architecture with a decoupled frontend and a Backend-as-a-Service (BaaS) provider. This simplifies development, deployment, and scaling.


   

Architectural Components:

1. Client (Frontend): A Next.js application built with shadcn/ui components. It will be responsible for all UI rendering, user interactions, and communication with the backend. It will be hosted on Vercel.
1. Backend (BaaS):Supabase will serve as the entire backend. We will leverage its core services:
   * Supabase Auth: For user sign-up, login, and session management (US-01).
   * Supabase Database (Postgres): As the primary data store for all application data.
   * Supabase Edge Functions: For server-side logic, including data ingestion from external sources and implementing the personalized feed algorithm (US-08).
   * Supabase Realtime: To power live features like the comment section (US-09).
1. Data Ingestion: A scheduled Supabase Edge Function will run periodically (e.g., every hour) to fetch new articles from predefined RSS feeds and APIs, parse them, and store them in the Postgres database.

### 3. Technology Stack

* Frontend Framework:Next.js 14+ (using App Router)
* UI Component Library:shadcn/ui (built on Radix UI & Tailwind CSS)
* Backend & Database:Supabase
* State Management: React Context / useState for local state; SWR or React Query for server state management and caching.
* Deployment:Vercel for the frontend; Supabase handles its own infrastructure.
* Version Control: Git (e.g., on GitHub/GitLab).

### 4. Data Model (Supabase Postgres Schema)

A robust and well-structured database schema is critical. All tables will be protected by Row Level Security (RLS) policies to ensure data privacy.

| Table Name                | Columns                                                                                                                                 | Description & Relationships                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| profiles                  | id (UUID, PK, FK to auth.users.id), username (TEXT), theme (TEXT, default 'system'), font_size (TEXT, default 'medium')                 | Stores public user data and application preferences. Linked one-to-one with the built-in auth.users table. |
| sources                   | id (BIGSERIAL, PK), name (TEXT), url (TEXT), rss_feed_url (TEXT)                                                                        | Stores the news sources we aggregate from.                                                                 |
| categories                | id (BIGSERIAL, PK), name (TEXT, UNIQUE)                                                                                                 | Stores news categories like 'Technology', 'Politics', etc.                                                 |
| articles                  | id (BIGSERIAL, PK), source_id (FK to sources.id), title (TEXT), link (TEXT, UNIQUE), content_summary (TEXT), published_at (TIMESTAMPTZ) | The core table for all news articles.                                                                      |
| article_categories        | article_id (FK to articles.id), category_id (FK to categories.id)                                                                       | A many-to-many join table linking articles to categories.                                                  |
| USER-SPECIFIC TABLES      | <br/>                                                                                                                                       | <br/>                                                                                                          |
| user_preferred_categories | user_id (FK to profiles.id), category_id (FK to categories.id)                                                                          | Stores the categories a user selects during onboarding (US-02).                                            |
| likes                     | user_id (FK to profiles.id), article_id (FK to articles.id), created_at (TIMESTAMPTZ)                                                   | Tracks which articles a user has liked (US-04).                                                            |
| saved_articles            | user_id (FK to profiles.id), article_id (FK to articles.id), created_at (TIMESTAMPTZ)                                                   | Tracks articles a user has saved for later (US-05).                                                        |
| muted_sources             | user_id (FK to profiles.id), source_id (FK to sources.id)                                                                               | Stores sources a user has muted (US-07).                                                                   |
| comments                  | id (BIGSERIAL, PK), user_id (FK to profiles.id), article_id (FK to articles.id), content (TEXT), created_at (TIMESTAMPTZ)               | Stores user comments on articles (US-09).                                                                  |


Key RLS Policies:

* Users can only read/update their own profiles row.
* Users can only create/read/delete rows in likes, saved_articles, and muted_sources that match their own user_id.
* Users can create comments with their user_id, but cannot update or delete comments from other users.

### 5. API & Backend Logic (Supabase Functions)

Interaction with the backend will primarily use the supabase-js client library. For complex, secure, or performance-critical operations, we will use Database Functions (RPCs) and Edge Functions.

5.1. Data Ingestion (Edge Function)

* Name: news-ingestion
* Trigger: Cron schedule (e.g., 0 * * * * - every hour).
* Logic:
  1. Fetch all active sources from the database.
  1. For each source, fetch the RSS feed.
  1. Parse the XML/JSON response.
  1. For each new item in the feed:
     * Check if an article with the same link already exists in the articles table to avoid duplicates.
     * If not, insert the new article into the articles table.
     * (Optional) Classify the article into categories and populate article_categories.

5.2. Personalized Feed Algorithm (Database Function / RPC)
This is the core of the personalized experience (US-08) and must be efficient.

* Name: get_personalized_feed(requesting_user_id UUID, page_limit INT, page_offset INT)
* Logic (SQL):
  1. Start with a base query for all articles.
  1. Filter out muted content: LEFT JOIN muted_sources and filter where muted_sources.user_id IS NULL.
  1. Calculate a relevance score for each article using a CASE statement or COALESCE with weights:
     * High weight if the article's category is in the user's user_preferred_categories.
     * Medium weight if the article's category matches a category of an article the user has liked.
     * Lower weight for other articles.
  1. Order by this calculated score and published_at descending.
  1. Apply LIMIT and OFFSET for pagination.
  1. Return a list of article.id. The frontend will then fetch the full data for these IDs.

5.3. Realtime Comments (Realtime Subscriptions)

* Implementation: The frontend will use the supabase-js client to subscribe to inserts on the comments table, filtered by article_id.
* Flow:
  1. User A opens an article page. The client subscribes: supabase.channel('comments:[article_id]').on(...).
  1. User B posts a comment. This triggers a simple INSERT into the comments table.
  1. Supabase Realtime detects the INSERT and pushes the new comment data to all subscribed clients (including User A).
  1. User A's UI updates instantly to show the new comment.

### 6. Frontend Architecture

The Next.js application will be structured using the App Router for clear, file-based routing.

6.1. Directory Structure

Generated code

     /

├── app/

│   ├── (auth)/             # Route group for auth pages

│   │   ├── login/page.tsx

│   │   └── signup/page.tsx

│   ├── (main)/             # Route group for main app layout

│   │   ├── layout.tsx      # Main layout with nav, sidebar

│   │   ├── page.tsx        # The main news feed

│   │   ├── saved/page.tsx

│   │   └── article/[id]/page.tsx

│   └── layout.tsx          # Root layout

├── components/

│   ├── ui/                 # shadcn/ui components

│   ├── custom/             # Custom composite components

│   │   ├── article-card.tsx

│   │   ├── feed-filters.tsx

│   │   └── comment-section.tsx

├── lib/

│   └── supabase/           # Supabase client instances

└── styles/

    └── globals.css

   

IGNORE_WHEN_COPYING_START

content_copy download

Use code[with caution](https://support.google.com/legal/answer/13505487).

IGNORE_WHEN_COPYING_END

6.2. Component Strategy

* Server Components: Used for data-fetching pages by default (/, /article/[id]). They will call Supabase functions directly on the server to fetch data, reducing client-side load times.
* Client Components ("use client"): Used for any component requiring interactivity (state, effects, event listeners). Examples:
  * LikeButton, SaveButton, ShareButton.
  * CommentForm and CommentList (for realtime updates).
  * ThemeToggle and FontSizeSelector.
  * Login/Signup forms.

6.3. User Authentication Flow

1. User visits /signup or /login. Forms use supabase.auth.signUp() or signInWithPassword().
1. On successful signup, a trigger in Supabase automatically creates a corresponding row in the profiles table.
1. The client-side onAuthStateChange listener redirects the user.
1. For a new user, redirect to an /onboarding page (US-02) to select categories.
1. For an existing user, redirect to the main feed (/).

### 7. Implementation of Non-Functional Requirements (NFRs)

* Performance:
  * Database: Add indexes on all foreign keys (user_id, article_id, source_id, category_id) and on articles.published_at.
  * Frontend: Use Next.js Server Components to fetch initial data. Implement pagination on all feeds. Use SWR/React Query to cache client-side data and avoid re-fetching.
  * Image Optimization: Use next/image for automatic optimization of any images.
* Security:
  * RLS: Row Level Security will be enabled on ALL tables containing user-specific data. This is the primary security layer.
  * Auth: Supabase Auth handles secure JWTs and password hashing (bcrypt).
  * Environment Variables: All Supabase keys (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) will be stored as environment variables in Vercel. Only public keys will be exposed to the client.
  * Data Validation: Use a library like Zod for input validation in forms and Edge Functions.
* Mobile Responsiveness:
  * Tailwind CSS is mobile-first by design. All components will be built to be responsive from the start.
  * shadcn/ui components are responsive out-of-the-box.
* Accessibility:
  * Semantic HTML: Use appropriate HTML5 tags (<main>, <nav>, <article>, <button>).
  * shadcn/ui: Leverages Radix UI, which is headless and fully accessible (keyboard navigation, ARIA attributes).
  * US-10 & US-11: The theme toggle and font-size selector directly address accessibility requirements.

### 8. Deployment & Operations

* CI/CD: A Git-based workflow. The main branch is connected to the Vercel production deployment. Pushing to main will automatically trigger a new build and deployment.
* Database Migrations: All schema changes will be managed using the Supabase CLI. Migration files will be generated locally, tested, and committed to the Git repository, ensuring a repeatable and version-controlled database schema.
* Environments:
  * Local: Developers run a local instance of Supabase via Docker for development.
  * Staging (Optional): A separate Supabase project and Vercel deployment for testing before production.
  * Production: The primary Supabase project and Vercel deployment.
---
