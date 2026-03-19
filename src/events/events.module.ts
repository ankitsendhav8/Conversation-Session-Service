import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './events.schema';
import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }])],
  providers: [EventsService, EventsRepository],
  exports: [EventsService],
})
export class EventsModule { }
