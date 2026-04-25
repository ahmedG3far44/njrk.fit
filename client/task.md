# Njerka.fit Frontend Implementation Tasks

This document tracks all frontend development phases and tasks for the Njerka.fit application.

## Project Overview

- **Framework**: React 19 + Vite + Tailwind CSS 4
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **API Base URL**: `http://localhost:8080/api`
- **Backend**: Node.js/Express (documented in `server/DOCS.md`)

---

## Phase 1: Core Infrastructure & Authentication (COMPLETED)

### Tasks Completed:

| # | Task | File | Status |
|---|------|------|--------|
| 1.1 | Install TanStack Query | `package.json` | ✅ |
| 1.2 | Create API client with interceptors | `src/lib/api.ts` | ✅ |
| 1.3 | Create auth service | `src/services/auth.ts` | ✅ |
| 1.4 | Create AuthContext | `src/contexts/AuthContext.tsx` | ✅ |
| 1.5 | Create ProtectedRoute component | `src/components/ProtectedRoute.tsx` | ✅ |
| 1.6 | Build Login page | `src/pages/login.tsx` | ✅ |
| 1.7 | Build Register page | `src/pages/register.tsx` | ✅ |
| 1.8 | Build Forgot password page | `src/pages/forgot-password.tsx` | ✅ |
| 1.9 | Build Reset password page | `src/pages/reset-password.tsx` | ✅ |
| 1.10 | Update App.tsx with routes | `src/App.tsx` | ✅ |

### API Endpoints Connected:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/refresh-token`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/google` (placeholder - Coming soon)

---

## Phase 2: User Profile & Settings (COMPLETED)

### Tasks Completed:

| # | Task | File | Status |
|---|------|------|--------|
| 2.1 | Create user service | `src/services/user.ts` | ✅ |
| 2.2 | Create Profile page | `src/pages/dashboard/profile.tsx` | ✅ |
| 2.3 | Create Profile edit form | `src/pages/dashboard/profile-edit.tsx` | ✅ |
| 2.4 | Create Avatar uploader | `src/components/AvatarUploader.tsx` | ✅ |
| 2.5 | Create Settings page | `src/pages/dashboard/settings.tsx` | ✅ |
| 2.6 | Add delete account flow | settings page | ✅ |

### API Endpoints Connected:

- `GET /api/users/me`
- `PATCH /api/users/me`
- `DELETE /api/users/me`
- `POST /api/users/me/avatar`

---

## Phase 3: Dashboard Shell & Core Features (PENDING)

### Tasks:

| # | Task | File | API Endpoint |
|---|------|------|--------------|
| 3.1 | Create Dashboard layout | `src/layouts/DashboardLayout.tsx` | - |
| 3.2 | Create Sidebar component | `src/components/Sidebar.tsx` | - |
| 3.3 | Create Schedule service | `src/services/schedule.ts` | `GET /api/schedule` |
| 3.4 | Create Schedule page | `src/pages/dashboard/schedule.tsx` | `GET /api/schedule` |
| 3.5 | Create Nutrition service | `src/services/nutrition.ts` | `GET /api/nutrition/current` |
| 3.6 | Create Nutrition page | `src/pages/dashboard/nutrition.tsx` | `GET /api/nutrition/current` |
| 3.7 | Create GenerateMealPlan modal | `src/components/GenerateMealPlan.tsx` | `POST /api/nutrition/generate` |
| 3.8 | Create RefineMeal modal | `src/components/RefineMeal.tsx` | `POST /api/nutrition/refine/:mealId` |
| 3.9 | Create Fitness service | `src/services/fitness.ts` | `GET /api/fitness/current` |
| 3.10 | Create Fitness page | `src/pages/dashboard/fitness.tsx` | `GET /api/fitness/current` |
| 3.11 | Create GenerateWorkout modal | `src/components/GenerateWorkout.tsx` | `POST /api/fitness/generate` |
| 3.12 | Create CompleteSession modal | `src/components/CompleteSession.tsx` | `PATCH /api/fitness/session/:sessionId/complete` |

---

## Phase 4: Gamification, Community & Progress (PENDING)

### Tasks:

