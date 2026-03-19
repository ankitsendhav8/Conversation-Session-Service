# Conversation Session Service

A NestJS backend service for a Voice AI platform. Each incoming call creates a conversation session, and a session can receive multiple events over time.

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **MongoDB** 6+ 

## Projet Setup

### 1. Clone the repository and navigate to the project directory: 

```bash
git clone https://github.com/ankitsendhav8/Conversation-Session-Service.git
cd conversation-session-service
```

### 2. Install the required packages:

```bash
npm install
```

### 3. Start MongoDB

Ensure MongoDB is running locally on `mongodb://127.0.0.1:27017`, or update the connection string in `src/app.module.ts`:

```typescript
MongooseModule.forRoot('mongodb://127.0.0.1:27017/conversation-db')
```

## Running the project
To start the project server:
```bash
npm run start:dev
```

The API runs on `http://localhost:3000` by default.


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
