# ✅ Checklist de Respuesta a Builds Fallidos por Cobertura

1. **Identificar el tipo de alerta**
   - [ ] Revisar si la alerta es por **cobertura global** (<80%).
   - [ ] Revisar si la alerta es por **archivo/patch** (<70%).

2. **Analizar el reporte de Codecov**
   - [ ] Abrir el reporte desde el PR o build fallido.
   - [ ] Localizar los archivos marcados en rojo o amarillo.
   - [ ] Revisar las líneas no cubiertas (resaltadas en rojo).

3. **Plan de acción**
   - [ ] Escribir tests adicionales para cubrir las líneas críticas.
   - [ ] Priorizar lógica de negocio, validaciones y casos límite.
   - [ ] Confirmar que los mensajes de error sean claros y consistentes.

4. **Validación**
   - [ ] Ejecutar nuevamente los tests con Jest.
   - [ ] Verificar que la cobertura supere los umbrales definidos.
   - [ ] Confirmar que el pipeline de CI pase sin errores.

5. **Excepciones**
   - [ ] Si la caída es mínima y justificada (ej. código muerto eliminado), documentar la excepción en el PR.
   - [ ] Ajustar tolerancia en `codecov.yml` solo si es necesario.

---

> Este checklist debe usarse en cada PR que falle por cobertura, garantizando disciplina y calidad en el proceso de testing.
