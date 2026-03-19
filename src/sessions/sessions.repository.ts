import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './sessions.schema';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name)
    private sessionModel: Model<SessionDocument>,
  ) {}

  async findById(sessionId: string): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({ sessionId });
  }

  async upsert(sessionId: string, data: Partial<Session>): Promise<SessionDocument> {
    return this.sessionModel.findOneAndUpdate(
      { sessionId },
      { $setOnInsert: { ...data, sessionId, startedAt: new Date() } },
      { upsert: true, returnDocument: 'after' },
    );
  }

  async updateStatus(sessionId: string, status: string): Promise<SessionDocument | null> {
    const endedAt = status === 'completed' ? new Date() : null;
    return this.sessionModel.findOneAndUpdate(
      { sessionId },
      { $set: { status, endedAt } },
      { returnDocument: 'after' },
    );
  }
}
