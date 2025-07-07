# Architecture Document

- **Project Name:** Personalized News Aggregator
- **Document Version:** 1.0
- **Date:** 2025-06-18
- **Author(s):** Iustin Margarit, Vlad Marius-Valentin
- **Purpose:** This document details the system architecture, components, data model, and frontend structure for the Personalized News Aggregator.

---

## 1. Goals

- **Architectural Goals:**
    - **Scalability:** The system must handle a growing number of users, articles, and data sources.
    - **Performance:** Ensure fast load times and a responsive user experience.
    - **Security:** Protect user data and privacy through robust security measures.
    - **Maintainability:** Create a well-structured, decoupled architecture that is easy to understand, modify, and extend.
- **Business Goals:**
    - Support rapid development and iteration to quickly deliver value to users.
    - Enable the seamless integration of future features like monetization and advanced personalization.

---

## 2. System Overview

The application follows a **Jamstack architecture**, leveraging a decoupled frontend and a Backend-as-a-Service (BaaS) provider to simplify development, deployment, and scaling.

- **System Context Diagram:**
    ```mermaid
    graph TD
        subgraph "User's Browser"
            Client[Next.js Frontend on Vercel]
        end

        subgraph "Supabase (BaaS)"
            Auth[Supabase Auth]
            DB[(Supabase Postgres DB)]
            EdgeFunc[Supabase Edge Functions]
            Realtime[Supabase Realtime]
        end

        subgraph "External Services"
            RSS[RSS Feeds]
            API[News APIs]
        end

        Client -- "HTTPS/WSS" --> Auth
        Client -- "HTTPS/WSS" --> DB
        Client -- "HTTPS" --> EdgeFunc
        Client -- "WSS" --> Realtime

        EdgeFunc -- "HTTP" --> RSS
        EdgeFunc -- "HTTP" --> API
        EdgeFunc -- "DB Connection" --> DB

        Auth -- "Manages" --> DB
    ```

---

## 3. Components

### 3.1. Client (Frontend)
- **Description:** A Next.js application responsible for all UI rendering and user interactions.
- **Responsibilities:**
    - Displaying the news feed, articles, and user-specific pages.
    - Handling user input through forms and interactive elements.
    - Communicating with the Supabase backend to fetch and mutate data.
- **Implementation Details:** Built with shadcn/ui components and hosted on Vercel.

### 3.2. Backend (BaaS)
- **Description:** Supabase serves as the entire backend, providing a suite of tools to accelerate development.
- **Components:**
    - **Supabase Auth:** Manages user sign-up, login, and session management.
    - **Supabase Database (Postgres):** The primary data store for all application data.
    - **Supabase Edge Functions:** Used for server-side logic, including data ingestion and the personalized feed algorithm.
    - **Supabase Realtime:** Powers live features like the comment section.

### 3.3. Data Ingestion
- **Description:** A scheduled Supabase Edge Function that runs periodically to aggregate news.
- **Responsibilities:**
    - Fetching new articles from predefined RSS feeds and APIs.
    - Parsing and standardizing the article data.
    - Storing new articles in the database, avoiding duplicates.

---

## 4. Data Architecture

- **Data Model:** A relational schema is implemented in Supabase (Postgres). All user-specific tables are protected by Row Level Security (RLS) policies.
- **Data Storage:** See the table schema below.
- **Data Flow:** The client fetches data directly from the database via the Supabase client library. Complex queries and business logic are encapsulated in database functions (RPCs). Data ingestion is handled by a serverless edge function.

| Table Name | Description |
|---|---|
| `profiles` | Stores public user data and application preferences. |
| `sources` | Stores the news sources we aggregate from. |
| `categories` | Stores news categories like 'Technology', 'Politics'. |
| `articles` | The core table for all news articles. |
| `article_categories` | Many-to-many join table linking articles to categories. |
| `user_preferred_categories` | Stores user's selected categories from onboarding. |
| `likes` | Tracks which articles a user has liked. |
| `saved_articles` | Tracks articles a user has saved for later. |
| `muted_sources` | Stores sources a user has muted. |
| `comments` | Stores user comments on articles. |

---

## 5. Frontend Architecture

- **Directory Structure:** The Next.js application uses the App Router for file-based routing.
    ```
    /app
    ├── (auth)/         # Auth pages (login, signup)
    ├── (main)/         # Main app (feed, saved, article detail)
    /components
    ├── /ui             # shadcn/ui components
    ├── /custom         # Custom composite components
    /lib
    └── /supabase       # Supabase client instances
    ```
- **Component Strategy:**
    - **Server Components:** Used for data-fetching pages to reduce client-side load.
    - **Client Components:** Used for any component requiring interactivity (e.g., buttons, forms, realtime updates).

---

## 6. Data Lifecycle

### 6.1. Article Cleanup & Per-User Retention
- **Description:** To manage storage costs while providing personalized article retention, the system implements per-user article visibility.
- **Implementation:**
  - A `pg_cron` job runs the `delete_old_articles()` PostgreSQL function every day at midnight UTC.
  - A new `get_user_visible_articles()` function controls which articles each user can see.
- **Logic:**
  - **Article Deletion:** Articles older than **60 days** with no saved_articles entries are permanently deleted from the database.
  - **Per-User Visibility:** Each user sees:
    - All articles from the last **30 days** (regardless of save status)
    - Their own saved articles (regardless of age)
  - **Key Benefit:** If User1 saves an article, it remains visible only to User1 after 30 days, not to other users who didn't save it.
- **User Impact:**
  - The main feed shows recent articles (< 30 days) plus the user's saved articles.
  - Saved articles are preserved indefinitely for the user who saved them.
  - Articles saved by other users don't clutter your feed after 30 days.
  - True per-user article retention based on individual user actions.