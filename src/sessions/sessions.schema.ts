import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema()
export class Session {
  @Prop({ required: true, unique: true })
  sessionId: string;

  @Prop({ required: true })
  sessionName: string;

  @Prop({required: true, default: 'initiated', enum: ['initiated', 'active', 'completed', 'failed'] })
  status: string;

  @Prop()
  language: string;

  @Prop({ default: Date.now })
  startedAt: Date;

  @Prop({ default: null })
  endedAt: Date;

  @Prop({ type: Object,optional: true })
  metadata: Record<string, any>;
}

export const SessionSchema = SchemaFactory.createForClass(Session);