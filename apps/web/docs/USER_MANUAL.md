# 1Place2Post User Manual

Welcome to the **1Place2Post** User Manual! This guide explains how to use the dashboard to connect your social accounts, create templates, schedule posts, and manage interactions.

## 🔗 Table of Contents
1. [Logging In and Dashboard Overview](#1-logging-in-and-dashboard-overview)
2. [Connecting Social Accounts](#2-connecting-social-accounts)
3. [Creating and Scheduling Posts](#3-creating-and-scheduling-posts)
4. [Using the AI Studio & Templates](#4-using-the-ai-studio--templates)
5. [Managing the Unified Inbox & Lead Pipeline](#5-managing-the-unified-inbox--lead-pipeline)
6. [Link-in-Bio Pages](#6-link-in-bio-pages)
7. [Automated Bot Rules](#7-automated-bot-rules)

---

## 1. Logging In and Dashboard Overview

When you first log in, you are greeted by the Dashboard Overview. This page provides a high-level summary of your account activity.
- **Top Metrics**: Shows your total posts, connected accounts, recent engagement, and system health.
- **Sidebar Navigation**: Your primary way of moving around the app. Contains links to your Calendar, Media Library, Analytics, Inbox, Leads, etc.

## 2. Connecting Social Accounts

To publish content, you must first connect your social media profiles.
1. Navigate to **Connections** in the sidebar.
2. Click the specific platform button (e.g., *Connect Instagram* or *Connect Twitter/X*).
3. Follow the OAuth prompt to authorize 1Place2Post.
4. Your account will appear in the table. Note its expiration date—most tokens last 60 days before needing re-authentication.

> **Note**: Facebook Pages require specific permissions during the OAuth flow. Do not uncheck any requested page permissions.

## 3. Creating and Scheduling Posts

1. Click **Posts** in the sidebar, then click the **+ New Post** button.
2. **Select Platforms**: Choose which accounts to publish this post to.
3. **Write Caption**: Enter your text. You can use the ✨ AI Assist button to rewrite or generate a caption.
4. **Add Media**: Click *Upload Media* to attach a photo or video from your hard drive or the Media Library.
5. **Set Schedule**:
   - **Publish Now**: Sends the post to the queue immediately.
   - **Schedule for Later**: Pick a date and time. Make sure your browser timezone is correct!
6. Click **Schedule Post**.

## 4. Using the AI Studio & Templates

### Templates
Templates allow you to save recurring caption formats or hashtag groups.
1. Go to **Templates** and click **Create Template**.
2. Give it a name (e.g., "Feature Release" or "Friday Motivation").
3. Fill in the caption and hashtags. 
4. When writing a new post, use the **Apply Template** dropdown to instantly fill the editor with this saved format.

### AI Studio
The AI Studio helps you generate content ideas and refine drafts. Type a prompt like "Write an engaging tweet about our new analytics dashboard" and copy the result directly into your Post Creator.

## 5. Managing the Unified Inbox & Lead Pipeline

### Unified Inbox
The **Unified Inbox** aggregates comments, thread replies, and Direct Messages from all your connected platforms into one cohesive feed.
- Unread messages are bolded and highlighted.
- Click **Mark Read** to dismiss them, or use **Mark All as Read** at the top.

### Leads Pipeline
When a user interacts with your automated Bot Rules (e.g., commenting "PRICE" on an Instagram post), they are automatically filtered into the **Leads Pipeline**.
- The pipeline tracks their handle, the event that triggered them, and the status.
- You can manually change a lead's status to **NEW**, **CLICKED**, or **CLOSED**.

## 6. Link-in-Bio Pages

1Place2Post replaces Linktree by letting you host your own mobile-first landing pages.
1. Go to **Link Pages**.
2. Click **Create Link Page** and define your unique URL slug (e.g., `brandname`).
3. Click the **View** button to open the editor.
4. **Edit Theme**: Change colors, gradients, and fonts.
5. **Add Links**: Add URLs, labels, and icons. You can track exactly how many times each link is clicked.
6. The public page is hosted at `https://yourdomain.com/l/brandname`.

## 7. Automated Bot Rules

Save time by letting 1Place2Post auto-reply to users and collect leads for you.
1. Navigate to **Bot Rules** and click **+ New Rule**.
2. Fill out the configuration:
   - **Trigger Type**: Will this trigger on a public *Comment* or a private *DM*?
   - **Platform**: Restrict this rule to a specific platform, or leave it blank to apply to all outboxes.
   - **Match Type**: 
     - *Contains*: Triggers if the message contains exactly "pricing"
     - *Regex*: Advanced pattern matching
     - *Any Message*: Triggers on every single message received.
3. Choose a **Reply Mode**: Should the bot reply in the public thread, or send a private DM?
4. **Reply Text**: What the bot will say.
5. Click **Create Rule**. When this rule fires, the user's handle is automatically logged into your **Leads Pipeline**.
