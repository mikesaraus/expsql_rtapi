-- # COMMENT
-- ##
-- ### Run the following command >
-- ##
-- #
-- > sudo -u postgres psql postgres
-- > CREATE ROLE tppa_user WITH LOGIN PASSWORD 'password' CREATEDB;
-- > \q
-- > psql -U tppa_user -d postgres -W
-- > CREATE DATABASE tppa_db;
-- > \c tppa_db
-- > \i \path\to\database.sql
-- #
-- ##
-- ###
-- ##
-- #

CREATE TYPE select_paymethod AS ENUM ('Cash', 'Check', 'Debit');
CREATE TYPE select_channel_location AS ENUM ('OverTheCounter', 'Internet', 'ATM', 'Mobile', 'Phone');
CREATE TYPE select_check_type AS ENUM ('Local', 'Regional', 'On Us', 'Managers Check');
CREATE TYPE select_online_channel AS ENUM ('Gcash', 'Coins.ph', 'Paymaya', 'Debit');
CREATE TYPE select_online_confimed AS ENUM ('y', 'n', 'd');

------------------------------------------------------------------------------
-- Create Table for Users


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
     for each ROW EXECUTE FUNCTION notify_user_added()
    ;

CREATE TRIGGER trigger_users_deleted AFTER
DELETE
    ON
     for each ROW EXECUTE FUNCTION notify_user_deleted()
    ;

CREATE TRIGGER trigger_users_updated AFTER
UPDATE
    ON
     for each ROW EXECUTE FUNCTION notify_user_updated()
    ;
------------------------------------------------------------------------------

CREATE TYPE select_paymethod AS ENUM ('Cash', 'Check', 'Debit');
CREATE TYPE select_channel_location AS ENUM ('OverTheCounter', 'Internet', 'ATM', 'Mobile', 'Phone');
CREATE TYPE select_check_type AS ENUM ('Local', 'Regional', 'On Us', 'Managers Check');
CREATE TYPE select_online_channel AS ENUM ('Gcash', 'Coins.ph', 'Paymaya', 'Debit');
CREATE TYPE select_online_confimed AS ENUM ('y', 'n', 'd');

------------------------------------------------------------------------------
-- Create Table for Transactions


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
     for each ROW EXECUTE FUNCTION notify_transaction_added()
    ;

CREATE TRIGGER trigger_transaction_deleted AFTER
DELETE
    ON
     for each ROW EXECUTE FUNCTION notify_transaction_deleted()
    ;

CREATE TRIGGER trigger_transaction_updated AFTER
UPDATE
    ON
     for each ROW EXECUTE FUNCTION notify_transaction_updated()
    ;
------------------------------------------------------------------------------
