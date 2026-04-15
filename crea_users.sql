CREATE TYPE "enum_Users_rol" AS ENUM ('cliente', 'admin');

CREATE TABLE "Users" (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) DEFAULT '',
  email VARCHAR(255) NOT NULL UNIQUE,
  "emailVerificado" BOOLEAN DEFAULT FALSE,
  "emailVerificationToken" VARCHAR(255),
  "emailVerificationExpires" TIMESTAMP,
  password VARCHAR(255) NOT NULL,
  cedula VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(255) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  saldo NUMERIC(15,2) DEFAULT 0,
  "saldoChain" NUMERIC(15,2) DEFAULT 0,
  "saldoEnTransitoAlpaca" NUMERIC(15,2) DEFAULT 0,
  "stripeCustomerId" VARCHAR(255),
  "alpacaAccountId" VARCHAR(255) UNIQUE,
  "alpacaAccountStatus" VARCHAR(255) NOT NULL DEFAULT 'not_linked',
  "alpacaAchEnabledAt" TIMESTAMP,
  rol "enum_Users_rol" NOT NULL DEFAULT 'cliente',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
