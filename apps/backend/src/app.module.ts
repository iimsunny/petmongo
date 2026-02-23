import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CitiesController } from './cities/cities.controller';
import { CategoriesController } from './categories/categories.controller';
import { ResourcesController } from './resources/resources.controller';
import { DiscoverController } from './discover/discover.controller';
import { AuthController } from './auth/auth.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'media'),
      serveRoot: '/media',
      serveStaticOptions: {
        index: false,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  controllers: [
    AppController,
    CitiesController,
    CategoriesController,
    ResourcesController,
    DiscoverController,
    AuthController,
    UsersController,
  ],
  providers: [AppService],
})
export class AppModule {}
