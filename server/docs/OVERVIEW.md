## Development Milestones:
    ### Milestone 1: The Foundation & Auth
    Set up the repository, Zod environment validation, MongoDB connection, and build the complete Authentication flow (Email/Password, JWT, Google/Apple OAuth).

    ### Milestone 2: User Profiles & Settings
    Configure the core User schema, S3 bucket settings for profile picture uploads, and basic profile CRUD operations.

    ### Milestone 3: Core Domain (Nutrition, Fitness, Schedule)
    Design schemas for meals and workouts. Build llm.service to securely prompt the Gemma model and enforce structured JSON responses for daily/weekly plans.

    ### Milestone 4: Gamification, Progress & Community
    Implement the social feed, streaks, rewards, and leaderboard logic. Create aggregation pipelines for time-series progress tracking.

    ### Milestone 5: Monetization & Exports
    Integrate Stripe and webhook handling for subscriptions, Nodemailer for alerts, and PDFKit for exporting meal/grocery plans.

## Domain Implementations
    ### A. Gamification (Streaks & Rewards)
        Models: User (tracks currentStreak, longestStreak, lastCheckInDate, availableFreezes), ActivityLog.

        Routes: - POST /api/gamification/check-in

        POST /api/gamification/freeze

        Strategy: Use a daily cron job at midnight to reset streaks to 0 if lastCheckInDate is older than 48 hours without a freeze.

    ### B. Nutrition & AI Meal Refinement
        Models: NutritionPlan, Meal (includes ingredients and instructions sub-documents).

        Routes:

        POST /api/nutrition/generate (Creates full plan via LLM)

        POST /api/nutrition/refine/:mealId (Sends user adjustments to LLM)

        Strategy: Enforce strict JSON output from Ollama using Zod schemas to ensure predictable database writes.

    ### C. Fitness Hub
        Models: WeeklyFitnessPlan, WorkoutSession (includes array of Exercise sub-documents).

        Routes:

        POST /api/fitness/generate

        PATCH /api/fitness/session/:sessionId/complete (Triggers gamification check-in)

    ### D. Schedule (Timeline)
        Architecture: Acts as an aggregator route without a dedicated database collection.

        Route: GET /api/schedule?date=YYYY-MM-DD

        Strategy: ScheduleService fetches NutritionPlan and WeeklyFitnessPlan for the date, maps them to a unified TimelineItem interface, sorts by time, and returns the feed.

    ### E. Grocery List & Exports
        Models: GroceryList (contains normalized array of items).

        Routes:

        POST /api/groceries/sync (Aggregates ingredients from upcoming meals)

        GET /api/groceries/export

        Strategy: Generates a formatted document in memory using PDFKit and pipes the stream directly to the Express response.

    ### F. Progress & Analytics
        Models: ProgressLog (includes weight, notes, scanFileUrl), DailyMetric.

        Routes:

        POST /api/progress/log (Handles multipart form uploads to S3)

        GET /api/progress/dashboard?timeframe=7weeks

    Strategy: Utilize MongoDB Aggregation Pipelines ($match, $group) to compile weekly averages and weight trends efficiently. Use progress notes to adjust future AI generation prompts.

    ### G. Community Hub
        Models: Post (includes likeCount cache), Like, Comment, Squad.

        Routes:

        POST /api/community/posts

        GET /api/community/feed (Paginated using .skip() and .limit())

        POST /api/community/posts/:id/like

    ### Strategy: Create a compound index on the Post schema for { createdAt: -1 } to ensure instantaneous feed loading. Store likes in a separate collection to prevent unbounded arrays on the Post document.