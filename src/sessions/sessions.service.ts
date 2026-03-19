import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
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

    //  API to insert or update a new session
    async createSession(data: any) {
        return this.sessionModel.findOneAndUpdate(
            { sessionId: data.sessionId },
            {
                $setOnInsert: {
                    ...data,
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

        return this.eventsService.createEvent({
            ...event,
            sessionId,
        });
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

    //  API to complete a session
    async completeSession(sessionId: string) {
        return this.sessionModel.updateOne(
            { sessionId, status: { $ne: 'completed' } },
            {
                $set: {
                    status: 'completed',
                    endedAt: new Date(),
                },
            },
        );
    }
}
