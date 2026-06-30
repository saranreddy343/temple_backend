import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable("loans", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    borrowerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "RESTRICT",
    },
    loanNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    principalAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    interestRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    loanDate: { type: DataTypes.DATEONLY, allowNull: false },
    durationMonths: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("ACTIVE", "COMPLETED", "OVERDUE"),
      defaultValue: "ACTIVE",
    },
    remainingPrincipal: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    monthlyInterest: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    closedDate: { type: DataTypes.DATEONLY, allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex("loans", ["borrowerId"]);
  await queryInterface.addIndex("loans", ["status"]);
  await queryInterface.addIndex("loans", ["loanNumber"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("loans");
};
