import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './sessions.schema';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { EventsModule } from '../events/events.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    EventsModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService]
})
export class SessionsModule { }
