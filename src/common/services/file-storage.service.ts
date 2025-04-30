import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import { StorageStrategy, FileMetadata, UploadedFileResult } from '../interfaces/storage.interface'
import { S3StorageStrategy } from './s3-storage.strategy'
import { LocalStorageStrategy } from './local-storage.strategy'

@Injectable()
export class FileStorageService {
  private readonly strategy: StorageStrategy

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Strategy: S3StorageStrategy,
    private readonly localStrategy: LocalStorageStrategy,
  ) {
    // Choose the strategy based on config
    const storageType = this.configService.get<string>('STORAGE_TYPE') || 'local'
    this.strategy = storageType === 's3' ? this.s3Strategy : this.localStrategy
  }

  /**
   * Creates a path for a file based on entity type, id, and document type
   * @param entityType Type of entity (client, contract, etc.)
   * @param entityId ID of the entity
   * @param documentType Type of document
   * @param fileName Original file name
   * @returns Generated path for the file
   */
  buildFilePath(entityType: string, entityId: string, documentType: string, fileName: string): string {
    // Sanitize the filename to prevent path traversal attacks
    const sanitizedFileName = this.sanitizeFileName(fileName)

    // Add timestamp to prevent filename collisions
    const timestamp = Date.now()
    const extension = this.getFileExtension(sanitizedFileName)
    const baseFileName = this.getFileNameWithoutExtension(sanitizedFileName)
    const finalFileName = `${baseFileName}-${timestamp}${extension}`

    // Public files go in a different folder for easier access control
    const isPublic = documentType === 'public'
    const basePath = isPublic ? 'public' : 'private'

    return `${basePath}/${entityType}/${entityId}/${documentType}/${finalFileName}`
  }

  /**
   * Upload a file for a specific entity
   * @param file File buffer or path
   * @param entityType Type of entity
   * @param entityId ID of the entity
   * @param documentType Type of document
   * @param metadata Additional metadata
   * @returns Upload result
   */
  async uploadEntityFile(
    file: Buffer | string,
    entityType: string,
    entityId: string,
    documentType: string,
    metadata: Partial<FileMetadata> = {},
  ): Promise<UploadedFileResult> {
    // Determine file name - either from metadata or from file path if it's a string
    const fileName = metadata.originalName || (typeof file === 'string' ? this.getFileName(file) : 'unknown')

    // Build the file path
    const filePath = this.buildFilePath(entityType, entityId, documentType, fileName)

    // Determine content type if not provided
    const contentType = metadata.contentType || this.getMimeType(fileName)

    // Prepare complete metadata
    const fullMetadata: FileMetadata = {
      originalName: fileName,
      contentType,
      size: typeof file === 'string' ? this.getFileSize(file) : file.length,
      entityType,
      entityId,
      documentType,
      isPublic: documentType === 'public',
      ...metadata,
    }

    // Upload using the selected strategy
    return this.strategy.uploadFile(file, filePath, fullMetadata)
  }

  /**
   * Get a file by its key
   * @param key File key
   * @returns File buffer
   */
  async getFile(key: string): Promise<Buffer> {
    return this.strategy.getFile(key)
  }

  /**
   * Delete a file by its key
   * @param key File key
   * @returns Success status
   */
  async deleteFile(key: string): Promise<boolean> {
    return this.strategy.deleteFile(key)
  }

  /**
   * Get a URL for a file
   * @param key File key
   * @param expiryTime Expiry time in seconds
   * @returns URL to access the file
   */
  async getFileUrl(key: string, expiryTime?: number): Promise<string> {
    return this.strategy.getFileUrl(key, expiryTime)
  }

  /**
   * List files for a specific entity
   * @param entityType Type of entity
   * @param entityId ID of the entity
   * @param documentType Optional type of document to filter by
   * @returns List of file keys
   */
  async listEntityFiles(entityType: string, entityId: string, documentType?: string): Promise<string[]> {
    const basePath = `private/${entityType}/${entityId}`
    const path = documentType ? `${basePath}/${documentType}` : basePath
    return this.strategy.listFiles(path)
  }

  /**
   * Helper method to sanitize a file name to prevent directory traversal
   * @param fileName Original file name
   * @returns Sanitized file name
   */
  private sanitizeFileName(fileName: string): string {
    // Remove path components, keep only the filename
    return fileName.replace(/^.*[\\/]/, '').replace(/[^\w\s.-]/g, '_')
  }

  /**
   * Get the file extension including the dot
   * @param fileName File name
   * @returns File extension with dot
   */
  private getFileExtension(fileName: string): string {
    const extension = fileName.split('.').pop()
    return extension ? `.${extension}` : ''
  }

  /**
   * Get the file name without extension
   * @param fileName File name
   * @returns File name without extension
   */
  private getFileNameWithoutExtension(fileName: string): string {
    const extension = this.getFileExtension(fileName)
    return fileName.substring(0, fileName.length - extension.length)
  }

  /**
   * Get file name from a path
   * @param filePath File path
   * @returns File name
   */
  private getFileName(filePath: string): string {
    return filePath.split(/[\\/]/).pop() || 'unknown'
  }

  /**
   * Get file size from a path
   * @param filePath File path
   * @returns File size in bytes
   */
  private getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath)
      return stats.size
    } catch {
      return 0
    }
  }

  /**
   * Try to determine MIME type from file extension
   * @param fileName File name
   * @returns MIME type or application/octet-stream if unknown
   */
  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      csv: 'text/csv',
      json: 'application/json',
      xml: 'application/xml',
      zip: 'application/zip',
      '7z': 'application/x-7z-compressed',
      rar: 'application/x-rar-compressed',
      tar: 'application/x-tar',
      gz: 'application/gzip',
    }

    return mimeTypes[extension] || 'application/octet-stream'
  }
}
