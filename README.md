# Njerka.fit

AI-powered health and fitness platform with personalized meal plans, workout programs, progress tracking, gamification, and family management.

## Features

### AI-Powered Personalization
- **Meal Plans** — AI generates weekly meal plans based on BMR/TDEE calculations, dietary restrictions, allergies, religion, and fitness goals. Refine or replace individual meals with AI.
- **Workout Programs** — AI creates weekly workout plans with configurable splits (push/pull/legs, upper/lower, Arnold split, full body). Each session includes exercises with sets, reps, and GIF demonstrations.
- **Health Insights** — Daily AI-generated insights based on user activity, nutrition, and progress trends.

### Nutrition & Fitness Tracking
- **Macro Tracking** — Per-meal calorie, protein, carb, and fat breakdown. Daily/weekly views.
- **Smart Grocery List** — Auto-synced from meal plans with categorized items (proteins, vegetables, dairy, etc.). Family-sharable lists with purchase tracking.
- **Workout Logging** — Session completion tracking, exercise library with GIFs via ExerciseDB.
- **Daily Schedule** — Unified timeline merging meals and workouts with completion checkmarks.

### Progress & Analytics
- **Body Metrics** — Track weight, body fat %, muscle mass. Upload InBody scan images for text extraction.
- **Charts & Trends** — Visual progress over 7/30 days or 7 weeks using Recharts.
- **Dashboard** — Aggregated view of nutrition snapshot, vitals (water/sleep/steps), streak status, and AI insight.

### Gamification
- **Streaks** — Daily check-in streaks with freeze tokens (up to 3/month).
- **Rewards** — Milestone-based rewards at 7, 14, 30, 50, and 100-day streaks.
- **Points System** — Earn points for check-ins, meal logging, frozen streaks, and reward claims.
- **Activity Calendar** — Monthly heatmap of all check-in activity.

### Community & Social
- **Feed** — Share posts with images, likes, and comments.
- **Family Plans** — Create/manage family groups, view member meal plans, family leaderboard, activity feed (requires PRO+ subscription).

### Subscription & Billing
- **Tiers** — Basic (free), Pro ($19.99/mo), Family ($29.99/mo).
- **Stripe Integration** — Checkout sessions, webhook handling, billing portal, subscription lifecycle management.

### Admin Panel
- Dashboard with KPIs (total users, active users, revenue, plan distribution).
- User management (list, search, filter, block/delete).
- Analytics (revenue over time, user growth, subscription distribution).

## Tech Stack

### Server
| Technology | Purpose |
|---|---|
| **Node.js 20** + **Express 5** | API framework |
| **TypeScript 6** | Language |
| **MongoDB** + **Mongoose 9** | Database |
| **Zod** | Schema validation |
| **Stripe SDK** | Payment processing |
| **OpenAI SDK** / **OpenRouter** | AI/LLM integration |
| **Google OAuth** + **Passport** | Social authentication |
| **Cloudinary** | Image upload & management |
| **PDFKit** | PDF generation (meal/workout/grocery exports) |
| **Nodemailer** | Email (password reset, notifications) |

### Client
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Language |
| **Vite 6** | Build tool |
| **React Router 7** | Routing |
| **MUI 7** + **Emotion** | UI component library |
| **Radix UI** (~25 primitives) | Headless accessible components |
| **Tailwind CSS 4** | Utility styling |
| **Recharts** | Charts & graphs |
| **Motion** (Framer Motion) | Animations |
| **React Hook Form** | Form management |
| **Lucide React** | Icons |
| **Sonner** | Toast notifications |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker** + **Docker Compose** | Containerization |
| **Nginx** | Reverse proxy & static file serving |
| **MongoDB Atlas** | Managed database |

## Project Structure

