import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from './events/events.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://127.0.0.1:27017/conversation-db'), EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
