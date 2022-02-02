const _ = process.env;

let dbTables = {};
(dbTables[_.DB_TBL_USERS] = {
  name: _.DB_TBL_USERS,
  custom_types: [
    {
      name: "select_gender",
      type: "enum",
      values: ["female", "male", "others"],
    },
    {
      name: "select_status",
      type: "enum",
      values: ["active", "inactive", "deactivated", "terminated"],
    },
    {
      name: "select_isactive",
      type: "enum",
      values: ["yes", "no", "invisible"],
    },
  ],
  columns: [
    {
      name: "id",
      category: "number",
      type: "serial",
      notnull: true,
      primarykey: true,
    },
    {
      name: "userid",
      category: "number",
      type: "int",
      notnull: true,
      unique: true,
    },
    {
      name: "username",
      category: "string",
      type: "varchar(30)",
      notnull: true,
      unique: true,
    },
    {
      name: "password",
      category: "string",
      type: "varchar(128)",
      notnull: true,
    },
    {
      name: "firstname",
      category: "string",
      type: "varchar(30)",
      notnull: true,
    },
    {
      name: "middlename",
      category: "string",
      type: "varchar(30)",
    },
    {
      name: "lastname",
      category: "string",
      type: "varchar(30)",
      notnull: true,
    },
    {
      name: "gender",
      category: "custom",
      type: "select_gender",
      notnull: true,
    },
    {
      name: "uemail",
      category: "string",
      type: "varchar(128)",
    },
    {
      name: "uaddress",
      category: "string",
      type: "varchar(128)",
    },
    {
      name: "position",
      category: "string",
      type: "varchar(30)",
      notnull: true,
    },
    {
      name: "branch_location",
      category: "string",
      type: "varchar(30)",
      notnull: true,
    },
    {
      name: "status",
      category: "custom",
      type: "select_status",
      notnull: true,
      default: "active",
    },
    {
      name: "date_added",
      category: "date",
      type: "timestamptz",
      notnull: true,
      default: "current_timestamp",
    },
    {
      name: "last_login",
      category: "date",
      type: "timestamptz",
    },
    {
      name: "active_now",
      category: "custom",
      type: "select_isactive",
      notnull: true,
      default: "no",
    },
  ],
  constraint: [
    {
      name: "unique_user",
      type: "unique",
      columns: ["username", "uemail"],
    },
  ],
}),
  (dbTables[_.DB_TBL_TRANSACTIONS] = {
    name: _.DB_TBL_TRANSACTIONS,
    custom_types: [
      {
        name: "select_paymethod",
        type: "enum",
        values: ["Cash", "Check", "Debit"],
      },
      {
        name: "select_channel_location",
        type: "enum",
        values: ["OverTheCounter", "Internet", "ATM", "Mobile", "Phone"],
      },
      {
        name: "select_check_type",
        type: "enum",
        values: ["Local", "Regional", "On Us", "Managers Check"],
      },
      {
        name: "select_online_channel",
        type: "enum",
        values: ["Gcash", "Coins.ph", "Paymaya", "Debit"],
      },
      {
        name: "select_online_confimed",
        type: "enum",
        values: ["yes", "no", "declined"],
      },
    ],
    columns: [
      {
        name: "id",
        category: "number",
        type: "serial",
        notnull: true,
        primarykey: true,
      },
      {
        name: "trans_id",
        category: "string",
        type: "varchar(20)",
        notnull: true,
        unique: true,
      },
      {
        name: "trans_or",
        category: "string",
        type: "varchar(20)",
      },
      {
        name: "trans_ar",
        category: "string",
        type: "varchar(20)",
      },
      {
        name: "account_id",
        category: "string",
        type: "varchar(30)",
        notnull: true,
      },
      {
        name: "account_name",
        category: "string",
        type: "varchar(30)",
        notnull: true,
      },
      {
        name: "receiver_id",
        category: "number",
        type: "varchar(30)",
        notnull: true,
      },
      {
        name: "branch_location",
        category: "string",
        type: "varchar(30)",
        notnull: true,
      },
      {
        name: "paymethod",
        category: "custom",
        type: "select_paymethod",
        notnull: true,
        default: "Cash",
      },
      {
        name: "channel",
        category: "custom",
        type: "select_channel_location",
        notnull: true,
        default: "OverTheCounter",
      },
      {
        name: "channel_online",
        category: "custom",
        type: "select_online_channel",
      },
      {
        name: "channel_online_confirmed",
        category: "custom",
        type: "select_online_confimed",
      },
      {
        name: "date_online_confirmed",
        category: "date",
        type: "timestamptz",
      },
      {
        name: "date_paid",
        category: "date",
        type: "timestamptz",
        notnull: true,
        default: "current_timestamp",
      },
      { name: "date_due", category: "date", type: "timestamptz" },
      {
        name: "amount_paid",
        category: "number",
        type: "int",
        notnull: true,
      },
      {
        name: "amount_received",
        category: "number",
        type: "int",
        notnull: true,
      },
      { name: "trans_fee", category: "number", type: "int" },
      { name: "check_bus_style", category: "string", type: "varchar(30)" },
      { name: "check_no", category: "string", type: "varchar(50)" },
      { name: "check_date", category: "date", type: "timestamptz" },
      { name: "check_bank", category: "string", type: "varchar(50)" },
      { name: "check_type", category: "custom", type: "select_check_type" },
      { name: "business_style", category: "string", type: "varchar(30)" },
      { name: "deleted", category: "date", type: "timestamptz" },
      { name: "confirm_by", category: "string", type: "varchar(30)" },
      { name: "deleted_by", category: "string", type: "varchar(30)" },
      { name: "updated_by", category: "string", type: "varchar(30)" },
    ],
    constraint: [
      {
        name: "unique_transaction",
        type: "unique",
        columns: ["trans_id"],
      },
    ],
  });

let envVars = [
  "COMPANY_NAME",
  "COMPANY_NAME_SHORT",
  "COMPANY_WEBSITE",
  "COMPANY_COLOR_PRIMARY",
  "SRV_MAIN_PORT",
  "SRV_ACCESS_LIST",
  "DB_NAME",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PWD",
  "DB_TBL_USERS",
  "DB_TBL_TRANSACTIONS",
  "TOKEN_KEY",
  "TOKEN_KEY_PUB",
  "TOKEN_SALT_DEG",
  "TOKEN_LOGIN_EXPIRE",
  "TXT_USERNAME_BLOCK_LIST",
];

module.exports = {
  /**
   * Database structure
   */
  dbTables,

  /**
   * DotEnv (.env) variables
   */
  envVars,
};
