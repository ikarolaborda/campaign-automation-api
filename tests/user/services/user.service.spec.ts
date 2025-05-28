import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UserService } from '../../../src/user/services/user.service';
import { IUserRepository } from '../../../src/user/contracts/user-repository.interface';
import { User } from '../../../src/user/entities/user.entity';
import { UserDto } from '../../../src/user/dto/user.dto';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUser: User = {
    id: 'test-user-id',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    country: 'US',
    isActive: true,
    createdAt: new Date(),
  };

  const mockUserDto: UserDto = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    country: 'US',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      findByCriteria: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get('IUserRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      userRepository.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(userRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById('test-user-id');

      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      userRepository.create.mockResolvedValue(mockUser);

      const result = await service.create(mockUserDto);

      expect(result).toEqual(mockUser);
      expect(userRepository.create).toHaveBeenCalledWith(mockUserDto);
    });
  });

  describe('uploadUsers', () => {
    it('should upload users successfully', async () => {
      const users = [mockUserDto];
      userRepository.createMany.mockResolvedValue(1);

      const result = await service.uploadUsers(users);

      expect(result).toEqual({
        count: 1,
        message: 'Successfully uploaded 1 users',
      });
      expect(userRepository.createMany).toHaveBeenCalledWith(users);
    });

    it('should throw BadRequestException when no users provided', async () => {
      await expect(service.uploadUsers([])).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadUsers(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('processCSV', () => {
    it('should process valid CSV data', async () => {
      const csvData = `name,email,age,country
John Doe,john@example.com,30,US
Jane Smith,jane@example.com,25,CA`;

      const result = await service.processCSV(csvData);

      expect(result).toEqual([
        { name: 'John Doe', email: 'john@example.com', age: 30, country: 'US' },
        { name: 'Jane Smith', email: 'jane@example.com', age: 25, country: 'CA' },
      ]);
    });

    it('should throw BadRequestException for invalid CSV', async () => {
      // Mock Papa.parse to simulate an error
      jest.spyOn(require('papaparse'), 'parse').mockReturnValueOnce({
        data: [],
        errors: [{ message: 'Invalid CSV format' }],
      });
      
      await expect(service.processCSV('invalid csv')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('processJSON', () => {
    it('should process valid JSON data', async () => {
      const jsonData = JSON.stringify([
        { name: 'John Doe', email: 'john@example.com', age: '30', country: 'US' },
        { name: 'Jane Smith', email: 'jane@example.com', age: '25', country: 'CA' },
      ]);

      const result = await service.processJSON(jsonData);

      expect(result).toEqual([
        { name: 'John Doe', email: 'john@example.com', age: 30, country: 'US' },
        { name: 'Jane Smith', email: 'jane@example.com', age: 25, country: 'CA' },
      ]);
    });

    it('should throw BadRequestException for invalid JSON', async () => {
      const invalidJson = 'invalid json';
      
      await expect(service.processJSON(invalidJson)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when JSON is not an array', async () => {
      const nonArrayJson = JSON.stringify({ user: 'data' });
      
      await expect(service.processJSON(nonArrayJson)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findMatchingUsers', () => {
    it('should return matching users based on criteria', async () => {
      const criteria = {
        ageRange: { min: 25, max: 35 },
        countries: ['US', 'CA'],
      };
      const matchingUsers = [mockUser];
      
      userRepository.findByCriteria.mockResolvedValue(matchingUsers);

      const result = await service.findMatchingUsers(criteria);

      expect(result).toEqual(matchingUsers);
      expect(userRepository.findByCriteria).toHaveBeenCalledWith(criteria);
    });
  });
}); 