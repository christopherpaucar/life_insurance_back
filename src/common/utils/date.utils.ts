export class DateUtils {
  static monthsBetween(startDate: Date, endDate: Date): number {
    const start = startDate
    const end = endDate

    const years = end.getFullYear() - start.getFullYear()
    const months = end.getMonth() - start.getMonth()

    return years * 12 + months
  }
}
