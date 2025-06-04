import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryFailedError, Repository } from 'typeorm'
import { PaymentMethod } from '../entities/payment-method.entity'
import { CreatePaymentMethodDto } from '../dto/create-payment-method.dto'
import { UpdatePaymentMethodDto } from '../dto/update-payment-method.dto'
import { User } from '../../auth/entities/user.entity'
import { Contract } from '../entities/contract.entity'

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto, user: User): Promise<PaymentMethod> {
    const paymentMethod = this.paymentMethodRepository.create({
      ...createPaymentMethodDto,
      user,
    })
    return this.paymentMethodRepository.save(paymentMethod)
  }

  async findAll(user: User): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({
      where: { user: { id: user.id } },
      order: { isDefault: 'DESC' },
    })
  }

  async findOne(id: string, user: User): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id, user: { id: user.id } },
    })

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found')
    }

    return paymentMethod
  }

  async update(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto, user: User): Promise<PaymentMethod> {
    const paymentMethod = await this.findOne(id, user)
    Object.assign(paymentMethod, updatePaymentMethodDto)
    return this.paymentMethodRepository.save(paymentMethod)
  }

  async remove(id: string, user: User): Promise<void> {
    const paymentMethod = await this.findOne(id, user)

    if (paymentMethod.isDefault) {
      throw new BadRequestException('Cannot delete default payment method')
    }

    try {
      await this.paymentMethodRepository.remove(paymentMethod)
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const defaultPaymentMethod = await this.paymentMethodRepository.findOne({
          where: { user: { id: user.id }, isDefault: true },
        })

        if (defaultPaymentMethod) {
          await this.contractRepository.update(
            { paymentMethod: { id: paymentMethod.id } },
            { paymentMethod: { id: defaultPaymentMethod.id } },
          )
          await this.paymentMethodRepository.remove(paymentMethod)
        } else {
          throw new BadRequestException(
            'Cannot delete payment method. Please delete all contracts using this payment method first.',
          )
        }
      }
    }
  }
}
