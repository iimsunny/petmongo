import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async listCategories() {
    return this.databaseService.query(
      'SELECT id, name FROM categories ORDER BY name',
    );
  }
}
