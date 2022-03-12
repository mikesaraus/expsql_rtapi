# Express PostgreSQL Realtime API

### Requirements

- NodeJS ^v16.13.2
- NPM ^8.4.1
- PostgreSQL ^13.5

<hr><br/>

### Clone the Repository

```bash
git clone https://gitlab.com/mikesaraus/expsql_rtapi.git
```

### Install Node Modules

```bash
cd expsql_rtapi && npm install
```

### Run Setup To Generate `database.sql` and `.env`

```bash
npm run setup
```

<br>

### Modify `.env` configuration

### Follow the commands inside `database.sql`

<br>

#### PSQL Create New User

```bash
INSERT INTO users(userid, username, password, firstname, lastname, gender, uemail, position, branch_location) VALUES(10001, 'mike', 'cGFzc3dvcmQ=', 'Mike', 'Smith', 'male', 'mizkie98@gmail.com', 'Super Admin', 'Davao');
```

#### PSQL Create Company

```bash
INSERT INTO company(name, name_short, name_abbr, website, email, phone, address_1, address_2, tin, color_primary, convenience_fee) VALUES('Trans Pilipinas Power & Automation Inc.', 'Trans Pilipinas', 'TPPA', 'https://tppainc.com', 'sales.support@tppainc.com', '(082) 233-4688', 'Building 1, Quimpo Compound', 'Jail Road Maa, Davao City', '0', '#22a6ee', 2);
```

<br>

### Run in Development Mode

```bash
npm run dev
```

### Run in Production Mode

```bash
npm start
```

<br><hr><br>

### Essential Links

Download [NodeJS](https://nodejs.dev/download/)

Postgresql [PSQL](https://www.postgresql.org/download/)
