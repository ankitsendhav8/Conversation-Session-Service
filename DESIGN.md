# Design Document — Conversation Session Service

## 1. How did you ensure idempotency?

### Create/Upsert Session (POST /sessions)

- Uses MongoDB `findOneAndUpdate` with `upsert: true` and `$setOnInsert`.
- If `sessionId` exists: no fields are updated (`$setOnInsert` only runs on insert), and the existing session is returned.
- If `sessionId` does not exist: a new session is created.
- Same request repeated multiple times yields the same result.

### Add Event (POST /sessions/:sessionId/events)

- A compound unique index on `(sessionId, eventId)` enforces uniqueness per session.
- Before insert: check if event exists; if so, return it (idempotent).
- On duplicate key error (race condition): find the existing event and return it instead of throwing.
- Duplicate requests for the same `(sessionId, eventId)` always return the existing event.

### Complete Session (POST /sessions/:sessionId/complete)

- Uses `updateOne` to set `status: 'completed'` and `endedAt`.
- Calling complete again updates the same document again without changing the logical outcome (already completed).
- Idempotency could be improved by using `findOneAndUpdate` and returning the session instead of `updateOne`, so the response is always the same session document.

---

## 2. How does your design behave under concurrent requests?

### Create Session

- `findOneAndUpdate` with `upsert` is atomic.
- Two concurrent requests with the same `sessionId`:
  - First one inserts, the second finds the document and updates it (with no-op `$setOnInsert`).
  - Both return the same session; one document is created.
- Possible duplicate key errors if both try to insert at the same time; MongoDB’s upsert semantics handle this by retrying one operation as an update.

### Add Event

- Session existence is checked with `findOne` before inserting the event; a small TOCTOU window exists but is acceptable.
- Duplicate `(sessionId, eventId)` inserts are rejected by the compound unique index; the second request finds and returns the existing event (idempotent).
- Event creation itself is atomic (`create` is a single insert).

### Get Session & Complete Session

- Reads and updates are independent; no special coordination needed.
- Concurrent completes for the same session both succeed but produce the same final state.

---

## 3. What MongoDB indexes did you choose and why?

### Session collection

- **`sessionId` (unique)** — Default from Mongoose `@Prop({ unique: true })`. Used for:
  - Primary lookup by `sessionId`
  - Uniqueness for session creation/upsert

### Event collection

- **`{ sessionId: 1, eventId: 1 }` (compound unique)** — Enforces uniqueness per session; allows the same `eventId` in different sessions; supports idempotent add-event lookups.
- **`{ sessionId: 1, timestamp: 1 }`** — Supports paginated queries for events by session ordered by timestamp.

---

## 4. How would you scale this system for millions of sessions per day?

1. **MongoDB**
   - Shard by `sessionId` (or a hash of it) for horizontal scaling.
   - Use read replicas for GET-heavy workloads.
   - Tune write concern (e.g. `w: 1`) for lower latency where acceptable.

2. **API layer**
   - Run multiple NestJS instances behind a load balancer.
   - Use connection pooling for MongoDB (default in Mongoose).

3. **Caching**
   - Add Redis for hot sessions and recent events.
   - Cache session metadata and short event lists; invalidate on updates.

4. **Event handling**
   - Move event ingestion to a message queue (Kafka/RabbitMQ) so API remains fast and events are processed asynchronously.
   - PDF says no background jobs/queues, so this would be a future step.

5. **Storage**
   - Consider splitting hot vs cold data: recent sessions and events in primary store, older data in cheaper storage.

---

## 5. What did you intentionally keep out of scope, and why?

| Out of scope              | Reason                                                                 |
|---------------------------|------------------------------------------------------------------------|
| Authentication/Authorization | PDF specifies no auth is required.                                |
| Background jobs/queues    | PDF explicitly states no background jobs or queues.                    |
| External services         | PDF requires keeping the solution self-contained.                      |
| Repository layer          | Kept simple with services using Mongoose directly for a take-home.     |
| DTOs and validation pipes | Kept minimal; would add `class-validator` DTOs in production.         |
| Comprehensive test suite | Basic structure exists; full coverage would be a next step.            |
| Rate limiting              | Not required for the assignment.                                      |
| Logging/monitoring        | Basic error handling only; observability would come later.             |
