# Technical Specifications

- **Project Name:** Personalized News Aggregator
- **Document Version:** 1.0
- **Date:** 2025-06-18
- **Author(s):** Iustin Margarit, Vlad Marius-Valentin
- **Purpose:** This document provides detailed technical specifications, including the technology stack, key decisions, and implementation details for the project.

---

## 1. Development Environment & Technologies

- **Programming Languages:** TypeScript
- **Frameworks:** Next.js 14+ (App Router)
- **Libraries:** React 18, shadcn/ui, Tailwind CSS, SWR/React Query, Supabase-js
- **Development Tools:** VS Code, Git, npm/pnpm/yarn
- **Technology Stack Rationale:**
    - **Next.js:** Provides a robust framework with features like Server Components and file-based routing, ideal for performance and SEO.
    - **Supabase:** A Backend-as-a-Service that provides a Postgres database, authentication, edge functions, and realtime capabilities out-of-the-box, significantly accelerating development.
    - **shadcn/ui & Tailwind CSS:** A modern, utility-first approach to building a responsive and accessible UI efficiently.

---

## 2. Key Technical Decisions

- **Jamstack Architecture:** Decoupling the frontend and backend simplifies development, improves security, and enhances scalability.
- **Serverless Functions for Backend Logic:** Using Supabase Edge Functions for data ingestion and complex queries keeps the frontend light and centralizes business logic.
- **Row Level Security (RLS):** Implementing RLS in the database is the primary security measure, ensuring users can only access their own data.
- **Database Migrations via CLI:** Managing schema changes through version-controlled migration files ensures a repeatable and reliable deployment process.

---

## 3. API & Backend Logic

### 3.1. Data Ingestion (Edge Function)
- **Name:** `news-ingestion`
- **Trigger:** Cron schedule (hourly).
- **Logic:** Fetches and parses RSS feeds, checks for duplicates, and inserts new articles into the database.

### 3.2. Personalized Feed (Database Function / RPC)
- **Name:** `get_personalized_feed(...)`
- **Logic:** A SQL function that calculates a relevance score for articles based on user preferences and likes, filters out muted sources, and returns a paginated list of article IDs.

### 3.3. Realtime Comments (Realtime Subscriptions)
- **Implementation:** The frontend client subscribes to database changes on the `comments` table, allowing for instant UI updates when new comments are posted.

---

## 4. Security Considerations

- **Authentication:** Handled by Supabase Auth (secure JWTs, password hashing).
- **Authorization:** Enforced at the database level using Row Level Security (RLS).
- **Environment Variables:** All sensitive keys are stored as environment variables in Vercel and are not exposed to the client-side.
- **Input Validation:** A library like Zod will be used for validating all user input on forms and in Edge Functions.

---

## 5. Performance & Scalability

- **Performance:**
    - **Database:** Indexes will be added to all foreign keys and frequently queried columns.
    - **Frontend:** Next.js Server Components, pagination, and client-side caching will be used to optimize load times.
    - **Images:** `next/image` will be used for automatic image optimization.
- **Scalability:** The serverless nature of Vercel and Supabase allows the application to scale automatically with demand.

---

## 6. Deployment & Operations

- **CI/CD:** A Git-based workflow where pushes to the `main` branch automatically trigger a production deployment on Vercel.
- **Environments:** Separate environments for local development, staging (optional), and production will be maintained.