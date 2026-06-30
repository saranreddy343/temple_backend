import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable("loan_payments", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "loans", key: "id" },
      onDelete: "RESTRICT",
    },
    principalAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    interestAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    totalPaid: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: false },
    paymentMethod: {
      type: DataTypes.ENUM("CASH", "UPI", "BANK_TRANSFER", "CHEQUE"),
      allowNull: false,
      defaultValue: "CASH",
    },
    collectedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex("loan_payments", ["loanId"]);
  await queryInterface.addIndex("loan_payments", ["paymentDate"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("loan_payments");
};
