# Express PostgreSQL Realtime API

### Requirements

- NodeJS ^v16.13.2
- NPM ^8.4.1
- PostgreSQL ^13.5

<br/>

### Essential Links

https://www.postgresql.org/download/

https://nodejs.dev/download/

<br/><hr><br/>

### Clone the Repository

```bash
git clone https://gitlab.com/mikesaraus/expsql_rtapi.git
```

### Install Node Modules

```bash
cd expsql_rtapi && npm install
```

### Run Setup To Generate Database Structure (database.sql) and DotEnv Configuration (.env)

```bash
npm run setup
```

#### Modify .env configuration

Sample `.env`

```bash
SRV_MAIN_PORT="7001"
SRV_ACCESS_LIST="https://localhost:8080,https://127.0.0.1:8080"

DB_NAME="payment_db"
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="test_user"
DB_PWD="cGFzc3dvcmQ="

DBTBL_USERS="users"
DBTBL_TRANSACTIONS="transactions"
DBTBL_COMPANY="company"

MAIL_NAME="Trans Pilipinas"
MAIL_HOST="mail.tppainc.com"
MAIL_PORT="465"
MAIL_AUTH_USER="payments@tppainc.com"
MAIL_AUTH_PWD="JFRyYW5zLlBoJA=="

TOKEN_KEY="s0m3Pr1v8t0ken"
TOKEN_KEY_PUB="pUbl1cT0k3n"
TOKEN_SALT_DEG="10"
TOKEN_LOGIN_EXPIRE="12h"

TXT_USERNAME_BLOCK_LIST="something"

SSL_KEY="/home/certs/server-key.pem"
SSL_CERT="/home/certs/server.pem"
```

#### Follow the commands inside .sql file

<br/>
### PSQL Create New User

```bash
INSERT INTO users(userid, username, password, firstname, lastname, gender, uemail, position, branch_location) VALUES(10001, 'mike', 'cGFzc3dvcmQ=', 'Mike', 'Smith', 'male', 'mizkie98@gmail.com', 'Super Admin', 'Davao');
```

### PSQL Create Company

```bash
INSERT INTO company(name, name_short, name_abbr, website, email, phone, address_1, address_2, tin, color_primary, convenience_fee) VALUES('Trans Pilipinas Power & Automation Inc.', 'Trans Pilipinas', 'TPPA', 'https://tppainc.com', 'sales.support@tppainc.com', '(082) 233-4688', 'Building 1, Quimpo Compound', 'Jail Road Maa, Davao City', '0', '#22a6ee', 2);
```

<br/><hr><br/>

### Run in Development Mode

```bash
npm run dev
```

### Run in Production Mode

```bash
npm start
```
