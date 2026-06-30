import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Recreate notifications table with new schema
  await queryInterface.dropTable("notifications");

  await queryInterface.createTable("notifications", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "INFO",
    },
    targetType: {
      type: DataTypes.ENUM(
        "ALL",
        "ADMINS_ONLY",
        "BORROWERS_ONLY",
        "SPECIFIC_USER",
      ),
      allowNull: false,
      defaultValue: "ALL",
    },
    targetUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    scheduledDate: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM("PENDING", "SENT", "FAILED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable("user_notifications", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    notificationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "notifications", key: "id" },
      onDelete: "CASCADE",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    readAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex("notifications", ["targetType"]);
  await queryInterface.addIndex("notifications", ["targetUserId"]);
  await queryInterface.addIndex("notifications", ["status"]);
  await queryInterface.addIndex("user_notifications", ["userId", "isRead"]);
  await queryInterface.addIndex("user_notifications", ["notificationId"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("user_notifications");
  await queryInterface.dropTable("notifications");
};
