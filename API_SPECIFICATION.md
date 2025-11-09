# SongMatch API Specification

> Complete REST API and WebSocket specification for the SongMatch backend
>
> **Last Updated:** 2025-11-09
> **Version:** 1.0
> **Base URL:** `https://api.songmatch.app/api/v1`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Authentication Endpoints](#authentication-endpoints)
5. [Game Endpoints](#game-endpoints)
6. [Music Endpoints](#music-endpoints)
7. [Match Endpoints](#match-endpoints)
8. [User Endpoints](#user-endpoints)
9. [WebSocket Events](#websocket-events)
10. [Error Codes](#error-codes)

---

## Overview

### Base URL

```
Production:  https://api.songmatch.app/api/v1
Development: http://localhost:3000/api/v1
```

### Versioning

All endpoints are versioned with `/v1/` prefix. Future breaking changes will use `/v2/`.

### Content Type

All requests and responses use `application/json`.

### Rate Limiting

```
Authentication endpoints:  10 requests/hour
Game endpoints:            100 requests/hour
Music search:              100 requests/hour
General:                   1000 requests/hour
```

---

## Authentication

### JWT Tokens

Most endpoints require authentication via JWT token:

```http
Authorization: Bearer <jwt_token>
```

### OAuth Flow (Spotify)

```
1. Client initiates: GET /auth/spotify/connect
2. User authorizes on Spotify
3. Callback: GET /auth/spotify/callback?code=...
4. Server returns JWT token + user data
```

---

## Common Patterns

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-11-09T12:00:00Z",
    "version": "1.0"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "maxRounds",
        "message": "Must be between 1 and 20"
      }
    ]
  }
}
```

### Pagination

For list endpoints:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "musiclover123",
  "password": "SecurePass123!"
}
```

**Validation:**
- Email: Valid email format
- Username: 3-20 characters, alphanumeric + underscore
- Password: Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "username": "musiclover123",
      "createdAt": "2025-11-09T12:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "username": "musiclover123"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials

---

### GET /auth/spotify/connect

Initiate Spotify OAuth flow.

**Query Parameters:**
- `redirectUrl` (optional): Where to redirect after auth

**Response (302 Redirect):**
Redirects to Spotify authorization page.

---

### GET /auth/spotify/callback

OAuth callback from Spotify.

**Query Parameters:**
- `code`: Authorization code from Spotify
- `state`: CSRF protection token

**Response (302 Redirect):**
Redirects to app with JWT token:
```
myapp://auth/callback?token=<jwt_token>&userId=<user_id>
```

---

### POST /auth/spotify/disconnect

Disconnect Spotify account.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Spotify account disconnected"
  }
}
```

---

## Game Endpoints

### POST /games

Create a new game session.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "maxRounds": 10,
  "musicService": "spotify",
  "allowExplicit": true,
  "inviteUserId": "uuid-here"  // Optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "gameId": "game-uuid",
    "status": "waiting",
    "maxRounds": 10,
    "currentRound": 0,
    "player1": {
      "id": "user-uuid",
      "username": "musiclover123"
    },
    "player2": null,
    "createdAt": "2025-11-09T12:00:00Z"
  }
}
```

---

### GET /games/:gameId

Get game details.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "gameId": "game-uuid",
    "status": "active",
    "maxRounds": 10,
    "currentRound": 3,
    "player1": {
      "id": "user-uuid-1",
      "username": "player1",
      "score": 245
    },
    "player2": {
      "id": "user-uuid-2",
      "username": "player2",
      "score": 230
    },
    "rounds": [
      {
        "roundNumber": 1,
        "player1Song": {
          "id": "spotify:track:abc123",
          "name": "Song Title",
          "artist": "Artist Name"
        },
        "player2Song": {
          "id": "spotify:track:def456",
          "name": "Another Song",
          "artist": "Another Artist"
        },
        "matchScore": 85,
        "player1Points": 75,
        "player2Points": 75
      }
    ]
  }
}
```

---

### PUT /games/:gameId/join

Join an existing game.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "gameId": "game-uuid",
    "status": "active",
    "message": "Successfully joined game"
  }
}
```

**Errors:**
- `404 Not Found`: Game doesn't exist
- `409 Conflict`: Game already full
- `403 Forbidden`: Cannot join own game

---

### POST /games/:gameId/rounds/:roundNum/submit-song

Submit song for current round.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "songId": "spotify:track:abc123",
  "platform": "spotify"
}
```

**Response (200 OK):**

If waiting for opponent:
```json
{
  "success": true,
  "data": {
    "roundNumber": 1,
    "status": "waiting_opponent",
    "yourSong": {
      "id": "spotify:track:abc123",
      "name": "Song Title",
      "artist": "Artist Name"
    }
  }
}
```

If round complete (both players submitted):
```json
{
  "success": true,
  "data": {
    "roundNumber": 1,
    "status": "complete",
    "matchResult": {
      "overallScore": 85,
      "confidence": 0.92,
      "explanation": {
        "summary": "Great match! Both songs share high energy and similar mood.",
        "topReasons": [
          "Energy levels are very close (0.82 vs 0.85)",
          "Both songs are in major key",
          "Similar tempo (125 BPM vs 128 BPM)"
        ]
      },
      "breakdown": {
        "layer1": {
          "score": 0.88,
          "components": {
            "valence": 0.95,
            "energy": 0.92,
            "danceability": 0.85
          }
        }
      }
    },
    "points": {
      "player1": 75,
      "player2": 75
    },
    "gameStatus": "active",
    "nextRound": 2
  }
}
```

**Errors:**
- `400 Bad Request`: Not your turn, round already complete
- `404 Not Found`: Game or round not found

---

### DELETE /games/:gameId/abandon

Abandon a game in progress.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Game abandoned"
  }
}
```

