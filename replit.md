# Winey - Multiplayer Wine Tasting Game

## Overview

Winey is a browser-based multiplayer wine tasting game where exactly 20 players bring wines to taste and rank in 5 rounds. The application is built as a full-stack web app with a React frontend and Express backend, featuring real-time multiplayer functionality, administrative controls, and a sophisticated scoring system.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom wine-themed design system
- **State Management**: React Query (TanStack Query) for server state and caching
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ESM modules
- **Data Layer**: Drizzle ORM with PostgreSQL (specifically Neon serverless)
- **Session Management**: Express sessions with PostgreSQL store
- **Build Process**: ESBuild for production builds

### Database Architecture
- **Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with Zod schema validation
- **Schema**: Relational design with games, bottles, players, rounds, submissions, and gambit submissions tables

## Key Components

### Game Flow Management
The application follows a strict state machine pattern with these game states:
- `setup`: Host configures 20 bottles
- `lobby`: Players join and wait for game start
- `in_round`: Active tasting and ranking phase
- `countdown`: Brief transition between rounds
- `reveal`: Results display after each round
- `gambit`: Final bonus round for price guessing
- `final`: Complete game results and leaderboard

### Authentication System
- **Host Authentication**: Token-based system for game creators
- **Player Identification**: Session-based player tracking
- **Spectator Mode**: Read-only access for late joiners

### Real-time Updates
- Polling-based real-time updates every 5 seconds
- Automatic page transitions based on game state changes
- Live leaderboard updates

### Scoring Algorithm
- Round scoring: Points awarded for correct wine ranking positions
- Gambit scoring: Bonus points for correctly guessing most/least expensive wines
- Cumulative scoring across all rounds

## Data Flow

### Game Creation Flow
1. Host provides display name
2. Backend generates unique game ID, join code, and host token
3. Host redirected to setup page to select game configuration and enter all wines
4. Wines are saved to database and host proceeds to rounds page
5. Host organizes wines into rounds using the visual interface

### Player Join Flow
1. Players access join link with game ID
2. Provide display name or join as spectator
3. Lobby displays current players and game status
4. Host controls game start timing

### Round Flow
1. Players view 4 wines with fun names (prices hidden)
2. Players submit tasting notes and rankings
3. Host can close round when ready
4. Results revealed showing correct price order and scores
5. Automatic progression to next round or gambit phase

### Gambit Flow
1. Players guess most/least expensive wine from entire game
2. Players select personal favorite wine
3. Final results display with complete leaderboard

## External Dependencies

### Core Runtime Dependencies
- React ecosystem (React, React DOM, React Query)
- Express.js with middleware
- Drizzle ORM with PostgreSQL driver
- Zod for schema validation
- Radix UI component primitives

### Development Dependencies
- Vite for frontend build and development
- TypeScript for type safety
- Tailwind CSS for styling
- ESBuild for backend compilation

### Database Dependencies
- Neon serverless PostgreSQL
- Drizzle Kit for migrations
- Connect-pg-simple for session storage

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- Express server with TypeScript execution via tsx
- Concurrent development with shared port strategy

