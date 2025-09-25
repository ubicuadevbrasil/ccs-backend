import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { 
  CreateCustomerDto, 
  UpdateCustomerByIdDto, 
  CustomerQueryDto, 
  FindCustomerDto, 
  DeleteCustomerDto 
} from './dto/customer.dto';
import { CustomerStatus, CustomerType, CustomerPlatform } from './entities/customer.entity';

describe('CustomerController', () => {
  let controller: CustomerController;
  let service: CustomerService;

  const mockCustomer = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    platformId: '5511999999999',
    pushName: 'John Doe',
    name: 'John Doe',
    profilePicUrl: 'https://example.com/profile.jpg',
    contact: '+5511999999999',
    email: 'john.doe@example.com',
    cpf: '12345678901',
    cnpj: null,
    priority: 5,
    isGroup: false,
    type: CustomerType.CONTACT,
    status: CustomerStatus.ACTIVE,
    platform: CustomerPlatform.WHATSAPP,
    observations: 'VIP customer',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isBlocked: false,
    isHighPriority: true,
    isGroupContact: false,
    hasProfilePicture: true,
    displayName: 'John Doe',
    tags: ['vip'],
  };

  const mockPaginatedResult = {
    data: [mockCustomer],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(async () => {
    const mockCustomerService = {
      createCustomer: jest.fn(),
      findAllCustomers: jest.fn(),
      findCustomerByIdWithTags: jest.fn(),
      updateCustomer: jest.fn(),
      deleteCustomer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
    service = module.get<CustomerService>(CustomerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCustomer', () => {
    const inputCreateCustomerDto: CreateCustomerDto = {
      platformId: '5511999999999',
      pushName: 'John Doe',
      name: 'John Doe',
      email: 'john.doe@example.com',
      contact: '+5511999999999',
      priority: 5,
      platform: CustomerPlatform.WHATSAPP,
      tags: ['vip'],
    };

    it('should create a customer successfully', async () => {
      jest.spyOn(service, 'createCustomer').mockResolvedValue(mockCustomer as any);

      const result = await controller.createCustomer(inputCreateCustomerDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCustomer.id);
      expect(result.name).toBe(mockCustomer.name);
      expect(service.createCustomer).toHaveBeenCalledWith(inputCreateCustomerDto);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'createCustomer').mockRejectedValue(error);

      await expect(controller.createCustomer(inputCreateCustomerDto)).rejects.toThrow(error);
    });
  });

  describe('findAllCustomers', () => {
    const inputQuery: CustomerQueryDto = {
      page: '1',
      limit: '10',
      search: 'john',
    };

    it('should return paginated customers', async () => {
      jest.spyOn(service, 'findAllCustomers').mockResolvedValue(mockPaginatedResult as any);

      const result = await controller.findAllCustomers(inputQuery);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(service.findAllCustomers).toHaveBeenCalledWith(inputQuery);
    });

    it('should handle empty query parameters', async () => {
      const emptyQuery = {};
      jest.spyOn(service, 'findAllCustomers').mockResolvedValue(mockPaginatedResult as any);

      const result = await controller.findAllCustomers(emptyQuery);

      expect(result).toBeDefined();
      expect(service.findAllCustomers).toHaveBeenCalledWith(emptyQuery);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'findAllCustomers').mockRejectedValue(error);

      await expect(controller.findAllCustomers(inputQuery)).rejects.toThrow(error);
    });
  });

  describe('findCustomerById', () => {
    const inputQuery: FindCustomerDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
    };

    it('should return customer by id', async () => {
      jest.spyOn(service, 'findCustomerByIdWithTags').mockResolvedValue(mockCustomer as any);

      const result = await controller.findCustomerById(inputQuery);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCustomer.id);
      expect(service.findCustomerByIdWithTags).toHaveBeenCalledWith(inputQuery.id);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'findCustomerByIdWithTags').mockRejectedValue(error);

      await expect(controller.findCustomerById(inputQuery)).rejects.toThrow(error);
    });
  });

  describe('updateCustomer', () => {
    const inputUpdateDto: UpdateCustomerByIdDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Updated Name',
      priority: 8,
    };

    it('should update customer successfully', async () => {
      const updatedCustomer = { ...mockCustomer, name: 'Updated Name' };
      jest.spyOn(service, 'updateCustomer').mockResolvedValue(updatedCustomer as any);

      const result = await controller.updateCustomer(inputUpdateDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Name');
      expect(service.updateCustomer).toHaveBeenCalledWith(inputUpdateDto.id, {
        name: 'Updated Name',
        priority: 8,
      });
    });

    it('should handle tags update', async () => {
      const updateDtoWithTags = {
        ...inputUpdateDto,
        tags: ['premium'],
      };

      const updatedCustomer = { ...mockCustomer, tags: ['premium'] };
      jest.spyOn(service, 'updateCustomer').mockResolvedValue(updatedCustomer as any);

      const result = await controller.updateCustomer(updateDtoWithTags);

      expect(result).toBeDefined();
      expect(result.tags).toEqual(['premium']);
      expect(service.updateCustomer).toHaveBeenCalledWith(updateDtoWithTags.id, {
        name: 'Updated Name',
        priority: 8,
        tags: ['premium'],
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'updateCustomer').mockRejectedValue(error);

      await expect(controller.updateCustomer(inputUpdateDto)).rejects.toThrow(error);
    });
  });

  describe('deleteCustomer', () => {
    const inputDeleteDto: DeleteCustomerDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
    };

    it('should delete customer successfully', async () => {
      jest.spyOn(service, 'deleteCustomer').mockResolvedValue(undefined);

      await controller.deleteCustomer(inputDeleteDto);

      expect(service.deleteCustomer).toHaveBeenCalledWith(inputDeleteDto.id);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'deleteCustomer').mockRejectedValue(error);

      await expect(controller.deleteCustomer(inputDeleteDto)).rejects.toThrow(error);
    });
  });

  describe('testEndpoint', () => {
    it('should return test response', async () => {
      const result = await controller.testEndpoint();

      expect(result).toBeDefined();
      expect(result.message).toBe('Customer module is working correctly');
      expect(result.module).toBe('customer');
      expect(result.timestamp).toBeDefined();
    });
  });
});
