import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface InterestCollectionAttributes {
  id: string;
  loanId: string;
  month: number;
  year: number;
  interestAmount: number;
  paidDate: Date;
  paidBy: string;
  remarks?: string;
  createdAt?: Date;
}

interface InterestCreationAttributes extends Optional<
  InterestCollectionAttributes,
  "id"
> {}

export class InterestCollection
  extends Model<InterestCollectionAttributes, InterestCreationAttributes>
  implements InterestCollectionAttributes
{
  declare id: string;
  declare loanId: string;
  declare month: number;
  declare year: number;
  declare interestAmount: number;
  declare paidDate: Date;
  declare paidBy: string;
  declare remarks: string | undefined;
  declare readonly createdAt: Date;
}

InterestCollection.init(
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
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 12 },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    interestAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    paidDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    paidBy: {
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
    modelName: "InterestCollection",
    tableName: "interest_collections",
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ["loanId", "month", "year"], unique: true }],
  },
);
