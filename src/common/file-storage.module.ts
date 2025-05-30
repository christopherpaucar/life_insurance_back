import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FileStorageService } from './services/file-storage.service'
import { S3StorageStrategy } from './services/s3-storage.strategy'
import { LocalStorageStrategy } from './services/local-storage.strategy'

@Module({
  imports: [ConfigModule],
  providers: [FileStorageService, S3StorageStrategy, LocalStorageStrategy],
  exports: [FileStorageService, S3StorageStrategy, LocalStorageStrategy],
})
export class FileStorageModule {}
