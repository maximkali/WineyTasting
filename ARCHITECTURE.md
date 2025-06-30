# Codebase Architecture

## Core Principles
- **Separation of Concerns**: UI vs Business Logic vs Data Access
- **Type Safety**: Full TypeScript coverage
- **Consistency**: Uniform patterns across all layers

## Key Directories
```
├── client/           # React frontend
│   ├── src/
│   │   ├── common/   # Shared components & hooks
│   │   ├── [feature] # Feature modules
│
├── server/           # Express backend
│   ├── core/         # Foundation services
│   ├── api/          # Route handlers
│
├── shared/           # Cross-cutting concerns
│   ├── schema/       # DB models
│   ├── types/        # Shared interfaces
```

## Development Workflow
- `npm run dev` - Starts full-stack hot-reload
- `npm run test` - Runs vitest suite
- See CONTRIBUTING.md for PR guidelines
