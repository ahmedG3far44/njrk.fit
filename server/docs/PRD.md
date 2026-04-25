### 2. Product Requirements Document (PRD)

# PRD: [Njerka.fit](http://Njerka.fit) Backend Ecosystem

## 1. Product Overview

**[Njerka.fit](http://Njerka.fit)** is an AI-driven, highly personalized health and fitness platform. It leverages local Large Language Models (Gemma4 via Ollama) to dynamically generate tailored nutrition and workout plans. The platform distinguishes itself through deep gamification, community engagement, and granular progress tracking, operating on a freemium/subscription model.

## 2. Technical Stack


|                   |                                            |
| ----------------- | ------------------------------------------ |
| **Category**      | **Technology**                             |
| **Core**          | Node.js, Express.js, TypeScript            |
| **Database**      | MongoDB (Mongoose ORM)                     |
| **Validation**    | Zod                                        |
| **AI Engine**     | Ollama (Gemma4 model) - Local/Cloud hosted |
| **Cloud Storage** | AWS S3 (Images, PDFs, InBody Scans)        |
| **Monetization**  | Stripe Billing & Webhooks                  |
| **Utilities**     | PDFKit, Nodemailer, node-cron, Multer      |


## 3. Core Features & Specifications

### 3.1 Authentication & User Management

- **Registration/Login:** Support for traditional Email/Password (hashed via bcrypt) and OAuth (Google & Apple via respective libraries).
- **Session Management:** Stateless authentication using JWTs.
- **Profile Settings:** Users can manage personal information, update physical statistics (weight, goals), and manage preferences.
- **Avatar Upload:** Direct-to-S3 image upload via multipart form data handling.

### 3.2 AI Nutrition Engine

- **Plan Generation:** The backend sends user stats and goals to the local LLM to generate a 7-day meal plan, including calculated macros (protein, carbs, fats, calories).
- **Structured Output:** LLM responses must be strictly validated against Zod schemas before database insertion to ensure relational integrity.
- **Interactive Refinement:** Users can request meal swaps or modifications (e.g., "Make it under 15 mins", "I don't have eggs today"). The backend passes the existing meal context + the new prompt to the LLM for regeneration.
- **Grocery Aggregation:** Automated extraction and normalization of ingredients from the weekly plan into a centralized, checkable Grocery List.

### 3.3 AI Fitness Hub

- **Workout Generation:** LLM-generated weekly training schedules customized by style (Strength, Cardio, Yoga), duration, and user equipment.
- **Session Tracking:** Users can mark individual exercises or entire daily sessions as complete, which feeds into the gamification engine.

### 3.4 Aggregated Daily Schedule

- **Unified Timeline:** A read-only aggregator endpoint that merges data from the `NutritionPlan` and `WeeklyFitnessPlan` collections, sorting them chronologically to provide a seamless "Day at a Glance" view.

### 3.5 Gamification System

- **Streak Tracking:** Automated incrementing of daily streaks upon logging a meal or completing a workout.
- **Streak Protection:** A "Freeze" token system that users can apply to protect their streak if they miss a day.
- **Automated Resets:** A midnight chron job (`node-cron`) that evaluates all user `lastCheckInDate` fields and resets streaks to zero if 48 hours have elapsed without a freeze.

### 3.6 Progress & Analytics

- **Data Logging:** Users can log current weight, mood tags, textual notes, and upload complex medical/fitness scans (e.g., InBody scans) to S3.
- **Data Aggregation:** The backend will utilize MongoDB Aggregation Pipelines to serve timeframe-based data (e.g., "Last 7 Weeks") for frontend charting, calculating weight trends, and average daily metrics.
- **Feedback Loop:** Progress logs and user notes are fed back into the LLM context to automatically recalibrate future meal and fitness plans (e.g., adjusting calories if weight plateaus).

### 3.7 Community & Social Hub

- **Global Feed:** A paginated social feed where users can post text and images.
- **Interactions:** Users can "Like" and "Comment" on posts. Likes are stored in a relational-style secondary collection to prevent massive array growth on single posts.
- **Squads & Leaderboards:** Users can join "Squads." The backend will calculate combined team metrics (e.g., total workouts completed this week) to generate competitive leaderboards.

### 3.8 Notifications & Exports

- **In-App Alerts:** A persistent notification system for friend requests, meal reminders, and team challenges.
- **PDF Generation:** Server-side generation of Grocery Lists and Workout Plans using `PDFKit`, streamed directly to the client for download or printing.
- **Transactional Emails:** Automated emails for password resets, subscription confirmations, and weekly summaries via `Nodemailer`.

