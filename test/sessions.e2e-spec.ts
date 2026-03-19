import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Sessions API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /sessions', () => {
    it('should create a session', () => {
      return request(app.getHttpServer())
        .post('/sessions')
        .send({ sessionId: 'e2e-session-1', language: 'en' })
        .expect(201)
        .expect((res) => {
          expect(res.body.sessionId).toBe('e2e-session-1');
          expect(res.body.status).toBe('initiated');
          expect(res.body.language).toBe('en');
        });
    });

    it('should return existing session on duplicate (idempotent)', async () => {
      const sessionId = 'e2e-session-idempotent';
      const first = await request(app.getHttpServer())
        .post('/sessions')
        .send({ sessionId, language: 'en' })
        .expect(201);
      const second = await request(app.getHttpServer())
        .post('/sessions')
        .send({ sessionId, language: 'en' })
        .expect(201);
      expect(first.body.sessionId).toBe(second.body.sessionId);
      expect(first.body._id).toEqual(second.body._id);
    });

    it('should reject missing sessionId', () => {
      return request(app.getHttpServer())
        .post('/sessions')
        .send({ language: 'en' })
        .expect(400);
    });
  });

  describe('POST /sessions/:sessionId/events', () => {
    const sessionId = 'e2e-session-events';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/sessions')
        .send({ sessionId });
    });

    it('should add an event', () => {
      return request(app.getHttpServer())
        .post(`/sessions/${sessionId}/events`)
        .send({
          eventId: 'evt-1',
          type: 'user_speech',
          payload: { text: 'hello' },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.eventId).toBe('evt-1');
          expect(res.body.type).toBe('user_speech');
          expect(res.body.sessionId).toBe(sessionId);
        });
    });

    it('should return existing event on duplicate (idempotent)', async () => {
      const eventId = 'evt-idempotent';
      const first = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/events`)
        .send({ eventId, type: 'bot_speech', payload: {} })
        .expect(201);
      const second = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/events`)
        .send({ eventId, type: 'bot_speech', payload: {} })
        .expect(201);
      expect(first.body._id).toEqual(second.body._id);
    });

    it('should reject event for non-existent session', () => {
      return request(app.getHttpServer())
        .post('/sessions/non-existent-session/events')
        .send({ eventId: 'evt-x', type: 'user_speech' })
        .expect(404);
    });
  });

  describe('GET /sessions/:sessionId', () => {
    const sessionId = 'e2e-session-get';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/sessions')
        .send({ sessionId });
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/events`)
        .send({ eventId: 'evt-get-1', type: 'user_speech' });
    });

    it('should return session with events', () => {
      return request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.session.sessionId).toBe(sessionId);
          expect(Array.isArray(res.body.events)).toBe(true);
          expect(res.body.events.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get(`/sessions/${sessionId}?limit=5&offset=0`)
        .expect(200)
        .expect((res) => {
          expect(res.body.session).toBeDefined();
          expect(res.body.events.length).toBeLessThanOrEqual(5);
        });
    });

    it('should return 404 for non-existent session', () => {
      return request(app.getHttpServer())
        .get('/sessions/non-existent-session')
        .expect(404);
    });
  });

  describe('POST /sessions/:sessionId/complete', () => {
    const sessionId = 'e2e-session-complete';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/sessions')
        .send({ sessionId });
    });

    it('should complete session', () => {
      return request(app.getHttpServer())
        .post(`/sessions/${sessionId}/complete`)
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('completed');
          expect(res.body.endedAt).toBeDefined();
        });
    });

    it('should be idempotent (return session when already completed)', async () => {
      const first = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/complete`)
        .expect(201);
      const second = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/complete`)
        .expect(201);
      expect(first.body.status).toBe('completed');
      expect(second.body.status).toBe('completed');
      expect(first.body._id).toEqual(second.body._id);
    });

    it('should return 404 for non-existent session', () => {
      return request(app.getHttpServer())
        .post('/sessions/non-existent-session/complete')
        .expect(404);
    });
  });

  describe('POST /sessions/:sessionId/status', () => {
    const sessionId = 'e2e-session-status';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/sessions')
        .send({ sessionId });
    });

    it('should update status to active', () => {
      return request(app.getHttpServer())
        .post(`/sessions/${sessionId}/status`)
        .send({ status: 'active' })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('active');
        });
    });

    it('should reject status update when already completed', async () => {
      const completeSessionId = 'e2e-session-status-completed';
      await request(app.getHttpServer())
        .post('/sessions')
        .send({ sessionId: completeSessionId });
      await request(app.getHttpServer())
        .post(`/sessions/${completeSessionId}/complete`)
        .expect(201);
      return request(app.getHttpServer())
        .post(`/sessions/${completeSessionId}/status`)
        .send({ status: 'active' })
        .expect(409);
    });
  });
});
