# Express PostgreSQL Realtime API

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

#### Follow the commands inside .sql file

### Create New User

```bash
INSERT INTO users(userid, username, password, firstname, lastname, gender, uemail, position, branch_location) VALUES(10001, 'mike', 'cGFzc3dvcmQ=', 'Mike', 'Smith', 'male', 'mizkie98@gmail.com', 'Super Admin', 'Davao');
```

### Create Company

```bash
INSERT INTO company(name, name_short, name_abbr, website, email, phone, address_1, address_2, tin, color_primary, convenience_fee) VALUES('Trans Pilipinas Power & Automation Inc.', 'Trans Pilipinas', 'TPPA', 'https://tppainc.com', 'sales.support@tppainc.com', '(082) 233-4688', 'Building 1, Quimpo Compound', 'Jail Road Maa, Davao City', '0', '#22a6ee', 2);
```

### Run in Development Mode

```bash
npm run dev
```

### Run in Production Mode

```bash
npm start
```
