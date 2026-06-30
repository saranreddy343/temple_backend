import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable("users", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    mobile: { type: DataTypes.STRING(15), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    role: {
      type: DataTypes.ENUM("ADMIN", "BORROWER"),
      allowNull: false,
      defaultValue: "BORROWER",
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    fcmToken: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex("users", ["mobile"]);
  await queryInterface.addIndex("users", ["role"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable("users");
};
