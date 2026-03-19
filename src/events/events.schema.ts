import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema()
export class Event {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true, ref: 'Session' })
  sessionId: string;

  @Prop({ required: true, enum: ['user_speech', 'bot_speech', 'system'] })
  type: string;

  @Prop({ type: Object })
  payload: Record<string, any>;

  @Prop()
  timestamp: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// eventId unique per session (not globally)
EventSchema.index({ sessionId: 1, eventId: 1 }, { unique: true });
// Pagination: events by session ordered by timestamp
EventSchema.index({ sessionId: 1, timestamp: 1 });

