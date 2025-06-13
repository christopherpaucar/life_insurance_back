import { Controller, Get, Query } from '@nestjs/common'
import { ReportsService } from './reports.service'

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('unpaid-insurances')
  async getUnpaidInsurances(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getUnpaidInsurances(startDate, endDate)
  }

  @Get('contracts-by-client')
  async getContractsByClient(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getContractsByClient(startDate, endDate)
  }

  @Get('pending-requests')
  async getPendingRequests(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getPendingRequests(startDate, endDate)
  }

  @Get('expiring-contracts')
  async getExpiringContracts(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getExpiringContracts(startDate, endDate)
  }
}
