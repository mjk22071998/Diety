import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true
    }
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`[Diety API] NestJS Backend listening on http://localhost:${port}`);
  console.log(`[Diety API] WebRTC Signaling Gateway active on ws://localhost:${port}/signaling`);
  console.log(`[Diety API] Healthcheck available at http://localhost:${port}/health`);
}

bootstrap();
