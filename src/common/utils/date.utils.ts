export class DateUtils {
  static monthsBetween(startDate: Date, endDate: Date): number {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const years = end.getFullYear() - start.getFullYear()
    const months = end.getMonth() - start.getMonth()

    return years * 12 + months
  }
}
