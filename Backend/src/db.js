require("dotenv").config();

const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DATABASE_URL,
  DB_SSL
} = process.env;

const dialectOptions = {};
if (DB_SSL === "true" || (DATABASE_URL && !DATABASE_URL.includes("localhost"))) {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
}

const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: "mysql",
      logging: false,
      dialectOptions,
      define: {
        timestamps: true,
        underscored: false
      }
    })
  : new Sequelize(
      DB_NAME || "gestor_de_gastos",
      DB_USER || "root",
      DB_PASSWORD || "",
      {
        host: DB_HOST || "localhost",
        port: DB_PORT || 3306,
        dialect: "mysql",
        logging: false,
        dialectOptions,
        define: {
          timestamps: true,
          underscored: false
        }
      }
    );

const basename = path.basename(__filename);
const modelsPath = path.join(__dirname, "/models");

fs.readdirSync(modelsPath)
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    require(path.join(__dirname, '/models', file))(sequelize);
  });

const entries = Object.entries(sequelize.models);

const capsEntries = entries.map(([name, model]) => [
  name.charAt(0).toUpperCase() + name.slice(1),
  model
]);

sequelize.models = Object.fromEntries(capsEntries);

const {
  User,
  Transaction,
  CategoryFinance,
  PaymentMethod,
  PaymentAccount
} = sequelize.models;

// User relations
User.hasMany(CategoryFinance, {
  foreignKey: "idUser",
  sourceKey: "id",
  onDelete: "CASCADE"
});

CategoryFinance.belongsTo(User, {
  foreignKey: "idUser",
  targetKey: "id"
});

User.hasMany(PaymentAccount, {
  foreignKey: "idUser",
  sourceKey: "id",
  onDelete: "CASCADE"
});

PaymentAccount.belongsTo(User, {
  foreignKey: "idUser",
  targetKey: "id"
});

User.hasMany(Transaction, {
  foreignKey: "idUser",
  sourceKey: "id",
  onDelete: "CASCADE"
});

Transaction.belongsTo(User, {
  foreignKey: "idUser",
  targetKey: "id"
});

// Category relations
CategoryFinance.hasMany(Transaction, {
  foreignKey: "idCategory"
});

Transaction.belongsTo(CategoryFinance, {
  foreignKey: "idCategory"
});

// PaymentAccount relations
PaymentAccount.hasMany(Transaction, {
  foreignKey: "idPaymentAccount"
});

Transaction.belongsTo(PaymentAccount, {
  foreignKey: "idPaymentAccount"
});

// PaymentMethod relations
PaymentMethod.hasMany(PaymentAccount, {
  foreignKey: "idPaymentMethod"
});

PaymentAccount.belongsTo(PaymentMethod, {
  foreignKey: "idPaymentMethod"
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conectado correctamente a MySQL");
  } catch (error) {
    console.error("Error conectando a la DB:", error.message);
  }
};

testConnection();

module.exports = {
  ...sequelize.models,
  conn: sequelize
};
