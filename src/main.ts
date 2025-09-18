import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development
  app.enableCors({
    origin: ['http://10.20.20.103:8083', 'http://10.85.170.15:8099', 'https://vm103-8083.ubicuacloud.com.br', 'https://ccs.unidasgestaodeterceiros.com.br'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('CCS Backend API')
    .setDescription('Multi platform CRM API for customer service')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'Authorization', in: 'header', description: 'Typebot API Key (Bearer token)' },
      'Typebot-API-Key'
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = process.env.PORT ?? 8082;
  await app.listen(port, '0.0.0.0');
  
  console.log(process.env.NODE_ENV === 'production' ? `Application is running on: ${process.env.APPLICATION_URL} 🚀` : `Application is running on: http://localhost:${port} ⚙️`);
}
bootstrap();
