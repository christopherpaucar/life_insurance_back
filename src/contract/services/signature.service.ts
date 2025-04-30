import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class SignatureService {
  private readonly uploadDir: string

  constructor(private configService: ConfigService) {
    // Create upload directory if it doesn't exist
    this.uploadDir = this.configService.get('UPLOAD_DIR') || 'uploads/signatures'

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  /**
   * Process digital signature data
   * In a real production system, this would likely integrate with a digital signature service
   * such as DocuSign, SignNow, etc. or validate cryptographic signatures
   *
   * @param signatureData Base64 encoded signature data or token from a signature provider
   * @returns URL to the stored signature or signature ID
   */
  async processSignature(signatureData: string): Promise<string> {
    // For demonstration purposes only:
    // In a real app, this would:
    // 1. Call an e-signature API
    // 2. Verify cryptographic signatures
    // 3. Store signature data securely
    // 4. Return a reference or URL

    // Generate a hash to represent a unique signature reference
    const hash = crypto
      .createHash('sha256')
      .update(signatureData + Date.now())
      .digest('hex')

    // Simulate an asynchronous operation (like calling an external API)
    await new Promise((resolve) => setTimeout(resolve, 100))

    // In a real app, we would store the signature data and return a URL or ID
    const signatureUrl = `/signatures/${hash}.png`

    return signatureUrl
  }

  /**
   * Verify that a signature data is valid base64
   * @param str String to check
   * @returns boolean indicating if string is valid base64
   */
  private isBase64(str: string): boolean {
    // Remove data URI prefix if present
    const base64Data = str.replace(/^data:image\/\w+;base64,/, '')

    try {
      return Buffer.from(base64Data, 'base64').toString('base64') === base64Data
    } catch {
      return false
    }
  }
}
