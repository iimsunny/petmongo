import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('api/discover')
export class DiscoverController {
  constructor(private readonly databaseService: DatabaseService) {}

  private async tableExists(tableName: string): Promise<boolean> {
    const rows = await this.databaseService.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = $1
        ) AS exists
      `,
      [tableName],
    );
    return Boolean(rows[0]?.exists);
  }

  private async columnExists(tableName: string, columnName: string): Promise<boolean> {
    const rows = await this.databaseService.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = $2
        ) AS exists
      `,
      [tableName, columnName],
    );

    return Boolean(rows[0]?.exists);
  }

  private async ensureAdminUser(userId?: string): Promise<void> {
    if (!userId) {
      throw new BadRequestException('reviewerId is required');
    }

    const hasAdminUsers = await this.tableExists('admin_users');
    if (!hasAdminUsers) {
      throw new ForbiddenException('admin_users table not found');
    }

    const rows = await this.databaseService.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM admin_users
          WHERE user_id = $1
        ) AS exists
      `,
      [userId],
    );

    if (!rows[0]?.exists) {
      throw new ForbiddenException('Current user is not admin');
    }
  }

  @Get()
  async listDiscoverPosts(
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('q') q?: string,
  ) {
    const hasStatus = await this.columnExists('discover_posts', 'status');

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
      status: string | null;
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
          created_at,
          ${hasStatus ? 'status' : 'NULL::text AS status'}
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
          ${hasStatus ? `AND status = 'approved'` : ''}
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
    const hasStatus = await this.columnExists('discover_posts', 'status');

    if (!title || !authorName || !category) {
      throw new Error('Missing required fields: title, authorName, category');
    }

    const insertColumns = [
      'id',
      'title',
      'author_name',
      'author_avatar_url',
      'cover_url',
      'media_url',
      'category',
      'city',
      'tags',
      'post_type',
    ];
    const insertValues = [
      'gen_random_uuid()',
      '$1',
      '$2',
      '$3',
      '$4',
      '$5',
      '$6',
      '$7',
      `COALESCE($8::text[], '{}'::text[])`,
      `COALESCE($9, 'image')`,
    ];
    const params: unknown[] = [
      title,
      authorName,
      authorAvatarUrl || null,
      coverUrl || null,
      mediaUrl || null,
      category,
      city || null,
      tags || [],
      postType || 'image',
    ];

    if (hasStatus) {
      insertColumns.push('status');
      params.push('pending');
      insertValues.push(`$${params.length}`);
    }

    const result = await this.databaseService.query<{ id: string }>(
      `
        INSERT INTO discover_posts (
          ${insertColumns.join(', ')}
        )
        VALUES (
          ${insertValues.join(', ')}
        )
        RETURNING id
      `,
      params,
    );

    return {
      id: result[0].id,
      message: hasStatus ? 'Post submitted successfully, pending review' : 'Post created successfully',
    };
  }

  @Get('reviews/pending')
  async listPendingDiscoverPosts(
    @Query('limit') limit?: string,
    @Query('reviewerId') reviewerId?: string,
  ) {
    await this.ensureAdminUser(reviewerId);

    const hasStatus = await this.columnExists('discover_posts', 'status');
    if (!hasStatus) {
      return [];
    }

    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(100, Math.floor(parsedLimit)))
      : 50;

    const rows = await this.databaseService.query<{
      id: string;
      title: string;
      author_name: string;
      cover_url: string | null;
      media_url: string | null;
      category: string;
      city: string | null;
      tags: string[] | null;
      post_type: string;
      created_at: string;
    }>(
      `
        SELECT
          id,
          title,
          author_name,
          cover_url,
          media_url,
          category,
          city,
          tags,
          post_type,
          created_at
        FROM discover_posts
        WHERE status = 'pending'
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [safeLimit],
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      authorName: row.author_name,
      coverUrl: row.cover_url,
      mediaUrl: row.media_url,
      category: row.category,
      city: row.city,
      tags: row.tags || [],
      postType: row.post_type,
      createdAt: row.created_at,
    }));
  }

  @Patch('reviews/:postId')
  async reviewDiscoverPost(
    @Param('postId') postId: string,
    @Body()
    body: {
      action: 'approve' | 'reject';
      reviewerId?: string;
      reviewNote?: string;
    },
  ) {
    await this.ensureAdminUser(body?.reviewerId);

    const hasStatus = await this.columnExists('discover_posts', 'status');
    if (!hasStatus) {
      throw new Error('discover_posts.status column not found');
    }

    const nextStatus =
      body?.action === 'approve'
        ? 'approved'
        : body?.action === 'reject'
        ? 'rejected'
        : null;

    if (!nextStatus) {
      throw new Error('Invalid action. Use approve or reject.');
    }

    const [hasReviewedAt, hasReviewerId, hasReviewNote] = await Promise.all([
      this.columnExists('discover_posts', 'reviewed_at'),
      this.columnExists('discover_posts', 'reviewer_id'),
      this.columnExists('discover_posts', 'review_note'),
    ]);

    const setClauses = ['status = $1'];
    const params: unknown[] = [nextStatus];

    if (hasReviewedAt) {
      setClauses.push('reviewed_at = NOW()');
    }
    if (hasReviewerId && body.reviewerId) {
      params.push(body.reviewerId);
      setClauses.push(`reviewer_id = $${params.length}`);
    }
    if (hasReviewNote && body.reviewNote) {
      params.push(body.reviewNote);
      setClauses.push(`review_note = $${params.length}`);
    }

    params.push(postId);
    const rows = await this.databaseService.query<{ id: string }>(
      `
        UPDATE discover_posts
        SET ${setClauses.join(', ')}
        WHERE id = $${params.length}
          AND status = 'pending'
        RETURNING id
      `,
      params,
    );

    if (rows.length === 0) {
      throw new Error('Pending post not found or already reviewed');
    }

    return {
      ok: true,
      id: postId,
      status: nextStatus,
    };
  }
}
