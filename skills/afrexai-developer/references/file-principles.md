# File Principles

## Core Rule

**One responsibility per file.** If you can't describe a file's purpose in one sentence, it's doing too much.

## Group by Feature, Not Type

```
# ❌ Bad — grouped by type
src/
  controllers/
    userController.ts
    orderController.ts
  services/
    userService.ts
    orderService.ts
  models/
    userModel.ts
    orderModel.ts

# ✅ Good — grouped by feature
src/
  users/
    user.service.ts
    user.repository.ts
    user.types.ts
    user.routes.ts
    user.test.ts
  orders/
    order.service.ts
    order.repository.ts
    order.types.ts
    order.routes.ts
    order.test.ts
  shared/
    errors.ts
    logger.ts
    config.ts
```

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Feature module | kebab-case directory | `user-auth/` |
| Service | `feature.service.ext` | `user.service.ts` |
| Repository/data | `feature.repository.ext` | `order.repository.ts` |
| Types/interfaces | `feature.types.ext` | `user.types.ts` |
| Routes/handlers | `feature.routes.ext` | `auth.routes.ts` |
| Tests | `feature.test.ext` | `user.service.test.ts` |
| Utilities | `purpose.util.ext` | `date.util.ts` |
| Constants | `feature.constants.ext` | `auth.constants.ts` |
| Config | `config.ext` or `feature.config.ext` | `database.config.ts` |
| Components (React) | PascalCase | `UserProfile.tsx` |

## Directory Structure

```
src/
  features/          # Feature modules (bulk of the code)
    feature-name/
      index.ts       # Public API (re-exports)
      *.service.ts   # Business logic
      *.repository.ts # Data access
      *.types.ts     # Types and interfaces
      *.routes.ts    # HTTP handlers
      *.test.ts      # Tests
  shared/            # Cross-feature utilities
    errors/          # Error types
    middleware/       # Shared middleware
    utils/           # Pure utility functions
  config/            # App configuration
  index.ts           # Entry point
```

## Import Organization

Order imports in every file:

```typescript
// 1. External packages
import express from 'express';
import { z } from 'zod';

// 2. Internal absolute imports (shared modules)
import { AppError } from '@/shared/errors';
import { logger } from '@/shared/logger';

// 3. Relative imports (same feature)
import { UserRepository } from './user.repository';
import { UserSchema } from './user.types';
```

Separate each group with a blank line.

## When to Create a New File

Create a new file when:

- A function/class serves a **different responsibility** than the current file
- A file exceeds **300 lines**
- You're adding a **new feature** (start with its own directory)
- Shared logic is used by **2+ features** → move to `shared/`
- Types grow beyond **10 type definitions** → separate types file

Do NOT create a new file when:

- It would contain a single small helper used only by one file
- It would create a circular dependency
- The current file is under 100 lines and the addition is related

## Index Files (Barrel Exports)

Each feature directory should have an `index.ts` that exports the public API:

```typescript
// users/index.ts
export { UserService } from './user.service';
export type { User, CreateUserInput } from './user.types';
```

Rules:
- Only export what other features need
- Internal implementation stays unexported
- Don't re-export everything — curate the public API

## File Size Guidelines

| Size | Action |
|---|---|
| < 100 lines | Healthy — leave as is |
| 100-200 lines | Fine — monitor growth |
| 200-300 lines | Consider splitting soon |
| 300+ lines | Split now — find the seam |

## Finding the Seam

When splitting a large file, look for:

1. **Logical groups** — functions that work together
2. **Abstraction levels** — high-level orchestration vs low-level helpers
3. **Change frequency** — things that change together stay together
4. **Dependencies** — minimize cross-references after the split
