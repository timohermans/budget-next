import { pgTable, varchar, uniqueIndex, integer, numeric, date } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"




export const efMigrationsHistory = pgTable("__EFMigrationsHistory", {
	migrationId: varchar("MigrationId", { length: 150 }).primaryKey().notNull(),
	productVersion: varchar("ProductVersion", { length: 32 }).notNull(),
});

export const transactions = pgTable("transactions", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "transactions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	followNumber: integer("follow_number").notNull(),
	iban: varchar({ length: 34 }).notNull(),
	currency: varchar({ length: 5 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	dateTransaction: date("date_transaction").notNull(),
	balanceAfterTransaction: numeric("balance_after_transaction", { precision: 12, scale:  2 }).notNull(),
	nameOtherParty: varchar("name_other_party", { length: 255 }),
	ibanOtherParty: varchar("iban_other_party", { length: 34 }),
	authorizationCode: varchar("authorization_code", { length: 255 }),
	description: varchar({ length: 255 }),
	cashbackForDate: date("cashback_for_date"),
},
(table) => {
	return {
		ixTransactionsFollowNumberIban: uniqueIndex("ix_transactions_follow_number_iban").using("btree", table.followNumber.asc().nullsLast(), table.iban.asc().nullsLast()),
	}
});