---

### GET /games/my-games

Get current user's games.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: Filter by status (waiting, active, completed)
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "gameId": "game-uuid",
      "status": "active",
      "opponent": {
        "username": "player2"
      },
      "currentRound": 5,
      "maxRounds": 10,
      "myScore": 425,
      "opponentScore": 410,
      "lastActivity": "2025-11-09T12:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 45
    }
  }
}
```

---

## Music Endpoints

### GET /music/search

Search for songs.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q`: Search query (required)
- `platform`: Music platform (default: spotify)
- `limit`: Number of results (default: 20, max: 50)
- `offset`: Pagination offset

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tracks": [
      {
        "id": "spotify:track:abc123",
        "name": "Song Title",
        "artist": "Artist Name",
        "album": "Album Name",
        "releaseYear": 2023,
        "duration": 205000,
        "explicit": false,
        "popularity": 85,
        "previewUrl": "https://p.scdn.co/mp3-preview/...",
        "albumArt": "https://i.scdn.co/image/..."
      }
    ]
  },
  "meta": {
    "query": "upbeat pop",
    "platform": "spotify",
    "total": 1000
  }
}
```

---

### GET /music/features/:platform/:songId

Get audio features for a song.

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
- `platform`: spotify, apple, youtube
- `songId`: Platform-specific song ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "songId": "spotify:track:abc123",
    "features": {
      "valence": 0.725,
      "energy": 0.845,
      "danceability": 0.680,
      "acousticness": 0.123,
      "instrumentalness": 0.002,
      "liveness": 0.095,
      "speechiness": 0.042,
      "tempo": 125.5,
      "loudness": -5.2,
      "key": 0,
      "mode": 1,
      "timeSignature": 4,
      "durationMs": 205000
    },
    "metadata": {
      "genres": ["pop", "dance-pop"],
      "releaseYear": 2023,
      "popularity": 85
    },
    "cached": true,
    "cacheAge": 3600
  }
}
```

---

### GET /music/suggestions

Get personalized song suggestions for current round.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `gameId`: Current game ID (required)
- `roundNum`: Current round number (required)
- `count`: Number of suggestions (default: 5, max: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "spotify:track:abc123",
        "name": "Song Title",
        "artist": "Artist Name",
        "reason": "From your recently played",
        "confidence": 0.85,
        "previewUrl": "https://...",
        "albumArt": "https://..."
      }
    ],
    "strategy": {
      "familiar": 3,
      "discovery": 2
    }
  }
}
```

---

## Match Endpoints

### POST /match/calculate

Calculate match between two songs (for testing/preview).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "song1": {
    "id": "spotify:track:abc123",
    "platform": "spotify"
  },
  "song2": {
    "id": "spotify:track:def456",
    "platform": "spotify"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "confidence": 0.92,
    "breakdown": {
      "layer1": {
        "name": "High-Level Features",
        "score": 88,
        "weight": 0.60,
        "components": {
          "valence": {
            "similarity": 0.95,
            "weight": 0.15,
            "song1": 0.725,
            "song2": 0.745
          },
          "energy": {
            "similarity": 0.92,
            "weight": 0.15,
            "song1": 0.845,
            "song2": 0.820
          }
        }
      },
      "layer2": {
        "name": "Musical Structure",
        "score": 75,
        "weight": 0.25
      },
      "layer3": {
        "name": "Genre & Metadata",
        "score": 90,
        "weight": 0.15
      }
    },
    "explanation": {
      "summary": "Great match! Both songs share high energy and similar mood.",
      "topReasons": [
        "Energy levels are very close (0.82 vs 0.85)",
        "Both songs are in major key",
        "Similar tempo (125 BPM vs 128 BPM)",
        "Shared genre: pop"
      ],
      "differences": [
        "Song 1 is more acoustic",
        "Different time signatures"
      ]
    },
    "processingTime": 45,
    "algorithmVersion": "1.0"
  }
}
```

---

### GET /match/explain/:matchId

