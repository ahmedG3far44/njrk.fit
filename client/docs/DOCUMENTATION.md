# Njerka.fit API Documentation

**Base URL:** `http://localhost:8080/api`

---

## Authentication

### Cookie-based (Primary)
- **Access Token:** Stored in `accessToken` cookie (httpOnly, 24 hours)
- **Refresh Token:** Stored in `refreshToken` cookie (httpOnly, 30 days)
- Both use JWT with `JWT_SECRET` and `JWT_REFRESH_SECRET`

### Bearer Token (Alternative)
```http
Authorization: Bearer <access_token>
```

### Middleware
| Middleware | Description |
|------------|-------------|
| `authMiddleware` | Verifies access token; falls back to refresh token if expired; auto-refreshes if valid |
| `requireAuth` | Only accepts Bearer token (no cookie fallback) |

---

## Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Conditional | `Bearer <token>` when not using cookies |
| `Cookie` | Conditional | `accessToken=...; refreshToken=...` when not using Bearer |
| `Content-Type` | For POST/PUT/PATCH | `application/json` or `multipart/form-data` |
| `stripe-signature` | Yes (webhook only) | Stripe webhook signature verification |

---

## Error Codes

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Invalid/expired token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found |
| `410` | Gone - Resource expired (e.g., shared grocery link) |
| `500` | Server Error |

---

## File Upload Specifications

| Endpoint | Max Size | Formats |
|----------|----------|---------|
| Avatar upload | 5MB | JPEG, PNG, WebP |
| Progress scan | 10MB | Image, PDF |
| Community media | 10MB | JPEG, PNG, WebP |

---

## Endpoints

---

### Auth Routes (`/api/auth`)

#### `GET /auth/google`
Initiates Google OAuth flow.

| Auth | Content-Type |
|------|-------------|
| No | - |

**Response (302):** Redirects to Google OAuth consent page.

---

#### `GET /auth/google/callback`
Handles OAuth callback from Google.

| Auth | Content-Type |
|------|-------------|
| No | - |

**Response (302):** Redirects to frontend with tokens in cookies.

---

#### `POST /auth/register`
Register a new user.

| Auth | Content-Type |
|------|-------------|
| No | `application/json` |

**Request Body:**
```json
{
  "email": "string (valid email, required)",
  "password": "string (min 8 characters, required)",
  "name": "string (required, max 100 chars)"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": { ... },
  "accessToken": "string",
  "refreshToken": "string",
  "redirect": "http://CLIENT_URL/..."
}
```

---

#### `POST /auth/login`
Login with credentials.

| Auth | Content-Type |
|------|-------------|
| No | `application/json` |

**Request Body:**
```json
{
  "email": "string (valid email, required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": { ... },
  "accessToken": "string",
  "refreshToken": "string",
  "redirect": "http://CLIENT_URL/..."
}
```

---

#### `POST /auth/refresh-token`
Refresh access token.

| Auth | Content-Type |
|------|-------------|
| No | - |

**Headers:** Requires `refreshToken` cookie.

**Response (200):**
```json
{
  "accessToken": "string"
}
```

---

#### `POST /auth/logout`
Clear auth cookies.

| Auth | Content-Type |
|------|-------------|
| No | - |

**Response (200):**
```json
{
  "success": true
}
```

---

#### `POST /auth/forgot-password`
Request password reset email.

| Auth | Content-Type |
|------|-------------|
| No | `application/json` |

