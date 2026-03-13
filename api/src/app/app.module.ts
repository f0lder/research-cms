import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchemaModule } from './schema/schema.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/nestjs-api'),
    SchemaModule,
    ContentModule,
  ],
})
export class AppModule {}
