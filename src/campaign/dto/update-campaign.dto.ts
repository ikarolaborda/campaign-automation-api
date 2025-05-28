import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateCampaignDto } from './create-campaign.dto';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @ApiProperty({ example: true, description: 'Whether the campaign is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}