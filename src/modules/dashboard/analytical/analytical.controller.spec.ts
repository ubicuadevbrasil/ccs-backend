import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticalController } from './analytical.controller';
import { AnalyticalService } from './analytical.service';
import { ServicesChannelDto } from './dto/services-channel.dto';
import { ServicesChannelPeriodDto } from './dto/services-channel-period.dto';

describe('AnalyticalController', () => {
  let controller: AnalyticalController;
  let service: AnalyticalService;

  const mockAnalyticalService = {
    getServicesChannel: jest.fn(),
    getServicesChannelPeriod: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticalController],
      providers: [
        {
          provide: AnalyticalService,
          useValue: mockAnalyticalService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticalController>(AnalyticalController);
    service = module.get<AnalyticalService>(AnalyticalService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getServicesChannel', () => {
    it('should call analytical service getServicesChannel method', async () => {
      const query: ServicesChannelDto = { period: '7d' };
      const expectedResult = {
        channels: [
          { origin: 'whatsapp', count: 10, percentage: 60 },
          { origin: 'chatweb', count: 7, percentage: 40 },
        ],
        totalCount: 17,
        period: '7d',
      };

      mockAnalyticalService.getServicesChannel.mockResolvedValue(expectedResult);

      const result = await controller.getServicesChannel(query);

      expect(service.getServicesChannel).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getServicesChannelPeriod', () => {
    it('should call analytical service getServicesChannelPeriod method with month view', async () => {
      const query: ServicesChannelPeriodDto = { view: 'month' };
      const expectedResult = {
        data: [
          {
            month: 'Janeiro',
            whatsapp: 25,
            chatweb: 8
          },
          {
            month: 'Fevereiro',
            whatsapp: 30,
            chatweb: 10
          }
        ],
        totalCount: 73,
      };

      mockAnalyticalService.getServicesChannelPeriod.mockResolvedValue(expectedResult);

      const result = await controller.getServicesChannelPeriod(query);

      expect(service.getServicesChannelPeriod).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });

    it('should call analytical service getServicesChannelPeriod method with 30days view', async () => {
      const query: ServicesChannelPeriodDto = { view: '30days' };
      const expectedResult = {
        data: [
          {
            date: '09/10/2025',
            whatsapp: 15,
            chatweb: 5
          },
          {
            date: '10/10/2025',
            whatsapp: 10,
            chatweb: 3
          }
        ],
        totalCount: 33,
      };

      mockAnalyticalService.getServicesChannelPeriod.mockResolvedValue(expectedResult);

      const result = await controller.getServicesChannelPeriod(query);

      expect(service.getServicesChannelPeriod).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });
});
