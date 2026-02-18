# Architecture Guide

## Core Principles

### 1. Modular Design
- Each module has a clear boundary and public API
- Modules communicate through interfaces, not implementations
- A module can be replaced without affecting others
- Dependencies flow inward: handlers → services → repositories → data

### 2. Separation of Concerns
- **Routes/Handlers**: HTTP concerns only — parse request, call service, format response
- **Services**: Business logic — validation, orchestration, rules
- **Repositories**: Data access — queries, persistence, caching
- **Types**: Data shapes — interfaces, enums, validation schemas

Never mix layers. A route handler should not contain SQL. A repository should not validate business rules.

### 3. Dependency Direction
```
External World
    ↓
Routes / Handlers (parse input, format output)
    ↓
Services (business logic, orchestration)
    ↓
Repositories (data access)
    ↓
Data Layer (DB, APIs, filesystem)
```

Inner layers never depend on outer layers. Services don't know about HTTP. Repositories don't know about request objects.

## Design Patterns

### Service Pattern
Encapsulates business logic. One service per domain concept.

```typescript
class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private paymentService: PaymentService,
    private notifier: NotificationService,
  ) {}

  async placeOrder(input: PlaceOrderInput): Promise<Order> {
    const order = Order.create(input);
    await this.paymentService.charge(order.total);
    await this.orderRepo.save(order);
    await this.notifier.sendConfirmation(order);
    return order;
  }
}
```

### Repository Pattern
Abstracts data access. One repository per entity/aggregate.

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### Factory Pattern
Creates complex objects. Use when construction involves logic.

```typescript
class NotificationFactory {
  static create(event: DomainEvent): Notification {
    switch (event.type) {
      case 'order.placed': return new OrderConfirmation(event);
      case 'order.shipped': return new ShipmentNotice(event);
      default: throw new UnknownEventError(event.type);
    }
  }
}
```

### Observer/Event Pattern
Decouples side effects from core logic.

```typescript
// Core logic emits events
eventBus.emit('user.created', user);

// Listeners handle side effects independently
eventBus.on('user.created', sendWelcomeEmail);
eventBus.on('user.created', createDefaultWorkspace);
eventBus.on('user.created', trackAnalytics);
```

Use when: adding a feature shouldn't require modifying existing code.

## Code Quality Standards

### Coupling
- Prefer composition over inheritance
- Depend on interfaces, not concrete classes
- Avoid global state — pass dependencies explicitly
- No hidden side effects in functions

### Cohesion
- Related code stays together (feature modules)
- Unrelated code stays apart
- A class/module should have one reason to change

### Testability
- All dependencies injectable
- Pure functions where possible
- Side effects at the edges, logic in the core
- No hidden dependencies (singletons, global imports with state)

## Performance Considerations

### Do Early
- Database indexes for query patterns
- Pagination for list endpoints
- Connection pooling
- Request validation before expensive operations

### Do When Measured
- Caching (adds complexity — only when profiled)
- Query optimization (only for slow queries)
- Denormalization (only for proven read bottlenecks)
- Background jobs (only when sync is too slow)

### Never Prematurely
- Don't optimize without profiling data
- Don't cache everything "just in case"
- Don't add complexity for hypothetical scale

## Refactoring Triggers

Refactor when you see:

| Signal | Action |
|---|---|
| Same code in 3+ places | Extract shared utility |
| File > 300 lines | Split by responsibility |
| Function > 50 lines | Extract helpers |
| Feature touches 5+ files | Needs better module boundaries |
| Hard to test | Reduce coupling, inject dependencies |
| Hard to explain | Simplify — if you can't explain it, it's too complex |
| Fear of changing code | Add tests first, then refactor |
| "I'll fix it later" | Fix it now — later never comes |

## Decision Framework

When choosing between approaches:

1. **Simplest correct solution wins** — complexity must be justified
2. **Follow existing patterns** — consistency > personal preference
3. **Optimize for readability** — code is read 10x more than written
4. **Make wrong states unrepresentable** — use types to prevent bugs
5. **Prefer boring technology** — proven tools over shiny new ones
