# Checklist Post-Release: Tu Grupo

✅ Verificación técnica
- [ ] Revisar que el pipeline haya finalizado exitosamente en GitHub Actions.
- [ ] Confirmar que el smoke test pasó sin errores.
- [ ] Verificar logs de backend y frontend en producción (errores, advertencias, caídas).
- [ ] Validar que la base de datos está accesible y sin errores recientes.

✅ Pruebas funcionales rápidas
- [ ] Acceder a la app como usuario final y navegar por las principales funciones de "Tu grupo".
- [ ] Realizar una operación clave (crear grupo, agregar miembro, etc.) y validar que se refleja correctamente.
- [ ] Probar login/logout y flujos críticos de usuario.

✅ Monitoreo y alertas
- [ ] Confirmar que los sistemas de monitoreo y alertas están activos.
- [ ] Revisar dashboards de métricas (CPU, RAM, errores HTTP, etc.).
- [ ] Establecer un periodo de observación (ej: 1 hora) para detectar incidentes tempranos.

✅ Comunicación
- [ ] Notificar al equipo interno que el despliegue fue exitoso.
- [ ] Preparar mensaje para usuarios finales (si aplica): novedades, cambios, posibles incidencias.
- [ ] Actualizar documentación interna y canales de soporte.

✅ Seguimiento
- [ ] Registrar cualquier incidencia detectada post-release.
- [ ] Programar retroalimentación con el equipo para mejoras en el próximo ciclo.

---

Este checklist ayuda a asegurar calidad, monitoreo y comunicación efectiva tras cada release de "Tu grupo".