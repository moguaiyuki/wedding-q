# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Wedding Quiz Application** (結婚式クイズアプリ) designed for a wedding reception entertainment where 60 participants answer quiz questions about the bride and groom using their smartphones. The system consists of three main components:
- Participant App (for guests to answer quizzes)
- Admin App (for bride/groom to manage the quiz)
- Presentation Screen (projected on venue screen)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database/BaaS**: Supabase (PostgreSQL + Realtime)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS + shadcn/ui
- **Real-time**: Supabase Realtime subscriptions

## Commands

### Project Setup
```bash
# Create Next.js project
npx create-next-app@latest wedding-quiz-app --typescript --tailwind --app

# Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install qrcode @types/qrcode
npm install lucide-react clsx tailwind-merge
npm install @radix-ui/react-slot

# Setup shadcn/ui
npx shadcn-ui@latest init
```

### Development
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run typecheck # Run TypeScript type checking (if configured)
```

## Architecture

### Database Schema
The app uses Supabase with these main tables:
- `users`: Participant information with QR codes and group affiliations
- `questions`: Quiz questions with optional images
- `choices`: Answer choices for each question
- `answers`: Participant responses
- `game_state`: Current quiz state management
- `user_sessions`: Session management for reconnection

### Key Features
1. **QR Code Authentication**: Each participant has a unique QR code on their seat card
2. **Real-time Synchronization**: All participant screens update instantly via Supabase Realtime
3. **Resilient Connection**: Supports reconnection and state persistence on reload
4. **UNDO Functionality**: Admin can revert actions (close answers, show results, next question)

### Directory Structure
```
src/
├── app/                     # Next.js App Router pages
│   ├── participant/         # Guest-facing pages
│   ├── admin/              # Admin management pages
│   ├── presentation/       # Screen display page
│   └── api/                # API routes
├── components/             # React components
├── lib/                    # Business logic & utilities
└── types/                  # TypeScript definitions
```

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL`

## Development Guidelines

### Real-time Implementation
- Use Supabase Realtime channels for game state synchronization
- Subscribe to `game_state` table changes for all participants
- Subscribe to `answers` table for live statistics

### Authentication Flow
- **Admin**: Password-based (check against env variable)
- **Participants**: QR code or ID-based anonymous auth

### State Management
- Game state is centralized in Supabase `game_state` table
- Use optimistic updates for better UX but verify with server
- Handle connection failures gracefully with retry logic

### Mobile Optimization
- Design mobile-first (all participants use smartphones)
- Test with various screen sizes (iPhone/Android)
- Ensure touch targets are appropriately sized

### Japanese Language Support
- All user-facing text should be in Japanese
- Error messages must be clear and in Japanese
- Support Japanese names up to 100 characters

## Testing Considerations
- Simulate 60 concurrent connections
- Test network disconnection/reconnection scenarios
- Verify UNDO operations work correctly
- Ensure duplicate answer prevention works across devices
- use gh command to operate github

## Browser Testing Rule
- **Always verify browser applications with Playwright**: After implementing any browser-based application features, use Playwright to perform automated browser testing and verify the functionality works correctly
- Test critical user flows and interactions
- Verify cross-browser compatibility when needed
