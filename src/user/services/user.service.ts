import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserDto } from '../dto/user.dto';
import { UploadResponseDto } from '../dto/upload-response.dto';
import { IUserService } from '../contracts/user-service.interface';
import { IUserRepository } from '../contracts/user-repository.interface';
import * as Papa from 'papaparse';

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findById(id: string): Promise<User> {
    return this.userRepository.findById(id);
  }

  async create(userDto: UserDto): Promise<User> {
    return this.userRepository.create(userDto);
  }

  async uploadUsers(users: UserDto[]): Promise<UploadResponseDto> {
    if (!users || users.length === 0) {
      throw new BadRequestException('No valid users found in the uploaded file');
    }

    // Insert users in batch
    const count = await this.userRepository.createMany(users);

    return {
      count,
      message: `Successfully uploaded ${count} users`,
    };
  }

  async processCSV(csvString: string): Promise<UserDto[]> {
    try {
      const result = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (result.errors.length > 0) {
        throw new BadRequestException('Invalid CSV format');
      }

      return result.data.map((row: any) => ({
        name: row.name,
        email: row.email,
        age: parseInt(row.age),
        country: row.country,
      }));
    } catch (error) {
      throw new BadRequestException(`Failed to process CSV: ${error.message}`);
    }
  }

  async processJSON(jsonString: string): Promise<UserDto[]> {
    try {
      const data = JSON.parse(jsonString);

      if (!Array.isArray(data)) {
        throw new BadRequestException('JSON data must be an array of users');
      }

      return data.map((user: any) => ({
        name: user.name,
        email: user.email,
        age: parseInt(user.age),
        country: user.country,
      }));
    } catch (error) {
      throw new BadRequestException(`Failed to process JSON: ${error.message}`);
    }
  }

  async findMatchingUsers(criteria: {
    ageRange: { min: number; max: number };
    countries: string[];
  }): Promise<User[]> {
    return this.userRepository.findByCriteria(criteria);
  }
}