import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Not, Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { Role } from '../entities/role.entity'
import { UpdateUserDto } from '../dto/user.dto'
import { RoleType } from '../entities/role.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(user: User): Promise<User[]> {
    return this.userRepository.find({
      relations: ['role'],
      select: ['id', 'email', 'name'],
      where: { id: Not(user.id) },
    })
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id }, relations: ['role'], select: ['id', 'email'] })
    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id)

    if (updateUserDto.role && updateUserDto.role !== user.role.name) {
      await this.updateRole(id, updateUserDto.role)
    }

    delete updateUserDto.role

    if (updateUserDto.password) {
      const hashedPassword = await User.hashPassword(updateUserDto.password)
      updateUserDto.password = hashedPassword
    }

    Object.assign(user, updateUserDto)
    return this.userRepository.save(user)
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.softDelete(id)
  }

  async updateRole(id: string, roleType: RoleType): Promise<User> {
    const user = await this.findOne(id)
    const role = await this.roleRepository.findOne({ where: { name: roleType } })
    if (!role) {
      throw new NotFoundException('Role not found')
    }
    user.role = role
    return this.userRepository.save(user)
  }

  async updatePermissions(id: string, permissions: string[]): Promise<User> {
    const user = await this.findOne(id)
    const role = user.role
    role.permissions = permissions
    await this.roleRepository.save(role)
    return this.findOne(id)
  }
}
