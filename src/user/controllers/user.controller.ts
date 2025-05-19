import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Inject,
  BadRequestException,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes
} from '@nestjs/swagger';
import { IUserService } from '../contracts/user-service.interface';
import { UploadResponseDto } from '../dto/upload-response.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    @Inject('IUserService')
    private readonly userService: IUserService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload users data' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users uploaded successfully',
    type: UploadResponseDto
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadUsers(@UploadedFile() file: Express.Multer.File): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileContent = file.buffer.toString();
    let users;

    if (file.mimetype === 'text/csv') {
      users = await this.userService.processCSV(fileContent);
    } else if (file.mimetype === 'application/json') {
      users = await this.userService.processJSON(fileContent);
    } else {
      throw new BadRequestException('Unsupported file type. Please upload CSV or JSON files.');
    }

    return this.userService.uploadUsers(users);
  }
}