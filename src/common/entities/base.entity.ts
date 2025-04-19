import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, Index, DeleteDateColumn } from 'typeorm'

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @CreateDateColumn()
  createdAt: Date

  @Index()
  @UpdateDateColumn()
  updatedAt: Date

  @Index()
  @DeleteDateColumn()
  deletedAt: Date
}
