# 🧪 Plan de Pruebas - Sección "Tu grupo"

## 1. Acceso protegido
- [ ] Intentar acceder a `/tu-grupo` sin iniciar sesión → debe redirigir a login.
- [ ] Acceder a `/tu-grupo` con sesión activa → debe mostrar la página correctamente.

## 2. Creación de grupo
- [ ] Completar formulario con datos válidos → debe crear grupo y mostrar confirmación.
- [ ] Intentar crear grupo con campos vacíos → debe mostrar mensajes de error.
- [ ] Validar respuesta del backend (`POST /groups`) → debe devolver ID del grupo.

## 3. Unirse a grupo
- [ ] Listar grupos disponibles → debe mostrar datos correctos.
- [ ] Seleccionar grupo y unirse → debe mostrar confirmación.
- [ ] Intentar unirse dos veces → debe mostrar error de duplicado.

## 4. Mi grupo (aportes y turnos)
- [ ] Visualizar panel con miembros, aportes y turnos → datos deben coincidir con backend.
- [ ] Registrar aporte (`POST /groups/:id/contribute`) → debe actualizar progreso.
- [ ] Validar que el turno de retiro se asigna correctamente.

## 5. Lógica de aportes y retiros
- [ ] Simular ciclo completo de aportes → cada miembro recibe su turno.
- [ ] Intentar retiro fuera de turno → debe mostrar error.
- [ ] Validar que el historial se actualiza tras cada retiro.

## 6. Transparencia y gamificación
- [ ] Historial de aportes visible → debe mostrar fechas y montos.
- [ ] Insignias otorgadas a miembros cumplidores → debe reflejarse en la UI.
- [ ] Estadísticas del grupo (progreso, cumplimiento) → deben calcularse correctamente.

## 7. Educación financiera
- [ ] Acceder a la sección → debe mostrar artículos/simuladores.
- [ ] Validar enlaces y recursos → deben abrirse correctamente.

## 8. Mensajes de error y éxito
- [ ] Crear grupo con datos inválidos → mensaje de error claro.
- [ ] Aporte exitoso → mensaje de confirmación.
- [ ] Retiro exitoso → mensaje de confirmación.

## 9. Pruebas de integración con usuarios simulados
- [ ] Simular 3 usuarios creando y uniéndose a un grupo.
- [ ] Validar aportes simultáneos → backend debe registrar correctamente.
- [ ] Confirmar que todos los usuarios ven el mismo estado del grupo.

---

✅ **Resultado esperado:** La sección "Tu grupo" funciona de forma completa, segura y transparente, con validaciones correctas y experiencia fluida para el usuario.
