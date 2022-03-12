// Base64 Encode
const base64_encode = (text) => {
  try {
    return Buffer.from(text, 'utf-8').toString('base64')
  } catch (e) {
    console.error('Base64 Encode: ', JSON.stringify(e))
    return
  }
}

// Base64 Decode
const base64_decode = (base64) => {
  try {
    return Buffer.from(base64, 'base64').toString('utf-8')
  } catch (e) {
    return
  }
}

module.exports = {
  /**
   * Encode or Decode base64
   */
  base64: {
    /**
     * Encode utf-8 string to `base64` string
     *
     * @param {string} text     string to convert to base64
     */
    encode: base64_encode,
    /**
     * Decode base64 string to utf-8 `string`
     *
     * @param {string} base64   base64 string to convert to text
     */
    decode: base64_decode,
  },

  /**
   * Store passwords on database securely
   *
   * Options default `encoded` is `true`
   * `passwordText` should be in base64 encoded string
   *
   * @param {string} passwordText                             Password in Plain Text
   * @param {{encoded?: boolean, saltdeg?: number}?} options  Encryption Config
   */
  encryptPassword: (passwordText, options = { encoded: true }) => {
    try {
      const { genSaltSync, hashSync } = require('bcrypt')
      if (options && options.encoded) passwordText = base64_decode(passwordText)
      if (passwordText)
        return hashSync(
          passwordText,
          genSaltSync(parseInt(options && options.saltdeg ? options.saltdeg : process.env.TOKEN_SALT_DEG || 10))
        )
      return
    } catch (e) {
      console.error('Password Encryption Error:', JSON.stringify({ passwordText, options }), JSON.stringify(e))
      return
    }
  },

  /**
   * Generate unique transaction id
   *
   * @param {Boolean} long_version    use long version
   */
  generateTransactionID: (long_version) => {
    const today = new Date()
    return long_version === true
      ? [
          String(today.getFullYear()).substring(2) + String(today.getDOY()).padStart(3, 0),
          [
            String(branch_id || 0).padStart(3, 0),
            today.getSeconds(),
            String(today.getMilliseconds()).padStart(3, parseInt(String(Math.random()).replaceAll('.', ''))),
          ]
            .join('')
            .padStart(8, 0),
          String(today.getSecSinceMidnight()).padStart(5, 0),
        ].join('-')
      : [
          `RPAD(concat(`,
          String(today.getFullYear()).substring(2),
          String(today.getDOY()).padStart(3, 0),
          String(today.getMilliseconds()).substring(2, 0),
          `::varchar,`,
          `LPAD((select count(id) from ${process.env.DBTBL_TRANSACTIONS} where date_paid > '${[
            today.getDate(),
            today.getMonth() + 1,
            today.getFullYear(),
          ].join('-')}')::varchar, 3, '0')`,
          `)::varchar, 10, '0')`,
        ].join('')
  },

  /**
   * Generate database structure
   */
  generateDatabaseSQL: () => {
    const { availableTables } = require('./fn.db')
    const { dbTables } = require('../data/db.structures')
    let _tableGen = (_tbl, _columns) => {
      let tmp = []
      if (_tbl && _columns) {
        _columns.forEach((o) => {
          tmp.push(
            `\t${o.name} ` +
              (o.category == 'custom' ? o.type : String(o.type).toUpperCase()) +
              (o.notnull ? ` NOT NULL` : ``) +
              (o.unique ? ` UNIQUE` : ``) +
              (o.primarykey ? ` PRIMARY KEY` : ``) +
              (o.default
                ? ` DEFAULT ${
                    o.category == 'string' || o.category == 'custom' ? `'` + o.default + `'` : o.default.toUpperCase()
                  }`
                : ``)
          )
        })
        let _constraint = _constraintGen(dbTables()[_tbl].constraint) || ''
        return `CREATE TABLE IF NOT EXISTS ${_tbl}(\n${tmp.join(`,\n`)}${
          _constraint.length ? `,\n ${_constraint}` : ``
        }\n);`
      } else {
        return ''
      }
    }
    let _typeGen = (_ctype) => {
      let tmp = []
      if (_ctype)
        _ctype.forEach((o) => {
          tmp.push(`CREATE TYPE ${o.name} AS ${o.type.toUpperCase()} ('${o.values.join("', '")}');`)
        })
      return tmp.join(`\n`)
    }
    let _constraintGen = (_constraint) => {
      let tmp = []
      if (_constraint)
        _constraint.forEach((o) => {
          tmp.push(`\t\tCONSTRAINT ${o.name} ${o.type.toUpperCase()} (${o.columns.join(', ')})`)
        })
      return tmp.join(`,\n`)
    }

    let _sql = `-- # PosgreSQL Database
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
`
    availableTables().forEach((_tbl) => {
      const _cols = []
      dbTables()[_tbl].columns.forEach((col) => {
        if (col.name) _cols.push(col.name)
      })
      _sql += `
------------------------------------------------------------------------------
`
      _sql += `
${_typeGen(dbTables()[_tbl].custom_types)}

-- Create Table for ${_tbl}
`
      _sql += `
${_tableGen(_tbl, dbTables()[_tbl].columns)}
`

      _sql += `
-- FUNCTIONS
CREATE OR REPLACE FUNCTION notify_${_tbl}_added()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
	BEGIN
	  PERFORM pg_notify(CAST('added_${_tbl}' as text), 
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
CREATE OR REPLACE FUNCTION notify_${_tbl}_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
	BEGIN
	  PERFORM pg_notify(CAST('deleted_${_tbl}' as text), 
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
CREATE OR REPLACE FUNCTION notify_${_tbl}_updated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
	BEGIN
	  	PERFORM pg_notify(CAST('updated_${_tbl}' as text), 
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
CREATE TRIGGER trigger_${_tbl}_added AFTER
INSERT
    ON
    ${_tbl} for each ROW EXECUTE FUNCTION notify_${_tbl}_added()
    ;

CREATE TRIGGER trigger_${_tbl}_deleted AFTER
DELETE
    ON
    ${_tbl} for each ROW EXECUTE FUNCTION notify_${_tbl}_deleted()
    ;

CREATE TRIGGER trigger_${_tbl}_updated AFTER
UPDATE
    ON
    ${_tbl} for each ROW EXECUTE FUNCTION notify_${_tbl}_updated()
    ;
`
      _sql += `
------------------------------------------------------------------------------
`
      _sql += `
-- INSERT INTO ${_tbl}(${_cols.join(', ')}) VALUES(<<${_cols.join('>>, <<')}>>);
`
      _sql += `
------------------------------------------------------------------------------
`
    })
    return _sql
  },

  /**
   * Generate DotEnv (.env) structure
   */
  generateDotEnv: () => {
    const { envVars } = require('../data/db.structures')
    // Generate .env structure
    let dotEnv = []
    envVars.forEach((_env, i) => {
      let _o = envVars[i > 1 ? i - 1 : i].split('_')[0]
      let _n = _env.split('_')[0]
      if (_o != _n) dotEnv.push('')
      dotEnv.push(`${_env}="${process.env[_env] ? process.env[_env] : ''}"`)
    })
    return dotEnv.join('\n')
  },
}
