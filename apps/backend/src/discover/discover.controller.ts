import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('api/discover')
export class DiscoverController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async listDiscoverPosts(
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('q') q?: string,
  ) {
    const rows = await this.databaseService.query<{
      id: string;
      title: string;
      author_name: string;
      author_avatar_url: string | null;
      cover_url: string | null;
      media_url: string | null;
      category: string;
      city: string | null;
      likes: number;
      tags: string[] | null;
      post_type: string;
      created_at: string;
    }>(
      `
        SELECT
          id,
          title,
          author_name,
          author_avatar_url,
          cover_url,
          media_url,
          category,
          city,
          likes,
          tags,
          post_type,
          created_at
        FROM discover_posts
        WHERE ($1::text IS NULL OR category = $1)
          AND ($2::text IS NULL OR city = $2)
          AND (
            $3::text IS NULL OR
            title ILIKE '%' || $3 || '%' OR
            author_name ILIKE '%' || $3 || '%' OR
            EXISTS (
              SELECT 1
              FROM unnest(COALESCE(tags, '{}'::text[])) AS tag
              WHERE tag ILIKE '%' || $3 || '%'
            )
          )
        ORDER BY created_at DESC
      `,
      [category || null, city || null, q || null],
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      authorName: row.author_name,
      authorAvatarUrl: row.author_avatar_url,
      coverUrl: row.cover_url,
      mediaUrl: row.media_url,
      category: row.category,
      city: row.city,
      likes: row.likes,
      tags: row.tags || [],
      postType: row.post_type,
      createdAt: row.created_at,
    }));
  }

  @Post()
  async createDiscoverPost(
    @Body()
    body: {
      title: string;
      authorName: string;
      authorAvatarUrl?: string;
      coverUrl?: string;
      mediaUrl?: string;
      category: string;
      city?: string;
      tags?: string[];
      postType?: string;
    },
  ) {
    const { title, authorName, authorAvatarUrl, coverUrl, mediaUrl, category, city, tags, postType } = body;

    if (!title || !authorName || !category) {
      throw new Error('Missing required fields: title, authorName, category');
    }

    const result = await this.databaseService.query<{ id: string }>(
      `
        INSERT INTO discover_posts (
          id,
          title,
          author_name,
          author_avatar_url,
          cover_url,
          media_url,
          category,
          city,
          tags,
          post_type
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
          COALESCE($8::text[], '{}'::text[]),
          COALESCE($9, 'image')
        )
        RETURNING id
      `,
      [title, authorName, authorAvatarUrl || null, coverUrl || null, mediaUrl || null, category, city || null, tags || [], postType || 'image'],
    );

    return {
      id: result[0].id,
      message: 'Post created successfully',
    };
  }
}
