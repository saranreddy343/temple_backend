import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.addColumn("loans", "bondNumber", {
    type: DataTypes.STRING(80),
    allowNull: true,
  });
  await queryInterface.addIndex("loans", ["bondNumber"]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeIndex("loans", ["bondNumber"]);
  await queryInterface.removeColumn("loans", "bondNumber");
};
