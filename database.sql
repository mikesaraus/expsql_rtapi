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

CREATE TYPE select_gender AS ENUM ('f', 'm', 'o');
CREATE TYPE select_status AS ENUM ('a', 'i', 'd', 't');
CREATE TYPE select_isactive AS ENUM ('a', 'i', 'h');

------------------------------------------------------------------------------
-- Create Table for Users
CREATE TABLE IF NOT EXISTS tppa_users(
	id SERIAL NOT NULL PRIMARY KEY,
	userid INT NOT NULL,
	username VARCHAR(30) NOT NULL,
	password VARCHAR(128) NOT NULL,
	firstname VARCHAR(30) NOT NULL,
	middlename VARCHAR(30),
	lastname VARCHAR(30) NOT NULL,
	gender select_gender NOT NULL,
	uemail VARCHAR(128),
	uaddress VARCHAR(128),
	position VARCHAR(30) NOT NULL,
	branch_location VARCHAR(30) NOT NULL,
	status select_status NOT NULL DEFAULT 'a',
	date_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_login TIMESTAMP,
	active_now select_isactive NOT NULL DEFAULT 'i',
		CONSTRAINT unique_user UNIQUE (username, uemail)
);

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
    tppa_users for each ROW EXECUTE FUNCTION notify_user_added()
    ;

CREATE TRIGGER trigger_users_deleted AFTER
DELETE
    ON
    tppa_users for each ROW EXECUTE FUNCTION notify_user_deleted()
    ;

CREATE TRIGGER trigger_users_updated AFTER
UPDATE
    ON
    tppa_users for each ROW EXECUTE FUNCTION notify_user_updated()
    ;
------------------------------------------------------------------------------

CREATE TYPE select_paymethod AS ENUM ('Cash', 'Check', 'Debit');
CREATE TYPE select_channel_location AS ENUM ('OverTheCounter', 'Internet', 'ATM', 'Mobile', 'Phone');
CREATE TYPE select_check_type AS ENUM ('Local', 'Regional', 'On Us', 'Managers Check');
CREATE TYPE select_online_channel AS ENUM ('Gcash', 'Coins.ph', 'Paymaya', 'Debit');
CREATE TYPE select_online_confimed AS ENUM ('y', 'n', 'd');

------------------------------------------------------------------------------
-- Create Table for Transactions
CREATE TABLE IF NOT EXISTS tppa_transactions(
	id SERIAL NOT NULL PRIMARY KEY,
	trans_id VARCHAR(20) NOT NULL,
	trans_or VARCHAR(20) NOT NULL,
	trans_ar VARCHAR(20) NOT NULL,
	account_id VARCHAR(30) NOT NULL,
	receiver_id VARCHAR(30) NOT NULL,
	branch_location VARCHAR(30) NOT NULL,
	paymethod select_paymethod NOT NULL DEFAULT 'Cash',
	channel select_channel_location NOT NULL DEFAULT 'OverTheCounter',
	channel_online select_online_channel,
	channel_online_confirmed select_online_confimed,
	date_payed TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	date_due TIMESTAMP,
	amount_payed NUMERIC(15,4) NOT NULL,
	amount_received NUMERIC(15,4) NOT NULL,
	trans_fee NUMERIC(15,4),
	check_bus_style VARCHAR(30),
	check_no VARCHAR(50),
	check_date TIMESTAMP,
	check_bank VARCHAR(50),
	check_type select_check_type,
	business_style VARCHAR(30),
	deleted TIMESTAMP,
	updated_by VARCHAR(30),
		CONSTRAINT unique_transaction UNIQUE (trans_id, trans_or, trans_ar)
);

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
    tppa_transactions for each ROW EXECUTE FUNCTION notify_transaction_added()
    ;

CREATE TRIGGER trigger_transaction_deleted AFTER
DELETE
    ON
    tppa_transactions for each ROW EXECUTE FUNCTION notify_transaction_deleted()
    ;

CREATE TRIGGER trigger_transaction_updated AFTER
UPDATE
    ON
    tppa_transactions for each ROW EXECUTE FUNCTION notify_transaction_updated()
    ;
------------------------------------------------------------------------------
