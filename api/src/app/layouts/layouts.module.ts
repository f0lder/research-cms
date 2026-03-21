import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockLayoutModel, BlockLayoutSchema } from './schemas/block-layout.schema';
import { LayoutsService } from './layouts.service';
import { LayoutsController } from './layouts.controller';
import { SchemaModule } from '../schema/schema.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BlockLayoutModel.name, schema: BlockLayoutSchema }]),
    SchemaModule,
  ],
  controllers: [LayoutsController],
  providers: [LayoutsService],
  exports: [LayoutsService],
})
export class LayoutsModule {}
