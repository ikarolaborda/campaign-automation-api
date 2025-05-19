import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ example: 1000, description: 'Number of users uploaded' })
  count: number;

  @ApiProperty({ example: 'Successfully uploaded 1000 users', description: 'Status message' })
  message: string;
}