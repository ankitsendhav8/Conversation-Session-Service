import { IsString, IsOptional, IsObject, IsIn, IsDateString,MinLength } from 'class-validator';

export class AddEventDto {
  @IsOptional()
  @IsString()
  eventId?: string;

  @IsString()
  @MinLength(1, { message: 'sessionId is required' })
  sessionId: string;

  @IsString()
  @IsIn(['user_speech', 'bot_speech', 'system'])
  type: 'user_speech' | 'bot_speech' | 'system';

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  timestamp?: Date = new Date();
}