### Production Build
1. Frontend: Vite builds React app to static assets
2. Backend: ESBuild compiles TypeScript to single bundle
3. Express serves both API routes and static frontend
4. Database migrations applied via Drizzle Kit

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Automatic database provisioning check on startup
- Development vs production mode detection

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 29, 2025 (PM). Completed comprehensive wine tasting game implementation. All core functionality working: game creation with host details, wine entry with validation (minimum 3 characters for labels, optional nicknames), price handling with proper decimal storage, round organization with 3 wines per round, database persistence with orderIndex preservation. Application ready for deployment with full PostgreSQL integration and React frontend. User confirmed all data saves correctly and expressed interest in GitHub deployment.
- June 29, 2025 (PM). Successfully fixed all database numeric type issues. Changed column types from integer to numeric in PostgreSQL schema for proper decimal storage. Fixed toFixed() errors by converting database string values to numbers before formatting. Oz pours now display correctly as decimal values (e.g., "2.54 oz") throughout the application.
- June 29, 2025 (PM). Fixed oz pours display unit conversion issue. Removed incorrect division by 100 since ozPerPersonPerBottle values in database are already in decimal format (e.g., 1.27) as defined in game-setups.ts. Updated display to show two decimal places for consistency. 
- June 29, 2025 (PM). Fixed critical setup page data loading issue caused by race condition between useEffect hooks. One useEffect was initializing empty bottles while another loaded existing bottles from database, causing loaded data to be overwritten. Modified empty bottle initialization to only run when bottles.length === 0, preserving loaded wine data. Setup page now correctly displays all existing wines with labels, nicknames, and prices when navigating back to existing games.
- June 29, 2025 (PM). Added host name and email fields to setup page. Updated database schema with hostName and hostEmail fields in games table. Added validation for required name and email on new games. Changed button text from "Next" to "Create Game" for better UX clarity. Fields use consistent styling with existing form elements.
- June 29, 2025 (PM). Fixed "No wines found" error by implementing database-first approach. Removed erroneously added Wine List page that wasn't part of original design. Corrected flow is now: Setup (enter wines) → Rounds (organize wines). All data persists in database throughout the flow, eliminating session storage issues. Updated navigation to go directly from Setup to Rounds as originally intended.
- June 29, 2025 (PM). Reorganized folder structure to align with user flow: Home → Setup → Wine Rounds → Gameplay. Consolidated wine-list and rounds into single "wine-rounds" folder. Created feature-based folder organization: home/ (entry points), setup/ (game configuration), wine-rounds/ (wine entry and organization), gameplay/ (active game components), common/ (shared resources). Updated all imports to use new common/ path structure. This provides clear separation of concerns with each folder having a specific purpose in the user journey.
- June 29, 2025 (PM). Completed comprehensive code cleanup and file organization. Removed all old unused files (storage-old.ts, organize-old.tsx, setup-old.tsx), removed 18+ unused Shadcn UI components, cleaned up clunky sessionStorage and localStorage logic from setup and organize pages. Renamed organize.tsx to rounds.tsx to match intended page flow (Home > Setup > Wine List > Rounds). Updated App.tsx routing and function names accordingly. This significantly simplified memory management and improved code organization.
- June 29, 2025 (PM). Removed all backward navigation throughout the entire application to prevent session memory issues and data loss. Eliminated "Back to Home", "Back to Setup", and "Back to Wine List" buttons from lobby, setup, and organize pages. Removed resetConfiguration function and ArrowLeft imports. Navigation is now strictly forward-only: Home → Setup → Wine List → Rounds. This ensures clean session state and prevents users from accidentally losing progress by going backwards.
- June 29, 2025 (PM). Redesigned home page UI to match professional mockup with clean layout. Added "Host a Tasting" as primary CTA button, "Join Game" as secondary button. Implemented four feature cards (Blind Tasting, Live Ranking, Smart Scoring, Compete & Win) with appropriate icons. Added first/last name popup dialog when hosting. Updated header/footer design with proper branding and flow indicators (Sip → Rank → Score → Win). Simplified navigation logic to skip unnecessary saves when configuration hasn't changed.
- June 29, 2025 (PM). Updated all page titles to match requested flow: Home > Setup > Wine List > Rounds. Fixed critical navigation issue where returning from organize page to setup page would show blank form instead of preserving wine data. Removed resetConfiguration clearing of bottle data to maintain form state during back navigation. Added automatic display of wine entry form when bottles exist in database. Removed session storage usage for cleaner navigation state management.
- June 29, 2025 (PM). Implemented PUT endpoint for updating bottles when navigating back and forth between setup and organize pages. Now when user goes back to setup page after adding wines, all data is pre-filled, and if they change any wines and submit, it replaces all old data with the new entries using PUT endpoint. Removed auto-save functionality from organize page to give users full control over when data is saved. Added deleteBottle method to storage interface to support the PUT operation.
- June 29, 2025 (PM). Fixed critical bottles loading issue on organize page. Added temporary game handling to organize page (matching setup page logic), implemented cache invalidation for bottles query on mount, fixed "Back to Wine List" navigation to properly set configStep to 'wine'. All navigation flows now work seamlessly - forward navigation from setup to organize loads bottles correctly, backward navigation returns to wine entry step preserving all data.
- June 29, 2025 (PM). Removed all auto-save and session storage functionality that was blocking user interactions. Restored clean API-based game creation flow. Application now works without memory persistence - users start fresh each session.
- June 29, 2025 (PM). Implemented comprehensive admin setup flow validation and stress testing. Added bulletproof data integrity safeguards including: Enhanced bottle validation with duplicate price/name detection, Fixed decimal price handling (converts to cents for database storage), Added comprehensive start game validation with auto-organization fallback, Added robust error handling and recovery mechanisms, Comprehensive edge case testing covering 12+ validation scenarios. All admin setup flows now protected against data loss and corruption. Fixed critical API call bug and implemented seamless "Back to Setup" navigation that preserves all wine data when returning from organize page. Added GET bottles API endpoint and "Organize Wines" button for manual wine organization workflow.
- June 29, 2025 (AM). Added PostgreSQL database with Drizzle ORM integration, implemented host-picker system with configurable game setups, fixed routing issue preventing game creation flow, replaced drag-and-drop with intuitive button-based wine organization system using modal popups and checkbox selection, fixed authentication token storage consistency between setup and organize pages, corrected bottles API endpoint fetching
- June 28, 2025. Initial setup