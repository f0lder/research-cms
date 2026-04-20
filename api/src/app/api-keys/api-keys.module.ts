import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKeyModel, ApiKeySchema } from './schemas/api-key.schema';
import { ApiKeyUsageModel, ApiKeyUsageSchema } from './schemas/apikey-usage.schema';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyUsageService } from './apikey-usage.service';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { SchemaModule } from '../schema/schema.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApiKeyModel.name, schema: ApiKeySchema },
      { name: ApiKeyUsageModel.name, schema: ApiKeyUsageSchema },
    ]),
    SchemaModule,
    AuthModule,
  ],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyUsageService, ApiKeyGuard],
  exports: [ApiKeysService, ApiKeyUsageService, ApiKeyGuard],
})
export class ApiKeysModule {}
