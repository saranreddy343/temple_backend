import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable("notifications", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "INFO",
    },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    data: { type: DataTypes.JSONB, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex("notifications", ["userId", "isRead"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("notifications");
};
