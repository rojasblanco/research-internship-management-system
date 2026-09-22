# Sistema de Gestión de Pasantías de Investigación

[English version](README.md)

Sistema modular para organizar el **ingreso, formalización, seguimiento, reportes y cierre de pasantías de investigación y nuevos miembros** mediante Google Apps Script, Google Sheets, Google Drive y dos interfaces web separadas.

Esta es una **versión pública sanitizada de referencia**. No contiene personas reales, credenciales, identificadores privados de Google Workspace, URLs productivas, evidencias ni datos operativos de la organización original.

## El problema

El proyecto surgió en un entorno donde no existía una única ruta clara para incorporar y dar seguimiento a nuevas personas. En la práctica coexistían pasantías estándar, pasantías que podían preceder una posible transición laboral y miembros que ingresaban por una ruta administrativa directa. Cada caso podía involucrar distintos documentos, cursos, horarios, responsables y momentos de seguimiento.

La ruta fue **diseñada y perfeccionada progresivamente desde cero** a partir de esos vacíos. Lo que comenzó como automatizaciones para leer formularios y realizar cálculos evolucionó hacia un sistema que permite saber, para cada persona, qué etapa está completa, qué falta, qué horario está vigente, cuántas horas se han reconocido, qué actividades están respaldadas y qué reportes existen.

El objetivo no es reemplazar decisiones humanas, sino **hacer visible el proceso, reducir pérdida de información y conservar trazabilidad**.

## Qué resuelve

- seguimiento del proceso desde la postulación hasta el cierre;
- entrevista y decisión de ingreso;
- cursos de inducción y control de plazos;
- formalización, responsables y componentes;
- documentación y controles administrativos;
- horario provisional de postulación y versiones oficiales H1/H2/H3;
- registro de actividades, horas y evidencia mediante Activity Planner;
- asistencia y consistencia con el horario declarado;
- períodos de seguimiento de 30 días;
- cierre automático de períodos intermedios cuando los datos son coherentes;
- generación y registro automático de reportes periódicos;
- señalización de excepciones que requieren revisión;
- revisión humana del cierre final;
- progreso, extensiones, retiros y transición laboral cuando corresponda.

## Tres rutas de incorporación

El modelo distingue rutas que pueden compartir algunos controles sin perder su significado administrativo:

1. **Pasantía estándar.** Sigue el ciclo de postulación, aceptación, inducción, formalización, seguimiento y cierre.
2. **Pasantía con posible transición laboral.** Funciona como pasantía mientras la persona se encuentra en esa etapa y posteriormente registra una decisión de transición. La pasantía no implica ni garantiza contratación.
3. **Incorporación directa.** Permite integrar a una persona que ingresa por otra ruta administrativa sin inventar una historia de pasantía que no existió.

La fuente inicial tampoco está limitada a Google Forms. Puede ser cualquier formulario, portal, API o sistema capaz de producir registros estructurados que un adaptador incorpore al seguimiento de ingreso.

## Arquitectura general

```text
Fuente estructurada de postulación
            │
            ▼
Ingreso · entrevista · cursos · documentación
            │
            ▼
Modelo de gestión de pasantías
identidad · horarios · actividades · asistencia
períodos · progreso · reportes · transiciones
            │
      ┌─────┴─────┐
      ▼           ▼
Motor automático  API de gestión
      │           │
      ▼           ▼
consolidación     portal administrativo
+ reportes        autenticado
```

El portal administrativo está pensado para integrarse dentro de una **plataforma web propia de la organización**, con autenticación, autorización y permisos. La página de horarios es una superficie separada utilizada durante la postulación y puede desplegarse en cualquier entorno web compatible.

## Dos interfaces web

### Portal administrativo

Concentra la situación de cada persona y las acciones administrativas autorizadas. La interfaz administrativa incluye una sección de **Reportes** para consultar reportes periódicos, abrirlos, descargarlos cuando exista un artefacto disponible, identificar errores y solicitar una regeneración controlada.

Los operadores no deberían tener que abrir el editor de Apps Script ni ejecutar funciones manualmente como parte del flujo normal.

### Página de horarios

