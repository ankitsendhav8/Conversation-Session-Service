import { IsString, IsOptional, IsObject, IsIn, IsDateString, MinLength } from 'class-validator';

export class AddEventDto {
  @MinLength(1, { message: 'eventId is required' })
  @IsString()
  eventId: string;

  @IsString()
  @IsIn(['user_speech', 'bot_speech', 'system'])
  type: 'user_speech' | 'bot_speech' | 'system';

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  timestamp?: Date;
}
