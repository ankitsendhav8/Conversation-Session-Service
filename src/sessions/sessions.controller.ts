import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { SessionsService } from './sessions.service';
@Controller('sessions')
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    @Post()
    createSession(@Body() body: any) {
        return this.sessionsService.createSession(body);
    }

    @Post(':sessionId/events')
    addEvent(
        @Param('sessionId') sessionId: string,
        @Body() body: any,
    ) {
        return this.sessionsService.addEvent(sessionId, body);
    }

    @Get(':sessionId')
    getSession(
        @Param('sessionId') sessionId: string,
        @Query('limit') limit: number,
        @Query('offset') offset: number,
    ) {
        return this.sessionsService.getSession(sessionId, Number(limit) || 10, Number(offset) || 0);
    }

    @Post(':sessionId/:sessionStatus')
    updateSessionStatus(@Param('sessionId') sessionId: string, @Param('sessionStatus') sessionStatus: string) {
        return this.sessionsService.updateSessionStatus(sessionId, sessionStatus);
    }
}
