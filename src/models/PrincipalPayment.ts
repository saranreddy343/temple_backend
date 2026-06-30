import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface PrincipalPaymentAttributes {
  id: string;
  loanId: string;
  amount: number;
  paidDate: Date;
  collectedBy: string;
  remarks?: string;
  createdAt?: Date;
}

interface PrincipalPaymentCreationAttributes extends Optional<
  PrincipalPaymentAttributes,
  "id"
> {}

export class PrincipalPayment
  extends Model<PrincipalPaymentAttributes, PrincipalPaymentCreationAttributes>
  implements PrincipalPaymentAttributes
{
  declare id: string;
  declare loanId: string;
  declare amount: number;
  declare paidDate: Date;
  declare collectedBy: string;
  declare remarks: string | undefined;
  declare readonly createdAt: Date;
}

PrincipalPayment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "loans", key: "id" },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
    paidDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    collectedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "PrincipalPayment",
    tableName: "principal_payments",
    timestamps: true,
    updatedAt: false,
  },
);