| # | Task | File | API Endpoint |
|---|------|------|--------------|
| 4.1 | Create Gamification service | `src/services/gamification.ts` | `GET /api/gamification/status` |
| 4.2 | Create Streaks page | `src/pages/dashboard/streaks.tsx` | `GET /api/gamification/status` |
| 4.3 | Add check-in functionality | streaks page | `POST /api/gamification/check-in` |
| 4.4 | Add freeze token button | streaks page | `POST /api/gamification/freeze` |
| 4.5 | Create Community service | `src/services/community.ts` | `GET /api/community/feed` |
| 4.6 | Create Community page | `src/pages/dashboard/community.tsx` | `GET /api/community/feed` |
| 4.7 | Create PostComposer | `src/components/PostComposer.tsx` | `POST /api/community/posts` |
| 4.8 | Create LikeButton | `src/components/LikeButton.tsx` | `POST/DELETE /api/community/posts/:id/like` |
| 4.9 | Create Comments | `src/components/Comments.tsx` | `GET /api/community/posts/:id/comments` |
| 4.10 | Create Progress service | `src/services/progress.ts` | `GET /api/progress/dashboard` |
| 4.11 | Create Progress page | `src/pages/dashboard/progress.tsx` | `GET /api/progress/dashboard` |
| 4.12 | Create Progress history | `src/pages/dashboard/progress-history.tsx` | `GET /api/progress/history` |
| 4.13 | Create LogProgress | `src/components/LogProgress.tsx` | `POST /api/progress/log` |
| 4.14 | Create Grocery service | `src/services/grocery.ts` | `GET /api/groceries` |
| 4.15 | Create Groceries page | `src/pages/dashboard/groceries.tsx` | `GET /api/groceries` |

---

## Phase 5: Subscription & Monetization (PENDING)

### Tasks:

| # | Task | File | API Endpoint |
|---|------|------|--------------|
| 5.1 | Create Subscription service | `src/services/subscription.ts` | `GET /api/subscriptions/status` |
| 5.2 | Create Subscription page | `src/pages/dashboard/subscription.tsx` | `GET /api/subscriptions/status` |
| 5.3 | Add create subscription flow | subscription page | `POST /api/subscriptions/create` |
| 5.4 | Add cancel subscription | subscription page | `POST /api/subscriptions/cancel` |

---

## File Structure

```
client/src/
├── components/
│   ├── AvatarUploader.tsx
│   ├── ProtectedRoute.tsx
│   ├── GenerateMealPlan.tsx       (pending)
│   ├── RefineMeal.tsx              (pending)
│   ├── GenerateWorkout.tsx         (pending)
│   ├── CompleteSession.tsx        (pending)
│   ├── PostComposer.tsx           (pending)
│   ├── LikeButton.tsx             (pending)
│   ├── Comments.tsx               (pending)
│   ├── LogProgress.tsx            (pending)
│   └── Sidebar.tsx                (pending)
├── contexts/
│   └── AuthContext.tsx
├── layouts/
│   └── DashboardLayout.tsx       (pending)
├── lib/
│   └── api.ts
├── pages/
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   ├── reset-password.tsx
│   ├── dashboard/
│   │   ├── profile.tsx
│   │   ├── profile-edit.tsx
│   │   ├── settings.tsx
│   │   ├── schedule.tsx           (pending)
│   │   ├── nutrition.tsx          (pending)
│   │   ├── fitness.tsx            (pending)
│   │   ├── streaks.tsx            (pending)
│   │   ├── community.tsx          (pending)
│   │   ├── progress.tsx           (pending)
│   │   ├── progress-history.tsx   (pending)
│   │   ├── groceries.tsx         (pending)
│   │   └── subscription.tsx       (pending)
├── services/
│   ├── auth.ts
│   ├── user.ts
│   ├── nutrition.ts               (pending)
│   ├── fitness.ts                (pending)
│   ├── schedule.ts               (pending)
│   ├── gamification.ts          (pending)
│   ├── community.ts              (pending)
│   ├── progress.ts              (pending)
│   ├── grocery.ts               (pending)
│   └── subscription.ts          (pending)
├── App.tsx
├── main.tsx
└── index.css
```

---

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Linting
npm run lint

# Preview production
npm run preview
```

---

## Dependencies

- `react` ^19.2.5
- `react-dom` ^19.2.5
- `react-router-dom` ^7.14.2
- `@tanstack/react-query` ^5.99.2
- `axios` ^1.15.2
- `lucide-react` ^1.8.0
- `tailwindcss` ^4.2.4
- `@tailwindcss/vite` ^4.2.4
- `vite` ^8.0.9

---

## Last Updated

- Phase 1: Completed ✅
- Phase 2: Completed ✅
- Phase 3: Pending
- Phase 4: Pending
- Phase 5: Pending

---

## Notes

- Google OAuth button shows "Coming soon" placeholder
- All API calls go through `/api` prefix (e.g., `/api/auth/login`)
- Token refresh handled automatically via axios interceptors
- User data cached in TanStack Query with `['user']` query key