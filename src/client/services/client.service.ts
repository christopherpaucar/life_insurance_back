import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Client } from '../entities/client.entity'
import { CreateClientDto } from '../dto/create-client.dto'
import { UpdateClientDto } from '../dto/update-client.dto'

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create(createClientDto)
    return await this.clientRepository.save(client)
  }

  async findAll(query): Promise<{ clients: Client[]; total: number; page: number; limit: number }> {
    const page = query.page ? parseInt(query.page, 10) : 1
    const limit = query.limit ? parseInt(query.limit, 10) : 10
    const skip = (page - 1) * limit

    const [clients, total] = await this.clientRepository.findAndCount({
      skip,
      take: limit,
      where: {
        isActive: query.includeInactive ? undefined : true,
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    })

    return { clients, total, page, limit }
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['user'],
    })

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`)
    }

    return client
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id)
    const updated = Object.assign(client, updateClientDto)
    return await this.clientRepository.save(updated)
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id)
    client.isActive = false
    await this.clientRepository.save(client)
  }
}