```
njrk.fit/
├── client/                          # React SPA (Vite)
│   ├── Dockerfile                   # Multi-stage Docker build
│   ├── nginx/default.conf           # Nginx static server config
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx              # Root router (public, dashboard, admin)
│   │   │   ├── admin/               # Admin panel pages & components
│   │   │   ├── components/          # Shared UI components (~45 Radix-based)
│   │   │   ├── context/             # AuthProvider (login, register, onboarding)
│   │   │   ├── hooks/               # Custom hooks
│   │   │   ├── lib/                 # API client with auto-refresh
│   │   │   ├── pages/               # Page components by route
│   │   │   └── services/            # Domain-specific API service layer
│   │   ├── styles/                  # Global & theme CSS
│   │   └── main.tsx                 # Entry point
│   └── vite.config.ts
│
├── server/                          # Express API (TypeScript)
│   ├── Dockerfile                   # Docker build
│   ├── src/
│   │   ├── app.ts                   # Express app (route mounting, middleware)
│   │   ├── index.ts                 # Bootstrap (DB, server start, admin seed)
│   │   ├── configs/                 # DB, env, Cloudinary, Stripe, LLM, Multer
│   │   ├── dtos/                    # Zod validation schemas
│   │   ├── middlewares/             # Auth, admin auth, error handler, request logger, subscriptions
│   │   ├── models/                  # Mongoose schemas (user, nutrition, fitness, etc.)
│   │   ├── routes/                  # Route handlers by domain
│   │   ├── services/                # Business logic layer
│   │   ├── types/                   # TypeScript type definitions
│   │   └── utils/                   # JWT, BMR/TDEE, unit converter, parsers
│   └── tsconfig.json
│
├── nginx/
│   └── conf.d/
│       └── app.conf                 # Nginx reverse proxy config
│
└── docker-compose.yml               # Orchestration (client + server + nginx)
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- MongoDB Atlas cluster (or local MongoDB)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone <repo-url> njrk.fit
   cd njrk.fit
   ```

