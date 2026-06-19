import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { MenuModel, MenuSchema } from './schemas/menu.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MenuModel.name, schema: MenuSchema }]),
    AuthModule,
  ],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenusModule {}
