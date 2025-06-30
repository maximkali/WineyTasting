# Winey - Multiplayer Wine Tasting Game

A sophisticated browser-based multiplayer blind wine-tasting game that offers an immersive competitive experience for wine enthusiasts to test their tasting skills through strategic wine organization and identification challenges.

## Features

- **Multiplayer Game Hosting**: Create games for up to 20 players with customizable wine configurations
- **Blind Wine Tasting**: Players taste and rank wines without knowing prices or labels
- **Round-based Gameplay**: Organize wines into multiple tasting rounds (3-4 wines per round)
- **Smart Scoring System**: Points awarded based on correct price ranking accuracy
- **Gambit Round**: Final bonus round for guessing most/least expensive wines
- **Real-time Leaderboards**: Live scoring and rankings throughout the game
- **Host Admin Controls**: Complete game management with player oversight

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling with custom wine-themed design
- **Shadcn/ui** components for accessible UI elements
- **TanStack Query** for server state management
- **Wouter** for client-side routing
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js
- **TypeScript** with ESM modules
- **Drizzle ORM** with PostgreSQL database
- **Neon Serverless** PostgreSQL hosting
- **Express Sessions** with PostgreSQL store

### Database
- **PostgreSQL** with relational schema
- Tables: games, bottles, players, rounds, submissions, gambit_submissions
- **Drizzle ORM** for type-safe database operations
- **Zod schemas** for validation

## Game Flow

1. **Host Setup**: Create game, configure player count and bottle requirements
2. **Wine Entry**: Host enters all wine details (labels, nicknames, prices)
3. **Round Organization**: Arrange wines into balanced tasting rounds
4. **Player Lobby**: Players join using game code and wait for start
5. **Tasting Rounds**: Players taste, take notes, and rank wines by price
6. **Results & Scoring**: Reveal correct prices and award points
7. **Gambit Round**: Final predictions for most/least expensive wines
8. **Final Leaderboard**: Complete game results and winner announcement

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon serverless account)

### Installation
```bash
npm install
```

### Environment Setup
```bash
# Required environment variable
DATABASE_URL=your_postgresql_connection_string
```

### Development Server
```bash
npm run dev
```

This starts both the Express backend and Vite frontend development servers.

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Generate database migrations
npm run db:generate
```

## Project Structure

```
├── client/src/           # React frontend application
│   ├── common/          # Shared components and utilities
│   ├── setup/           # Game setup and configuration
│   ├── gameplay/        # Active game components
│   └── home/            # Entry pages and navigation
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   └── index.ts         # Server entry point
├── shared/              # Shared types and schemas
│   ├── schema.ts        # Database schema and validation
│   └── game-setups.ts   # Game configuration options
└── package.json         # Dependencies and scripts
```

## Key Features

### Wine Management
- Minimum 9, maximum 20 wines per game
- Label names (3-60 characters) and optional nicknames (0-40 characters)
- Price validation and decimal handling
- Automatic wine organization into balanced rounds

### Scoring System
- Points awarded for correct price ranking positions
- Bonus points for exact matches in gambit round
- Cumulative scoring across all rounds
- Real-time leaderboard updates

### Game Administration
- Host controls for game flow and timing
- Player management and spectator mode
- Round progression and results reveal
- Data persistence and game state management

## Deployment

The application is designed for easy deployment on platforms like Replit, Vercel, or any Node.js hosting service with PostgreSQL support.

### Production Build
```bash
npm run build
npm start
```

## Contributing

This project follows modern web development best practices with TypeScript, comprehensive validation, and a clean separation between frontend and backend concerns.

## License

MIT License - see LICENSE file for details.