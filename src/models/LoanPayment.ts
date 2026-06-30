import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { PaymentMethod } from "../types";

interface LoanPaymentAttributes {
  id: string;
  loanId: string;
  principalAmount: number;
  interestAmount: number;
  totalPaid: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  collectedBy: string;
  remarks?: string;
  createdAt?: Date;
}

interface LoanPaymentCreationAttributes extends Optional<
  LoanPaymentAttributes,
  "id" | "remarks"
> {}

export class LoanPayment
  extends Model<LoanPaymentAttributes, LoanPaymentCreationAttributes>
  implements LoanPaymentAttributes
{
  declare id: string;
  declare loanId: string;
  declare principalAmount: number;
  declare interestAmount: number;
  declare totalPaid: number;
  declare paymentDate: Date;
  declare paymentMethod: PaymentMethod;
  declare collectedBy: string;
  declare remarks: string | undefined;
  declare readonly createdAt: Date;
}

LoanPayment.init(
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
    principalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    interestAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    totalPaid: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
      defaultValue: PaymentMethod.CASH,
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
    modelName: "LoanPayment",
    tableName: "loan_payments",
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ["loanId"] }, { fields: ["paymentDate"] }],
  },
);
