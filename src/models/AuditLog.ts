import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface AuditLogAttributes {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: object;
  newValues?: object;
  ipAddress?: string;
  createdAt?: Date;
}

interface AuditLogCreationAttributes extends Optional<
  AuditLogAttributes,
  "id"
> {}

export class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  declare id: string;
  declare userId: string;
  declare action: string;
  declare entity: string;
  declare entityId: string | undefined;
  declare oldValues: object | undefined;
  declare newValues: object | undefined;
  declare ipAddress: string | undefined;
  declare readonly createdAt: Date;
}

AuditLog.init(
  {
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
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    oldValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "AuditLog",
    tableName: "audit_logs",
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ["userId"] }, { fields: ["entity", "entityId"] }],
  },
);
