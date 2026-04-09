import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientPageModel, ClientPageSchema } from './schemas/client-page.schema';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ClientPageModel.name, schema: ClientPageSchema }]),
  ],
  controllers: [PagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
