const _ = process.env

const envVars = [
  'PORT',
  'TZ',
  'SRV_UID',
  'SRV_ACCESS_LIST',
  'DB_NAME',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PWD',
  'DBTBL_USERS',
  'DBTBL_ACCOUNTS',
  'DBTBL_TRANSACTIONS',
  'DBTBL_COMPANY',
  'MAIL_NAME',
  'MAIL_HOST',
  'MAIL_PORT',
  'MAIL_AUTH_USER',
  'MAIL_AUTH_PWD',
  'TOKEN_KEY',
  'TOKEN_KEY_PUB',
  'TOKEN_SALT_DEG',
  'TOKEN_LOGIN_EXPIRE',
  'TXT_USERNAME_BLOCK_LIST',
  'CRON_UPDATE',
  'CRON_UPDATE_BACKUP',
  'CRON_UPDATE_KEEPALL_BACKUP',
  'SSL_KEY',
  'SSL_CERT',
]

const log_dirs = {
  main: 'log',
  upload: 'upload_tmp',
  request: 'requests',
}

module.exports = {
  /**
   * Database structure
   */
  dbTables: () => {
    let tables = {}
    // Users
    tables[_.DBTBL_USERS] = {
      name: _.DBTBL_USERS,
      custom_types: [
        {
          name: 'select_gender',
          type: 'enum',
          values: ['female', 'male', 'other'],
        },
        {
          name: 'select_status',
          type: 'enum',
          values: ['active', 'inactive', 'deactivated', 'terminated'],
        },
        {
          name: 'select_active_now',
          type: 'enum',
          values: ['yes', 'no', 'invisible'],
        },
        {
          name: 'select_position',
          type: 'enum',
          values: ['Super Admin', 'Administrator', 'Branch Manager', 'Teller'],
        },
      ],
      columns: [
        {
          name: 'id',
          category: 'number',
          type: 'serial',
          notnull: true,
          primarykey: true,
        },
        {
          name: 'userid',
          category: 'number',
          type: 'int',
          notnull: true,
          unique: true,
        },
        {
          name: 'username',
          category: 'string',
          type: 'varchar(30)',
          notnull: true,
          unique: true,
        },
        {
          name: 'password',
          category: 'string',
          type: 'varchar(128)',
          notnull: true,
        },
        {
          name: 'firstname',
          category: 'string',
          type: 'varchar(50)',
          notnull: true,
        },
        {
          name: 'middlename',
          category: 'string',
          type: 'varchar(50)',
        },
        {
          name: 'lastname',
          category: 'string',
          type: 'varchar(50)',
          notnull: true,
        },
        {
          name: 'gender',
          category: 'custom',
          type: 'select_gender',
          notnull: true,
        },
        {
          name: 'uemail',
          category: 'string',
          type: 'varchar(128)',
        },
        {
          name: 'uaddress',
          category: 'string',
          type: 'varchar(128)',
        },
        {
          name: 'position',
          category: 'custom',
          type: 'select_position',
          notnull: true,
        },
        {
          name: 'branch_location',
          category: 'string',
          type: 'varchar(30)',
          notnull: true,
        },
        {
          name: 'status',
          category: 'custom',
          type: 'select_status',
          notnull: true,
          default: 'active',
        },
        {
          name: 'date_added',
          category: 'date',
          type: 'timestamptz',
          notnull: true,
          default: 'current_timestamp',
        },
        {
          name: 'last_login',
          category: 'date',
          type: 'timestamptz',
        },
        {
          name: 'active_now',
          category: 'custom',
          type: 'select_active_now',
          notnull: true,
          default: 'no',
        },
      ],
      constraint: [
        {
          name: 'unique_user',
          type: 'unique',
          columns: ['username', 'uemail'],
        },
      ],
    }
    // Accounts
    tables[_.DBTBL_ACCOUNTS] = {
      name: _.DBTBL_ACCOUNTS,
      custom_types: [
        {
          name: 'select_accounts_sa_status',
          type: 'enum',
          values: ['Active', 'Inactive'],
        },
      ],
      columns: [
        {
          name: 'id',
          category: 'number',
          type: 'serial',
          notnull: true,
          primarykey: true,
        },
        {
          name: 'sa_status',
          category: 'custom',
          type: 'select_accounts_sa_status',
          default: 'Active',
        },
        {
          name: 'sa_id',
          category: 'string',
          type: 'varchar(30)',
        },
        {
          name: 'accnt_id',
          category: 'string',
          type: 'varchar(30)',
        },
        {
          name: 'account_id',
          category: 'string',
          type: 'varchar(30)',
          notnull: true,
          unique: true,
        },
        {
          name: 'accnt_password',
          category: 'string',
          type: 'varchar(128)',
        },
        {
          name: 'account_name',
          category: 'string',
          type: 'varchar(256)',
        },
        {
          name: 'cu_cd',
          category: 'string',
          type: 'varchar(30)',
        },
        {
          name: 'rs_cd',
          category: 'string',
          type: 'varchar(30)',
        },
        {
          name: 'sa_type_cd',
          category: 'string',
          type: 'varchar(30)',
        },
        {
          name: 'account_address',
          category: 'string',
          type: 'varchar(256)',
        },
        {
          name: 'pole_no',
          category: 'string',
          type: 'varchar(30)',
        },
        {
          name: 'tax_city',
          category: 'string',
          type: 'varchar(128)',
        },
        {
          name: 'meter_no',
          category: 'string',
          type: 'varchar(30)',
        },
        {
          name: 'book_no',
          category: 'string',
          type: 'varchar(30)',
        },
        {
          name: 'bill_cycle',
          category: 'string',
          type: 'varchar(30)',
        },
        {
          name: 'sa_start_date',
          category: 'string',
          type: 'varchar(30)',
        },
      ],
      constraint: [],
    }
    // Payments
    tables[_.DBTBL_TRANSACTIONS] = {
      name: _.DBTBL_TRANSACTIONS,
      custom_types: [
        {
          name: 'select_paymethod',
          type: 'enum',
          values: ['Cash', 'Check', 'Debit'],
        },
        {
          name: 'select_channel',
          type: 'enum',
          values: ['OverTheCounter', 'Internet', 'ATM', 'Mobile', 'Phone'],
        },
        {
          name: 'select_check_type',
          type: 'enum',
          values: ['Local', 'Regional', 'On Us', 'Managers Check'],
        },
        {
          name: 'select_channel_online',
          type: 'enum',
          values: ['Gcash', 'Coins.ph', 'Paymaya', 'Debit'],
        },
        {
          name: 'select_online_confimed',
          type: 'enum',
          values: ['yes', 'no', 'declined'],
        },
      ],
      columns: [
        {
          name: 'id',
          category: 'number',
          type: 'serial',
          notnull: true,
          primarykey: true,
        },
        {
          name: 'trans_id',
          category: 'string',
          type: 'varchar(20)',
          notnull: true,
          unique: true,
        },
        {
          name: 'trans_or',
          category: 'string',
          type: 'varchar(20)',
        },
        {
          name: 'trans_ar',
          category: 'string',
          type: 'varchar(20)',
        },
        {
          name: 'account_id',
          category: 'string',
          type: 'varchar(30)',
          notnull: true,
        },
        {
          name: 'account_name',
          category: 'string',
          type: 'varchar(256)',
          notnull: true,
        },
        {
          name: 'email',
          category: 'string',
          type: 'varchar(30)',
        },
        {
          name: 'phone',
          category: 'string',
          type: 'varchar(30)',
        },
        {
          name: 'receiver_id',
          category: 'string',
          type: 'varchar(30)',
          notnull: true,
        },
        {
          name: 'branch_location',
          category: 'string',
          type: 'varchar(30)',
          notnull: true,
        },
        {
          name: 'paymethod',
          category: 'custom',
          type: 'select_paymethod',
          notnull: true,
          default: 'Cash',
        },
        {
          name: 'channel',
          category: 'custom',
          type: 'select_channel',
          notnull: true,
          default: 'OverTheCounter',
        },
        {
          name: 'channel_online',
          category: 'custom',
          type: 'select_channel_online',
        },
        {
          name: 'channel_online_confirmed',
          category: 'custom',
          type: 'select_online_confimed',
        },
        {
          name: 'date_online_confirmed',
          category: 'date',
          type: 'timestamptz',
        },
        {
          name: 'date_paid',
          category: 'date',
          type: 'timestamptz',
          notnull: true,
          default: 'current_timestamp',
        },
        { name: 'date_due', category: 'date', type: 'timestamptz' },
        {
          name: 'amount_paid',
          category: 'number',
          type: 'numeric(15,4)',
          notnull: true,
        },
        {
          name: 'amount_received',
          category: 'number',
          type: 'numeric(15,4)',
          notnull: true,
        },
        { name: 'trans_fee', category: 'number', type: 'numeric(15,4)' },
        { name: 'check_bus_style', category: 'string', type: 'varchar(30)' },
        { name: 'check_no', category: 'string', type: 'varchar(50)' },
        { name: 'check_date', category: 'date', type: 'timestamptz' },
        { name: 'check_bank', category: 'string', type: 'varchar(50)' },
        { name: 'check_type', category: 'custom', type: 'select_check_type' },
        { name: 'business_style', category: 'string', type: 'varchar(30)' },
        { name: 'deleted', category: 'date', type: 'timestamptz' },
        { name: 'confirm_by', category: 'string', type: 'varchar(30)' },
        { name: 'deleted_by', category: 'string', type: 'varchar(30)' },
        { name: 'updated_by', category: 'string', type: 'varchar(30)' },
      ],
      constraint: [
        {
          name: 'unique_transaction',
          type: 'unique',
          columns: ['trans_id'],
        },
      ],
    }
    // Company
    tables[_.DBTBL_COMPANY] = {
      name: _.DBTBL_COMPANY,
      custom_types: [],
      columns: [
        {
          name: 'id',
          category: 'number',
          type: 'serial',
          notnull: true,
          primarykey: true,
        },
        {
          name: 'name',
          category: 'string',
          type: 'varchar(200)',
          notnull: true,
          unique: true,
        },
        {
          name: 'name_short',
          category: 'string',
          type: 'varchar(100)',
        },
        {
          name: 'name_abbr',
          category: 'string',
          type: 'varchar(50)',
        },
        {
          name: 'website',
          category: 'string',
          type: 'varchar(100)',
        },
        {
          name: 'email',
          category: 'string',
          type: 'varchar(100)',
        },
        {
          name: 'phone',
          category: 'string',
          type: 'varchar(20)',
        },
        {
          name: 'address_1',
          category: 'string',
          type: 'varchar(200)',
        },
        {
          name: 'address_2',
          category: 'string',
          type: 'varchar(200)',
        },
        {
          name: 'tin',
          category: 'string',
          type: 'varchar(200)',
        },
        {
          name: 'color_primary',
          category: 'string',
          type: 'varchar(200)',
        },
        {
          name: 'convenience_fee',
          category: 'number',
          type: 'numeric(15,4)',
          notnull: true,
        },
      ],
      constraint: [
        {
          name: 'unique_company',
          type: 'unique',
          columns: ['website', 'email', 'phone'],
        },
      ],
    }
    return tables
  },

  /**
   * DotEnv (.env) variables
   */
  envVars,

  /**
   * Constant log directories
   */
  log_dirs,
}
