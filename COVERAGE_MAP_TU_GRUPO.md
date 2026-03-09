# 🗺️ Mapa de Cobertura - "Tu grupo"

| Módulo / Archivo                              | Cobertura (%) | Recomendaciones de acción                                  |
|-----------------------------------------------|---------------|------------------------------------------------------------|
| backend/src/controllers/circulosController.js | 82%           | Reforzar tests de validación y errores de negocio.         |
| backend/src/models/CirculoAhorro.js           | 95%           | Cubrir casos límite de atributos y relaciones.             |
| backend/src/models/CirculoMiembro.js          | 93%           | Añadir tests de integridad y pertenencia a grupo.          |
| backend/src/routes/circulosRoutes.js          | 88%           | Probar rutas con y sin autenticación, IDs inválidos.       |
| backend/src/controllers/aporteController.js   | 76%           | Agregar tests de montos negativos y saldo insuficiente.    |
| backend/src/controllers/retiroController.js   | 70%           | Cubrir retiros fuera de turno y errores de lógica.         |
| backend/src/middleware/auth.js                | 90%           | Validar expiración y manipulación de tokens.               |
| backend/src/utils/validaciones.js             | 60%           | Añadir tests para inputs vacíos y formatos incorrectos.    |

**Leyenda:**
- Cobertura ideal: ≥90%
- Prioridad alta: módulos <80% o con lógica crítica

## Acciones sugeridas
- Priorizar tests en controladores con menor cobertura (aportes, retiros).
- Reforzar validaciones y mensajes de error en rutas y middleware.
- Cubrir casos límite: montos extremos, usuarios no autorizados, grupos inexistentes.
- Revisar el reporte de Codecov tras cada PR y actualizar este mapa periódicamente.

---

> Actualiza los porcentajes según el último reporte de Codecov para mantener el tablero al día.
