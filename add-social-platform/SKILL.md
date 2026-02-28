---
name: add-social-platform
description: How to scaffold a new social platform integration. Make sure to use this skill whenever the user asks to add or integrate a new social media network, site, or platform (like Pinterest, Mastodon, Threads, Reddit, etc.) into the application.
---

# Add Social Platform

Use this skill to quickly scaffold a new social network integration in the 1Place2Post NestJS backend.

## Instructions

Whenever you are triggered to add a new social platform, follow these steps exactly:

### 1. Capture Intent
If the user hasn't specified the name of the new platform, ask them for the name of the new platform they want to integrate (e.g., "Pinterest", "Mastodon").

### 2. Prepare Variables
Based on the platform name provided by the user, derive three variables:
- `platform`: lowercase name (e.g., `pinterest`)
- `Platform`: PascalCase name (e.g., `Pinterest`)
- `PLATFORM_UPPER`: UPPERCASE name (e.g., `PINTEREST`)

### 3. Scaffold the NestJS Module
Read the templates from the `assets` folder in this skill's directory using the `view_file` tool:
- `assets/controller.template.ts`
- `assets/service.template.ts`
- `assets/module.template.ts`

Create a new directory for the platform at `apps/api/src/social/{{platform}}`.

Transform the templates by replacing the placeholders `{{platform}}`, `{{Platform}}`, and `{{PLATFORM_UPPER}}` with the appropriate variables you derived in step 2.

Write the transformed content to the new directory using the `write_to_file` tool:
- `apps/api/src/social/{{platform}}/{{platform}}.controller.ts`
- `apps/api/src/social/{{platform}}/{{platform}}.service.ts`
- `apps/api/src/social/{{platform}}/{{platform}}.module.ts`

### 4. Update Database Schema
Use the `multi_replace_file_content` block to add the new `{{PLATFORM_UPPER}}` to the `Platform` enum in `schema.prisma`. 

Find the `enum Platform` block in `apps/api/prisma/schema.prisma` and add it. For example, if adding Pinterest:
```prisma
enum Platform {
    FACEBOOK
    INSTAGRAM
    LINKEDIN
    TIKTOK
    TWITTER
    PINTEREST // <- add this
}
```

### 5. Final Instructions to the User
Once the files are created and the schema is updated, use the `notify_user` tool (if applicable) or inform the user via standard chat that they need to:
1. Run Prisma Generate: `npx prisma generate`
2. Run Prisma Migration: `npx prisma migrate dev --name add_{{platform}}_platform`
3. Import `{{Platform}}Module` to the `SocialModule` (if one exists) or `AppModule`.
4. Update their `.env` files with `{{PLATFORM_UPPER}}_CLIENT_ID`, `{{PLATFORM_UPPER}}_CLIENT_SECRET`, and `{{PLATFORM_UPPER}}_REDIRECT_URI`.

## Important Notes:
- Ensure that the generated code is syntactically valid TypeScript.
- Do NOT delete the templates, just read them.
- Do NOT run the prisma migrations yourself, ask the user to run them or ask for permission to run them using `run_command`.