**Request Body:**
```json
{
  "email": "string (valid email, required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

#### `POST /auth/reset-password`
Reset password with token.

| Auth | Content-Type |
|------|-------------|
| No | `application/json` |

**Request Body:**
```json
{
  "token": "string (required)",
  "newPassword": "string (min 8 characters, required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

#### `POST /auth/onboarding`
Complete user onboarding.

| Auth | Content-Type |
|------|-------------|
| Yes (authMiddleware) | `application/json` |

**Request Body:**
```json
{
  "age": "number (13-100, required)",
  "gender": "male | female (required)",
  "height": "number (100-250 cm, required)",
  "weight": "number (10-200 kg, required)",
  "allergies": ["string"] (optional),
  "activityLevel": "sedentary | light | moderate | active | very_active (required)",
  "religion": "muslim | christian (required)",
  "dietaryRestrictions": ["string"] (optional),
  "medicalDocuments": ["string"] (optional),
  "userGoal": "lose_weight | gain_weight | maintain_weight (required)",
  "targetWeight": "number (required)",
  "fitnessGoal": "string (required)"
}
```

**Response (201):**
```json
{
  "message": "User onboarded successfully",
  "redirect": "http://CLIENT_URL/dashboard/insights"
}
```

---

### User Routes (`/api/users`)

#### `GET /users/me`
Get current user profile.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
```json
{
  "user": {
    "_id": "string",
    "email": "string",
    "name": "string",
    "avatarUrl": "string",
    "onboardingCompleted": "boolean",
    "subscriptionTier": "string",
    ...
  }
}
```

---

#### `PATCH /users/me`
Update user profile.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Request Body:**
```json
{
  "name": "string (optional)",
  "height": "number (optional, max 300)",
  "weight": "number (optional, max 500)",
  "age": "number (optional, 13-120)",
  "activityLevel": "sedentary | light | moderate | active | very_active (optional)",
  "fitnessGoals": ["string"] (optional)",
  "dietaryRestrictions": ["string"] (optional)",
  "equipment": ["string"] (optional)",
  "preferences": {
    "notifications": "boolean (optional)",
    "weeklySummary": "boolean (optional)",
    "mealReminders": "boolean (optional)"
  }
}
```

**Response (200):** Updated user object.

---

#### `DELETE /users/me`
Delete user account.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
```json
{
  "success": true,
  "message": "Account deleted"
}
```

---

#### `POST /users/me/avatar`
Upload user avatar.

| Auth | Content-Type |
|------|-------------|
| Yes | `multipart/form-data` |

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `avatar` | file | Yes | Image file (JPEG, PNG, WebP; max 5MB) |

**Response (200):**
```json
{
  "user": { ... },
  "avatarUrl": "string (S3 URL)"
}
```

---

### Family Routes (`/api/family`)

#### `GET /api/family`
Get family members and pending invitations.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
```json
{
  "familyMembers": [
    {
      "_id": "string",
      "name": "string",
      "avatarUrl": "string",
      "email": "string"
    }
  ],
  "pendingInvitations": [
    {
      "id": "string",
      "user": {
        "id": "string",
        "name": "string",
        "avatarUrl": "string"
      }
    }
  ]
}
```

---

#### `GET /api/family/search`
Search users by name/email.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (min 2 chars) |

**Response (200):**
```json
{
  "results": [
    {
      "id": "string",
      "name": "string",
      "avatarUrl": "string",
      "username": "string#XXXX"
    }
  ]
}
```

---

#### `POST /api/family/invite`
Send family invitation.

| Auth | Content-Type |
|------|-------------|
| Yes (FAMILY tier required) | `application/json` |

**Request Body:**
```json
{
  "targetUserId": "string (required)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Invitation sent"
}
```

---

#### `POST /api/family/respond`
Accept/reject family invitation.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Request Body:**
```json
{
  "invitationId": "string (required)",
  "action": "accept | reject (required)"
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

### Export Routes (`/api/export`)

#### `GET /api/export/meal/pdf`
Export nutrition plan as PDF.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
- **Content-Type:** `application/pdf`
- **Headers:** `Content-Disposition: attachment; filename="meal.pdf"`
- **Body:** Binary PDF file

---

#### `GET /api/export/fitness/pdf`
Export workout plan as PDF.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
- **Content-Type:** `application/pdf`
- **Headers:** `Content-Disposition: attachment; filename="workout.pdf"`
- **Body:** Binary PDF file

---

#### `GET /api/export/grocery/pdf`
Export grocery list as PDF.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
- **Content-Type:** `application/pdf`
- **Headers:** `Content-Disposition: attachment; filename="grocery.pdf"`
- **Body:** Binary PDF file

---

### Fitness Routes (`/api/fitness`)

#### `POST /api/fitness/generate`
Generate workout plan.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Request Body:**
```json
{
  "duration": "number (15-120, default 60)",
  "equipment": ["string"] (default [])",
  "startDate": "string (ISO date, optional)"
}
```

**Response (201):**
```json
{
  "workoutPlan": {
    "_id": "string",
    "userId": "string",
    "startDate": "date",
    "endDate": "date",
    "sessionsCompleted": "number",
    "sessions": [
      {
        "_id": "string",
        "dayOfWeek": "string",
        "name": "string",
        "type": "string",
        "durationMin": "number",
        "exercises": [...],
        "isCompleted": "boolean"
      }
    ]
  }
}
```

---

#### `PATCH /api/fitness/session/:sessionId/complete`
Mark session as complete.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | Session ID |

**Request Body:**
```json
{
  "exerciseIndices": [0, 1, 2] (optional - specific exercises to mark complete)
}
```

**Response (200):**
```json
{
  "workoutPlan": { ... },
  "sessionCompleted": { ... }
}
```

**Points Awarded:** 50 points

---

#### `GET /api/fitness/current`
Get current workout plan.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | Yes | `day` or `week` |

**Response (200):**
```json
{
  "data": [...] // Workout sessions for the day/week
}
```

---

### Grocery Routes (`/api/groceries`)

#### `GET /api/groceries`
Get grocery list.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `daysAhead` | number | No | Days ahead (default 7) |

**Response (200):**
```json
{
  "items": [
    {
      "name": "string",
      "category": "string",
      "quantity": "string",
      "checked": "boolean",
      "isPurchased": "boolean"
    }
  ],
  "purchasedCount": "number",
  "totalCount": "number",
  "categories": ["Proteins", "Vegetables", "Dairy", "Grains", "Fruits", "Spices", "Other"]
}
```

---

#### `POST /api/groceries/sync`
Sync grocery list from nutrition plan.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Request Body:**
```json
{
  "daysAhead": "number (default 7)",
  "isFamily": "boolean (default false)"
}
```

**Response (200):**
```json
{
  "items": [...],
  "purchasedCount": "number",
  "totalCount": "number",
  "syncedAt": "date"
}
```

---

#### `POST /api/groceries/toggle-item`
Toggle item purchased status.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Request Body:**
```json
{
  "itemName": "string (required)",
  "checked": "boolean (required)"
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

#### `POST /api/groceries/add-item`
Add item to grocery list.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Request Body:**
```json
{
  "name": "string (required)",
  "quantity": "string (default '1')",
  "category": "string (default 'Other')"
}
```

**Response (201):**
```json
{
  "success": true
}
```

---

#### `POST /api/groceries/share`
Create shared grocery list.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (201):**
```json
{
  "success": true,
  "shareUrl": "/shared-list/{token}"
}
```

---

#### `GET /api/groceries/shared/:token`
View shared grocery list (public).

| Auth | Content-Type |
|------|-------------|
| No | - |

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Share token |

**Response (200):**
```json
{
  "items": [...],
  "expiresAt": "date"
}
```

**Error (410):** Link has expired

---

### Progress Routes (`/api/progress`)

#### `POST /api/progress/log`
Log progress entry.

| Auth | Content-Type |
|------|-------------|
| Yes | `multipart/form-data` |

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scanFile` | file | No | Image/PDF (max 10MB) |
| `weightKg` | string | No | Weight in kg |
| `bodyFatPercentage` | string | No | Body fat % |
| `muscleMass` | string | No | Muscle mass |
| `dailySteps` | string | No | Daily steps |
| `tags` | JSON string array | No | Tags |
| `notes` | string | No | Notes |
| `source` | string | No | `'manual'` or `'inbody_scan'` (default `'manual'`) |

**Response (201):**
```json
{
  "progressLog": {
    "_id": "string",
    "userId": "string",
    "date": "date",
    "weightKg": "number",
    "bodyFatPercentage": "number",
    "muscleMass": "number",
    "dailySteps": "number",
    "tags": ["string"],
    "notes": "string",
    "scanFileUrl": "string",
    "source": "string"
  }
}
```

**Points Awarded:** 15 points

---

#### `GET /api/progress/dashboard`
Get progress dashboard data.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `timeframe` | string | No | `'7days'` \| `'30days'` \| `'7weeks'` (default `'7days'`) |

**Response (200):**
```json
{
  "timeframe": "string",
  "weightTrend": [
    {
      "_id": "YYYY-MM-DD",
      "weightKg": "number",
      "logs": [...]
    }
  ],
  "latestWeight": "number",
  "totalLogs": "number"
}
```

---

#### `GET /api/progress/history`
Get progress history.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default 1) |
| `limit` | number | No | Items per page (default 20) |

**Response (200):**
```json
{
  "logs": [...],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

---

#### `POST /api/progress/extract-inbody`
Extract data from InBody scan.

| Auth | Content-Type |
|------|-------------|
| Yes | `multipart/form-data` |

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scanFile` | file | Yes | Image/PDF of InBody scan (max 10MB) |

**Response (200):**
```json
{
  "extracted": {
    "weightKg": "number",
    "bodyFatPercentage": "number",
    "muscleMass": "number"
  }
}
```

---

#### `GET /api/progress/feelings`
Get feelings/notes logs.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `days` | number | No | Number of days (default 7) |

**Response (200):**
```json
{
  "feelings": [
    {
      "date": "date",
      "tags": ["string"],
      "notes": "string"
    }
  ]
}
```

---

### Schedule Routes (`/api/schedule`)

#### `GET /api/schedule`
Get daily timeline (meals + workouts).

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | No | ISO date string (defaults to today) |

**Response (200):**
```json
{
  "date": "YYYY-MM-DD",
  "timeline": [
    {
      "type": "meal",
      "id": "string",
      "name": "string",
      "time": "string",
      "details": {
        "macros": {...},
        "ingredients": [...],
        "instructions": [...]
      }
    },
    {
      "type": "workout",
      "id": "string",
      "name": "string",
      "time": "string",
      "details": {
        "type": "string",
        "durationMin": "number",
        "estimatedCaloriesBurn": "number",
        "exercises": [...],
        "isCompleted": "boolean"
      }
    }
  ]
}
```

---

#### `PATCH /api/schedule/:itemId/complete`
Mark schedule item complete.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `itemId` | string | Yes | Schedule item ID |

**Request Body:**
```json
{
  "isCompleted": "boolean (required)"
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

### Webhook Routes (`/api/webhook`)

#### `POST /api/webhook/stripe`
Handle Stripe webhook events.

| Auth | Content-Type |
|------|-------------|
| No (Stripe signature verification) | Raw body |

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `stripe-signature` | Yes | Stripe webhook signature |

**Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Response (200):**
```json
{
  "received": true
}
```

---

### Community Routes (`/api/community`)

#### `POST /api/community/posts`
Create a post.

| Auth | Content-Type |
|------|-------------|
| Yes | `multipart/form-data` |

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `media` | file | No | Image file (JPEG/PNG/WebP; max 10MB) |
| `content` | string | Yes | Post content |

**Response (201):**
```json
{
  "post": {
    "_id": "string",
    "userId": "string",
    "content": "string",
    "mediaUrl": "string",
    "likeCount": "number",
    "commentCount": "number",
    "createdAt": "date"
  }
}
```

---

#### `GET /api/community/test`
Test endpoint (returns mock data).

| Auth | Content-Type |
|------|-------------|
| No | - |

**Response (200):** Returns mock posts data.

---

#### `GET /api/community/feed`
Get community feed.

| Auth | Content-Type |
|------|-------------|
| No (uses auth if available) | - |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default 1) |
| `limit` | number | No | Items per page (default 10) |

**Response (200):**
```json
{
  "posts": [
    {
      "_id": "string",
      "userId": { "name": "string", "avatarUrl": "string" },
      "content": "string",
      "mediaUrl": "string",
      "likeCount": "number",
      "commentCount": "number",
      "isLiked": "boolean",
      "createdAt": "date"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

---

#### `DELETE /api/community/posts/:id`
Delete a post.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Post ID |

**Response (200):**
```json
{
  "success": true
}
```

---

#### `PUT /api/community/posts/:id/like`
Toggle like on post.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Post ID |

**Response (201):** Liked
**Response (200):** Unliked
```json
{
  "success": true,
  "message": "Post liked/unliked successfully",
  "count": "number"
}
```

---

#### `GET /api/community/posts/:id/comments`
Get comments for a post.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Post ID |

**Response (200):**
```json
{
  "comments": [
    {
      "_id": "string",
      "postId": "string",
      "userId": { "name": "string", "avatarUrl": "string" },
      "content": "string",
      "createdAt": "date"
    }
  ]
}
```

---

#### `POST /api/community/posts/:id/comment`
Add comment to post.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Post ID |

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Response (201):**
```json
{
  "comment": { ... }
}
```

---

#### `DELETE /api/community/posts/:id/comment/:commentId`
Delete a comment.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Post ID |
| `commentId` | string | Yes | Comment ID |

**Response (200):**
```json
{
  "comment": { ... }
}
```

---

### Nutrition Routes (`/api/nutrition`)

#### `POST /api/nutrition/generate`
Generate meal plan.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Request Body:**
```json
{
  "calories": "number (positive, optional)",
  "startDate": "string (ISO date, optional)",
  "userId": "string (optional - premium feature for family mode)"
}
```

**Response (201):**
```json
{
  "plan": {
    "_id": "string",
    "userId": "string",
    "date": "date",
    "targetMacros": {
      "calories": "number",
      "protein": "number",
      "carbs": "number",
      "fat": "number"
    },
    "meals": [
      {
        "_id": "string",
        "day": "Day 1-7",
        "name": "string",
        "time": "string",
        "macros": {...},
        "ingredients": [...],
        "instructions": [...]
      }
    ]
  }
}
```

---

#### `POST /api/nutrition/refine/:mealId`
Refine specific meal.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mealId` | string | Yes | Meal ID |

**Request Body:**
```json
{
  "refinement": "string (required)",
  "dayIndex": "number (0-6, optional)"
}
```

**Response (200):**
```json
{
  "plan": { ... }
}
```

---

#### `GET /api/nutrition/current`
Get current nutrition plan.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | No | User ID (premium feature) |
| `date` | string | No | `'today'` \| `'week'` |

**Response (200):**
```json
{
  "meals": [...],
  "targetMacros": {...}
}
```

---

#### `GET /api/nutrition/week`
Get weekly nutrition plans.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | No | User ID (premium feature) |
| `startDate` | string | No | ISO date |

**Response (200):**
```json
{
  "nutritionPlans": [...]
}
```

---

#### `POST /api/nutrition/log-meal`
Log meal completion.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Request Body:**
```json
{
  "mealName": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "Meal logged, points awarded"
}
```

**Points Awarded:** 25 points

---

### Gamification Routes (`/api/gamification`)

#### `POST /api/gamification/check-in`
Daily check-in.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
```json
{
  "currentStreak": "number",
  "longestStreak": "number",
  "availableFreezes": "number",
  "isFirstCheckIn": "boolean",
  "isFrozen": "boolean",
  "message": "string"
}
```

**Points Awarded:** 10 points

---

#### `POST /api/gamification/freeze`
Use freeze token.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Request Body:**
```json
{
  "timezoneOffset": "number (optional, default 0)"
}
```

**Response (200):**
```json
{
  "success": true,
  "availableFreezes": "number",
  "message": "Streak protected with freeze token."
}
```

---

#### `POST /api/gamification/apply-freeze`
Apply streak freeze.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
```json
{
  "success": true,
  "currentStreak": "number",
  "message": "Streak frozen for today."
}
```

---

#### `GET /api/gamification/status`
Get gamification status.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
```json
{
  "currentStreak": "number",
  "longestStreak": "number",
  "lastCheckInDate": "date",
  "availableFreezes": "number",
  "totalPoints": "number",
  "pointsToRedeem": "number"
}
```

---

#### `GET /api/gamification/insights`
Get user insights.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):** User insights object.

---

#### `GET /api/gamification/activity`
Get activity history.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `timezoneOffset` | number | No | Timezone offset (default 0) |
| `month` | number | No | Month number |
| `year` | number | No | Year number |

**Response (200):** Activity history array.

---

#### `GET /api/gamification/rewards`
Get available rewards.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
```json
{
  "rewards": [...]
}
```

---

#### `POST /api/gamification/rewards/claim`
Claim a reward.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Request Body:**
```json
{
  "rewardId": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  ...
}
```

---

### Subscription Routes (`/api/subscriptions`)

#### `POST /api/subscriptions/create`
Create/upgrade subscription.

| Auth | Content-Type |
|------|-------------|
| Yes | `application/json` |

**Request Body:**
```json
{
  "planId": "string (Stripe price ID, required)"
}
```

**Response (201):**
```json
{
  "subscriptionId": "string",
  "status": "string",
  "prorated": "boolean"
}
```

---

#### `POST /api/subscriptions/create-portal-session`
Create billing portal session.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
```json
{
  "url": "string (Stripe billing portal URL)"
}
```

---

#### `POST /api/subscriptions/cancel`
Cancel subscription.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
```json
{
  "message": "Subscription will cancel at period end"
}
```

---

#### `GET /api/subscriptions/status`
Get subscription status.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
```json
{
  "status": "string",
  "planId": "string",
  "currentPeriodEnd": "date",
  "cancelAtPeriodEnd": "boolean",
  "subscriptionTier": "string"
}
```

---

#### `POST /api/subscriptions/portal`
Get billing portal URL.

| Auth | Content-Type |
|------|-------------|
| Yes | - |

**Response (200):**
```json
{
  "url": "string"
}
```

---

### Health Routes

#### `GET /`
Health check.

| Auth | Content-Type |
|------|-------------|
| No | - |

**Response (200):** HTML page `<h1>Njerka.fit AI Powered App Server is running!</h1>`

---

#### `GET /health`
JSON health check.

| Auth | Content-Type |
|------|-------------|
| No | - |

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "ISO date string"
}
```

---

## Points System

| Action | Points |
|--------|--------|
| First check-in | 10 |
| Daily check-in | 10 |
| Complete workout session | 50 |
| Log meal | 25 |
| Log progress | 15 |

---

## Notes

1. **Leaderboard route** exists in codebase but is NOT registered in `app.ts` - not currently active.

2. **Community feed** does NOT require auth but includes user like status if authenticated.

3. **Shared grocery list** endpoint does NOT require authentication.

4. **Stripe webhook** uses Stripe signature verification instead of standard auth.

5. All authenticated endpoints support both cookie-based and Bearer token authentication.
