import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GetObjectCommandOutput, PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import { GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import * as fs from 'fs'
import { StorageStrategy, StorageConfig, FileMetadata, UploadedFileResult } from '../interfaces/storage.interface'

@Injectable()
export class S3StorageStrategy implements StorageStrategy {
  private s3: S3
  private bucket: string
  private region: string
  private baseUrl: string

  constructor(private configService: ConfigService) {
    const config: StorageConfig = {
      region: this.configService.get<string>('AWS_REGION'),
      bucket: this.configService.get<string>('AWS_S3_BUCKET'),
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    }

    this.bucket = config.bucket || 'test-bucket'
    this.region = config.region || 'us-east-1'
    this.baseUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/`

    this.s3 = new S3({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId || '',
        secretAccessKey: config.secretAccessKey || '',
      },
    })
  }

  async uploadFile(file: Buffer | string, filePath: string, metadata: FileMetadata): Promise<UploadedFileResult> {
    let fileContent: Buffer

    // If file is a string (path), read it
    if (typeof file === 'string') {
      fileContent = fs.readFileSync(file)
    } else {
      fileContent = file
    }

    // Prepare S3 upload params
    const params = {
      Bucket: this.bucket,
      Key: filePath,
      Body: fileContent,
      ContentType: metadata.contentType,
      Metadata: {
        originalName: metadata.originalName,
        entityType: metadata.entityType || '',
        entityId: metadata.entityId || '',
        documentType: metadata.documentType || '',
        ownerId: metadata.ownerId || '',
        ownerType: metadata.ownerType || '',
        isPublic: String(metadata.isPublic || false),
        ...this.flattenMetadata(metadata.customMetadata || {}),
      },
    }

    // Upload file to S3
    await this.s3.send(new PutObjectCommand(params))

    // Return the result
    return {
      key: filePath,
      url: `${this.baseUrl}${filePath}`,
      metadata,
    }
  }

  async getFile(key: string): Promise<Buffer> {
    const params = {
      Bucket: this.bucket,
      Key: key,
    }

    const result = await this.s3.send(new GetObjectCommand(params))
    return result.Body as unknown as Buffer
  }

  async deleteFile(key: string): Promise<boolean> {
    const params = {
      Bucket: this.bucket,
      Key: key,
    }

    try {
      await this.s3.send(new DeleteObjectCommand(params))
      return true
    } catch (error) {
      console.error('Error deleting file from S3:', error)
      return false
    }
  }

  async getFileUrl(key: string, expiryTime = 3600): Promise<GetObjectCommandOutput> {
    // For public files, return the direct URL
    const params = {
      Bucket: this.bucket,
      Key: key,
    }

    if (key.startsWith('public/')) {
      return await this.s3.send(new GetObjectCommand(params))
    }

    // For private files, generate a pre-signed URL
    return await this.s3.send(
      new GetObjectCommand({
        ...params,
        ResponseExpires: new Date(Date.now() + expiryTime * 1000),
      }),
    )
  }

  async listFiles(path: string): Promise<string[]> {
    const params = {
      Bucket: this.bucket,
      Prefix: path,
    }

    const result = await this.s3.send(new ListObjectsV2Command(params))
    return result.Contents?.map((item) => item.Key || '') || []
  }

  // Helper method to flatten metadata for S3 (S3 metadata must be flat key-value pairs)
  private flattenMetadata(metadata: Record<string, any>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {}

    for (const [key, value] of Object.entries(metadata)) {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'object' && value !== null) {
        Object.assign(result, this.flattenMetadata(value, newKey))
      } else {
        result[newKey] = String(value)
      }
    }

    return result
  }
}
