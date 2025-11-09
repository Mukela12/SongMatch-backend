# SongMatch Technical Architecture

> Comprehensive technical architecture documentation for the SongMatch backend system
>
> **Last Updated:** 2025-11-09
> **Version:** 1.0
> **Tech Stack:** TypeScript, Node.js, Express, Prisma, PostgreSQL, Redis, Socket.io

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Patterns](#architecture-patterns)
5. [Database Design](#database-design)
6. [API Design](#api-design)
7. [Real-time Architecture](#real-time-architecture)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Architecture](#deployment-architecture)
10. [Security Considerations](#security-considerations)

---

## System Overview

SongMatch is a multiplayer music discovery game built with a modern TypeScript stack. The system supports:

- **Two Play Modes:** Online (server-authoritative) and In-Person (peer-to-peer)
- **Music Platform Integration:** Spotify (MVP), with planned Apple Music & YouTube Music support
- **Real-time Gameplay:** WebSocket-based for instant updates
- **Advanced Matching Algorithm:** Scientific music similarity calculation
- **Mobile-First Design:** React Native app with shared TypeScript codebase

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌─────────────────┐         ┌──────────────────┐          │
│  │  Mobile App     │         │   Web App        │          │
│  │  (React Native) │         │   (React)        │          │
│  └────────┬────────┘         └────────┬─────────┘          │
└───────────┼──────────────────────────┼─────────────────────┘
            │                          │
            │   REST API / WebSocket   │
            ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server (Node.js)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Express.js + Socket.io                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │ Controllers│  │  Services   │  │   Repositories    │   │
│  │  (Routes)  │──│(Business Logic)│──│ (Data Access)   │   │
│  └────────────┘  └─────────────┘  └───────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Matching Algorithm Service                 │   │
│  │  - Audio Features Analysis                           │   │
│  │  - Three-Layer Weighted Scoring                      │   │
│  │  - Explanation Generation                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Music Platform Adapters                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ Spotify  │  │  Apple   │  │ YouTube  │          │   │
│  │  │ Adapter  │  │  Music   │  │  Music   │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────┬────────────────────────┘
               │                      │
               ▼                      ▼
    ┌─────────────────┐   ┌──────────────────┐
    │   PostgreSQL    │   │      Redis       │
    │  (Primary DB)   │   │  (Cache/Queue)   │
    └─────────────────┘   └──────────────────┘
```

---

## Technology Stack

### Backend Core

| Technology | Version | Purpose | Why Chosen |
|------------|---------|---------|------------|
| **TypeScript** | 5.7+ | Programming Language | Type safety, better IDE support, catch errors at compile-time |
| **Node.js** | 20 LTS | Runtime Environment | Fast, efficient, great for real-time apps |
| **Express.js** | 4.21+ | Web Framework | Mature, flexible, extensive middleware ecosystem |
| **Prisma** | 6.0+ | ORM | Best TypeScript integration, excellent DX, auto-generated types |
| **PostgreSQL** | 16+ | Primary Database | ACID compliance, JSON support, full-text search |
| **Redis** | 7.4+ | Cache & Queue | Fast caching, pub/sub for WebSockets, BullMQ support |
| **Socket.io** | 4.8+ | WebSocket Library | Type-safe, auto-reconnection, room management |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Vitest** | 2.1+ | Unit Testing | 3-5x faster than Jest, zero-config TypeScript |
| **Zod** | 3.24+ | Validation | TypeScript-first, automatic type inference |
| **TSyringe** | 4.8+ | Dependency Injection | Lightweight, decorator-based, Microsoft-maintained |
| **pnpm** | 9.0+ | Package Manager | Fast, disk-efficient, monorepo support |
| **ESLint** | 9.0+ | Linting | Code quality enforcement |
| **Prettier** | 3.0+ | Formatting | Consistent code style |

### External Services

| Service | Purpose |
|---------|---------|
| **Spotify Web API** | Primary music data source, OAuth, audio features |
| **Apple Music API** | Secondary platform (post-MVP) |
| **Railway** | Backend hosting, PostgreSQL, Redis |
| **Sentry** (planned) | Error monitoring |
| **Amplitude** (planned) | Analytics |

---

## Project Structure

### Monorepo Organization

```
songmatch/
├── packages/
│   ├── backend/                 # Node.js backend server
│   │   ├── src/
│   │   │   ├── config/         # Configuration & environment
│   │   │   ├── controllers/    # Route handlers (thin layer)
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── matching/   # Algorithm services
│   │   │   │   └── adapters/   # Music platform adapters
│   │   │   ├── repositories/   # Database access layer
│   │   │   ├── models/         # Database models
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── validators/     # Zod validation schemas
│   │   │   ├── utils/          # Helper functions
│   │   │   ├── routes/         # API routes
│   │   │   ├── socket/         # WebSocket handlers
│   │   │   ├── app.ts          # Express app setup
│   │   │   └── server.ts       # Server initialization
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── migrations/     # Database migrations
│   │   ├── tests/
│   │   │   ├── unit/           # Unit tests
│   │   │   ├── integration/    # Integration tests
│   │   │   └── e2e/            # End-to-end tests
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── shared/                  # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types/          # Shared TypeScript types
│   │   │   │   ├── api.types.ts
│   │   │   │   ├── game.types.ts
│   │   │   │   └── music.types.ts
│   │   │   ├── constants.ts    # Shared constants
│   │   │   ├── validators.ts   # Shared Zod schemas
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── mobile/                  # React Native mobile app
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mcp-server/              # Documentation sync server
│       ├── src/
│       │   ├── index.ts
│       │   ├── watcher.ts
│       │   └── generator.ts
│       └── package.json
│
├── docs/                        # Documentation
│   ├── api/                     # Auto-generated API docs
│   ├── architecture/            # Architecture diagrams
│   └── guides/                  # Developer guides
│
├── pnpm-workspace.yaml         # Workspace configuration
├── package.json                 # Root package.json
├── .gitignore
└── README.md
```

### Backend Folder Structure (Detailed)

```typescript
// src/config/
- database.ts         // Prisma client initialization
- redis.ts            // Redis client configuration
- env.ts              // Environment variable validation with Zod
- logger.ts           // Winston logger setup

// src/controllers/
- auth.controller.ts
- game.controller.ts
- music.controller.ts
- match.controller.ts
- user.controller.ts

// src/services/
- auth.service.ts
- game.service.ts
- music.service.ts
- user.service.ts
- matching/
  ├── algorithm.service.ts      // Core matching algorithm
  ├── explanation.service.ts    // Generate match explanations
  └── cache.service.ts          // Match result caching
- adapters/
  ├── base.adapter.ts           // Abstract base class
  ├── spotify.adapter.ts        // Spotify integration
  ├── apple.adapter.ts          // Apple Music (future)
  └── youtube.adapter.ts        // YouTube Music (future)

// src/repositories/
- user.repository.ts
- game.repository.ts
- song.repository.ts
- match.repository.ts

// src/types/
- api.types.ts        // API request/response types
- music.types.ts      // Music-related types
- game.types.ts       // Game-related types
- socket.types.ts     // WebSocket event types

// src/middleware/
- auth.middleware.ts          // JWT authentication
- validation.middleware.ts    // Zod validation
- error.middleware.ts         // Global error handler
- rateLimit.middleware.ts     // Rate limiting
- logger.middleware.ts        // Request logging

// src/validators/
- auth.validator.ts
- game.validator.ts
- music.validator.ts

// src/socket/
- socket.handler.ts   // Main Socket.io setup
- game.socket.ts      // Game-related events
- types.ts            // Socket event types
```

---

## Architecture Patterns

### 1. Onion/Clean Architecture

We follow clean architecture principles with clear separation of concerns:

```
┌────────────────────────────────────────┐
│         Controllers (Routes)           │
│  - Handle HTTP requests                │
│  - Validate input                      │
│  - Return responses                    │
└─────────────┬──────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│            Services                    │
│  - Business logic                      │
│  - Orchestration                       │
│  - No database knowledge               │
└─────────────┬──────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│          Repositories                  │
│  - Database operations                 │
│  - Query building                      │
│  - Data mapping                        │
└─────────────┬──────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│        Database (Prisma)               │
│  - PostgreSQL                          │
│  - Data persistence                    │
└────────────────────────────────────────┘
```

**Benefits:**
- Testability: Each layer can be tested independently
- Maintainability: Changes in one layer don't affect others
- Flexibility: Easy to swap implementations (e.g., different databases)

### 2. Dependency Injection with TSyringe

All services use constructor injection for dependencies:

```typescript
// src/services/game.service.ts
import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { MatchingService } from './matching/algorithm.service';

@injectable()
export class GameService {
  constructor(
    @inject(PrismaClient) private prisma: PrismaClient,
    @inject(MatchingService) private matchingService: MatchingService
  ) {}

  async createGame(userId: string, options: CreateGameOptions) {
    // Use this.prisma and this.matchingService
  }
}
```

**Benefits:**
- Easy testing (mock dependencies)
- Loose coupling
- Single Responsibility Principle
- Inversion of Control

### 3. Repository Pattern

All database access goes through repositories:

```typescript
// src/repositories/user.repository.ts
@injectable()
export class UserRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
```

**Benefits:**
- Centralized data access
- Easy to optimize queries
- Consistent error handling
- Can add caching layer easily

### 4. Adapter Pattern for Music Services

All music platforms implement the same interface:

```typescript
// src/services/adapters/base.adapter.ts
export abstract class MusicServiceAdapter {
  abstract readonly platform: MusicService;

  abstract searchSongs(query: string, limit?: number): Promise<SongInfo[]>;
  abstract getSongById(songId: string): Promise<SongInfo>;
  abstract getAudioFeatures(songId: string): Promise<AudioFeatures>;
  abstract getPreviewUrl(songId: string): Promise<string | null>;
}

// src/services/adapters/spotify.adapter.ts
@injectable()
export class SpotifyAdapter extends MusicServiceAdapter {
  readonly platform = 'spotify' as const;

  async searchSongs(query: string, limit = 20): Promise<SongInfo[]> {
    // Spotify-specific implementation
  }
}
```

**Benefits:**
- Easy to add new platforms
- Consistent interface across all services
- Can swap platforms transparently

---

## Database Design

### Technology Choice: Prisma + PostgreSQL

**Why Prisma:**
1. **Best TypeScript Integration**: Auto-generates types from schema
2. **Excellent Developer Experience**: Type-safe queries, auto-completion
3. **Migration System**: Version-controlled database changes
4. **Prisma Studio**: Built-in GUI for database exploration
5. **Railway Integration**: Seamless PostgreSQL connection

**Alternatives Considered:**
- **Drizzle**: Faster but smaller ecosystem (consider post-MVP)
- **TypeORM**: Mature but less type-safe

### Schema Design Principles

1. **Normalization**: Avoid data duplication
2. **Indexing**: Index frequently queried fields
3. **Soft Deletes**: Keep audit trail
4. **Timestamps**: Track creation and updates
5. **UUIDs**: Use UUIDs for primary keys (better for distributed systems)

### Core Schema (Prisma)

See `DATABASE_SCHEMA.md` for complete schema. Key tables:

- **users**: User accounts, OAuth tokens, stats
- **game_sessions**: Game instances, players, scores
- **game_rounds**: Individual round data, match results
- **song_cache**: Cached song data (30-day TTL)
- **match_history**: Historical match data for analytics

### Caching Strategy (Redis)

```typescript
// Cache Keys Structure
song-features:{platform}:{songId}    // TTL: 30 days
match-result:{song1}:{song2}         // TTL: 7 days
user-profile:{userId}                // TTL: 6 hours
search:{query}                       // TTL: 1 hour
game-session:{gameId}                // TTL: 24 hours
rate-limit:{userId}:{endpoint}       // TTL: 1 minute
```

---

## API Design

### RESTful Principles

All endpoints follow REST conventions:

- **GET**: Retrieve resources
- **POST**: Create resources
- **PUT/PATCH**: Update resources
- **DELETE**: Remove resources

### Endpoint Versioning

All endpoints are versioned: `/api/v1/...`

### Standard Response Format

```typescript
// Success Response
{
  success: true,
  data: {
    // Response data
  },
  meta?: {
    // Pagination, timestamps, etc.
  }
}

// Error Response
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable message",
    details?: any
  }
}
```

### Input Validation with Zod

All inputs validated before reaching controllers:

```typescript
// src/validators/game.validator.ts
import { z } from 'zod';

export const createGameSchema = z.object({
  body: z.object({
    maxRounds: z.number().int().min(1).max(20).default(10),
    musicService: z.enum(['spotify', 'apple', 'youtube']).default('spotify'),
    allowExplicit: z.boolean().default(true),
  }),
});

// Auto-infer TypeScript types
export type CreateGameInput = z.infer<typeof createGameSchema>['body'];
```

### Authentication

- **JWT Tokens**: For stateless authentication
- **OAuth 2.0**: For music platform integration
- **Refresh Tokens**: Long-lived tokens for token renewal

---

## Real-time Architecture

### Socket.io Integration

Type-safe WebSocket implementation:

```typescript
// Server → Client Events
interface ServerToClientEvents {
  'game:player-joined': (data: { player: PlayerInfo }) => void;
  'round:complete': (data: { matchResult: MatchResult }) => void;
  'game:complete': (data: { winner: string }) => void;
}

// Client → Server Events
interface ClientToServerEvents {
  'game:join': (data: { gameId: string }) => void;
  'round:submit-song': (data: { songId: string }) => void;
}
```

### Room-Based Architecture

Each game session = one room:

```typescript
// Player joins game room
socket.join(`game:${gameId}`);

// Broadcast to all players in room
io.to(`game:${gameId}`).emit('round:complete', result);

// Broadcast to everyone except sender
socket.to(`game:${gameId}`).emit('game:player-joined', player);
```

---

## Testing Strategy

### Test Pyramid

```
          ┌─────────┐
          │   E2E   │  10% - Full user flows
          └─────────┘
        ┌─────────────┐
        │ Integration │  30% - API endpoints, DB
        └─────────────┘
      ┌─────────────────┐
      │      Unit       │  60% - Business logic, utils
      └─────────────────┘
```

### Testing Tools

- **Vitest**: Unit testing (3-5x faster than Jest)
- **Supertest**: API integration testing
- **Testcontainers** (optional): Real database for integration tests

### Coverage Goals

- **Overall**: 80%+
- **Business Logic (services)**: 90%+
- **Algorithm**: 95%+
- **Controllers**: 70%+

---

## Deployment Architecture

### Railway Hosting

```
┌──────────────────────────────────────────┐
│           Railway Environment            │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │     Node.js Backend Service        │ │
│  │  - Auto-deploy from Git            │ │
│  │  - Environment variables           │ │
│  │  - Health checks                   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │      PostgreSQL Database           │ │
│  │  - Automatic backups               │ │
│  │  - Connection pooling              │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │         Redis Cache                │ │
│  │  - In-memory caching               │ │
│  │  - Pub/sub for WebSockets          │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Environment Variables

All sensitive configuration via environment variables:

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# Spotify
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=...
```

---

## Security Considerations

### Authentication & Authorization

- JWT tokens with short expiry (7 days)
- Refresh token rotation
- OAuth 2.0 for music platforms
- Rate limiting per user and endpoint

### Input Validation

- All inputs validated with Zod
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (sanitize outputs)
- CORS configuration

### Data Protection

- Encrypted OAuth tokens in database
- HTTPS only in production
- Secure cookie flags
- Environment variable secrets

### Rate Limiting

```typescript
// Rate limits per endpoint
POST /api/v1/auth/register     - 5 req/hour
POST /api/v1/auth/login        - 10 req/hour
POST /api/v1/games             - 100 req/hour
GET  /api/v1/music/search      - 100 req/hour
```

---

## Next Steps

1. **Initialize Project**: Set up monorepo structure
2. **Database Setup**: Create Prisma schema and migrations
3. **Core Services**: Implement matching algorithm
4. **API Development**: Build REST endpoints
5. **Testing**: Write comprehensive test suite
6. **Deployment**: Deploy to Railway

For detailed implementation steps, see `DEVELOPMENT_PLAN.md`.
