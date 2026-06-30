import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { NotificationTargetType, NotificationStatus } from "../types";

interface NotificationAttributes {
  id: string;
  title: string;
  message: string;
  type: string;
  targetType: NotificationTargetType;
  targetUserId?: string;
  createdBy?: string;
  scheduledDate?: Date;
  status: NotificationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationCreationAttributes extends Optional<
  NotificationAttributes,
  "id" | "targetUserId" | "createdBy" | "scheduledDate" | "status"
> {}

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: string;
  declare title: string;
  declare message: string;
  declare type: string;
  declare targetType: NotificationTargetType;
  declare targetUserId: string | undefined;
  declare createdBy: string | undefined;
  declare scheduledDate: Date | undefined;
  declare status: NotificationStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "INFO",
    },
    targetType: {
      type: DataTypes.ENUM(...Object.values(NotificationTargetType)),
      allowNull: false,
      defaultValue: NotificationTargetType.ALL,
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
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(NotificationStatus)),
      allowNull: false,
      defaultValue: NotificationStatus.PENDING,
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "notifications",
    timestamps: true,
    indexes: [
      { fields: ["targetType"] },
      { fields: ["targetUserId"] },
      { fields: ["status"] },
      { fields: ["createdBy"] },
    ],
  },
);
