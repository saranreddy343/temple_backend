import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable("principal_payments", {
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
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    paidDate: { type: DataTypes.DATEONLY, allowNull: false },
    collectedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex("principal_payments", ["loanId"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("principal_payments");
};
