import { IsString, IsOptional, IsObject, MinLength, IsIn } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @MinLength(1, { message: 'sessionId is required' })
  sessionId: string;

  @IsString()
  @IsIn(['initiated', 'active', 'completed', 'failed'])
  status: 'initiated' | 'active' | 'completed' | 'failed';

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

}
