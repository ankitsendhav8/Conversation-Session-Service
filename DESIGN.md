# Design Document — Conversation Session Service

## 1. How did you ensure idempotency?

### Create or Upsert Session

- If `sessionId` exists: no fields are updated (`$setOnInsert` only runs on insert), and the existing session is returned.
- If `sessionId` does not exist: a new session is created.
- Same request repeated multiple times gives the same result.

### Add Event to Session

- A compound unique index on `(sessionId, eventId)` enforces uniqueness per session.
- Before insert: check if event exists; if so, return it (idempotent).
- On duplicate key error (race condition): find the existing event and return it instead of throwing.
- Duplicate requests for the same `(sessionId, eventId)` always return the existing event.

### Complete Session (POST /sessions/:sessionId/complete)

- Dedicated endpoint that sets `status` to `completed` and `endedAt`.
- Uses `findOneAndUpdate` with `returnDocument: 'after'` to return the session document.
- If already completed: returns the existing session without updating (idempotent).
- Calling complete multiple times yields the same response.

---

## 2. How does your design behave under concurrent requests?

### Create Session

- `findOneAndUpdate` with `upsert` is atomic.
- Multiple concurrent requests with the same `sessionId`:
  - First one inserts, rest finds the document and updates it (with no-op `$setOnInsert`).
  - All return the same session; after one document is created.
- Possible duplicate key errors if both try to insert at the same time; MongoDB’s upsert semantics handle this by retrying one operation as an update.

### Add Event to Session

- Session existence is checked with `findOne` before inserting the event.
- Duplicate `(sessionId, eventId)` inserts are rejected by the compound unique index; the second request finds and returns the existing event .
- Event creation itself is atomic (`create` is a single insert).
- If session if active or initiated than only event creation allowed.

### Get Session & Status update

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

- **Authentication/Authorization** — Not mandatory per assignment; would require schema and middleware changes if added.
- **Monitoring / Observability** — Basic error handling only; structured logging and metrics would be a next step.
- **Rate limiting** — Not required for the assignment; would add at the edge or in middleware for production.