import { Module } from '@nestjs/common';
import * as fs from 'node:fs';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {
  /** Đảm bảo thư mục uploads tồn tại khi khởi động (dùng cho cả dev lẫn container). */
  constructor() {
    const dir = process.env.UPLOAD_DIR || '/app/uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
