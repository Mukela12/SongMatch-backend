import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

/**
 * Dependency Injection Container Setup
 *
 * This file configures TSyringe DI container with all application dependencies.
 * Services are registered here and can be injected using @inject() decorator.
 */

// Register database clients as singletons
container.registerInstance<PrismaClient>('PrismaClient', prisma);
container.registerInstance<Redis>('Redis', redis);

// Register repositories (will be implemented later)
// Example:
// container.registerSingleton<UserRepository>('UserRepository', UserRepository);

// Register services (will be implemented later)
// Example:
// container.registerSingleton<AuthService>('AuthService', AuthService);
// container.registerSingleton<MatchingService>('MatchingService', MatchingService);

export { container };
