import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { ExpenseCategory } from "../types";

interface ExpenseAttributes {
  id: string;
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: Date;
  receiptImage?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExpenseCreationAttributes extends Optional<
  ExpenseAttributes,
  "id" | "description" | "receiptImage" | "updatedBy"
> {}

export class Expense
  extends Model<ExpenseAttributes, ExpenseCreationAttributes>
  implements ExpenseAttributes
{
  declare id: string;
  declare title: string;
  declare description: string | undefined;
  declare category: ExpenseCategory;
  declare amount: number;
  declare expenseDate: Date;
  declare receiptImage: string | undefined;
  declare createdBy: string;
  declare updatedBy: string | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Expense.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM(...Object.values(ExpenseCategory)),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
    expenseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    receiptImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
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
  },
  {
    sequelize,
    modelName: "Expense",
    tableName: "expenses",
    indexes: [
      { fields: ["category"] },
      { fields: ["expenseDate"] },
      { fields: ["createdBy"] },
    ],
  },
);
