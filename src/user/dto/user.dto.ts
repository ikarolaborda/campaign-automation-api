import { IsEmail, IsInt, IsNotEmpty, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 30, description: 'User age' })
  @IsInt()
  @Min(0)
  @Max(120)
  age: number;

  @ApiProperty({ example: 'US', description: 'User country' })
  @IsNotEmpty()
  @IsString()
  country: string;
}