2. Configure server environment:
   ```bash
   cp server/.env.exmaple server/.env
   ```
   Edit `server/.env` and fill in required values (see [Environment Variables](#environment-variables)).

3. Configure client environment (optional, for local dev outside Docker):
   ```bash
   cp client/.env.exmaple client/.env  # if exists, or create manually
   ```

### Run with Docker Compose

```bash
docker compose build --no-cache client
docker compose up -d
```

This starts three containers:

| Service | Container Name | Internal Port | External Port | Description |
|---|---|---|---|---|
| **nginx** | `nginx-container` | 80 | **80** | Reverse proxy (routes `/api` → server, `/` → client) |
| **server** | `server-container` | 8080 | — | Express API (not exposed externally) |
| **client** | `client-container` | 80 | — | Static SPA served by Nginx (not exposed externally) |

The server connects to MongoDB Atlas using the `MONGODB_URI` from `server/.env`. No local MongoDB instance is required.

### Access

- **App**: http://localhost
- **API**: http://localhost/api
- **Health**: http://localhost/api/health (or http://localhost/health via nginx)

### Logs

```bash
docker compose logs -f server   # Server logs
docker compose logs -f nginx    # Nginx logs
docker compose logs -f client   # Client logs
```

## API Documentation

All API routes are prefixed with `/api` and mounted on the Express app.

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/auth/google` | Redirect to Google OAuth | — |
| GET | `/api/auth/google/callback` | Google OAuth callback | — |
| POST | `/api/auth/register` | Email/password registration | — |
| POST | `/api/auth/login` | Email/password login | — |
| POST | `/api/auth/refresh-token` | Refresh access token from cookie | Cookie |
| POST | `/api/auth/logout` | Clear auth cookies | — |
| POST | `/api/auth/forgot-password` | Send password reset email | — |
| POST | `/api/auth/reset-password` | Reset password with token | — |
| POST | `/api/auth/onboarding` | Complete user onboarding | JWT |

### Users

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/users/me` | Get current user profile | JWT |
| PATCH | `/api/users/me` | Update profile | JWT |
| DELETE | `/api/users/me` | Delete account | JWT |
| POST | `/api/users/me/avatar` | Upload avatar | JWT |

### Nutrition

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/nutrition/generate` | Generate AI meal plan | JWT |
| POST | `/api/nutrition/refine/:mealId` | Refine a meal with AI | JWT |
| POST | `/api/nutrition/replace/:mealId` | Replace a meal with AI | JWT |
| GET | `/api/nutrition/current` | Get current meal plan | JWT |
| GET | `/api/nutrition/week` | Get weekly meal plans | JWT |
| POST | `/api/nutrition/log-meal` | Log meal completion | JWT |

### Fitness

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/fitness/generate` | Generate AI workout plan | JWT |
| PATCH | `/api/fitness/session/:sessionId/complete` | Mark session complete | JWT |
| GET | `/api/fitness/current` | Get current workout | JWT |
| GET | `/api/fitness/exercise-image/:exerciseId` | Exercise GIF proxy | JWT |

### Schedule

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/schedule` | Get daily timeline (meals + workouts) | JWT |
| PATCH | `/api/schedule/:itemId/complete` | Toggle item completion | JWT |

### Progress

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/progress/can-update` | Check if can log today | JWT |
| POST | `/api/progress/log` | Log progress entry | JWT |
| GET | `/api/progress/dashboard` | Aggregated weight trends | JWT |
| GET | `/api/progress/history` | Paginated progress history | JWT |
| POST | `/api/progress/extract-inbody` | Extract InBody scan data | JWT |
| GET | `/api/progress/feelings` | Recent feeling tags/notes | JWT |

### Groceries

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/groceries` | Get grocery list | JWT |
| POST | `/api/groceries/sync` | Sync from nutrition plan | JWT |
| POST | `/api/groceries/toggle-item` | Toggle purchase status | JWT |
| POST | `/api/groceries/add-item` | Add custom item | JWT |

### Family

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/family` | Get family members & invitations | JWT |
| GET | `/api/family/search` | Search users to invite | JWT |
| POST | `/api/family/invite` | Send family invitation | JWT |
| POST | `/api/family/respond` | Accept/reject invitation | JWT |
| POST | `/api/family/remove/:memberId` | Remove family member | JWT |
| POST | `/api/family/cancel-invite/:invitationId` | Cancel invitation | JWT |
| GET | `/api/family/leaderboard` | Family leaderboard | JWT |
| GET | `/api/family/feed` | Family activity feed | JWT |
| GET | `/api/family/members` | List family members | JWT |
| GET | `/api/family/plan/member/:memberId` | Member's meal plan | JWT |

### Community

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/community/posts` | Create post | JWT |
| GET | `/api/community/feed` | Paginated community feed | JWT |
| DELETE | `/api/community/posts/:id` | Delete own post | JWT |
| PUT | `/api/community/posts/:id/like` | Toggle like | JWT |
| GET | `/api/community/posts/:id/comments` | Get post comments | JWT |
| POST | `/api/community/posts/:id/comment` | Add comment | JWT |
| DELETE | `/api/community/posts/:id/comment/:commentId` | Delete comment | JWT |

### Gamification

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/gamification/check-in` | Daily check-in | JWT |
| POST | `/api/gamification/freeze` | Use streak freeze token | JWT |
| POST | `/api/gamification/apply-freeze` | Apply streak freeze | JWT |
| GET | `/api/gamification/status` | Gamification status | JWT |
| GET | `/api/gamification/insights` | Daily health insights | JWT |
| GET | `/api/gamification/activity` | Activity history | JWT |
| GET | `/api/gamification/rewards` | Available rewards | JWT |
| POST | `/api/gamification/rewards/claim` | Claim a reward | JWT |

### Leaderboard

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/leaderboard` | Global/family leaderboard | JWT |
| GET | `/api/leaderboard/leaderboard` | Family leaderboard | JWT |
| GET | `/api/leaderboard/feed` | Activity feed | JWT |

### Subscriptions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/subscriptions/create` | Create Stripe checkout session | JWT |
| POST | `/api/subscriptions/cancel` | Cancel subscription | JWT |
| GET | `/api/subscriptions/status` | Get subscription status | JWT |
| POST | `/api/subscriptions/portal` | Stripe billing portal | JWT |

### Google Fit

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/google-fit/weekly-steps` | Weekly step data | JWT |

### Exports (PDF)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/export/nutrition/pdf` | Export meal plan as PDF | JWT |
| GET | `/api/export/fitness/pdf` | Export workout plan as PDF | JWT |
| GET | `/api/export/groceries/pdf` | Export grocery list as PDF | JWT |

### Webhooks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/webhook` | Stripe webhook receiver |

### Admin

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/admin/auth/login` | Admin login | — |
| POST | `/api/admin/auth/logout` | Admin logout | — |
| GET | `/api/admin/auth/me` | Current admin profile | Admin JWT |
| GET | `/api/admin/users` | List users (filtered) | Admin JWT |
| GET | `/api/admin/users/:id` | Get user by ID | Admin JWT |
| PATCH | `/api/admin/users/:id/block` | Block user | Admin JWT |
| PATCH | `/api/admin/users/:id/unblock` | Unblock user | Admin JWT |
| DELETE | `/api/admin/users/:id` | Delete user | Admin JWT |
| GET | `/api/admin/analytics/dashboard` | Dashboard stats | Admin JWT |
| GET | `/api/admin/analytics/revenue` | Revenue data | Admin JWT |
| GET | `/api/admin/analytics/users/growth` | User growth data | Admin JWT |
| GET | `/api/admin/analytics/subscriptions/distribution` | Plan distribution | Admin JWT |
| GET | `/api/admin/analytics/transactions` | Recent transactions | Admin JWT |

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check (`{ status: "ok", timestamp }`) |

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default `8080`) |
| `NODE_ENV` | No | Environment mode |
| `MONGODB_URI` | **Yes** | MongoDB connection string |
| `ALLOWED_ORIGINS` | No | CORS allowed origins |
| `CLIENT_URL` | No | Client URL for redirects |
| `API_URL` | No | API base URL |
| `JWT_SECRET` | **Yes** | Access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | **Yes** | Refresh token secret (min 32 chars) |
| `JWT_EXPIRATION` | No | Access token expiry (default `3h`) |
| `JWT_REFRESH_EXPIRATION` | No | Refresh token expiry (default `7d`) |
| `STRIPE_SECRET_KEY` | **Yes** | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | **Yes** | Pro plan price ID |
| `STRIPE_FAMILY_PRICE_ID` | **Yes** | Family plan price ID |
| `OPENROUTER_API_KEY` | **Yes** | OpenRouter API key (for LLM) |
| `GOOGLE_CLIENT_ID` | **Yes** | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | **Yes** | Google OAuth client secret |
| `CLOUDINARY_NAME` | **Yes** | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret |
| `RAPIDAPI_KEY` | No | ExerciseDB API key |
| `SMTP_USER` | No | Gmail SMTP user |
| `SMTP_PASSWORD` | No | Gmail SMTP app password |
| `SMTP_HOST` | No | SMTP host (default `smtp.gmail.com`) |
| `SMTP_PORT` | No | SMTP port (default `587`) |
| `ADMIN_EMAIL_1` | No | Admin 1 email |
| `ADMIN_PASSWORD_1` | No | Admin 1 password |
| `ADMIN_NAME_1` | No | Admin 1 name |

### Client (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | **Yes** | API base URL (e.g., `/api` or `https://api.example.com`) |
| `VITE_STRIPE_PRO_PRICE_ID` | **Yes** | Stripe Pro price ID for checkout |
| `VITE_STRIPE_FAMILY_PRICE_ID` | **Yes** | Stripe Family price ID for checkout |

## External Integrations

| Service | Purpose | How to Get |
|---|---|---|
| **MongoDB Atlas** | Database | Create a free cluster at mongodb.com |
| **OpenRouter** | AI/LLM (meal & workout generation) | Sign up at openrouter.ai, create API key |
| **Stripe** | Subscription billing | Create Stripe account, get keys from dashboard |
| **Google Cloud Console** | OAuth 2.0 (login) | Create OAuth 2.0 credentials (Web application type) |
| **Cloudinary** | Image upload & storage | Free account at cloudinary.com |
| **RapidAPI (ExerciseDB)** | Exercise GIF library | Subscribe to ExerciseDB on rapidapi.com |
| **Gmail SMTP** | Password reset emails | Enable 2FA, generate App Password |

## Deployment

### Production with Separate Domains

To use separate domains (e.g., `njerka.stacktest.space` for the client and `api.stacktest.space` for the API):

1. Point DNS A records for both domains to your server IP.
2. Obtain SSL certificates (e.g., via Let's Encrypt):
   ```bash
   certbot certonly --standalone -d njerka.stacktest.space -d api.stacktest.space
   ```
3. Place certificates in `nginx/ssl/`.
4. Update `nginx/conf.d/app.conf` with the two server blocks and SSL config.
5. Update `docker-compose.yml`:
   - Add port `443:443` to nginx service
   - Add `./nginx/ssl:/etc/nginx/ssl` volume
   - Change `VITE_API_BASE_URL` to `https://api.stacktest.space`
6. Update `server/.env`:
   - `ALLOWED_ORIGINS=https://njerka.stacktest.space`
   - `CLIENT_URL=https://njerka.stacktest.space`
   - `API_URL=https://api.stacktest.space/api`
7. Rebuild and start:
   ```bash
   docker compose build --no-cache client && docker compose up -d
   ```

## Data Models

The server uses Mongoose with the following main collections:

- **User** — Profile, authentication, subscription, preferences, gamification stats
- **NutritionPlan** — AI-generated weekly meal plans with per-meal macros and ingredients
- **WeeklyFitnessPlan** — AI-generated workout plans with sessions and exercises
- **ProgressLog** — Weight, body fat, muscle mass, daily steps with tags and notes
- **GroceryList** — Categorized shopping list synced from nutrition plans
- **Post / Like / Comment** — Community social feed
- **Activity** — Daily check-in, freeze, and reward activity log
- **Reward / UserReward** — Streak-based reward catalog and claims
- **FamilyInvitation** — Pending family join requests
- **SubscriptionTransaction** — Stripe payment records
- **Admin** — Admin panel accounts
