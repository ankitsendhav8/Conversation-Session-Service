# Conversation Session Service

A NestJS backend service for a Voice AI platform. Each incoming call creates a conversation session, and a session can receive multiple events over time.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **MongoDB** 6+ (local install or Docker)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start MongoDB

Ensure MongoDB is running locally on `mongodb://127.0.0.1:27017`, or update the connection string in `src/app.module.ts`:

```typescript
MongooseModule.forRoot('mongodb://127.0.0.1:27017/conversation-db')
```

**Using Docker:**

```bash
docker run -d -p 27017:27017 --name mongodb mongo:6
```

## Running the project

```bash
# development
npm run start

# watch mode (auto-reload on changes)
npm run start:dev

# production
npm run start:prod
```

The API runs on `http://localhost:3000` by default. Override with the `PORT` environment variable.

## API Endpoints

| Method | Endpoint                           | Description                              |
|--------|------------------------------------|------------------------------------------|
| POST   | `/sessions`                        | Create or upsert a session (idempotent)  |
| POST   | `/sessions/:sessionId/events`      | Add an event to a session                |
| GET    | `/sessions/:sessionId`             | Get session with paginated events        |
| POST   | `/sessions/:sessionId/:sessionStatus` | Update session status (e.g. `complete`) |

### Examples

**Create session**

```bash
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-123", "language": "en"}'
```

**Add event**

```bash
curl -X POST http://localhost:3000/sessions/session-123/events \
  -H "Content-Type: application/json" \
  -d '{"eventId": "evt-1", "type": "user_speech", "payload": {}, "timestamp": "2025-03-19T10:00:00Z"}'
```

**Get session with events (paginated)**

```bash
curl "http://localhost:3000/sessions/session-123?limit=10&offset=0"
```

**Complete session**

```bash
curl -X POST http://localhost:3000/sessions/session-123/complete
```

## Assumptions

- **sessionId** is required and must be provided by the client (externally provided per domain model).
- **language** is optional; default is unset.
- **metadata** is an optional object for extensibility.
- **Events** use `limit` (default 10) and `offset` for pagination.
- MongoDB runs locally; no authentication on the database for local development.
- No authentication/authorization on the API (as per assignment constraints).

## Project structure

```
src/
├── common/           # Shared filters (HTTP exception handling)
├── events/           # Event schema, service, module
├── sessions/         # Session schema, service, controller, module
├── app.module.ts
└── main.ts
```

## Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

## Design decisions

See [DESIGN.md](./DESIGN.md) for detailed answers on idempotency, concurrency, indexing, scaling, and scope.
