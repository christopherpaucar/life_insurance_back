export interface EmailMessage {
  to: string
  subject: string
  text?: string
  html?: string
  from?: string
  templateId?: string
  templateData?: Record<string, any>
}

export interface IEmailAdapter {
  send(message: EmailMessage): Promise<boolean>
  sendTemplate(message: EmailMessage): Promise<boolean>
}
