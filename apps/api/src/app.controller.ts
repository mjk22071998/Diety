import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  public getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      platform: 'Diety Freelance Marketplace API',
      version: '1.0.0',
      boundedContexts: [
        'identity',
        'marketplace',
        'escrow',
        'clinical',
        'reputation',
        'tribunal'
      ],
      services: {
        webrtcSignaling: 'online',
        escrowLedger: 'active',
        attendanceAccumulator: 'active'
      }
    };
  }

  @Get('api/v1/meta')
  public getMetadata() {
    return {
      name: 'Diety API',
      port: 3001,
      environment: process.env.NODE_ENV || 'development',
      signalingNamespace: '/signaling'
    };
  }
}
