# Conversation Session Service

A NestJS backend service for a Voice AI platform. Each incoming call creates a conversation session, and a session can receive multiple events over time.

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **MongoDB** 6+ 

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

## Running the project

```bash
# development
npm run start

# watch mode (auto-reload on changes)
npm run start:dev
```

The API runs on `http://localhost:3000` by default.

## API Endpoints

| Method | Endpoint                           | Description                              |
|--------|------------------------------------|------------------------------------------|
| POST   | `/sessions`                        | Create or upsert a session (idempotent)  |
| POST   | `/sessions/:sessionId/events`      | Add an event to a session (idempotent)   |
| GET    | `/sessions/:sessionId`             | Get session with paginated events        |
| POST   | `/sessions/:sessionId/complete`     | Complete session (idempotent)            |
| POST   | `/sessions/:sessionId/status`      | Update status (initiated, active, failed) |

## Assumptions

- **sessionId** is required and provided by the client (externally provided per domain model).
- **language** and **metadata** are optional on session creation.
- **Events** use `limit` (default 10) and `offset` for pagination.
- MongoDB runs locally; no auth on the database for local development.
- No authentication/authorization on the API (per assignment constraints).

## Project structure

```
src/
├── common/           # Shared filters (HTTP exception handling)
├── events/           # Event schema, service, module
├── sessions/         # Session schema, service, controller, module
├── app.module.ts
└── main.ts
```


## Design decisions

See [DESIGN.md](./DESIGN.md) for detailed answers on idempotency, concurrency, indexing, scaling, and scope.
