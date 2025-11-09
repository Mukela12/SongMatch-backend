# SongMatch Database Schema

> Complete PostgreSQL database schema using Prisma ORM
>
> **Last Updated:** 2025-11-09
> **Database:** PostgreSQL 16+
> **ORM:** Prisma 6.0+

---

## Table of Contents

1. [Overview](#overview)
2. [Schema Design](#schema-design)
3. [Complete Prisma Schema](#complete-prisma-schema)
4. [Relationships](#relationships)
5. [Indexes & Performance](#indexes--performance)
6. [Migration Strategy](#migration-strategy)
7. [Seed Data](#seed-data)

---

## Overview

### Database Technology Stack

- **PostgreSQL 16+**: Primary relational database
- **Prisma**: Type-safe ORM with auto-generated types
- **Redis**: Caching layer (not in this schema)

### Design Principles

1. **Normalization**: Minimize data duplication
2. **UUIDs**: Use UUIDs for all primary keys (better for distributed systems)
3. **Timestamps**: Track creation and update times for all tables
4. **Soft Deletes**: Preserve data for audit trail (where applicable)
5. **Indexes**: Index frequently queried fields
6. **Constraints**: Enforce data integrity at database level

---

## Schema Design

### Entity Relationship Diagram

```
┌──────────────┐
│    users     │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼────────────┐
│  game_sessions    │──┐
└──────┬────────────┘  │
       │               │ 1:N
       │ 1:N           │
       │          ┌────▼──────────┐
       │          │  game_rounds  │
       │          └───────────────┘
       │
       │
┌──────▼───────────┐
│  song_cache      │
└──────────────────┘

┌──────────────────┐
│ user_playlists   │
└──────┬───────────┘
       │ 1:N
       │
┌──────▼───────────┐
│ playlist_items   │
└──────────────────┘

┌──────────────────┐
│ match_history    │
└──────────────────┘
```

---

## Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique @db.VarChar(255)
  username  String   @unique @db.VarChar(50)
  password  String   @db.VarChar(255) // Bcrypt hashed
  createdAt DateTime @default(now()) @db.Timestamptz
  updatedAt DateTime @updatedAt @db.Timestamptz

  // OAuth Tokens (encrypted)
  spotifyAccessToken   String? @db.Text
  spotifyRefreshToken  String? @db.Text
  spotifyTokenExpiry   DateTime? @db.Timestamptz
  spotifyUserId        String? @db.VarChar(255)

  appleMusicToken      String? @db.Text
  appleMusicTokenExpiry DateTime? @db.Timestamptz

  // User Stats
  totalGamesPlayed     Int     @default(0)
  totalRoundsPlayed    Int     @default(0)
  totalGamesWon        Int     @default(0)
  totalGamesLost       Int     @default(0)
  averageMatchScore    Decimal @default(0) @db.Decimal(5, 2)

  // ELO Rating System
  eloRating            Int     @default(1000)
  peakEloRating        Int     @default(1000)
  currentStreak        Int     @default(0)
  longestStreak        Int     @default(0)

  // Preferences
  preferences          Json    @default("{}")

  // Soft delete
  deletedAt            DateTime? @db.Timestamptz

  // Relations
  gamesAsPlayer1       GameSession[] @relation("Player1Games")
  gamesAsPlayer2       GameSession[] @relation("Player2Games")
  playlists            UserPlaylist[]

  @@index([email])
  @@index([username])
  @@index([eloRating])
  @@index([createdAt])
  @@map("users")
}

// ============================================================================
// GAME MANAGEMENT
// ============================================================================

model GameSession {
  id          String      @id @default(uuid()) @db.Uuid
  createdAt   DateTime    @default(now()) @db.Timestamptz
  updatedAt   DateTime    @updatedAt @db.Timestamptz
  startedAt   DateTime?   @db.Timestamptz
  endedAt     DateTime?   @db.Timestamptz

  // Game Status
  status      GameStatus  @default(WAITING)

  // Game Settings
  maxRounds   Int         @default(10)
  currentRound Int        @default(1)
  musicService MusicService @default(SPOTIFY)
  allowExplicit Boolean   @default(true)
  region      String      @default("US") @db.Char(2)
  gameMode    GameMode    @default(ONLINE)

  // Players
  player1Id   String      @db.Uuid
  player2Id   String?     @db.Uuid
  player1     User        @relation("Player1Games", fields: [player1Id], references: [id], onDelete: Cascade)
  player2     User?       @relation("Player2Games", fields: [player2Id], references: [id], onDelete: Cascade)

  // Scores
  player1Score Int        @default(0)
  player2Score Int        @default(0)

  // Metadata
  winnerId    String?     @db.Uuid

  // Relations
  rounds      GameRound[]

  @@index([status])
  @@index([player1Id, player2Id])
  @@index([createdAt])
  @@index([winnerId])
  @@map("game_sessions")
}

model GameRound {
  id            String      @id @default(uuid()) @db.Uuid
  gameSessionId String      @db.Uuid
  roundNumber   Int
  createdAt     DateTime    @default(now()) @db.Timestamptz
  completedAt   DateTime?   @db.Timestamptz

  // Players
  firstPlayerId  String     @db.Uuid
  secondPlayerId String     @db.Uuid

  // Song Selections
  firstPlayerSongId  String  @db.VarChar(150) // platform:trackId
  secondPlayerSongId String? @db.VarChar(150)

  firstPlayerSongPlatform  MusicService
  secondPlayerSongPlatform MusicService?

  // Submission Timestamps (for time bonuses)
  firstPlayerSubmittedAt  DateTime? @db.Timestamptz
  secondPlayerSubmittedAt DateTime? @db.Timestamptz

  // Match Results
  matchScore      Int?
  matchConfidence Decimal?   @db.Decimal(3, 2) // 0.00 - 1.00
  matchBreakdown  Json?      // Layer scores
  matchExplanation Json?     // Human-readable explanation

  // Points Awarded
  firstPlayerPoints  Int?
  secondPlayerPoints Int?

  // Metadata
  processingTimeMs  Int?
  algorithmVersion  String    @default("1.0") @db.VarChar(10)

  // Relations
  gameSession GameSession @relation(fields: [gameSessionId], references: [id], onDelete: Cascade)

  @@unique([gameSessionId, roundNumber])
  @@index([gameSessionId])
  @@index([firstPlayerSongId])
  @@index([secondPlayerSongId])
  @@map("game_rounds")
}

// ============================================================================
// SONG CACHING
// ============================================================================

model SongCache {
  id       String       @id @db.VarChar(150) // platform:trackId
  platform MusicService

  // Basic Info
  title       String   @db.VarChar(255)
  artist      String   @db.VarChar(255)
  album       String?  @db.VarChar(255)
  releaseYear Int?
  durationMs  Int?
  explicit    Boolean  @default(false)
  popularity  Int?     // 0-100 (Spotify)

  // URLs
  previewUrl  String?  @db.Text
  fullUrl     String?  @db.Text
  albumArtUrl String?  @db.Text

  // ISRC for cross-platform matching
  isrc        String?  @db.VarChar(20)

  // Audio Features (JSON for flexibility)
  features    Json     // AudioFeatures object
  genres      String[] // Array of genre strings

  // Cache Metadata
  cachedAt     DateTime @default(now()) @db.Timestamptz
  lastAccessed DateTime @default(now()) @db.Timestamptz
  accessCount  Int      @default(0)

  // Estimated features flag
  featuresEstimated Boolean @default(false)

  @@index([platform])
  @@index([title, artist])
  @@index([isrc])
  @@index([cachedAt])
  @@index([lastAccessed]) // For cache eviction
  @@map("song_cache")
}

// ============================================================================
// MATCH HISTORY (for analytics & validation)
// ============================================================================

model MatchHistory {
  id        String   @id @default(uuid()) @db.Uuid
  createdAt DateTime @default(now()) @db.Timestamptz

  // Songs
  song1Id   String   @db.VarChar(150)
  song2Id   String   @db.VarChar(150)

  // Match Result
  matchScore      Int
  matchConfidence Decimal @db.Decimal(3, 2)
  matchBreakdown  Json

  // Algorithm Version (for A/B testing)
  algorithmVersion String @db.VarChar(10)

  // Human Validation (optional)
  humanScore      Int?    // If human rated this match
  humanFeedback   String? @db.Text

  // Metadata
  processingTimeMs Int?

  @@index([song1Id, song2Id])
  @@index([createdAt])
  @@index([algorithmVersion])
  @@map("match_history")
}

// ============================================================================
// USER PLAYLISTS (Discovery Feature)
// ============================================================================

model UserPlaylist {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @db.Uuid
  name        String   @db.VarChar(255)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  // Visibility
  isPublic    Boolean  @default(false)

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       PlaylistItem[]

  @@index([userId])
  @@index([createdAt])
  @@map("user_playlists")
}

model PlaylistItem {
  id         String   @id @default(uuid()) @db.Uuid
  playlistId String   @db.Uuid
  songId     String   @db.VarChar(150) // platform:trackId
  platform   MusicService
  position   Int      // Order in playlist
  addedAt    DateTime @default(now()) @db.Timestamptz

  // Relations
  playlist   UserPlaylist @relation(fields: [playlistId], references: [id], onDelete: Cascade)

  @@unique([playlistId, position])
  @@index([playlistId])
  @@index([songId])
  @@map("playlist_items")
}

// ============================================================================
// ENUMS
// ============================================================================

enum GameStatus {
  WAITING    // Waiting for player 2
  ACTIVE     // Game in progress
  COMPLETED  // Game finished
  ABANDONED  // Player left

  @@map("game_status")
}

enum MusicService {
  SPOTIFY
  APPLE
  YOUTUBE

  @@map("music_service")
}

enum GameMode {
  ONLINE      // Server-authoritative, WebSocket
  IN_PERSON   // Peer-to-peer, Bluetooth/WiFi-Direct

  @@map("game_mode")
}
```

---

## Relationships

### One-to-Many

1. **User → GameSessions (as player1)**
   - One user can create many games
   - `gamesAsPlayer1` relation

2. **User → GameSessions (as player2)**
   - One user can join many games
   - `gamesAsPlayer2` relation

3. **GameSession → GameRounds**
   - One game has many rounds
   - Cascade delete: deleting game deletes all rounds

4. **User → UserPlaylists**
   - One user can have many playlists
   - Cascade delete: deleting user deletes playlists

5. **UserPlaylist → PlaylistItems**
   - One playlist has many songs
   - Cascade delete: deleting playlist deletes items

### Constraints

- `GameRound.gameSessionId` + `roundNumber` must be unique
- `PlaylistItem.playlistId` + `position` must be unique
- `User.email` must be unique
- `User.username` must be unique

---

## Indexes & Performance

### Primary Indexes (Automatic)

All `@id` fields are automatically indexed.

### Secondary Indexes

#### Users Table
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_elo_rating ON users(elo_rating);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### Game Sessions Table
```sql
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_players ON game_sessions(player1_id, player2_id);
CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at);
CREATE INDEX idx_game_sessions_winner ON game_sessions(winner_id);
```

#### Game Rounds Table
```sql
CREATE UNIQUE INDEX idx_game_rounds_unique_round
  ON game_rounds(game_session_id, round_number);
CREATE INDEX idx_game_rounds_session ON game_rounds(game_session_id);
CREATE INDEX idx_game_rounds_songs
  ON game_rounds(first_player_song_id, second_player_song_id);
```

#### Song Cache Table
```sql
CREATE INDEX idx_song_cache_platform ON song_cache(platform);
CREATE INDEX idx_song_cache_search ON song_cache(title, artist);
CREATE INDEX idx_song_cache_isrc ON song_cache(isrc);
CREATE INDEX idx_song_cache_access ON song_cache(last_accessed); -- For eviction
```

### Query Optimization Tips

1. **Use `select` to limit fields:**
   ```typescript
   const users = await prisma.user.findMany({
     select: { id: true, username: true, eloRating: true }
   });
   ```

2. **Use `include` sparingly:**
   ```typescript
   // Only include what you need
   const game = await prisma.gameSession.findUnique({
     where: { id },
     include: {
       rounds: {
         where: { completedAt: { not: null } },
         orderBy: { roundNumber: 'asc' }
       }
     }
   });
   ```

3. **Use pagination:**
   ```typescript
   const games = await prisma.gameSession.findMany({
     skip: offset,
     take: limit,
     orderBy: { createdAt: 'desc' }
   });
   ```

---

## Migration Strategy

### Initial Migration

```bash
# Generate migration
npx prisma migrate dev --name init

# Apply to production
npx prisma migrate deploy
```

### Adding New Fields

```prisma
// Add field to User model
model User {
  // ... existing fields
  profilePictureUrl String? @db.Text
}
```

```bash
# Generate migration
npx prisma migrate dev --name add_profile_picture

# Migration file created: prisma/migrations/20251109_add_profile_picture/migration.sql
```

### Rollback Strategy

Prisma doesn't have built-in rollback. For safety:

1. **Backup before migration:**
   ```bash
   pg_dump database_name > backup.sql
   ```

2. **Test migrations in staging first**

3. **Use reversible migrations:**
   ```sql
   -- Up
   ALTER TABLE users ADD COLUMN profile_picture_url TEXT;

   -- Down (manual)
   ALTER TABLE users DROP COLUMN profile_picture_url;
   ```

---

## Seed Data

### Development Seed

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: 'test1@example.com' },
    update: {},
    create: {
      email: 'test1@example.com',
      username: 'testuser1',
      password: await bcrypt.hash('password123', 10),
      eloRating: 1200,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'test2@example.com' },
    update: {},
    create: {
      email: 'test2@example.com',
      username: 'testuser2',
      password: await bcrypt.hash('password123', 10),
      eloRating: 1150,
    },
  });

  // Create sample game
  const game = await prisma.gameSession.create({
    data: {
      player1Id: user1.id,
      player2Id: user2.id,
      status: 'COMPLETED',
      maxRounds: 5,
      currentRound: 5,
      player1Score: 425,
      player2Score: 410,
      winnerId: user1.id,
      startedAt: new Date(),
      endedAt: new Date(),
    },
  });

  console.log({ user1, user2, game });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Run Seed

```bash
npx prisma db seed
```

### package.json

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## Database Utilities

### Connection Pooling

```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

// Connection pooling is handled automatically by Prisma
// For Railway, use connection limit: ?connection_limit=10

export { prisma };
```

### Health Check

```typescript
// Check database connection
async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

### Cache Eviction

```typescript
// Clean up old song cache entries
async function evictOldCache() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deleted = await prisma.songCache.deleteMany({
    where: {
      lastAccessed: {
        lt: thirtyDaysAgo,
      },
    },
  });

  console.log(`Evicted ${deleted.count} old cache entries`);
}
```

---

## Next Steps

1. **Create Prisma Schema File**: Copy schema to `prisma/schema.prisma`
2. **Generate Prisma Client**: `npx prisma generate`
3. **Create Migration**: `npx prisma migrate dev --name init`
4. **Create Seed File**: `prisma/seed.ts`
5. **Test Locally**: Run seed and verify data

For implementation code, see `packages/backend/src/repositories/`.
