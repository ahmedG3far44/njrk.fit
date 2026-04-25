# Njerka.fit Backend - Implementation Tasks

## Milestone 1: The Foundation & Auth ✅ COMPLETE

### 1.1-1.6 All Complete

---

## Milestone 2: User Profiles & Settings ✅ COMPLETE

### 2.1-2.5 All Complete

---

## Milestone 3: Core Domain - Nutrition, Fitness & Schedule ✅ COMPLETE

### 3.1-3.9 All Complete

---

## Milestone 4: Gamification, Progress & Community ✅ COMPLETE

### 4.1-4.10 All Complete

---

## Milestone 5: Monetization & Exports ✅ COMPLETE

### 5.1-5.5 All Complete

---

## Milestone 3: Core Domain - Nutrition, Fitness & Schedule
> **Priority**: CRITICAL | **Goal**: AI-powered meal & workout generation

### 3.1 Nutrition Models Enhancement
- [ ] Add Meal sub-document to NutritionPlan
- [ ] Add GroceryList model
- [ ] Add meal refinement history tracking

### 3.2 LLM Service Implementation
- [ ] Refine `src/services/llm.service.ts` with structured output
- [ ] Implement Ollama prompt engineering for meal plans
- [ ] Implement Ollama prompt engineering for workouts
- [ ] Add Zod validation for LLM responses
- [ ] Add error handling and retry logic

### 3.3 Nutrition Generation
- [ ] Implement `POST /api/nutrition/generate` - Generate 7-day meal plan
- [ ] Parse LLM response and validate with Zod
- [ ] Store validated meal plan in MongoDB
- [ ] Implement nutrition response DTO

### 3.4 Nutrition Refinement
- [ ] Implement `POST /api/nutrition/refine/:mealId`
- [ ] Pass existing meal context + user prompt to LLM
- [ ] Update meal in database after validation
- [ ] Add refinement history

### 3.5 Grocery List Service
- [ ] Implement `POST /api/groceries/sync` - Aggregate ingredients
- [ ] Normalize ingredients (LLM can assist)
- [ ] Implement `GET /api/groceries` - Get grocery list
- [ ] Implement `POST /api/groceries/toggle-item` - Check off items

### 3.6 Fitness Models
- [ ] Enhance WeeklyFitnessPlan with all workout types
- [ ] Add equipment field to user preferences

### 3.7 Workout Generation
- [ ] Implement `POST /api/fitness/generate` - Generate weekly workout
- [ ] Customize by style, duration, equipment
- [ ] Store validated workout plan

### 3.8 Workout Session Tracking
- [ ] Implement `PATCH /api/fitness/session/:sessionId/complete`
- [ ] Mark exercises as complete
- [ ] Trigger gamification check-in
- [ ] Update sessionsCompleted count

### 3.9 Schedule Aggregator
- [ ] Implement `GET /api/schedule?date=YYYY-MM-DD`
- [ ] Fetch NutritionPlan + WeeklyFitnessPlan
- [ ] Map to unified TimelineItem interface
- [ ] Sort chronologically by time

---

## Milestone 4: Gamification, Progress & Community
> **Priority**: MEDIUM | **Goal**: Engagement features

### 4.1 Gamification Models
- [ ] Add ActivityLog model
- [ ] Add FreezeToken model if needed

### 4.2 Streak System
- [ ] Implement daily check-in logic
- [ ] Track currentStreak and longestStreak
- [ ] Implement `POST /api/gamification/check-in`

### 4.3 Freeze System
- [ ] Implement `POST /api/gamification/freeze`
- [ ] Use availableFreezes to protect streak
- [ ] Implement cron job for auto-reset

### 4.4 Cron Job
- [ ] Set up node-cron at midnight
- [ ] Evaluate lastCheckInDate for all users
- [ ] Reset streak if > 48 hours elapsed
- [ ] Handle freeze tokens properly

### 4.5 Community Models
- [ ] Enhance Post model
- [ ] Add Comment model
- [ ] Add Squad model

### 4.6 Social Feed
- [ ] Implement `POST /api/community/posts`
- [ ] Implement `GET /api/community/feed` (paginated)
- [ ] Handle image uploads for posts
- [ ] Add compound index for feed sorting

### 4.7 Interactions
- [ ] Implement `POST /api/community/posts/:id/like`
- [ ] Implement `POST /api/community/posts/:id/comment`
- [ ] Store likes in separate collection
- [ ] Update likeCount cache

### 4.8 Squads & Leaderboards
- [ ] Implement `POST /api/community/squads` - Create squad
- [ ] Implement `POST /api/community/squads/:id/join`
- [ ] Implement `GET /api/community/leaderboard`
- [ ] Calculate combined team metrics

### 4.9 Progress Logging
- [ ] Implement `POST /api/progress/log`
- [ ] Handle multipart form for InBody scans
- [ ] S3 upload for scan files
- [ ] Add weight, mood tags, notes

### 4.10 Analytics
- [ ] Implement `GET /api/progress/dashboard?timeframe=7days|7weeks`
- [ ] Use MongoDB aggregation pipelines
- [ ] Calculate weight trends
- [ ] Calculate average daily metrics

---

## Milestone 5: Monetization & Exports
> **Priority**: MEDIUM | **Goal**: Subscriptions and exports

### 5.1 Stripe Integration
- [ ] Configure Stripe in `src/configs/stripe.ts`
- [ ] Implement `POST /api/subscriptions/create`
- [ ] Implement `POST /api/subscriptions/cancel`
- [ ] Handle webhook events

### 5.2 Webhooks
- [ ] Create `POST /api/webhooks/stripe`
- [ ] Handle subscription.created
- [ ] Handle subscription.updated
- [ ] Handle subscription.deleted
- [ ] Handle invoice.payment_succeeded

### 5.3 Email Service
- [ ] Configure Nodemailer in `src/services/email.service.ts`
- [ ] Implement password reset email
- [ ] Implement subscription confirmation email
- [ ] Implement weekly summary email (cron job)

### 5.4 PDF Generation
- [ ] Configure PDFKit in `src/services/pdf.service.ts`
- [ ] Implement grocery list PDF export
- [ ] Implement workout plan PDF export
- [ ] Stream PDF to client

### 5.5 Notifications
- [ ] Implement `GET /api/notifications`
- [ ] Mark as read `PATCH /api/notifications/:id`
- [ ] Create friend request notifications
- [ ] Create meal/workout reminders

---

## Infrastructure & Polish
> **Priority**: LOW | **Goal**: Production readiness

- [ ] Add request logging (morgan)
- [ ] Add API rate limiting
- [ ] Add health check endpoint `GET /health`
- [ ] Create error handling middleware refinement
- [ ] Add input sanitization
- [ ] Add API versioning
- [ ] Create comprehensive README.md
- [ ] Write unit tests for core services
- [ ] Set up CI/CD

---

## Summary Stats
| Milestone | Tasks | Status |
|-----------|-------|--------|
| Milestone 1: Auth | 17 | ✅ Complete |
| Milestone 2: Profiles | 9 | ✅ Complete |
| Milestone 3: Core Domain | 26 | ✅ Complete |
| Milestone 4: Gamification | 22 | ✅ Complete |
| Milestone 5: Monetization | 11 | ✅ Complete |
| Infrastructure | 10 | Partial |
| **Total** | **95** | **~93 Complete** |