# 1Place2Post

**1 Place 2 Post** is a comprehensive, enterprise-grade social media management and automation platform. Designed for marketing teams, creators, and agencies, it provides a "single pane of glass" to manage content scheduling, team approvals, unified messaging, and advanced bot automations across multiple social networks.

## 🚀 Key Features

- **Multi-Platform Publishing**: Schedule and publish posts across connected social media accounts from a single interface.
- **Unified Inbox**: View and reply to all Direct Messages, Comments, and Mentions in one centralized thread.
- **Bot Automation & Auto-Replies**: Create advanced `CONTAINS` or `REGEX` text-matching rules to automatically reply to comments/DMs, or trigger external webhooks.
- **Leads Pipeline**: Automatically capture users who interact with your automated bots or click your Link-in-Bio links, moving them into a Kanban-style CRM pipeline.
- **Link-in-Bio Pages**: Generate dynamic, themable landing pages (`/l/your-brand`) showcasing your scheduled posts, static links, and a customizable contact card.
- **Team & Approval Workflows**: Invite team members with specific roles (OWNER, ADMIN, MEMBER). Enforce publishing workflows where junior members must request approval before a post goes live.
- **AI Studio & Templates**: Generate engaging captions using AI templates, or pre-fill standard campaign structures with reusable post templates.
- **Analytics & Reporting**: Track engagement metrics, clicks, and viewer geography with 30-day timeline visualizations.
- **Admin Console**: Global platform oversight, feature flag management, audit logging, and role-based access control (RBAC).

## 🛠️ Technology Stack

1Place2Post utilizes a modern, robust TypeScript monorepo architecture:

- **Frontend**: Next.js 16 (App Router), React, Vanilla CSS (Mobile-first responsive design).
- **Backend / API**: NestJS (Node.js framework), Passport.js (JWT & Google OAuth).
- **Database / ORM**: PostgreSQL, Prisma ORM.
- **Background Processing**: Postgres-backed publish job queues handling exponential backoff and retries.
- **Deployment**: Docker Compose (multi-container definitions for API, Web, and Database).

## 💻 Local Development Setup

The application is structured as a monorepo utilizing npm workspaces.

### Prerequisites
- Node.js (v20+)
- Docker & Docker Compose
- PostgreSQL (if running bare-metal instead of Docker)

### 1. Clone & Install
```bash
git clone https://github.com/techstruction/1Place2Post.git
cd 1Place2Post
npm install
```

### 2. Environment Variables
Create `.env` files in both the API and Web roots by copying the sample files:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```
Ensure your `DATABASE_URL` is pointing to a valid Postgres instance.

### 3. Database Initialization
Run the Prisma migrations to build the schema:
```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

### 4. Running the Dev Servers
You can run both the API and Web applications concurrently from the root directory:
```bash
npm run dev
```
Alternatively, navigate into `apps/api` and run `npm run start:dev`, and into `apps/web` and run `npm run dev`.

The Frontend will be available at `http://localhost:3000` and the API at `http://localhost:35763`.
