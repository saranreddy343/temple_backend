import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable("audit_logs", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entity: { type: DataTypes.STRING(100), allowNull: false },
    entityId: { type: DataTypes.STRING(100), allowNull: true },
    oldValues: { type: DataTypes.JSONB, allowNull: true },
    newValues: { type: DataTypes.JSONB, allowNull: true },
    ipAddress: { type: DataTypes.STRING(45), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex("audit_logs", ["userId"]);
  await queryInterface.addIndex("audit_logs", ["entity", "entityId"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("audit_logs");
};
