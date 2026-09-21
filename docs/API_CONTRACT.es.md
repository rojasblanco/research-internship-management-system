# Contrato de integración — Portal de gestión

## Objetivo

La interfaz administrativa debe poder integrarse dentro de una plataforma anfitriona autenticada sin depender de `google.script.run`. El navegador no debe contener credenciales ni acceso irrestricto a las hojas.

El sistema anfitrión puede proporcionar un adaptador JavaScript o un backend REST equivalente.

## Lectura

La respuesta principal debe incluir:

```json
{
  "pasantias": [],
  "resumen": {},
  "actualizado": "ISO-8601",
  "catalogos": {}
}
```

Cada persona puede exponer, según corresponda:

- identidad y ruta de ingreso;
- entrevista e ingreso;
- cursos;
- documentación;
- formalización;
- horario de postulación y horario oficial;
- períodos y excepciones;
- progreso;
- informes.

## Informes

La API debe exponer el estado autoritativo registrado en `Registro_Informes`, incluyendo cuando exista:

- identificador estable del informe;
- período;
- tipo (`PERIODICO`, `FINAL` u otro valor canónico);
- estado;
- versión;
- fecha/hora de generación;
- enlace de artefacto;
- mensaje de error o motivo de revisión.

## Acciones administrativas

Las acciones exactas pueden evolucionar, pero el contrato objetivo contempla al menos:

- registrar entrevista;
- registrar fecha real de envío de cursos;
- guardar formalización;
- actualizar controles documentales;
- guardar carpeta personal;
- registrar extensión/retiro/transición;
- registrar controles de cierre;
- regenerar un informe autorizado;
- ejecutar/confirmar revisión final cuando corresponda.

Los períodos intermedios y sus reportes normales deben resolverse por automatización; no se espera que el operador pulse un botón para cada cierre rutinario.


### Contratos usados por la interfaz incluida

La interfaz pública de referencia usa estos nombres de acción para las funciones nuevas de períodos e informes:

- `cerrar_periodo_revisado`: cierra únicamente un período que requiere revisión final o por excepción, después de recalcular el diagnóstico en servidor;
- `regenerar_informe_periodo`: genera una nueva versión del informe del período sin eliminar la versión anterior.

Los objetos de período pueden incluir `requiereRevision`, `tipoRevision` y un bloque `revision` con snapshots, alertas, bloqueos y horas finales propuestas. Los objetos de informe pueden incluir `tipoPeriodo`, `periodo`, `version`, `urlGoogleDoc`, `urlPdf`, `fechaGeneracion` y `observacion`.

## Escrituras seguras

Toda acción debe:

1. autenticar al operador mediante la plataforma anfitriona;
2. autorizar la acción;
3. identificar el registro mediante correo/ID estable, nunca solo por nombre;
4. validar payload con lista blanca;
5. usar bloqueo/transacción apropiada;
6. escribir únicamente el registro esperado;
7. registrar contexto/auditoría cuando corresponda;
8. releer la fuente autoritativa;
9. devolver confirmación verificada.

Ejemplo:

```json
{
  "ok": true,
  "verificado": true,
  "message": "Guardado y verificado"
}
```

## Regeneración de informes

La regeneración debe ser una acción controlada, no una ejecución manual desde Apps Script. Debe conservar versión/trazabilidad y actualizar `Registro_Informes` antes de devolver el estado verificado.

## Catálogos

Los catálogos de componentes, responsables, documentos y otros valores ampliables deben provenir de configuración autoritativa. Un error ortográfico de un valor existente no debe crear automáticamente una nueva categoría.

## Seguridad

No enviar al navegador Secret Keys, credenciales de Google, tablas privadas de acceso ni identificadores que no sean necesarios para la función autorizada.
