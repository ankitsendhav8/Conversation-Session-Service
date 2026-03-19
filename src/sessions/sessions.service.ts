import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionDocument } from './sessions.schema';
import { Model } from 'mongoose';
import { EventsService } from '../events/events.service';
@Injectable()
export class SessionsService {
    constructor(
        @InjectModel(Session.name)
        private sessionModel: Model<SessionDocument>,
        private eventsService: EventsService,
    ) { }

    //  API to insert or update a new session (sessionId externally provided)
    async createSession(data: any) {
        const sessionId = data?.sessionId;
        if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
            throw new BadRequestException('sessionId is required');
        }
        return this.sessionModel.findOneAndUpdate(
            { sessionId },
            {
                $setOnInsert: {
                    ...data,
                    sessionId,
                    startedAt: new Date(),
                },
            },
            { upsert: true, new: true },
        );
    }

    //  API to add a new event to a session
    async addEvent(sessionId: string, event: any) {
        const session = await this.sessionModel.findOne({ sessionId });
        if (!session) throw new NotFoundException('Session not found.');
        if (session && (session.status == 'active' || session.status == 'initiated')) {
            return this.eventsService.createEvent({
                ...event,
                sessionId,
            });
        } else {
            throw new ConflictException('You cannot add events to a completed or failed session.');
        }

    }

    //  API to get a session with its events
    async getSession(sessionId: string, limit = 10, offset = 0) {
        const session = await this.sessionModel.findOne({ sessionId });
        if (!session) throw new NotFoundException('Session not found.');
        const events = await this.eventsService.getEvents(
            sessionId,
            limit,
            offset,
        );
        return { session, events };
    }

    //  API to Update the status of a session
    async updateSessionStatus(sessionId: string, sessionStatus: string) {
        const session = await this.sessionModel.findOne({ sessionId });
        if (!session) throw new NotFoundException('Session not found.');
        if (session && (session.status == 'completed' || session.status == 'failed'))
            throw new ConflictException('You cannot update status of a completed or failed session.');
        return this.sessionModel.updateOne(
            { sessionId },
            {
                $set: {
                    status: sessionStatus,
                    endedAt: sessionStatus === 'completed' ? new Date() : null,
                },
            },
        );
    }
}
