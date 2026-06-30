import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { PaymentScheduleStatus } from "../types";

interface PaymentScheduleAttributes {
  id: string;
  loanId: string;
  month: number;
  year: number;
  dueDate: Date;
  interestDue: number;
  principalBalance: number;
  status: PaymentScheduleStatus;
  paidDate?: Date;
}

interface PaymentScheduleCreationAttributes extends Optional<
  PaymentScheduleAttributes,
  "id" | "status"
> {}

export class PaymentSchedule
  extends Model<PaymentScheduleAttributes, PaymentScheduleCreationAttributes>
  implements PaymentScheduleAttributes
{
  declare id: string;
  declare loanId: string;
  declare month: number;
  declare year: number;
  declare dueDate: Date;
  declare interestDue: number;
  declare principalBalance: number;
  declare status: PaymentScheduleStatus;
  declare paidDate: Date | undefined;
}

PaymentSchedule.init(
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
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    interestDue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    principalBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentScheduleStatus)),
      defaultValue: PaymentScheduleStatus.PENDING,
    },
    paidDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "PaymentSchedule",
    tableName: "payment_schedules",
    timestamps: false,
    indexes: [{ fields: ["loanId", "month", "year"] }],
  },
);
