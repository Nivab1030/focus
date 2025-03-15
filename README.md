# Focus - Habit Tracking App

A beautiful habit tracking application with data logging and analysis capabilities.

## Features

- Track daily and custom frequency habits
- Categorize habits (Health, Productivity, Personal)
- Visual habit completion tracking
- Weekly and monthly views
- Data export for analysis
- Quarterly summaries
- User authentication
- Cross-device synchronization

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Authentication, Database, Hosting)

## Deployment Guide

### 1. Set Up Supabase

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL schema in `supabase/schema.sql` in the SQL Editor
4. Set up authentication providers (Email, Google, etc.)
5. Get your Supabase URL and anon key from the API settings

### 2. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the environment variables from step 2
4. Deploy!

Alternatively, you can deploy with the Vercel CLI:

```bash
npm i -g vercel
vercel login
vercel
```

### 4. Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Data Analysis

### Exporting Data

1. Log in to your account
2. Navigate to the Profile page
3. Use the Export Data section to download your habit data as CSV
4. Optionally specify date ranges for the export

### Quarterly Summaries

1. Log in to your account
2. Navigate to the Profile page
3. Use the Quarterly Summary section to view summaries
4. Select the year and quarter to analyze

## Database Schema

The application uses three main tables:

1. `habit_categories` - Stores habit categories
2. `habits` - Stores individual habits
3. `habit_completions` - Stores habit completion records

The schema includes:
- Row-level security for data protection
- Indexes for performance optimization
- Analytics view for easier reporting
- Custom function for quarterly summaries

## License

MIT
