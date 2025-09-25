import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserByIdDto, UserQueryDto, FindUserDto, DeleteUserDto, UserResponseDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this login, email, or contact already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.createUser(createUserDto);
    return user as UserResponseDto;
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'profile', required: false, description: 'Filter by profile' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAllUsers(@Query() query: UserQueryDto) {
    return this.userService.findAllUsers(query);
  }

  @Get('find')
  @ApiOperation({ summary: 'Find user by ID' })
  @ApiQuery({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findUserById(@Query() query: FindUserDto): Promise<UserResponseDto> {
    const user = await this.userService.findUserById(query.id);
    return user as UserResponseDto;
  }

  @Patch()
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this login, email, or contact already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async updateUser(@Body() updateUserDto: UpdateUserByIdDto): Promise<UserResponseDto> {
    const { id, ...updateData } = updateUserDto;
    const user = await this.userService.updateUser(id, updateData);
    return user as UserResponseDto;
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteUser(@Body() deleteUserDto: DeleteUserDto): Promise<void> {
    return this.userService.deleteUser(deleteUserDto.id);
  }
}
