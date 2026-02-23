import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('api/cities')
export class CitiesController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async listCities() {
    return this.databaseService.query(
      'SELECT id, name FROM cities ORDER BY name',
    );
  }
}
