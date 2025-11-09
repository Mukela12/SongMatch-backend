# SongMatch 🎵

> A multiplayer music discovery game where players match songs based on vibe, energy, and sonic characteristics.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-blueviolet)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Project Overview

**SongMatch** is a multiplayer music game that uses a scientifically-backed algorithm to match songs based on their audio features, musical structure, and metadata. Players compete to find songs that match well, learning about music similarity in the process.

### Key Features

- 🎮 **Multiplayer Gameplay**: Play online or in-person with friends
- 🎵 **Music Platform Integration**: Spotify (MVP), Apple Music & YouTube Music (planned)
- 🧠 **Smart Algorithm**: Three-layer weighted matching system (70%+ accuracy target)
- 📱 **Mobile-First**: React Native app with audio preview
- 🔄 **Real-time Updates**: WebSocket-based gameplay with Socket.io
- 📊 **ELO Rating System**: Competitive rankings and leaderboards
- 🎨 **Transparent Scoring**: Human-readable explanations for match scores

---

## 🏗️ Architecture

This is a **monorepo** project using pnpm workspaces:

```
songmatch/
├── packages/
│   ├── backend/          # TypeScript Node.js server (Express + Prisma)
│   ├── shared/           # Shared TypeScript types
│   ├── mobile/           # React Native mobile app (Expo)
│   └── mcp-server/       # Documentation sync server
├── docs/                 # Comprehensive documentation
└── README.md             # This file
```

### Technology Stack