Estandariza la disponibilidad semanal durante la postulación, calcula las horas declaradas y genera un PDF después de que el backend acepta el envío. El horario de postulación es provisional; `H1` corresponde al primer horario oficial desde el inicio real, y las versiones posteriores deben preservar el historial.

## Seguimiento y reportes

Los períodos intermedios están concebidos como **seguimiento automatizado**. Al finalizar un período, el sistema valida las fuentes disponibles; si los datos son coherentes, consolida el período, congela los snapshots necesarios y genera su reporte automáticamente. Si existe una inconsistencia bloqueante, el caso se deriva a revisión mediante un estado visible en la interfaz.

La revisión humana se reserva principalmente para **excepciones y cierre final**, donde puede ser necesario validar la trayectoria completa antes de una evaluación final, constancia, carta o recomendación según la política de cada organización.

## Qué significa “Planner”

En este proyecto, **Planner** significa el registro operativo de tareas/actividades, horas y evidencia de una persona. No implica una dependencia de Microsoft Planner. La documentación pública también utiliza el término **Activity Planner** para evitar ambigüedad.

## Reglas de la implementación de referencia

Estas reglas afectan el comportamiento del sistema y se documentan para que puedan revisarse al reutilizarlo; **no son reglas universales**:

- 5 cursos de inducción;
- aprobación técnica de referencia: `score >= 70`;
- 14 días calendario desde el envío real de los cursos;
- períodos estándar de 30 días;
- cierre y reporte automáticos para períodos intermedios cuando pasan las validaciones;
- revisión humana para excepciones y cierre final;
- la entrega de cursos sigue siendo manual en la implementación de referencia, aunque el sistema registra la fecha real;
- un módulo completo de evaluación/informe final puede requerir adaptación a la política de cada organización.

## Modelo de datos de ejemplo

El repositorio incluye dos libros ficticios equivalentes:

- `data/internship_management_database_example_es.xlsx`
- `data/internship_management_database_example_en.xlsx`

La versión española refleja los nombres canónicos de la implementación de referencia; la inglesa es un espejo documental para facilitar la comprensión internacional. Ninguno contiene datos reales.

## Seguridad y publicación

El repositorio público mantiene separados código y entorno productivo. Las credenciales, claves privadas, IDs reales, datos personales, evidencias, URLs productivas y configuraciones privadas deben permanecer fuera del control de versiones.

Turnstile puede utilizarse en la página externa como protección antiabuso, pero **no sustituye autenticación**. Para entornos que necesiten restringir quién puede enviar información, la arquitectura admite una capa adicional de invitación, verificación o identidad.

## Relevancia profesional

El proyecto documenta el recorrido completo de:

**necesidad operativa → diseño de una ruta → modelo de datos → automatización → interfaces web → trazabilidad → mejora iterativa**.

Además del desarrollo técnico, refleja análisis de procesos, separación de responsabilidades, diseño de controles, manejo de excepciones, integración entre fuentes y preparación de una arquitectura reutilizable.

**El sistema fue diseñado y desarrollado por el autor del repositorio, con apoyo de herramientas de inteligencia artificial durante distintas partes del proceso de desarrollo.** Estas herramientas se utilizaron como asistencia para tareas como redacción y revisión de código, depuración, comparación de alternativas y documentación. Las decisiones sobre el problema, el flujo, la arquitectura, las reglas operativas, la validación y la publicación fueron tomadas por el autor.

La versión pública se distribuye bajo la **Licencia MIT**. En el repositorio publicado, el archivo `LICENSE` contiene el texto legal aplicable. La licencia cubre únicamente el material publicado aquí; no licencia datos privados, infraestructura, marcas, documentos internos ni otros activos no incluidos.

## Documentación

La documentación técnica detallada se encuentra en [`docs/`](docs/README.es.md). Incluye arquitectura, modelo de datos, integraciones, contrato de API, mantenimiento, seguridad, prueba de aceptación y contexto para futuras herramientas de IA/desarrollo.

---

**Stack:** JavaScript · Google Apps Script · Google Sheets · Google Drive · HTML/CSS/JavaScript · REST/adapters
