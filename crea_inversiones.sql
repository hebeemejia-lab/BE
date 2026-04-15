CREATE TYPE "enum_inversiones_estado" AS ENUM ('abierta', 'cerrada');
CREATE TYPE "enum_inversiones_tipo" AS ENUM ('compra', 'venta');

CREATE TABLE inversiones (
  id SERIAL PRIMARY KEY,
  "usuarioId" INTEGER NOT NULL REFERENCES "Users"(id),
  symbol VARCHAR(10) NOT NULL,
  cantidad NUMERIC(24,8) NOT NULL,
  "precioCompra" NUMERIC(10,2) NOT NULL,
  "costoTotal" NUMERIC(10,2) NOT NULL,
  "precioVenta" NUMERIC(10,2),
  "ingresoTotal" NUMERIC(10,2),
  ganancia NUMERIC(10,2),
  estado "enum_inversiones_estado" NOT NULL DEFAULT 'abierta',
  tipo "enum_inversiones_tipo" NOT NULL DEFAULT 'compra',
  "fechaCompra" TIMESTAMP NOT NULL DEFAULT NOW(),
  "fechaVenta" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ON inversiones("usuarioId");
CREATE INDEX ON inversiones(symbol);
CREATE INDEX ON inversiones(estado);
