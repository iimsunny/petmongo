import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('api/resources')
export class ResourcesController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async listResources(
    @Query('city') city?: string,
    @Query('category') category?: string,
  ) {
    const rows = await this.databaseService.query<{
      id: string;
      name: string;
      category: string;
      city: string;
      cover_url: string | null;
      location_hint: string | null;
      safety_note: string | null;
      best_time: string | null;
      verified: boolean;
      status: string;
      tags: string[];
      media: Array<{
        id: string;
        type: string;
        url: string;
        thumbUrl: string | null;
        sortOrder: number;
      }>;
    }>(
      `
        SELECT
          r.id,
          r.name,
          c.name AS category,
          ci.name AS city,
          r.cover_url,
          r.location_hint,
          r.safety_note,
          r.best_time,
          r.verified,
          r.status,
          COALESCE(array_remove(array_agg(t.name), NULL), '{}') AS tags,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', m.id,
                'type', m.type,
                'url', m.url,
                'thumbUrl', m.thumb_url,
                'sortOrder', m.sort_order
              )
            ) FILTER (WHERE m.id IS NOT NULL),
            '[]'
          ) AS media
        FROM resources r
        JOIN categories c ON r.category_id = c.id
        JOIN cities ci ON r.city_id = ci.id
        LEFT JOIN resource_tags rt ON rt.resource_id = r.id
        LEFT JOIN tags t ON t.id = rt.tag_id
        LEFT JOIN media_assets m ON m.resource_id = r.id
        WHERE ($1::text IS NULL OR ci.name = $1)
          AND ($2::text IS NULL OR c.name = $2)
          AND r.status != 'rejected'
        GROUP BY r.id, c.name, ci.name
        ORDER BY r.created_at DESC
      `,
      [city || null, category || null],
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.name,
      category: row.category,
      city: row.city,
      tags: row.tags || [],
      safety: row.safety_note,
      bestTime: row.best_time,
      locationHint: row.location_hint,
      verified: row.verified,
      coverUrl: row.cover_url,
      media: row.media || [],
    }));
  }

  @Post()
  async createResource(
    @Body()
    body: {
      name: string;
      category: string;
      city: string;
      locationHint?: string;
      safetyNote?: string;
      bestTime?: string;
      coverUrl?: string;
      submitterId?: string;
    },
  ) {
    const { name, category, city, locationHint, safetyNote, bestTime, coverUrl, submitterId } = body;

    if (!name || !category || !city) {
      throw new Error('Missing required fields: name, category, city');
    }

    // 获取或创建城市
    let cityRow = await this.databaseService.query<{ id: string }>(
      `SELECT id FROM cities WHERE name = $1 LIMIT 1`,
      [city],
    );

    if (cityRow.length === 0) {
      const newCity = await this.databaseService.query<{ id: string }>(
        `INSERT INTO cities (id, name) VALUES (gen_random_uuid(), $1) RETURNING id`,
        [city],
      );
      cityRow = newCity;
    }

    // 获取分类ID
    const categoryRow = await this.databaseService.query<{ id: string }>(
      `SELECT id FROM categories WHERE name = $1 LIMIT 1`,
      [category],
    );

    if (categoryRow.length === 0) {
      throw new Error(`Category "${category}" not found`);
    }

    // 创建资源（状态为pending，等待审核）
    const resourceResult = await this.databaseService.query<{ id: string }>(
      `
        INSERT INTO resources (
          id,
          name,
          category_id,
          city_id,
          cover_url,
          location_hint,
          safety_note,
          best_time,
          status
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          'pending'
        )
        RETURNING id
      `,
      [
        name,
        categoryRow[0].id,
        cityRow[0].id,
        coverUrl || null,
        locationHint || null,
        safetyNote || null,
        bestTime || null,
      ],
    );

    const resourceId = resourceResult[0].id;

    // 创建提交记录
    if (submitterId) {
      await this.databaseService.query(
        `
          INSERT INTO submissions (
            id,
            resource_id,
            submitter_id,
            payload,
            status
          )
          VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3::jsonb,
            'pending'
          )
        `,
        [
          resourceId,
          submitterId,
          JSON.stringify({
            name,
            category,
            city,
            locationHint,
            safetyNote,
            bestTime,
            coverUrl,
          }),
        ],
      );
    }

    return {
      id: resourceId,
      message: 'Resource submitted successfully, pending review',
    };
  }
}
