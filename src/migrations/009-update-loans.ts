import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Add new columns as nullable first (existing rows may have no data)
  await queryInterface.addColumn("loans", "dueDate", {
    type: DataTypes.DATEONLY,
    allowNull: true,
  });

  await queryInterface.addColumn("loans", "totalInterest", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  });

  await queryInterface.addColumn("loans", "totalPayable", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  });

  await queryInterface.addColumn("loans", "remainingBalance", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  });

  await queryInterface.addColumn("loans", "updatedBy", {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: "users", key: "id" },
  });

  // Backfill existing rows: compute dueDate, totalInterest, totalPayable, remainingBalance
  // dueDate = loanDate + durationMonths
  // totalInterest = principalAmount * interestRate/100 * durationMonths
  // totalPayable = principalAmount + totalInterest
  await queryInterface.sequelize.query(`
    UPDATE "loans"
    SET
      "dueDate" = ("loanDate"::date + ("durationMonths" || ' months')::interval)::date,
      "totalInterest" = ROUND(("principalAmount" * "interestRate" / 100 * "durationMonths"), 2),
      "totalPayable"  = ROUND(("principalAmount" + ("principalAmount" * "interestRate" / 100 * "durationMonths")), 2),
      "remainingBalance" = CASE
        WHEN "status" IN ('COMPLETED', 'CANCELLED') THEN 0
        ELSE ROUND(("principalAmount" + ("principalAmount" * "interestRate" / 100 * "durationMonths")), 2)
      END
    WHERE "dueDate" IS NULL
  `);

  // Now enforce NOT NULL on the computed columns
  await queryInterface.changeColumn("loans", "dueDate", {
    type: DataTypes.DATEONLY,
    allowNull: false,
  });
  await queryInterface.changeColumn("loans", "totalInterest", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });
  await queryInterface.changeColumn("loans", "totalPayable", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });
  await queryInterface.changeColumn("loans", "remainingBalance", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });

  // Update status ENUM to include new values
  await queryInterface.sequelize.query(
    `ALTER TYPE "enum_loans_status" ADD VALUE IF NOT EXISTS 'DUE_SOON'`,
  );
  await queryInterface.sequelize.query(
    `ALTER TYPE "enum_loans_status" ADD VALUE IF NOT EXISTS 'CANCELLED'`,
  );

  await queryInterface.addIndex("loans", ["dueDate"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeIndex("loans", ["dueDate"]);
  await queryInterface.removeColumn("loans", "dueDate");
  await queryInterface.removeColumn("loans", "totalInterest");
  await queryInterface.removeColumn("loans", "totalPayable");
  await queryInterface.removeColumn("loans", "remainingBalance");
  await queryInterface.removeColumn("loans", "updatedBy");
};
