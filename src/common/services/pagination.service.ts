import { Repository, FindOptionsWhere, ObjectLiteral, FindOptionsOrder } from 'typeorm'
import { PaginationDto } from '../dto/pagination.dto'
import { PaginatedResponse } from '../interfaces/pagination.interface'

export class PaginationService {
  static async paginate<T extends ObjectLiteral>(
    repository: Repository<T>,
    where: FindOptionsWhere<T>,
    { page = 1, limit = 10 }: PaginationDto,
    order?: FindOptionsOrder<T>,
  ): Promise<PaginatedResponse<T>> {
    const [data, total] = await repository.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    })

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}
