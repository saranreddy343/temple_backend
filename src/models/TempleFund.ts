import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface TempleFundAttributes {
  id: string;
  totalAmount: number;
  availableAmount: number;
  loanedAmount: number;
  updatedAt?: Date;
}

interface TempleFundCreationAttributes extends Optional<
  TempleFundAttributes,
  "id" | "loanedAmount"
> {}

export class TempleFund
  extends Model<TempleFundAttributes, TempleFundCreationAttributes>
  implements TempleFundAttributes
{
  declare id: string;
  declare totalAmount: number;
  declare availableAmount: number;
  declare loanedAmount: number;
  declare readonly updatedAt: Date;
}

TempleFund.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    availableAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    loanedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
  },
  {
    sequelize,
    modelName: "TempleFund",
    tableName: "temple_fund",
    timestamps: true,
    createdAt: false,
  },
);
