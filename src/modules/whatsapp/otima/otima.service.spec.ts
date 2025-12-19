import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { OtimaService } from './otima.service';

describe('OtimaService', () => {
  let service: OtimaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: false })],
      providers: [OtimaService],
    }).compile();
    service = module.get<OtimaService>(OtimaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});


