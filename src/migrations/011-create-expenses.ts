import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable("expenses", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: {
      type: DataTypes.ENUM(
        "FESTIVAL",
        "MAINTENANCE",
        "DECORATION",
        "ELECTRICITY",
        "WATER",
        "ANNADANAM",
        "SALARY",
        "MISCELLANEOUS",
      ),
      allowNull: false,
    },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    expenseDate: { type: DataTypes.DATEONLY, allowNull: false },
    receiptImage: { type: DataTypes.STRING(500), allowNull: true },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex("expenses", ["category"]);
  await queryInterface.addIndex("expenses", ["expenseDate"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("expenses");
};