Get detailed explanation for a completed match.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "matchId": "match-uuid",
    "song1": {
      "id": "spotify:track:abc123",
      "name": "Song Title 1"
    },
    "song2": {
      "id": "spotify:track:def456",
      "name": "Song Title 2"
    },
    "explanation": {
      "summary": "...",
      "visualization": {
        "radarChart": {
          "song1": [0.8, 0.7, 0.9, 0.6],
          "song2": [0.75, 0.72, 0.88, 0.65],
          "labels": ["Energy", "Valence", "Danceability", "Acousticness"]
        }
      }
    }
  }
}
```

---

## User Endpoints

### GET /users/me

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "musiclover123",
    "createdAt": "2025-01-01T00:00:00Z",
    "stats": {
      "totalGamesPlayed": 45,
      "totalRoundsPlayed": 420,
      "averageMatchScore": 72.5,
      "eloRating": 1250,
      "rank": "Gold",
      "currentStreak": 5
    },
    "connectedServices": {
      "spotify": {
        "connected": true,
        "username": "spotifyuser",
        "connectedAt": "2025-01-15T00:00:00Z"
      },
      "appleMusic": {
        "connected": false
      }
    }
  }
}
```

---

### PATCH /users/me

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "username": "newusername",
  "preferences": {
    "notifications": {
      "dailyChallenge": true,
      "friendRequests": true,
      "gameInvites": true
    },
    "privacy": {
      "showOnLeaderboard": true,
      "allowFriendRequests": true
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "username": "newusername",
    "preferences": { ... }
  }
}
```

---

### GET /users/:userId/stats

Get public stats for a user.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "username": "musiclover123",
    "stats": {
      "totalGamesPlayed": 45,
      "totalRoundsPlayed": 420,
      "averageMatchScore": 72.5,
      "eloRating": 1250,
      "rank": "Gold"
    },
    "recentGames": [
      {
        "gameId": "game-uuid",
        "opponent": "player2",
        "result": "win",
        "score": 850,
        "playedAt": "2025-11-09T12:00:00Z"
      }
    ]
  }
}
```

---

### GET /leaderboard

Get global leaderboard.

**Query Parameters:**
- `type`: global, weekly, friends (default: global)
- `limit`: Number of entries (default: 100, max: 100)
- `offset`: Pagination offset

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "rank": 1,
        "userId": "user-uuid",
        "username": "topplayer",
        "eloRating": 2150,
        "totalPoints": 15420,
        "gamesPlayed": 250,
        "averageMatchScore": 78.5
      }
    ],
    "myRank": {
      "rank": 42,
      "percentile": 85.5
    }
  },
  "meta": {
    "type": "global",
    "updatedAt": "2025-11-09T12:00:00Z"
  }
}
```

---

## WebSocket Events

### Connection

```javascript
const socket = io('wss://api.songmatch.app', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Server → Client Events

#### `game:player-joined`

Another player joined the game.

```json
{
  "gameId": "game-uuid",
  "player": {
    "id": "user-uuid",
    "username": "player2"
  }
}
```

#### `game:started`

Game has started (both players ready).

```json
{
  "gameId": "game-uuid",
  "startTime": "2025-11-09T12:00:00Z",
  "currentRound": 1
}
```

#### `round:song-submitted`

Opponent submitted a song.

```json
{
  "gameId": "game-uuid",
  "roundNumber": 1,
  "player": "player1",
  "songSubmitted": true,
  "waitingFor": "player2"
}
```

#### `round:complete`

Round finished, match calculated.

```json
{
  "gameId": "game-uuid",
  "roundNumber": 1,
  "matchResult": {
    "overallScore": 85,
    "explanation": { ... }
  },
  "scores": {
    "player1": {
      "roundPoints": 75,
      "totalPoints": 245
    },
    "player2": {
      "roundPoints": 75,
      "totalPoints": 230
    }
  },
  "nextRound": 2
}
```

#### `game:complete`

Game finished.

```json
{
  "gameId": "game-uuid",
  "winner": "player1",
  "finalScores": {
    "player1": 850,
    "player2": 830
  },
  "performanceRating": "A",
  "eloChanges": {
    "player1": +15,
    "player2": -15
  }
}
```

#### `error`

Error occurred.

```json
{
  "code": "GAME_NOT_FOUND",
  "message": "Game session not found"
}
```

### Client → Server Events

#### `game:join`

Join a game room.

```json
{
  "gameId": "game-uuid"
}
```

#### `round:submit-song`

Submit song for current round (also via REST).

```json
{
  "gameId": "game-uuid",
  "roundNumber": 1,
  "songId": "spotify:track:abc123"
}
```

#### `game:leave`

Leave game room.

```json
{
  "gameId": "game-uuid"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., game full) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | External service unavailable |

### Detailed Error Responses

#### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "maxRounds",
        "message": "Must be between 1 and 20",
        "value": 25
      }
    ]
  }
}
```

#### Authentication Error
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

#### Rate Limit Error
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 3600
  }
}
```

---

## Changelog

### Version 1.0 (2025-11-09)
- Initial API specification
- Authentication endpoints
- Game management endpoints
- Music search and features
- WebSocket real-time events
- Leaderboard and user stats

---

## Next Steps

1. Implement REST endpoints with Express
2. Add Zod validation schemas
3. Set up Socket.io for WebSocket events
4. Write integration tests for all endpoints
5. Generate API documentation with Swagger/OpenAPI

For implementation details, see `TECHNICAL_ARCHITECTURE.md` and `DEVELOPMENT_PLAN.md`.
