# Njerka.fit Backend API Documentation

---

## Phase 1: Authentication & User Management (IMPLEMENTED)

### POST /api/auth/register
Register a new user with email and password.

**Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "min8characters",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "user": { "_id": "...", "email": "...", "name": "...", ... },
  "accessToken": "JWT",
  "refreshToken": "JWT"
}
```

**Error:** 400, 500

---

### POST /api/auth/login
Login with email and password.

**Headers:** `Content-Type: application/json`

**Request Body:**
```json
{ "email": "user@example.com", "password": "password" }
```

**Response (200):** `{ "user": {...}, "accessToken": "...", "refreshToken": "..." }`

**Error:** 400, 401

---

### POST /api/auth/refresh-token
Refresh access token.

**Headers:** `Authorization: Bearer <refresh_token>`

**Response (200):** `{ "accessToken": "...", "refreshToken": "..." }`

**Error:** 401

---

### POST /api/auth/logout
Logout (client-side token removal).

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):** `{ "message": "Logged out successfully" }`

---

### POST /api/auth/forgot-password
Request password reset.

**Headers:** `Content-Type: application/json`

**Request Body:** `{ "email": "user@example.com" }`

**Response (200):** `{ "message": "Password reset email sent" }`

---

### POST /api/auth/reset-password
Reset password with token.

**Headers:** `Content-Type: application/json`

**Request Body:** `{ "token": "...", "newPassword": "min8chars" }`

**Response (200):** `{ "message": "Password reset successfully" }`

---

### GET /api/auth/google
Redirect to Google OAuth. *(Requires GOOGLE_CLIENT_ID)*

**Response:** 302

---

### GET /api/auth/google/callback
Google OAuth callback.

**Response:** 302 Redirect with tokens

---

## Phase 2: User Profiles (IMPLEMENTED)

### GET /api/users/me
Get current user profile.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "user": {
    "_id": "...",
    "email": "...",
    "name": "...",
    "avatarUrl": "...",
    "height": 180,
    "weight": 75,
    "age": 25,
    "activityLevel": "moderate",
    "fitnessGoals": ["Build muscle", "Lose fat"],
    "dietaryRestrictions": [],
    "equipment": ["dumbbells"],
    "subscription": { "planId": "...", "status": "active" },
    "currentStreak": 5,
    "longestStreak": 15,
    "availableFreezes": 2,
    "preferences": { "notifications": true, "weeklySummary": true, "mealReminders": true }
  }
}
```

**Error:** 401, 404

---

### PATCH /api/users/me
Update user profile.

**Headers:** 
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John",
  "height": 180,
  "weight": 75,
  "age": 25,
  "activityLevel": "moderate",
  "fitnessGoals": ["Build muscle"],
  "dietaryRestrictions": ["gluten-free"],
  "equipment": ["dumbbells", "barbell"],
  "preferences": { "notifications": true, "weeklySummary": false }
}
```

**Response (200):** `{ "user": {...} }`

**Error:** 400, 401, 404

---

### DELETE /api/users/me
Delete user account.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):** `{ "message": "Account deleted successfully" }`

---

### POST /api/users/me/avatar
Upload profile picture.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:** `avatar` (file, max 5MB, JPEG/PNG/WebP)

**Response (200):**
```json
{
  "user": { ... },
  "avatarUrl": "https://s3.../avatars/..."
}
```

**Error:** 400, 401

---

## Phase 3: Nutrition & Fitness (IMPLEMENTED)

### POST /api/nutrition/generate
Generate 7-day meal plan via LLM.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "calories": 2000,
  "startDate": "2026-04-21"
}
```

**Response (201):**
```json
{
  "nutritionPlan": {
    "_id": "...",
    "userId": "...",
    "date": "2026-04-21",
    "targetMacros": { "calories": 2000, "protein": 150, "carbs": 250, "fat": 65 },
    "meals": [
      {
        "day": "Day 1",
        "name": "Oatmeal with Berries",
        "time": "08:00 AM",
        "macros": { "calories": 400, "protein": 20, "carbs": 60, "fat": 10 },
        "ingredients": ["1 cup Oats", "1/2 cup Berries"],
        "instructions": ["Cook oats", "Add berries"]
      }
    ]
  }
}
```

**Error:** 400, 401, 404, 500

---

### POST /api/nutrition/refine/:mealId
Refine a meal based on user feedback.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "refinement": "Make it under 15 mins",
  "dayIndex": 0
}
```

**Response (200):** `{ "nutritionPlan": {...} }`

**Error:** 400, 401, 404

---

### GET /api/nutrition/current
Get today's nutrition plan.

**Headers:** `Authorization: Bearer <access_token>`

**Query:** `?date=2026-04-21`

**Response (200):** `{ "nutritionPlan": {...} }`

**Error:** 401, 404

---

### POST /api/fitness/generate
Generate weekly workout plan via LLM.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "duration": 60,
  "equipment": ["dumbbells", "barbell"],
  "startDate": "2026-04-21"
}
```

**Response (201):**
```json
{
  "workoutPlan": {
    "_id": "...",
    "userId": "...",
    "startDate": "2026-04-21",
    "endDate": "2026-04-27",
    "sessionsCompleted": 0,
    "sessions": [
      {
        "dayOfWeek": "Monday",
        "name": "Full Body Strength",
        "type": "Strength",
        "durationMin": 60,
        "estimatedCaloriesBurn": 400,
        "exercises": [
          { "name": "Push-ups", "sets": 3, "reps": "12-15" },
          { "name": "Squats", "sets": 3, "reps": "12-15" }
        ],
        "isCompleted": false
      }
    ]
  }
}
```

