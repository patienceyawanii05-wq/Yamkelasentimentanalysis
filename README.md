# Social Insights - Social Media Post Analysis

A modern, full-stack web application that analyzes the sentiment of social media posts and displays insights through interactive dashboards and visualizations.

## Features

- **Dashboard** — Total posts analyzed, sentiment counts, pie chart, trend line chart, and recent posts table
- **Post Analysis** — Paste a single post for real-time sentiment, confidence score, keyword extraction, and emotion classification
- **Bulk Analysis** — Upload a CSV of posts, analyze all at once, and export results to CSV
- **Data Visualization** — Pie chart (sentiment), bar chart (emotions), trend chart (by date), top keywords
- **Search & Filtering** — Filter by sentiment, date range, and keyword search
- **Reports** — Generate a sentiment summary report, export to PDF, and view AI-powered recommendations
- **Dark/Light Mode** — Toggle between themes, with system preference detection
- **Responsive Design** — Works seamlessly on mobile and desktop with sidebar navigation
- **Authentication** — JWT-based login/signup system powered by Supabase Auth

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL)
- **Charts:** Recharts
- **NLP Engine:** Custom lexicon-based sentiment analysis with emotion detection and keyword extraction
- **Authentication:** Supabase Auth (email/password)
- **Icons:** Lucide React

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. The Supabase database and environment variables are pre-configured. No additional setup is needed.

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to the provided URL.

5. Create an account using the Sign Up page. Sample data will be automatically seeded on first login.

## How It Works

### Analysis Engine

The app uses a lexicon-based NLP engine that:

- **Classifies sentiment** as Positive, Neutral, or Negative using curated word lists
- **Handles negations** ("not good" → negative) and **intensifiers** ("very good" → stronger positive)
- **Detects emotions** — Joy, Anger, Sadness, Fear, Surprise, or Neutral
- **Extracts keywords** by filtering stop words and sentiment words, ranking by frequency
- **Calculates confidence** scores between 0 and 1 based on sentiment word density

### Database Schema

**profiles** (extends Supabase auth.users):
- `id` — references auth.users
- `name` — display name
- `created_at` — timestamp

**posts:**
- `id` — UUID primary key
- `content` — the post text
- `sentiment` — positive / neutral / negative
- `confidence_score` — 0 to 1
- `emotion` — joy / anger / sadness / fear / surprise / neutral
- `keywords` — JSON array of extracted keywords
- `created_at` — timestamp
- `user_id` — owner reference

All tables have Row Level Security (RLS) enabled — users can only access their own data.

## CSV Format for Bulk Analysis

Upload a CSV file where the first column contains post text. A header row is optional and will be skipped if detected.

Example:
```csv
content
"I love this product!"
"This is terrible service."
"The weather is nice today."
```

## Building for Production

```
npm run build
```

This creates an optimized production build in the `dist/` directory.
