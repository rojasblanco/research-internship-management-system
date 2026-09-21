# Data model

The public example contains 21 model sheets plus one visual separator. Private access-control structures and provider-specific response mirrors are intentionally excluded from the public workbook.

## Operational sheets

| Sheet | Responsibility |
|---|---|
| `Seguimiento_Ingreso` | application/onboarding state before and during acceptance/induction |
| `Variables_Internas` | stable operational attributes after acceptance/formalization |
| `Documentacion_Pasantia` | one row per person/document control |
| `Control_Cursos` | derived course completion/status |
| `Horarios_Postulacion` | provisional schedule submitted during application |
| `Control_horarios` | official schedule versions H1/H2/H3 |
| `Registro_Planner` | normalized activity/task records |
| `Asistencia_Procesada` | normalized attendance |
| `Control_Periodos` | monitoring periods, snapshots, closure/exception state |
| `Progreso_Pasantias` | derived overall progress |
| `Registro_Informes` | periodic/final report registry and artifact metadata |
| `Diccionario_Datos` | data dictionary/documentation |

## Technical/configuration sheets

| Sheet | Responsibility |
|---|---|
| `Catalogo_Documentos_Pasantia` | configurable document/control catalog |
| `Config_Encargados_Componentes` | authoritative component/owner configuration |
| `Log_Notificaciones_Postulaciones` | intake notification log |
| `Log_Ingreso` | onboarding processing log |
| `Datos_Cursos` | technical mirror/import of training results |
| `Catalogo_Cursos` | required training catalog |
| `Ajustes_Horas` | traceable post-snapshot hour adjustments |
| `Configuracion` | configurable operational settings |
| `Historial_Roles` | role transitions without erasing prior trajectory |

## Period/report relationship

For intermediate periods, `Control_Periodos` stores the period boundaries and frozen snapshots after successful automatic consolidation. `Registro_Informes` stores report status, versioning, timestamps, and artifact references.

A blocking inconsistency should be represented explicitly instead of forcing a false closure. Final closure may use a distinct review state because it requires authorized human validation.

## Public examples

- `data/internship_management_database_example_es.xlsx`
- `data/internship_management_database_example_en.xlsx`

The English workbook is a documentation mirror. Renaming a real deployment's canonical sheets/headers requires a coordinated code migration.
