/* eslint-disable no-case-declarations */
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

export enum DocumentType {
  RUC = 'RUC',
  PASSPORT = 'PASSPORT',
  CI = 'CI',
}

export function IsValidDocument(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidDocument',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const documentType = (args.object as any).documentType
          if (!value) return false
          if (typeof value !== 'string') return false

          switch (documentType) {
            case DocumentType.CI:
              if (value.length !== 10) return false
              if (!/^\d+$/.test(value)) return false
              const ciDigits = value.split('').map(Number)
              const ciLastDigit = ciDigits[9]
              const ciSum = ciDigits.slice(0, 9).reduce((acc, curr, idx) => {
                const multiplier = idx % 2 === 0 ? 2 : 1
                const product = curr * multiplier
                return acc + (product >= 10 ? product - 9 : product)
              }, 0)
              const ciCalculatedDigit = ciSum % 10 === 0 ? 0 : 10 - (ciSum % 10)
              return ciCalculatedDigit === ciLastDigit

            case DocumentType.RUC:
              if (value.length !== 13) return false
              if (!/^\d+$/.test(value)) return false
              const rucDigits = value.split('').map(Number)
              const rucLastDigit = rucDigits[12]
              const rucSum = rucDigits.slice(0, 12).reduce((acc, curr, idx) => {
                const multiplier = idx % 2 === 0 ? 2 : 1
                const product = curr * multiplier
                return acc + (product >= 10 ? product - 9 : product)
              }, 0)
              const rucCalculatedDigit = rucSum % 10 === 0 ? 0 : 10 - (rucSum % 10)
              return rucCalculatedDigit === rucLastDigit

            case DocumentType.PASSPORT:
              if (value.length !== 9) return false
              if (!/^[A-Z0-9]+$/.test(value)) return false
              return true

            default:
              return false
          }
        },
        defaultMessage(args: ValidationArguments) {
          const documentType = (args.object as any).documentType
          switch (documentType) {
            case DocumentType.CI:
              return 'Invalid CI number. Must be a valid 10-digit Ecuadorian CI.'
            case DocumentType.RUC:
              return 'Invalid RUC number. Must be a valid 13-digit Ecuadorian RUC.'
            case DocumentType.PASSPORT:
              return 'Invalid passport number. Must be a valid 9-character passport number.'
            default:
              return 'Invalid document type.'
          }
        },
      },
    })
  }
}
