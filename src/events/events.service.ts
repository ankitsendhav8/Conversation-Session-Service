import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Event, EventDocument } from './events.schema';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class EventsService {
    constructor(
        @InjectModel(Event.name)
        private eventModel: Model<EventDocument>,
    ) { }

    async createEvent(data: any) {
        const eventId = data.eventId ?? uuidv4();
        const sessionId = data.sessionId;

        // return existing event if duplicate (sessionId + eventId)
        const existing = await this.eventModel.findOne({ sessionId, eventId });
        if (existing) return existing;

        try {
            return await this.eventModel.create({ ...data, eventId });
        } catch (err: any) {
            if (err?.code === 11000) {
                // If another request inserted between our check and create
                const duplicate = await this.eventModel.findOne({ sessionId, eventId });
                if (duplicate) return duplicate;
            }
            if (err?.name === 'ValidationError') {
                throw err;
            }
            throw new ConflictException('Failed to create event. Please try again.');
        }
    }

    async getEvents(sessionId: string, limit: number, offset: number) {
        return this.eventModel
            .find({ sessionId })
            .sort({ timestamp: 1 })
            .skip(offset)
            .limit(limit);
    }
}
