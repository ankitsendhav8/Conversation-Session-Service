import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './events.schema';

@Injectable()
export class EventsRepository {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
  ) {}

  async findBySessionAndEventId(
    sessionId: string,
    eventId: string,
  ): Promise<EventDocument | null> {
    return this.eventModel.findOne({ sessionId, eventId });
  }

  async create(data: Partial<Event>): Promise<EventDocument> {
    return this.eventModel.create(data);
  }

  async findBySession(
    sessionId: string,
    limit: number,
    offset: number,
  ): Promise<EventDocument[]> {
    return this.eventModel
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }
}
