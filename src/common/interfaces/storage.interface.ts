export interface StorageConfig {
  region?: string
  bucket?: string
  accessKeyId?: string
  secretAccessKey?: string
  baseUrl?: string
  localPath?: string
}

export interface FileMetadata {
  originalName: string
  contentType: string
  size: number
  entityType?: string // 'client', 'contract', 'reimbursement', etc.
  entityId?: string
  documentType?: string // 'identification', 'contract', 'invoice', etc.
  ownerId?: string
  ownerType?: string // 'user', 'client', etc.
  isPublic?: boolean
  customMetadata?: Record<string, any>
}

export interface UploadedFileResult {
  key: string
  url: string
  metadata: FileMetadata
}

export interface StorageStrategy {
  /**
   * Upload a file to storage
   * @param file Buffer or file path to upload
   * @param path Path where the file should be stored
   * @param metadata File metadata
   */
  uploadFile(file: Buffer | string, path: string, metadata: FileMetadata): Promise<UploadedFileResult>

  /**
   * Get a file from storage
   * @param key File key/path
   */
  getFile(key: string): Promise<Buffer>

  /**
   * Delete a file from storage
   * @param key File key/path
   */
  deleteFile(key: string): Promise<boolean>

  /**
   * Get a public URL for a file
   * @param key File key/path
   * @param expiryTime Time in seconds for the URL to be valid
   */
  getFileUrl(key: string, expiryTime?: number): Promise<any>

  /**
   * List files in a directory
   * @param path Directory path
   */
  listFiles(path: string): Promise<string[]>
}
