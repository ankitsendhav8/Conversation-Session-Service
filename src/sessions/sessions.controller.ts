import { Controller, Post, Get, Param, Body, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AddEventDto } from './dto/add-event.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  @Post()
  createSession(@Body() dto: CreateSessionDto) {
    return this.sessionsService.createSession(dto);
  }

  @Post(':sessionId/events')
  addEvent(
    @Param('sessionId') sessionId: string,
    @Body() dto: AddEventDto,
  ) {
    return this.sessionsService.addEvent(sessionId, dto);
  }

  @Get(':sessionId')
  getSession(
    @Param('sessionId') sessionId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.sessionsService.getSession(sessionId, limit, offset);
  }

  @Post(':sessionId/complete')
  completeSession(@Param('sessionId') sessionId: string) {
    return this.sessionsService.completeSession(sessionId);
  }

  @Post(':sessionId/status')
  updateSessionStatus(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.sessionsService.updateSessionStatus(sessionId, dto);
  }
}
