import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import * as path from 'path'
import { StorageStrategy, StorageConfig, FileMetadata, UploadedFileResult } from '../interfaces/storage.interface'

@Injectable()
export class LocalStorageStrategy implements StorageStrategy {
  private basePath: string
  private baseUrl: string

  constructor(private configService: ConfigService) {
    const config: StorageConfig = {
      localPath: this.configService.get<string>('STORAGE_LOCAL_PATH') || 'uploads',
      baseUrl: this.configService.get<string>('STORAGE_BASE_URL') || 'http://localhost:3000/uploads',
    }

    this.basePath = config.localPath || 'uploads'
    this.baseUrl = config.baseUrl || 'http://localhost:3000/uploads'

    // Ensure the base directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true })
    }
  }

  async uploadFile(file: Buffer | string, filePath: string, metadata: FileMetadata): Promise<UploadedFileResult> {
    // Create the full path
    const fullPath = path.join(this.basePath, filePath)

    // Ensure directory exists
    const directory = path.dirname(fullPath)
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }

    // Write the file
    let fileContent: Buffer
    if (typeof file === 'string') {
      fileContent = fs.readFileSync(file)
    } else {
      fileContent = file
    }

    fs.writeFileSync(fullPath, fileContent)

    // Save metadata in a separate JSON file
    const metadataPath = `${fullPath}.metadata.json`
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

    return {
      key: filePath,
      url: `${this.baseUrl}/${filePath}`,
      metadata,
    }
  }

  async getFile(key: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, key)

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${key}`)
    }

    return fs.readFileSync(fullPath)
  }

  async deleteFile(key: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, key)
    const metadataPath = `${fullPath}.metadata.json`

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }

      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath)
      }

      return true
    } catch (error) {
      console.error('Error deleting file from local storage:', error)
      return false
    }
  }

  async getFileUrl(key: string, expiryTime?: number): Promise<string> {
    // Local storage doesn't support expiry times, so we ignore it
    // Just return the URL
    return `${this.baseUrl}/${key}`
  }

  async listFiles(dirPath: string): Promise<string[]> {
    const fullPath = path.join(this.basePath, dirPath)

    if (!fs.existsSync(fullPath)) {
      return []
    }

    const files = fs.readdirSync(fullPath)

    // Filter out metadata files and convert to keys
    return files.filter((file) => !file.endsWith('.metadata.json')).map((file) => path.join(dirPath, file))
  }

  // Helper method to get metadata for a file
  async getMetadata(key: string): Promise<FileMetadata | null> {
    const fullPath = path.join(this.basePath, key)
    const metadataPath = `${fullPath}.metadata.json`

    if (!fs.existsSync(metadataPath)) {
      return null
    }

    const metadataContent = fs.readFileSync(metadataPath, 'utf8')
    return JSON.parse(metadataContent) as FileMetadata
  }
}