| Category | Technology |
|----------|-----------|
| **Language** | TypeScript 5.7+ |
| **Runtime** | Node.js 20 LTS |
| **Framework** | Express.js 4.21+ |
| **Database** | PostgreSQL 16+ |
| **ORM** | Prisma 6.0+ |
| **Cache** | Redis 7.4+ |
| **WebSockets** | Socket.io 4.8+ |
| **Testing** | Vitest 2.1+ |
| **Validation** | Zod 3.24+ |
| **DI** | TSyringe 4.8+ |
| **Hosting** | Railway |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20+ ([Download](https://nodejs.org/))
- **pnpm** v9+ (`npm install -g pnpm`)
- **PostgreSQL** 16+ (or use Railway)
- **Redis** 7.4+ (or use Railway)
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd SongMatch-backend
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cd packages/backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database:**
   ```bash
   cd packages/backend
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

The server will start at `http://localhost:3000` 🎉

---

## 📚 Documentation

Comprehensive documentation is available in the following files:

| Document | Description |
|----------|-------------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Quick start guide and first steps |
| [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) | Complete system architecture (7,400+ words) |
| [API_SPECIFICATION.md](API_SPECIFICATION.md) | All REST & WebSocket endpoints (5,200+ words) |
| [ALGORITHM_DOCUMENTATION.md](ALGORITHM_DOCUMENTATION.md) | Music matching algorithm (5,800+ words) |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Prisma schema and migrations (4,300+ words) |
| [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | 12-week implementation roadmap (5,600+ words) |
| [SongMatch-System-Design.md](SongMatch-System-Design.md) | Original design + v2.0 research update |

**Total Documentation:** 30,000+ words of implementation-ready guides

---

## 🎯 Development Roadmap

### Phase 1: Foundation & Algorithm (Weeks 1-2) ✅
- [x] Project structure initialized
- [x] Comprehensive documentation created
- [ ] Matching algorithm implementation
- [ ] Unit tests (80%+ coverage)

### Phase 2: Backend API & Database (Weeks 3-4)
- [ ] Spotify OAuth integration
- [ ] Authentication system (JWT)
- [ ] Music search endpoints
- [ ] User management

### Phase 3: Real-time & Game Logic (Weeks 5-6)
- [ ] Game management endpoints
- [ ] Socket.io WebSocket setup
- [ ] Round progression logic
- [ ] **MVP Milestone: Playable online game**

### Phase 4: Multi-Platform Expansion (Weeks 7-8)
- [ ] Apple Music integration
- [ ] In-person game mode
- [ ] Song suggestions
- [ ] Playlist features

### Phase 5: Mobile App (Weeks 9-10)
- [ ] React Native app (Expo)
- [ ] Authentication flows
- [ ] Game UI components
- [ ] Audio preview system

### Phase 6: Testing & Validation (Week 11)
- [ ] Algorithm validation (70%+ correlation)
- [ ] Load testing (100+ users)
- [ ] Beta testing

### Phase 7: Deployment & Launch (Week 12)
- [ ] Railway production deployment
- [ ] App Store submission
- [ ] **Public Launch** 🚀

---

## 🧪 Testing

Run tests with:

```bash
# All tests
pnpm test

# Unit tests only
pnpm --filter backend test:unit

# With coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

**Coverage Goals:**
- Overall: 80%+
- Algorithm: 95%+
- Business Logic: 90%+

---

## 🔧 Development

### Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript type checking
pnpm format           # Format code with Prettier
```

### Backend-Specific Scripts

```bash
cd packages/backend

pnpm dev              # Start dev server with hot reload
pnpm db:generate      # Generate Prisma client
pnpm db:migrate:dev   # Create and run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database with test data
```

---

## 📦 Project Structure

### Backend Package

```
packages/backend/
├── src/
│   ├── config/           # Configuration & env validation
│   ├── controllers/      # Route handlers
│   ├── services/         # Business logic
│   │   ├── matching/     # Algorithm services
│   │   └── adapters/     # Music platform adapters
│   ├── repositories/     # Database access layer
│   ├── types/            # TypeScript types
│   ├── middleware/       # Express middleware
│   ├── validators/       # Zod validation schemas
│   ├── routes/           # API routes
│   ├── socket/           # WebSocket handlers
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server initialization
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
└── tests/
    ├── unit/             # Unit tests
    ├── integration/      # Integration tests
    └── e2e/              # End-to-end tests
```

---

## 🎵 The Algorithm

SongMatch uses a three-layer weighted matching algorithm:

**Layer 1: High-Level Features (60%)**
- Valence (mood) - 15%
- Energy (intensity) - 15%
- Danceability - 12%
- Tempo (with octave awareness) - 10%
- Acousticness - 8%

**Layer 2: Musical Structure (25%)**
- Key & Mode (Circle of Fifths) - 10%
- Time Signature - 5%
- Loudness - 5%
- Duration - 5%

**Layer 3: Genre & Metadata (15%)**
- Genre overlap (Jaccard similarity) - 8%
- Artist similarity - 4%
- Era/decade match - 3%

**Target Performance:**
- < 5ms computation time per match
- 70%+ correlation with human judgment
- Human-readable explanations

See [ALGORITHM_DOCUMENTATION.md](ALGORITHM_DOCUMENTATION.md) for complete details.

---

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/spotify/connect` - Initiate Spotify OAuth

### Game Management
- `POST /api/v1/games` - Create game
- `GET /api/v1/games/:id` - Get game details
- `PUT /api/v1/games/:id/join` - Join game
- `POST /api/v1/games/:id/rounds/:num/submit-song` - Submit song

### Music
- `GET /api/v1/music/search` - Search songs
- `GET /api/v1/music/features/:platform/:id` - Get audio features
- `GET /api/v1/music/suggestions` - Get personalized suggestions

### WebSocket Events
- `game:player-joined` - Player joined
- `round:complete` - Round finished
- `game:complete` - Game finished

See [API_SPECIFICATION.md](API_SPECIFICATION.md) for complete API documentation.

---

## 🤝 Contributing

This is currently a solo project, but contributions are welcome!

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Write tests
4. Ensure `pnpm test` and `pnpm type-check` pass
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Spotify Web API** for audio features
- **Music Information Retrieval** research community
- TypeScript and Node.js ecosystems
- Railway for hosting

---

## 📞 Contact

**Developer:** Mukela Katungu
**Education:** B.S. Software Engineering, Xiamen University

---

## 🔮 Future Features

- Machine learning for algorithm optimization
- Social features (friends, challenges)
- Tournament mode
- Collaborative playlists
- Advanced statistics and insights
- YouTube Music integration
- Apple Music full support

---

**Built with ❤️ and TypeScript**

🎵 **Happy Matching!** 🎵
