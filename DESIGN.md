# Design Document — Conversation Session Service

## 1. How did you ensure idempotency?

**Create Session (POST /sessions)**

I used MongoDB's `findOneAndUpdate` with `upsert: true` and `$setOnInsert`. The idea is: if the session already exists, we don't change anything and just return it. If it doesn't exist, we create it. So calling the same request multiple times always gives the same result—no duplicate sessions.

**Add Event (POST /sessions/:sessionId/events)**

Before inserting, I check if an event with the same sessionId and eventId already exists. If yes, I return that event instead of creating a new one. If another request inserts the same event between my check and insert (race condition), MongoDB's unique index will reject it—then I catch that error, find the existing event, and return it. So duplicate requests always get the same event back.

**Complete Session (POST /sessions/:sessionId/complete)**

I check the session status first. If it's already completed, I return it as-is. If not, I update it to completed and set endedAt. So calling complete multiple times always returns the same result without errors.

---

## 2. How does your design behave under concurrent requests?

**Create Session**

The `findOneAndUpdate` with upsert is a single atomic operation in MongoDB. So even if two requests with the same sessionId hit at the same time, only one document gets created. Both requests will get back the same session.

**Add Event**

Creating an event is a single insert—atomic. If two requests try to add the same eventId for the same session, the compound unique index blocks the duplicate. The second request then finds and returns the existing event, so it stays idempotent.

**Get Session & Complete Session**

These are simple reads and updates. No special locking is needed. Multiple concurrent completes for the same session will all succeed and leave the session in the same final state.

---

## 3. What MongoDB indexes did you choose and why?

**Session collection**

- **sessionId (unique)** — Every lookup is by sessionId, and we need to ensure each sessionId appears only once. So a unique index on sessionId makes sense for both lookup and upsert.

**Event collection**

- **Compound index (sessionId, eventId) — unique** — The requirement says eventId must be unique per session. This index enforces that. It also lets different sessions reuse the same eventId (e.g., both can have eventId "evt-1"). I use it for idempotency checks before inserting.
- **Compound index (sessionId, timestamp)** — When we fetch events for a session, we sort by timestamp. This index makes that query efficient.

---

## 4. How would you scale this system for millions of sessions per day?

**MongoDB**

- Shard by sessionId (or a hash of it) to spread data across nodes.
- Use read replicas for GET /sessions/:sessionId, which will be read-heavy.
- Tune write concern (e.g. w: 1) where we can trade durability for lower latency.

**API layer**

- Run multiple NestJS instances behind a load balancer. Stateless API so horizontal scaling is straightforward.
- Mongoose connection pooling handles multiple DB connections efficiently.

**Caching**

- Add Redis for frequently accessed sessions and recent events. Cache on read, invalidate when a session or its events are updated.

**Event ingestion (future)**

- For very high write volume, put a message queue (e.g. Kafka or RabbitMQ) in front. The API accepts events quickly and pushes them to the queue; workers process them and write to MongoDB. The assignment said no queues, so I kept it out of scope.

**Storage**

- For old data, consider moving cold sessions and events to cheaper storage and keeping only recent data in the hot database.

---

## 5. What did you intentionally keep out of scope, and why?

**Authentication** — The assignment said no auth was needed, so I didn't add it. In production we would add JWT or similar.

**Monitoring and logging** — I focused on basic error handling and correctness. For production we would add structured logging, metrics (e.g. Prometheus), and tracing.

**Rate limiting** — Not required by the assignment. In production we would add it at the API gateway or in middleware.

**Background jobs / queues** — The PDF explicitly said no background jobs or queues. Event ingestion stays synchronous for now.
