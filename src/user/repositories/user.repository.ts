import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserDto } from '../dto/user.dto';
import { IUserRepository } from '../contracts/user-repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: string): Promise<User> {
    return this.userRepository.findOneOrFail({ where: { id } });
  }

  async create(userDto: UserDto): Promise<User> {
    const user = this.userRepository.create(userDto);
    return this.userRepository.save(user);
  }

  async createMany(users: UserDto[]): Promise<number> {
    const result = await this.userRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(users)
      .execute();

    return result.identifiers.length;
  }

  async findByCriteria(criteria: {
    ageRange: { min: number; max: number };
    countries: string[];
  }): Promise<User[]> {
    return this.userRepository.find({
      where: {
        age: Between(criteria.ageRange.min, criteria.ageRange.max),
        country: In(criteria.countries),
        isActive: true,
      },
    });
  }
}