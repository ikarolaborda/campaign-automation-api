import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../../src/user/controllers/user.controller';
import { BadRequestException } from '@nestjs/common';
import { UserDto } from '../../../src/user/dto/user.dto';
import { UploadResponseDto } from '../../../src/user/dto/upload-response.dto';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: any;

  beforeEach(async () => {
    mockUserService = {
      processCSV: jest.fn(),
      processJSON: jest.fn(),
      uploadUsers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: 'IUserService',
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadUsers', () => {
    it('should throw an error when no file is uploaded', async () => {
      await expect(controller.uploadUsers(null as unknown as Express.Multer.File)).rejects.toThrow(BadRequestException);
    });

    it('should process CSV file', async () => {
      const mockFile = {
        buffer: Buffer.from('name,email,age,country\nJohn,john@example.com,30,US'),
        mimetype: 'text/csv',
      } as Express.Multer.File;

      const mockUsers: UserDto[] = [
        { name: 'John', email: 'john@example.com', age: 30, country: 'US' },
      ];

      const mockResponse: UploadResponseDto = {
        count: 1,
        message: 'Successfully uploaded 1 users',
      };

      mockUserService.processCSV.mockResolvedValue(mockUsers);
      mockUserService.uploadUsers.mockResolvedValue(mockResponse);

      expect(await controller.uploadUsers(mockFile)).toBe(mockResponse);
      expect(mockUserService.processCSV).toHaveBeenCalledWith(mockFile.buffer.toString());
      expect(mockUserService.uploadUsers).toHaveBeenCalledWith(mockUsers);
    });

    it('should process JSON file', async () => {
      const mockFile = {
        buffer: Buffer.from(JSON.stringify([
          { name: 'John', email: 'john@example.com', age: 30, country: 'US' },
        ])),
        mimetype: 'application/json',
      } as Express.Multer.File;

      const mockUsers: UserDto[] = [
        { name: 'John', email: 'john@example.com', age: 30, country: 'US' },
      ];

      const mockResponse: UploadResponseDto = {
        count: 1,
        message: 'Successfully uploaded 1 users',
      };

      mockUserService.processJSON.mockResolvedValue(mockUsers);
      mockUserService.uploadUsers.mockResolvedValue(mockResponse);

      expect(await controller.uploadUsers(mockFile)).toBe(mockResponse);
      expect(mockUserService.processJSON).toHaveBeenCalledWith(mockFile.buffer.toString());
      expect(mockUserService.uploadUsers).toHaveBeenCalledWith(mockUsers);
    });

    it('should throw an error for unsupported file types', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      await expect(controller.uploadUsers(mockFile)).rejects.toThrow(BadRequestException);
      expect(mockUserService.processCSV).not.toHaveBeenCalled();
      expect(mockUserService.processJSON).not.toHaveBeenCalled();
      expect(mockUserService.uploadUsers).not.toHaveBeenCalled();
    });

    it('should handle errors in CSV processing', async () => {
      const mockFile = {
        buffer: Buffer.from('invalid csv'),
        mimetype: 'text/csv',
      } as Express.Multer.File;

      mockUserService.processCSV.mockRejectedValue(new BadRequestException('Invalid CSV format'));

      await expect(controller.uploadUsers(mockFile)).rejects.toThrow(BadRequestException);
      expect(mockUserService.uploadUsers).not.toHaveBeenCalled();
    });

    it('should handle errors in JSON processing', async () => {
      const mockFile = {
        buffer: Buffer.from('invalid json'),
        mimetype: 'application/json',
      } as Express.Multer.File;

      mockUserService.processJSON.mockRejectedValue(new BadRequestException('Invalid JSON format'));

      await expect(controller.uploadUsers(mockFile)).rejects.toThrow(BadRequestException);
      expect(mockUserService.uploadUsers).not.toHaveBeenCalled();
    });

    it('should handle empty file', async () => {
      const mockFile = {
        buffer: Buffer.from(''),
        mimetype: 'text/csv',
      } as Express.Multer.File;

      mockUserService.processCSV.mockResolvedValue([]);
      mockUserService.uploadUsers.mockRejectedValue(new BadRequestException('No valid users found'));

      await expect(controller.uploadUsers(mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should handle large files with many users', async () => {
      // Create a mock CSV with 1000 users
      const header = 'name,email,age,country\n';
      let csvData = header;
      for (let i = 0; i < 1000; i++) {
        csvData += `User${i},user${i}@example.com,${20 + (i % 50)},US\n`;
      }

      const mockFile = {
        buffer: Buffer.from(csvData),
        mimetype: 'text/csv',
      } as Express.Multer.File;

      const mockUsers = Array(1000).fill(null).map((_, i) => ({
        name: `User${i}`,
        email: `user${i}@example.com`,
        age: 20 + (i % 50),
        country: 'US',
      }));

      const mockResponse: UploadResponseDto = {
        count: 1000,
        message: 'Successfully uploaded 1000 users',
      };

      mockUserService.processCSV.mockResolvedValue(mockUsers);
      mockUserService.uploadUsers.mockResolvedValue(mockResponse);

      const result = await controller.uploadUsers(mockFile);
      expect(result.count).toBe(1000);
      expect(mockUserService.uploadUsers).toHaveBeenCalledWith(mockUsers);
    });
  });
});