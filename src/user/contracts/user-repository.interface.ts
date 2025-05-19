import { User } from '../entities/user.entity';
import { UserDto } from '../dto/user.dto';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User>;
  create(userDto: UserDto): Promise<User>;
  createMany(users: UserDto[]): Promise<number>;
  findByCriteria(criteria: {
    ageRange: { min: number; max: number };
    countries: string[];
  }): Promise<User[]>;
}