import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Not, Repository } from 'typeorm'
import { Client } from '../entities/client.entity'
import { CreateClientDto } from '../dto/create-client.dto'
import { UpdateClientDto } from '../dto/update-client.dto'
import { User } from '../../auth/entities/user.entity'
import { RoleType } from '../../auth/entities/role.entity'

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create(createClientDto)
    const savedClient = await this.clientRepository.save(client)

    const matchingUser = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .where('user.email = :email', { email: createClientDto.email })
      .andWhere('role.name = :roleType', { roleType: RoleType.CLIENT })
      .getOne()

    if (matchingUser) {
      try {
        return await this.linkUserAccount(savedClient.id, matchingUser.id)
      } catch (error) {
        console.error('Error linking user account during client creation:', error)
      }
    }

    return savedClient
  }

  async findAll(query): Promise<{ clients: Client[]; total: number; page: number; limit: number }> {
    const page = query.page ? parseInt(query.page as string, 10) : 1
    const limit = query.limit ? parseInt(query.limit as string, 10) : 10
    const skip = (page - 1) * limit

    const [clients, total] = await this.clientRepository.findAndCount({
      skip,
      take: limit,
      where: {
        deletedAt: query.includeInactive ? Not(IsNull()) : IsNull(),
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

  async findOneByUserId(userId: string): Promise<Client> {
    const client = await this.clientRepository
      .createQueryBuilder('client')
      .select('client.id')
      .leftJoin('client.user', 'user')
      .where('user.id = :userId', { userId })
      .getOne()

    if (!client) {
      throw new NotFoundException(`Client with user ID ${userId} not found`)
    }

    return client
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id)
    const updated = Object.assign(client, updateClientDto)
    return await this.clientRepository.save(updated)
  }

  async remove(id: string): Promise<void> {
    await this.clientRepository.softDelete(id)
  }

  async linkUserAccount(clientId: string, userId: string): Promise<Client> {
    const client = await this.findOne(clientId)
    const user = await this.userRepository.findOne({ where: { id: userId } })

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    if (client.user) {
      throw new BadRequestException('Client already has a linked user account')
    }

    client.user = user
    return await this.clientRepository.save(client)
  }

  async unlinkUserAccount(clientId: string): Promise<Client> {
    const client = await this.findOne(clientId)
    client.user = null as any
    return await this.clientRepository.save(client)
  }

  async createClientForUser(user: User): Promise<Client> {
    const existingClient = await this.clientRepository.findOne({
      where: { user: { id: user.id } },
    })

    if (existingClient) {
      return existingClient
    }

    const client = this.clientRepository.create({
      firstName: user.name.split(' ')[0],
      lastName: user.name.split(' ').slice(1).join(' ') || user.name,
      email: user.email,
      phone: '',
      dateOfBirth: new Date(),
      user,
    })

    return await this.clientRepository.save(client)
  }
}
