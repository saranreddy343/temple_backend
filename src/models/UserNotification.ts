import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface UserNotificationAttributes {
  id: string;
  notificationId: string;
  userId: string;
  isRead: boolean;
  readAt?: Date;
  openedAt?: Date;
  createdAt?: Date;
}

interface UserNotificationCreationAttributes extends Optional<
  UserNotificationAttributes,
  "id" | "isRead" | "readAt" | "openedAt"
> {}

export class UserNotification
  extends Model<UserNotificationAttributes, UserNotificationCreationAttributes>
  implements UserNotificationAttributes
{
  declare id: string;
  declare notificationId: string;
  declare userId: string;
  declare isRead: boolean;
  declare readAt: Date | undefined;
  declare openedAt: Date | undefined;
  declare readonly createdAt: Date;
}

UserNotification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    notificationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "notifications", key: "id" },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    openedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "UserNotification",
    tableName: "user_notifications",
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ["userId", "isRead"] }, { fields: ["notificationId"] }],
  },
);
