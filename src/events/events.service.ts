import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Event, EventDocument } from './events.schema';
import { Model } from 'mongoose';

@Injectable()
export class EventsService {
    constructor(
        @InjectModel(Event.name)
        private eventModel: Model<EventDocument>,
    ) { }

    async createEvent(data: any) {
        try {
            return await this.eventModel.create(data);
        } catch (err) {
            if (err.code === 11000) {
                throw new ConflictException('Duplicate event');
            }
            throw err;
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
