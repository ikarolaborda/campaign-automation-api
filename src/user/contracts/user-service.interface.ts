import { User } from '../entities/user.entity';
import { UserDto } from '../dto/user.dto';
import { UploadResponseDto } from '../dto/upload-response.dto';

export interface IUserService {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User>;
  create(userDto: UserDto): Promise<User>;
  uploadUsers(users: UserDto[]): Promise<UploadResponseDto>;
  processCSV(csvString: string): Promise<UserDto[]>;
  processJSON(jsonString: string): Promise<UserDto[]>;
  findMatchingUsers(criteria: {
    ageRange: { min: number; max: number };
    countries: string[];
  }): Promise<User[]>;
}