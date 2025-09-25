import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserStatus, UserProfile } from './entities/user.entity';
import { CreateUserDto, UpdateUserByIdDto, FindUserDto, DeleteUserDto } from './dto/user.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser = new User({
    id: '123e4567-e89b-12d3-a456-426614174000',
    login: 'testuser',
    password: 'hashedpassword',
    name: 'Test User',
    email: 'test@example.com',
    contact: '+1234567890',
    profilePicture: 'https://example.com/profile.jpg',
    status: UserStatus.ACTIVE,
    profile: UserProfile.OPERATOR,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockPaginatedResult = {
    data: [mockUser],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const mockStats = {
    total: 10,
    active: 8,
    inactive: 2,
    byProfile: {
      [UserProfile.ADMIN]: 2,
      [UserProfile.SUPERVISOR]: 3,
      [UserProfile.OPERATOR]: 5,
    },
  };

  beforeEach(async () => {
  const mockUserService = {
    createUser: jest.fn(),
    findAllUsers: jest.fn(),
    findUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        login: 'testuser',
        password: 'password123',
        name: 'Test User',
        email: 'test@example.com',
        contact: '+1234567890',
        profile: UserProfile.OPERATOR,
      };
      jest.spyOn(service, 'createUser').mockResolvedValue(mockUser);

      // Act
      const result = await controller.createUser(createUserDto);

      // Assert
      expect(service.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toBe(mockUser);
    });
  });

  describe('findAllUsers', () => {
    it('should return paginated users', async () => {
      // Arrange
      const query = { page: '1', limit: '10' };
      jest.spyOn(service, 'findAllUsers').mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await controller.findAllUsers(query);

      // Assert
      expect(service.findAllUsers).toHaveBeenCalledWith(query);
      expect(result).toBe(mockPaginatedResult);
    });
  });

  describe('findUserById', () => {
    it('should return a user by id', async () => {
      // Arrange
      const query: FindUserDto = { id: mockUser.id };
      jest.spyOn(service, 'findUserById').mockResolvedValue(mockUser);

      // Act
      const result = await controller.findUserById(query);

      // Assert
      expect(service.findUserById).toHaveBeenCalledWith(query.id);
      expect(result).toBe(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      // Arrange
      const updateUserDto: UpdateUserByIdDto = {
        id: mockUser.id,
        name: 'Updated Name',
      };
      const updatedUser = new User({ ...mockUser, name: 'Updated Name' });
      jest.spyOn(service, 'updateUser').mockResolvedValue(updatedUser);

      // Act
      const result = await controller.updateUser(updateUserDto);

      // Assert
      expect(service.updateUser).toHaveBeenCalledWith(updateUserDto.id, { name: 'Updated Name' });
      expect(result).toBe(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      // Arrange
      const deleteUserDto: DeleteUserDto = { id: mockUser.id };
      jest.spyOn(service, 'deleteUser').mockResolvedValue(undefined);

      // Act
      await controller.deleteUser(deleteUserDto);

      // Assert
      expect(service.deleteUser).toHaveBeenCalledWith(deleteUserDto.id);
    });
  });

  describe('testEndpoint', () => {
    it('should return test message', async () => {
      // Act
      const result = await controller.testEndpoint();

      // Assert
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('module');
      expect(result.message).toBe('User module is working correctly');
      expect(result.module).toBe('user');
    });
  });
});
