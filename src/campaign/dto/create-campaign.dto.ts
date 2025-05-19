import { IsNotEmpty, IsString, IsObject, IsArray, IsInt, Min, Max, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AgeRangeDto {
  @ApiProperty({ example: 18, description: 'Minimum age' })
  @IsInt()
  @Min(0)
  min: number;

  @ApiProperty({ example: 65, description: 'Maximum age' })
  @IsInt()
  @Max(120)
  max: number;
}

class TargetAudienceDto {
  @ApiProperty({ type: AgeRangeDto, description: 'Age range criteria' })
  @IsObject()
  @ValidateNested()
  @Type(() => AgeRangeDto)
  ageRange: AgeRangeDto;

  @ApiProperty({ example: ['US', 'CA'], description: 'Target countries' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  countries: string[];
}

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Sale Campaign', description: 'Name of the campaign' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: TargetAudienceDto, description: 'Target audience criteria' })
  @IsObject()
  @ValidateNested()
  @Type(() => TargetAudienceDto)
  targetAudience: TargetAudienceDto;

  @ApiProperty({
    example: 'Hello {name}, check out our special offers for customers in {country}!',
    description: 'Message template with placeholders'
  })
  @IsNotEmpty()
  @IsString()
  messageTemplate: string;
}