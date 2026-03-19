import { IsString, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsIn(['initiated', 'active', 'completed', 'failed'])
  status: 'initiated' | 'active' | 'completed' | 'failed';
}
