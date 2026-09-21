# Lista de comprobación posterior a la implementación

Esta lista debe ejecutarse cuando la interfaz administrativa esté integrada en la plataforma real. El objetivo es comprobar el flujo completo sin depender del editor de Apps Script.

## 1. Acceso y seguridad

- [ ] La página administrativa solo es accesible para personal autorizado mediante el mecanismo de autenticación de la plataforma anfitriona.
- [ ] Un usuario sin autorización no puede consultar fichas, informes ni ejecutar acciones administrativas.
- [ ] La interfaz no expone credenciales, Secret Keys, IDs privados ni datos técnicos que no necesite el navegador.
- [ ] Si la página externa de horarios sigue siendo pública, Turnstile funciona como protección antiabuso y no se trata como sustituto de autenticación.

## 2. Carga de datos

- [ ] Al abrir la página se muestran datos reales desde la API/adaptador y no datos ficticios.
- [ ] El botón **Actualizar datos** vuelve a leer el backend sin duplicar registros.
- [ ] Una persona en `Seguimiento_Ingreso` que todavía no fue aceptada puede verse en la etapa correspondiente sin crear prematuramente una fila operativa en `Variables_Internas`.
- [ ] Las rutas estándar, transición laboral e incorporación directa permanecen diferenciadas.

## 3. Entrevista, cursos y formalización

- [ ] Registrar una entrevista desde la web actualiza la fila correcta y la página relee el dato guardado.
- [ ] Registrar la fecha real de envío de cursos calcula correctamente el plazo de 14 días calendario.
- [ ] El avance de cursos refleja 0/5…5/5 y considera aprobada una nota `>= 70`.
- [ ] Las notas calculadas no pueden editarse como texto libre desde la interfaz.
- [ ] La formalización permite registrar responsable, componentes, fechas y horas objetivo sin inferir estas últimas desde el horario semanal.
- [ ] El checklist documental guarda estados en `Documentacion_Pasantia` y vuelve a mostrarlos correctamente al recargar.

## 4. Carpeta personal, Planner y horarios

- [ ] El enlace de la carpeta personal abre el recurso correcto.
- [ ] El sistema localiza el Activity Planner dentro de la carpeta prevista.
- [ ] H1 aparece como primer horario oficial una vez iniciada la pasantía.
- [ ] Si posteriormente se implementa cambio de horario, H2/H3 crean nuevas versiones y nunca sobrescriben H1.

## 5. Períodos automáticos

- [ ] Un período intermedio vencido, con datos válidos y sin bloqueos, pasa de `PENDIENTE CIERRE` a `CERRADO` automáticamente mediante el motor horario.
- [ ] Al cerrarse, se congelan correctamente los snapshots de Planner, evidencia, asistencia, clasificación por horario y horas finales.
- [ ] El operador no necesita abrir Apps Script ni ejecutar `cerrarPeriodosPendientesV1()` para el seguimiento ordinario.
- [ ] Un período intermedio con datos bloqueantes permanece pendiente y aparece en la web como **Revisión requerida**.
- [ ] El último período formal BASE/EXTENSIÓN aparece como **Revisión final pendiente** y no se cierra automáticamente.
- [ ] Si existe una extensión formal, el último período de extensión pasa a ser el cierre final y el último BASE deja de tratarse como final.
- [ ] `EXTRA_HISTORICO`, si existe, no se utiliza para decidir cuál es el último período formal.

## 6. Cierre final desde la web

- [ ] Al seleccionar **Revisar / cerrar** se muestran período, fechas, horas Planner, evidencia, asistencia, dentro/fuera de horario, horas adicionales y horas finales propuestas.
- [ ] Si persiste un bloqueo duro, el backend rechaza el cierre y no consolida parcialmente el período.
- [ ] Si el período es cerrable, la acción web congela los snapshots y actualiza su estado sin ejecutar funciones manuales.
- [ ] Al terminar, la interfaz relee el backend y muestra el estado nuevo.

## 7. Informes periódicos

- [ ] Un período cerrado elegible crea/actualiza su fila en `Registro_Informes`.
- [ ] El motor genera automáticamente los informes pendientes por lotes sin intervención manual.
- [ ] La web muestra estado, período, versión y fecha del informe.
- [ ] **Abrir** lleva al Google Doc correcto.
- [ ] **Descargar PDF** entrega la representación PDF del informe correcto.
- [ ] **Generar nueva versión** crea una versión nueva y conserva la versión anterior en Drive.
- [ ] Después de regenerar, la página vuelve a leer los datos y muestra la versión vigente.
- [ ] Un informe bloqueado por datos insuficientes no se genera silenciosamente; su estado permite identificar el problema.

## 8. Motor y triggers

- [ ] Existen exactamente los tres triggers productivos previstos: formulario, `onEdit` de cursos y motor horario.
- [ ] No se crea un trigger adicional solo para informes.
- [ ] Una ejecución normal del motor completa cursos, asistencia, Planner, períodos, cierre intermedio, ajustes, progreso, registro de informes y generación de informes sin errores.
- [ ] El procesamiento por lotes de informes no crea documentos duplicados para la misma versión.

## 9. Cierre administrativo y excepciones

- [ ] Extensión, retiro y transición laboral se registran desde la interfaz y quedan trazables.
- [ ] Los ajustes posteriores a un período cerrado no alteran los snapshots originales; quedan registrados mediante el mecanismo de ajustes.
- [ ] La información que puede influir en una evaluación/carta final se revisa humanamente antes de emitir el documento institucional correspondiente.
- [ ] El futuro módulo de informe/evaluación final no debe considerarse implementado hasta ser diseñado y validado por separado.

## 10. Prueba de aceptación final

- [ ] Crear o usar una persona ficticia de prueba y recorrer: postulación → entrevista → cursos → formalización → carpeta/Planner → H1 → período intermedio → informe → cierre final.
- [ ] Verificar después de cada acción que la web, las hojas canónicas y los documentos de Drive coinciden.
- [ ] Registrar cualquier desviación encontrada antes de considerar la implementación estable.

> Esta lista es deliberadamente más estricta que la prueba estática del repositorio. La parte de autenticación, acciones de navegador, permisos de Drive y descargas solo puede validarse en el entorno donde la interfaz quede realmente integrada.
