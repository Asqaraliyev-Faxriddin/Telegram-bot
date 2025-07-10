import { Global, Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';

@Global()
@Module({
  providers: [RegistrationService],
  exports:[RegistrationService]
})
export class RegistrationModule {}
