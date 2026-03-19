import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SessionsRepository } from './sessions.repository';
import { EventsService } from '../events/events.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AddEventDto } from './dto/add-event.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly eventsService: EventsService,
  ) { }

  async createSession(dto: CreateSessionDto) {
    const { sessionId, language, metadata } = dto;
    const trimmedId = sessionId.trim();
    if (!trimmedId) {
      throw new BadRequestException('Session Id is required');
    }
    return this.sessionsRepository.upsert(trimmedId, {
      sessionId: trimmedId,
      language,
      metadata,
      status: 'initiated',
    });
  }

  async addEvent(sessionId: string, dto: AddEventDto) {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found.');
    if (session.status !== 'active' && session.status !== 'initiated') {
      throw new ConflictException(
        'You cannot add events to a completed or failed session.',
      );
    }
    return this.eventsService.createEvent({
      ...dto,
      sessionId,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
    });
  }

  async getSession(sessionId: string, limit = 10, offset = 0) {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found.');
    const events = await this.eventsService.getEvents(sessionId, limit, offset);
    return { session, events };
  }

  async completeSession(sessionId: string) {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found.');
    // Idempotent: if already completed, return existing session
    if (session.status === 'completed') {
      return session;
    }
    return this.sessionsRepository.updateStatus(sessionId, 'completed');
  }

  async updateSessionStatus(sessionId: string, dto: UpdateStatusDto) {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found.');
    if (session.status === 'completed' || session.status === 'failed') {
      throw new ConflictException(
        'You cannot update status of a completed or failed session.',
      );
    }
    return this.sessionsRepository.updateStatus(sessionId, dto.status);
  }
}
