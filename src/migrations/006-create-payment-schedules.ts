import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable("payment_schedules", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "loans", key: "id" },
      onDelete: "CASCADE",
    },
    month: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false },
    interestDue: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    principalBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("PENDING", "PAID", "OVERDUE"),
      defaultValue: "PENDING",
    },
    paidDate: { type: DataTypes.DATEONLY, allowNull: true },
  });

  await queryInterface.addIndex("payment_schedules", [
    "loanId",
    "month",
    "year",
  ]);
  await queryInterface.addIndex("payment_schedules", ["status"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("payment_schedules");
};
