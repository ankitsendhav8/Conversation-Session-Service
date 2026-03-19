import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './events.schema';

/**
 * Syncs Event collection indexes to match schema on startup.
 * Drops legacy eventId_1 (global unique) if present; ensures compound (sessionId, eventId) exists.
 */
@Injectable()
export class EventsIndexService implements OnModuleInit {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
  ) {}

  async onModuleInit() {
    await this.eventModel.syncIndexes();
  }
}
