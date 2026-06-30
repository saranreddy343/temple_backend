import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { LoanStatus } from "../types";

interface LoanAttributes {
  id: string;
  borrowerId: string;
  loanNumber: string;
  bondNumber?: string;
  principalAmount: number;
  interestRate: number;
  loanDate: Date;
  dueDate?: Date;
  durationMonths: number;
  status: LoanStatus;
  monthlyInterest: number;
  totalInterest?: number;
  totalPayable?: number;
  remainingBalance?: number;
  createdBy: string;
  updatedBy?: string;
  closedDate?: Date;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LoanCreationAttributes extends Optional<
  LoanAttributes,
  | "id"
  | "status"
  | "dueDate"
  | "totalInterest"
  | "totalPayable"
  | "remainingBalance"
  | "updatedBy"
  | "closedDate"
  | "remarks"
> {}

export class Loan
  extends Model<LoanAttributes, LoanCreationAttributes>
  implements LoanAttributes
{
  declare id: string;
  declare borrowerId: string;
  declare loanNumber: string;
  declare bondNumber: string | undefined;
  declare principalAmount: number;
  declare interestRate: number;
  declare loanDate: Date;
  declare dueDate: Date;
  declare durationMonths: number;
  declare status: LoanStatus;
  declare monthlyInterest: number;
  declare totalInterest: number;
  declare totalPayable: number;
  declare remainingBalance: number;
  declare createdBy: string;
  declare updatedBy: string | undefined;
  declare closedDate: Date | undefined;
  declare remarks: string | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Loan.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    borrowerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    loanNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    bondNumber: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    principalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 1 },
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    loanDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    durationMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(LoanStatus)),
      defaultValue: LoanStatus.ACTIVE,
    },
    monthlyInterest: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    totalInterest: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
    },
    totalPayable: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
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
    closedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Loan",
    tableName: "loans",
    indexes: [
      { fields: ["borrowerId"] },
      { fields: ["status"] },
      { fields: ["loanNumber"], unique: true },
      { fields: ["bondNumber"] },
      { fields: ["dueDate"] },
    ],
  },
);
