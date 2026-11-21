import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { WebRtcSignalingGateway } from './bounded-contexts/clinical/presentation/gateways/webrtc-signaling.gateway';
import { AttendanceAccumulatorService } from './bounded-contexts/clinical/application/services/attendance-accumulator.service';
import { PasswordHasherService } from './bounded-contexts/identity/application/services/password-hasher.service';
import { JwtTokenService } from './bounded-contexts/identity/application/services/jwt-token.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    WebRtcSignalingGateway,
    AttendanceAccumulatorService,
    PasswordHasherService,
    JwtTokenService,
    JwtService
  ]
})
export class AppModule {}
