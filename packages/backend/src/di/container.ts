import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { MatchingService } from '../services/matching.service';
import { MatchCacheService } from '../services/matchCache.service';
import { SpotifyService } from '../services/spotify.service';
import { SongCacheService } from '../services/songCache.service';

/**
 * Dependency Injection Container Setup
 *
 * This file configures TSyringe DI container with all application dependencies.
 * Services are registered here and can be injected using @inject() decorator.
 */

// Register database clients as singletons
container.registerInstance<PrismaClient>('PrismaClient', prisma);
container.registerInstance<Redis>('Redis', redis);

// Register matching services
container.registerSingleton<MatchingService>(MatchingService);
container.registerSingleton<MatchCacheService>(MatchCacheService);

// Register music services
container.registerSingleton<SpotifyService>(SpotifyService);
container.registerSingleton<SongCacheService>(SongCacheService);

// Register repositories (will be implemented later)
// Example:
// container.registerSingleton<UserRepository>('UserRepository', UserRepository);

// Register other services (will be implemented later)
// Example:
// container.registerSingleton<AuthService>('AuthService', AuthService);

export { container };