**Error:** 400, 401, 404, 500

---

### PATCH /api/fitness/session/:sessionId/complete
Mark workout session as complete.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "exerciseIndices": [0, 1]  // optional, marks specific exercises
}
```

**Response (200):**
```json
{
  "workoutPlan": { ... },
  "sessionCompleted": { "isCompleted": true, ... }
}
```

**Error:** 401, 404

---

### GET /api/fitness/current
Get current week's workout plan.

**Headers:** `Authorization: Bearer <access_token>`

**Query:** `?date=2026-04-21`

**Response (200):** `{ "workoutPlan": {...} }`

**Error:** 401, 404

---

### GET /api/schedule
Get unified daily schedule (meals + workouts).

**Headers:** `Authorization: Bearer <access_token>`

**Query:** `?date=2026-04-21`

**Response (200):**
```json
{
  "date": "2026-04-21",
  "timeline": [
    {
      "type": "meal",
      "id": "...",
      "name": "Oatmeal with Berries",
      "time": "08:00 AM",
      "details": { "macros": {...}, "ingredients": [...], "instructions": [...] }
    },
    {
      "type": "workout",
      "id": "...",
      "name": "Full Body Strength",
      "time": "60 min",
      "details": { "type": "Strength", "durationMin": 60, "exercises": [...], "isCompleted": false }
    }
  ]
}
```

**Error:** 401

---

## Phase 4: Gamification & Community (IMPLEMENTED)

### POST /api/gamification/check-in
Daily check-in for streak tracking.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "currentStreak": 5,
  "longestStreak": 15,
  "availableFreezes": 2,
  "isFirstCheckIn": false,
  "message": "Streak: 5 days"
}
```

---

### POST /api/gamification/freeze
Use freeze token to protect streak.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):** `{ "success": true, "availableFreezes": 1, "message": "Streak protected" }`

**Error:** 400 (No freeze tokens)

---

### GET /api/gamification/status
Get streak status.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):** `{ "currentStreak": 5, "longestStreak": 15, "availableFreezes": 2 }`

---

### POST /api/community/posts
Create social post.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:** `content` (text), `media` (image, optional)

**Response (201):** `{ "post": {...} }`

---

### GET /api/community/feed
Get paginated social feed.

**Headers:** `Authorization: Bearer <access_token>`

**Query:** `?page=1&limit=10`

**Response (200):** `{ "posts": [...], "pagination": {...} }`

---

### POST /api/community/posts/:id/like
Like a post.

**Response (200):** `{ "success": true, "likeCount": 5 }`

---

### DELETE /api/community/posts/:id/like
Unlike a post.

**Response (200):** `{ "success": true, "likeCount": 4 }`

---

### POST /api/community/posts/:id/comment
Comment on a post.

**Headers:** `Content-Type: application/json`

**Request Body:** `{ "content": "Great post!" }`

**Response (201):** `{ "comment": {...} }`

---

### GET /api/community/posts/:id/comments
Get comments on a post.

**Response (200):** `{ "comments": [...] }`

---

### POST /api/progress/log
Log progress (weight, InBody scans).

**Headers:** `multipart/form-data`

**Request Body:** `weightKg` (number), `tags` (JSON array), `notes` (text), `scanFile` (file)

**Response (201):** `{ "progressLog": {...} }`

---

### GET /api/progress/dashboard
Get progress analytics.

**Headers:** `Authorization: Bearer <access_token>`

**Query:** `?timeframe=7days|30days|7weeks`

**Response (200):**
```json
{
  "timeframe": "7days",
  "weightTrend": [{ "_id": "2026-04-21", "weightKg": 75, "logs": [...] }],
  "latestWeight": 75,
  "totalLogs": 5
}
```

---

### GET /api/progress/history
Get progress history.

**Response (200):** `{ "logs": [...], "pagination": {...} }`

---

### GET /api/groceries
Get aggregated grocery list.

**Query:** `?daysAhead=7`

**Response (200):** `{ "items": [{ "name": "Oats", "quantity": "1 cup", "checked": false }], "count": 15 }`

---

### POST /api/groceries/toggle-item
Toggle grocery item.

**Request Body:** `{ "itemName": "Oats", "checked": true }`

**Response (200):** `{ "success": true }`

---

## Phase 5: Monetization & Exports (IMPLEMENTED)

### POST /api/subscriptions/create
Create Stripe subscription.

**Request Body:** `{ "planId": "price_..." }`

**Response (201):** `{ "subscriptionId": "sub_...", "status": "active" }`

---

### POST /api/subscriptions/cancel
Cancel subscription.

**Response (200):** `{ "message": "Subscription cancelled" }`

---

### GET /api/subscriptions/status
Get subscription status.

**Response (200):** `{ "status": "active", "planId": "price_..." }`

---

### POST /api/webhooks/stripe
Stripe webhook endpoint.

**Headers:** `stripe-signature`

**Response (200):** `{ "received": true }`

---

## Health Check

### GET /api/health

**Response (200):** `{ "status": "ok", "timestamp": "..." }`

---
