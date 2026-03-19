import { Injectable, ConflictException } from '@nestjs/common';
import { EventsRepository } from './events.repository';
import { AddEventDto } from '../sessions/dto/add-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) { }

  async createEvent(data: AddEventDto & { sessionId: string }) {
    const eventId = data.eventId;
    const sessionId = data.sessionId;
    // Idempotency: return existing event if duplicate (sessionId + eventId)
    const existing =
      await this.eventsRepository.findBySessionAndEventId(sessionId, eventId);
    if (existing) return existing;
    try {
      const eventData = {
        ...data,
        eventId,
        sessionId,
        timestamp: data.timestamp
          ? new Date(data.timestamp)
          : new Date(),
      };
      return await this.eventsRepository.create(eventData);
    } catch (err: unknown) {
      const e = err as { code?: number; name?: string };
      if (e?.code === 11000) {
        const duplicate =
          await this.eventsRepository.findBySessionAndEventId(
            sessionId,
            eventId,
          );

        if (duplicate) return duplicate;
      }
      if (e?.name === 'ValidationError') {
        throw err;
      }
      throw new ConflictException(
        'Failed to create event. Please try again.',
      );
    }
  }

  async getEvents(sessionId: string, limit: number, offset: number) {
    return this.eventsRepository.findBySession(sessionId, limit, offset);
  }
}
