const _ = process.env;
const { dbTables, envVars } = require("../data/db.structures");
const { genSaltSync, hashSync } = require("bcrypt");

// Base64 Encode
function base64_encode(text) {
  try {
    return Buffer.from(text, "utf-8").toString("base64");
  } catch (e) {
    console.error("Base64 Encode: ", e.message);
    return;
  }
}

// Base64 Decode
function base64_decode(base64) {
  try {
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch (e) {
    return;
  }
}

module.exports = {
  /**
   * Encode or Decode base64
   * @option encode - Encode String to Base64
   * @option decode - Decode Base64 to String
   */
  base64: {
    /**
     * Encode utf-8 string to `base64` string
     * @param {string} text string to convert to base64
     */
    encode: base64_encode,
    /**
     * Decode base64 string to utf-8 `string`
     * @param {string} base64 base64 string to convert to text
     */
    decode: base64_decode,
  },

  /**
   * Store passwords on database securely
   *
   * Options default `encoded` is `true`
   * `passwordText` should be in base64 encoded string
   * @param {string} passwordText Password in Plain Text
   * @param {{encoded?: boolean, saltdeg?: number}?} options Optional config
   */
  encryptPassword: (passwordText, options = { encoded: true }) => {
    try {
      if (options && options.encoded)
        passwordText = base64_decode(passwordText);
      if (passwordText)
        return hashSync(
          passwordText,
          genSaltSync(
            parseInt(
              options && options.saltdeg
                ? options.saltdeg
                : _.TOKEN_SALT_DEG || 10
            )
          )
        );
      return;
    } catch (e) {
      console.error("Password Encryption Error:", { passwordText, options }, e);
      return;
    }
  },

  /**
   * Generate unique transaction id
   * @param {number|000} branch_id Branch location id
   */
  generateTransactionID: (branch_id) => {
    const now = new Date();
    return [
      String(now.getUTCFullYear()).substring(2) +
        String(now.getDOY()).padStart(3, 0),
      [
        String(branch_id || 0).padStart(3, 0),
        now.getUTCSeconds(),
        String(now.getUTCMilliseconds()).padStart(
          3,
          parseInt(String(Math.random()).replaceAll(".", ""))
        ),
      ]
        .join("")
        .padStart(8, 0),
      String(now.getSecSinceMidnight()).padStart(5, 0),
    ].join("-");
  },

  /**
   * Generate database structure
   */
  generateDatabaseSQL: () => {
    // Generate Database Structure
    const _db_structure = `-- # PosgreSQL Database
-- ##
-- ### Run the following command >
-- ##
-- #
-- > sudo -u postgres psql postgres
-- > CREATE ROLE user WITH LOGIN PASSWORD 'password' CREATEDB;
-- > \\q
-- > psql -U user -d postgres -W
-- > CREATE DATABASE payment_db;
-- > \\c payment_db
-- > \\i \\path\\to\\database.sql
-- #
-- ##
-- ###
-- ##
-- #

:::::custom_type_users:::::

------------------------------------------------------------------------------
-- Create Table for Users
:::::table_users_columns:::::

-- FUNCTIONS
CREATE OR REPLACE FUNCTION notify_user_added()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
	BEGIN
	  PERFORM pg_notify(CAST('added_user' as text), 
    json_build_object(
      'name', TG_NAME,
      'when', TG_WHEN,
      'level', TG_LEVEL,
      'operation', TG_OP,
      'relid', TG_RELID,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,  
      'args', TG_ARGV,
      'nargs', TG_NARGS,
      'record', row_to_json(NEW),
      'record_old', row_to_json(OLD)
    )::text);
	  RETURN NULL;
	END;
$function$
;
CREATE OR REPLACE FUNCTION notify_user_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
	BEGIN
	  PERFORM pg_notify(CAST('deleted_user' as text), 
    json_build_object(
      'name', TG_NAME,
      'when', TG_WHEN,
      'level', TG_LEVEL,
      'operation', TG_OP,
      'relid', TG_RELID,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,  
      'args', TG_ARGV,
      'nargs', TG_NARGS,
      'record', row_to_json(NEW),
      'record_old', row_to_json(OLD)
    )::text);
	  RETURN NULL;
	END;
$function$
;
CREATE OR REPLACE FUNCTION notify_user_updated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
	BEGIN
	  	PERFORM pg_notify(CAST('updated_user' as text), 
    json_build_object(
      'name', TG_NAME,
      'when', TG_WHEN,
      'level', TG_LEVEL,
      'operation', TG_OP,
      'relid', TG_RELID,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,  
      'args', TG_ARGV,
      'nargs', TG_NARGS,
      'record', row_to_json(NEW),
      'record_old', row_to_json(OLD)
    )::text);
		RETURN NULL;
	END;
$function$
;

-- TRIGGERS
CREATE TRIGGER trigger_users_added AFTER
INSERT
    ON
    :::::table_users::::: for each ROW EXECUTE FUNCTION notify_user_added()
    ;

CREATE TRIGGER trigger_users_deleted AFTER
DELETE
    ON
    :::::table_users::::: for each ROW EXECUTE FUNCTION notify_user_deleted()
    ;

CREATE TRIGGER trigger_users_updated AFTER
UPDATE
    ON
    :::::table_users::::: for each ROW EXECUTE FUNCTION notify_user_updated()
    ;
------------------------------------------------------------------------------

:::::custom_type_transactions:::::

------------------------------------------------------------------------------
-- Create Table for Transactions
:::::table_transactions_columns:::::

-- FUNCTIONS
CREATE OR REPLACE FUNCTION notify_transaction_added()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
	BEGIN
	  PERFORM pg_notify(CAST('added_transaction' as text), 
    json_build_object(
      'name', TG_NAME,
      'when', TG_WHEN,
      'level', TG_LEVEL,
      'operation', TG_OP,
      'relid', TG_RELID,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,  
      'args', TG_ARGV,
      'nargs', TG_NARGS,
      'record', row_to_json(NEW),
      'record_old', row_to_json(OLD)
    )::text);
	  RETURN NULL;
	END;
$function$
;
CREATE OR REPLACE FUNCTION notify_transaction_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
	BEGIN
	  PERFORM pg_notify(CAST('deleted_transaction' as text), 
    json_build_object(
      'name', TG_NAME,
      'when', TG_WHEN,
      'level', TG_LEVEL,
      'operation', TG_OP,
      'relid', TG_RELID,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,  
      'args', TG_ARGV,
      'nargs', TG_NARGS,
      'record', row_to_json(NEW),
      'record_old', row_to_json(OLD)
    )::text);
	  RETURN NULL;
	END;
$function$
;
CREATE OR REPLACE FUNCTION notify_transaction_updated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
	BEGIN
	  	PERFORM pg_notify(CAST('updated_transaction' as text), 
    json_build_object(
      'name', TG_NAME,
      'when', TG_WHEN,
      'level', TG_LEVEL,
      'operation', TG_OP,
      'relid', TG_RELID,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,  
      'args', TG_ARGV,
      'nargs', TG_NARGS,
      'record', row_to_json(NEW),
      'record_old', row_to_json(OLD)
    )::text);
		RETURN NULL;
	END;
$function$
;

-- TRIGGERS
CREATE TRIGGER trigger_transaction_added AFTER
INSERT
    ON
    :::::table_transactions::::: for each ROW EXECUTE FUNCTION notify_transaction_added()
    ;

CREATE TRIGGER trigger_transaction_deleted AFTER
DELETE
    ON
    :::::table_transactions::::: for each ROW EXECUTE FUNCTION notify_transaction_deleted()
    ;

CREATE TRIGGER trigger_transaction_updated AFTER
UPDATE
    ON
    :::::table_transactions::::: for each ROW EXECUTE FUNCTION notify_transaction_updated()
    ;
------------------------------------------------------------------------------
`;
    let _tableGen = (_tbl, _columns) => {
      let tmp = [];
      if (_tbl && _columns) {
        _columns.forEach((o) => {
          tmp.push(
            `\t${o.name} ` +
              (o.category == "custom" ? o.type : String(o.type).toUpperCase()) +
              (o.notnull ? ` NOT NULL` : ``) +
              (o.unique ? ` UNIQUE` : ``) +
              (o.primarykey ? ` PRIMARY KEY` : ``) +
              (o.default
                ? ` DEFAULT ${
                    o.category == "string" || o.category == "custom"
                      ? `'` + o.default + `'`
                      : o.default.toUpperCase()
                  }`
                : ``)
          );
        });
        let _constraint = _constraintGen(dbTables[_tbl].constraint) || "";
        return `CREATE TABLE IF NOT EXISTS ${_tbl}(\n${tmp.join(`,\n`)}${
          _constraint.length ? `,\n ${_constraint}` : ``
        }\n);`;
      } else {
        return "";
      }
    };
    let _typeGen = (_ctype) => {
      let tmp = [];
      if (_ctype)
        _ctype.forEach((o) => {
          tmp.push(
            `CREATE TYPE ${o.name} AS ${o.type.toUpperCase()} ('${o.values.join(
              "', '"
            )}');`
          );
        });
      return tmp.join(`\n`);
    };
    let _constraintGen = (_constraint) => {
      let tmp = [];
      if (_constraint)
        _constraint.forEach((o) => {
          tmp.push(
            `\t\tCONSTRAINT ${o.name} ${o.type.toUpperCase()} (${o.columns.join(
              ", "
            )})`
          );
        });
      return tmp.join(`,\n`);
    };
    let _databasesql = _db_structure;
    // Replace Table Names
    _databasesql = _databasesql.replaceAll(
      ":::::table_users:::::",
      _.DB_TBL_USERS
    );
    _databasesql = _databasesql.replaceAll(
      ":::::table_transactions:::::",
      _.DB_TBL_TRANSACTIONS
    );
    // Generate Custom Data Types
    _databasesql = _databasesql.replace(
      ":::::custom_type_users:::::",
      _typeGen(dbTables[_.DB_TBL_USERS].custom_types)
    );
    _databasesql = _databasesql.replace(
      ":::::custom_type_transactions:::::",
      _typeGen(dbTables[_.DB_TBL_TRANSACTIONS].custom_types)
    );
    // Generate Table and Columns
    _databasesql = _databasesql.replace(
      ":::::table_users_columns:::::",
      _tableGen(_.DB_TBL_USERS, dbTables[_.DB_TBL_USERS].columns)
    );
    _databasesql = _databasesql.replace(
      ":::::table_transactions_columns:::::",
      _tableGen(_.DB_TBL_TRANSACTIONS, dbTables[_.DB_TBL_TRANSACTIONS].columns)
    );
    return _databasesql;
  },

  /**
   * Generate DotEnv (.env) structure
   */
  generateDotEnv: () => {
    // Generate .env structure
    let dotEnv = [];
    envVars.forEach((_env, i) => {
      let _o = envVars[i > 1 ? i - 1 : i].split("_")[0];
      let _n = _env.split("_")[0];
      if (_o != _n) dotEnv.push("");
      dotEnv.push(`${_env}="${_[_env] ? _[_env] : ""}"`);
    });
    return dotEnv.join("\n");
  },
};
