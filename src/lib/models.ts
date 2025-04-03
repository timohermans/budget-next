export type Transaction = {
    id: number,
    followNumber: number,
    iban: string,
    currency: string,
    amount: number,
    dateTransaction: Date,
    balanceAfterTransaction: number,
    nameOtherParty?: string,
    ibanOtherParty?: string,
    authorizationCode?: string,
    description?: string,
    cashbackForDate?: Date,
    week: number,
    isFromOtherParty: boolean,
    isFixed: boolean
}