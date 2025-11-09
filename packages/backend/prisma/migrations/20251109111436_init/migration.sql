-- CreateEnum
CREATE TYPE "game_status" AS ENUM ('WAITING', 'ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "music_service" AS ENUM ('SPOTIFY', 'APPLE', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "game_mode" AS ENUM ('ONLINE', 'IN_PERSON');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "spotifyAccessToken" TEXT,
    "spotifyRefreshToken" TEXT,
    "spotifyTokenExpiry" TIMESTAMPTZ,
    "spotifyUserId" VARCHAR(255),
    "appleMusicToken" TEXT,
    "appleMusicTokenExpiry" TIMESTAMPTZ,
    "totalGamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "totalRoundsPlayed" INTEGER NOT NULL DEFAULT 0,
    "totalGamesWon" INTEGER NOT NULL DEFAULT 0,
    "totalGamesLost" INTEGER NOT NULL DEFAULT 0,
    "averageMatchScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "eloRating" INTEGER NOT NULL DEFAULT 1000,
    "peakEloRating" INTEGER NOT NULL DEFAULT 1000,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "startedAt" TIMESTAMPTZ,
    "endedAt" TIMESTAMPTZ,
    "status" "game_status" NOT NULL DEFAULT 'WAITING',
    "maxRounds" INTEGER NOT NULL DEFAULT 10,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "musicService" "music_service" NOT NULL DEFAULT 'SPOTIFY',
    "allowExplicit" BOOLEAN NOT NULL DEFAULT true,
    "region" CHAR(2) NOT NULL DEFAULT 'US',
    "gameMode" "game_mode" NOT NULL DEFAULT 'ONLINE',
    "player1Id" UUID NOT NULL,
    "player2Id" UUID,
    "player1Score" INTEGER NOT NULL DEFAULT 0,
    "player2Score" INTEGER NOT NULL DEFAULT 0,
    "winnerId" UUID,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_rounds" (
    "id" UUID NOT NULL,
    "gameSessionId" UUID NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,
    "firstPlayerId" UUID NOT NULL,
    "secondPlayerId" UUID NOT NULL,
    "firstPlayerSongId" VARCHAR(150) NOT NULL,
    "secondPlayerSongId" VARCHAR(150),
    "firstPlayerSongPlatform" "music_service" NOT NULL,
    "secondPlayerSongPlatform" "music_service",
    "firstPlayerSubmittedAt" TIMESTAMPTZ,
    "secondPlayerSubmittedAt" TIMESTAMPTZ,
    "matchScore" INTEGER,
    "matchConfidence" DECIMAL(3,2),
    "matchBreakdown" JSONB,
    "matchExplanation" JSONB,
    "firstPlayerPoints" INTEGER,
    "secondPlayerPoints" INTEGER,
    "processingTimeMs" INTEGER,
    "algorithmVersion" VARCHAR(10) NOT NULL DEFAULT '1.0',

    CONSTRAINT "game_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_cache" (
    "id" VARCHAR(150) NOT NULL,
    "platform" "music_service" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "artist" VARCHAR(255) NOT NULL,
    "album" VARCHAR(255),
    "releaseYear" INTEGER,
    "durationMs" INTEGER,
    "explicit" BOOLEAN NOT NULL DEFAULT false,
    "popularity" INTEGER,
    "previewUrl" TEXT,
    "fullUrl" TEXT,
    "albumArtUrl" TEXT,
    "isrc" VARCHAR(20),
    "features" JSONB NOT NULL,
    "genres" TEXT[],
    "cachedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "featuresEstimated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "song_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_history" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "song1Id" VARCHAR(150) NOT NULL,
    "song2Id" VARCHAR(150) NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "matchConfidence" DECIMAL(3,2) NOT NULL,
    "matchBreakdown" JSONB NOT NULL,
    "algorithmVersion" VARCHAR(10) NOT NULL,
    "humanScore" INTEGER,
    "humanFeedback" TEXT,
    "processingTimeMs" INTEGER,

    CONSTRAINT "match_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_playlists" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_items" (
    "id" UUID NOT NULL,
    "playlistId" UUID NOT NULL,
    "songId" VARCHAR(150) NOT NULL,
    "platform" "music_service" NOT NULL,
    "position" INTEGER NOT NULL,
    "addedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_eloRating_idx" ON "users"("eloRating");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "game_sessions_status_idx" ON "game_sessions"("status");

-- CreateIndex
CREATE INDEX "game_sessions_player1Id_player2Id_idx" ON "game_sessions"("player1Id", "player2Id");

-- CreateIndex
CREATE INDEX "game_sessions_createdAt_idx" ON "game_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "game_sessions_winnerId_idx" ON "game_sessions"("winnerId");

-- CreateIndex
CREATE INDEX "game_rounds_gameSessionId_idx" ON "game_rounds"("gameSessionId");

-- CreateIndex
CREATE INDEX "game_rounds_firstPlayerSongId_idx" ON "game_rounds"("firstPlayerSongId");

-- CreateIndex
CREATE INDEX "game_rounds_secondPlayerSongId_idx" ON "game_rounds"("secondPlayerSongId");

-- CreateIndex
CREATE UNIQUE INDEX "game_rounds_gameSessionId_roundNumber_key" ON "game_rounds"("gameSessionId", "roundNumber");

-- CreateIndex
CREATE INDEX "song_cache_platform_idx" ON "song_cache"("platform");

-- CreateIndex
CREATE INDEX "song_cache_title_artist_idx" ON "song_cache"("title", "artist");

-- CreateIndex
CREATE INDEX "song_cache_isrc_idx" ON "song_cache"("isrc");

-- CreateIndex
CREATE INDEX "song_cache_cachedAt_idx" ON "song_cache"("cachedAt");

-- CreateIndex
CREATE INDEX "song_cache_lastAccessed_idx" ON "song_cache"("lastAccessed");

-- CreateIndex
CREATE INDEX "match_history_song1Id_song2Id_idx" ON "match_history"("song1Id", "song2Id");

-- CreateIndex
CREATE INDEX "match_history_createdAt_idx" ON "match_history"("createdAt");

-- CreateIndex
CREATE INDEX "match_history_algorithmVersion_idx" ON "match_history"("algorithmVersion");

-- CreateIndex
CREATE INDEX "user_playlists_userId_idx" ON "user_playlists"("userId");

-- CreateIndex
CREATE INDEX "user_playlists_createdAt_idx" ON "user_playlists"("createdAt");

-- CreateIndex
CREATE INDEX "playlist_items_playlistId_idx" ON "playlist_items"("playlistId");

-- CreateIndex
CREATE INDEX "playlist_items_songId_idx" ON "playlist_items"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_items_playlistId_position_key" ON "playlist_items"("playlistId", "position");

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_playlists" ADD CONSTRAINT "user_playlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "user_playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
