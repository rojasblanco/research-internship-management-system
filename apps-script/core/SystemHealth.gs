/**
 * ============================================================
 * SYSTEM HEALTH CHECKS — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * Read-only health check for the current public model.
 *
 * Validates:
 * - the 21 model sheets represented in data/internship_management_database_example_es.xlsx;
 * - expected column counts for those sheets;
 * - CERRAR_PERIODOS_AUTOMATICAMENTE = NO (legacy safety flag; intermediate-period automation is handled by the motor policy);
 * - the critical runtime functions for automatic intermediate closure and reporting;
 * - exactly three productive triggers;
 * - absence of known obsolete trigger handlers.
 *
 * Optional/private deployment sheets are reported when present but are
 * not required by the public reference model.
 *
 * The function name diagnosticarSaludSistemaV2() is retained because it
 * is part of the current runtime contract.
 * ============================================================
 */

const SSV30_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const SSV30_HOJAS_CRITICAS = [
  'Variables_Internas',
  'Seguimiento_Ingreso',
  'Catalogo_Documentos_Pasantia',
  'Documentacion_Pasantia',
  'Config_Encargados_Componentes',
  'Log_Notificaciones_Postulaciones',
  'Log_Ingreso',
  'Datos_Cursos',
  'Catalogo_Cursos',
  'Control_Cursos',
  'Horarios_Postulacion',
  'Control_horarios',
  'Registro_Planner',
  'Asistencia_Procesada',
  'Control_Periodos',
  'Ajustes_Horas',
  'Configuracion',
  'Historial_Roles',
  'Diccionario_Datos',
  'Registro_Informes',
  'Progreso_Pasantias'
];

const SSV30_HOJAS_OPCIONALES = [
  'Accesos_Internos',
  'Excepciones_Regimen',
  'Respuestas de formulario 1'
];

const SSV30_ESTRUCTURAS = {
  Variables_Internas: 52,
  Seguimiento_Ingreso: 25,
  Catalogo_Documentos_Pasantia: 6,
  Documentacion_Pasantia: 13,
  Config_Encargados_Componentes: 6,
  Log_Notificaciones_Postulaciones: 10,
  Log_Ingreso: 11,
  Datos_Cursos: 8,
  Catalogo_Cursos: 4,
  Control_Cursos: 10,
  Horarios_Postulacion: 41,
  Control_horarios: 30,
  Registro_Planner: 33,
  Asistencia_Procesada: 15,
  Control_Periodos: 16,
  Ajustes_Horas: 10,
  Configuracion: 2,
  Historial_Roles: 9,
  Diccionario_Datos: 9,
  Registro_Informes: 20,
  Progreso_Pasantias: 16
};

const SSV30_TRIGGER_PRODUCTIVOS = [
  'procesarPostulacionEstandarTrigger',
  'manejarEdicionIngresoCursos',
  'motorAutomaticoPasantiasV2'
];

const SSV30_TRIGGER_PROHIBIDOS = [
  'motorAutomaticoPasantiasV1',
  'sincronizarCursosTodos',
  'sincronizarAsistenciaProcesadaTriggerV1',
  'instalarTriggerNotificacionesPostulacionV1',
  'notificarNuevaPostulacionTriggerV1'
];

function diagnosticarSaludSistemaV2() {
  const ss =
    SpreadsheetApp.openById(
      SSV30_DB_ID
    );

  const nombresActuales =
    ss.getSheets().map(
      function(hoja) {
        return hoja.getName();
      }
    );

  const hojas = {};

  SSV30_HOJAS_CRITICAS.forEach(
    function(nombre) {
      const hoja =
        ss.getSheetByName(nombre);

      hojas[nombre] = hoja
        ? {
            existe: true,
            filas: hoja.getLastRow(),
            filasDatos: Math.max(hoja.getLastRow() - 1, 0),
            columnas: hoja.getLastColumn(),
            oculta: hoja.isSheetHidden()
          }
        : {
            existe: false
          };
    }
  );

  const hojasFaltantes =
    SSV30_HOJAS_CRITICAS.filter(
      function(nombre) {
        return !hojas[nombre].existe;
      }
    );

  const opcionales = {};

  SSV30_HOJAS_OPCIONALES.forEach(
    function(nombre) {
      const hoja =
        ss.getSheetByName(nombre);

      opcionales[nombre] = hoja
        ? {
            existe: true,
            filas: hoja.getLastRow(),
            columnas: hoja.getLastColumn(),
            oculta: hoja.isSheetHidden()
          }
        : {
            existe: false
          };
    }
  );

  const conocidas =
    SSV30_HOJAS_CRITICAS.concat(
      SSV30_HOJAS_OPCIONALES
    );

  const hojasNoReconocidas =
    nombresActuales.filter(
      function(nombre) {
        return conocidas.indexOf(nombre) < 0;
      }
    );

  const estructuras = {};

  Object.keys(SSV30_ESTRUCTURAS).forEach(
    function(nombre) {
      const hoja =
        ss.getSheetByName(nombre);

      const esperadas =
        SSV30_ESTRUCTURAS[nombre];

      estructuras[nombre] = {
        existe: Boolean(hoja),
        columnasActuales: hoja ? hoja.getLastColumn() : null,
        columnasEsperadas: esperadas,
        ok: Boolean(
          hoja &&
          hoja.getLastColumn() === esperadas
        )
      };
    }
  );

  const estructurasIncorrectas =
    Object.keys(estructuras).filter(
      function(nombre) {
        return !estructuras[nombre].ok;
      }
    );

  const configuracion =
    ss.getSheetByName('Configuracion');

  const cierreAuto =
    SSV30_leerConfiguracion_(
      configuracion,
      'CERRAR_PERIODOS_AUTOMATICAMENTE'
    );

  const configuracionCierreOk =
    String(cierreAuto || '')
      .trim()
      .toUpperCase() === 'NO';

  const funciones = {
    sincronizarCursosTodos:
      typeof sincronizarCursosTodos === 'function',
    sincronizarAsistenciaProcesadaV1:
      typeof sincronizarAsistenciaProcesadaV1 === 'function',
    sincronizarPlanners:
      typeof sincronizarPlanners === 'function',
    sincronizarConsolidacionBaseV11:
      typeof sincronizarConsolidacionBaseV11 === 'function',
    sincronizarEstructuraControlPeriodosV2:
      typeof sincronizarEstructuraControlPeriodosV2 === 'function',
    cerrarPeriodosIntermediosAutomaticamenteV2:
      typeof cerrarPeriodosIntermediosAutomaticamenteV2 === 'function',
    sincronizarAjustesHorasV1:
      typeof sincronizarAjustesHorasV1 === 'function',
    sincronizarProgresoPasantiasV1:
      typeof sincronizarProgresoPasantiasV1 === 'function',
    sincronizarRegistroInformesV1:
      typeof sincronizarRegistroInformesV1 === 'function',
    generarInformesPeriodoPendientesV1:
      typeof generarInformesPeriodoPendientesV1 === 'function',
    cerrarPeriodoDesdePortalV5:
      typeof cerrarPeriodoDesdePortalV5 === 'function',
    regenerarInformeDesdePortalV5:
      typeof regenerarInformeDesdePortalV5 === 'function',
    motorAutomaticoPasantiasV2:
      typeof motorAutomaticoPasantiasV2 === 'function',
    manejarEdicionIngresoCursos:
      typeof manejarEdicionIngresoCursos === 'function',
    procesarPostulacionEstandarTrigger:
      typeof procesarPostulacionEstandarTrigger === 'function'
  };

  const funcionesFaltantes =
    Object.keys(funciones).filter(
      function(nombre) {
        return !funciones[nombre];
      }
    );

  const triggers =
    ScriptApp.getProjectTriggers().map(
      function(trigger) {
        return {
          handler: trigger.getHandlerFunction(),
          tipo: String(trigger.getEventType()),
          fuente: String(trigger.getTriggerSource())
        };
      }
    );

  const triggerConteo = {};

  SSV30_TRIGGER_PRODUCTIVOS
    .concat(SSV30_TRIGGER_PROHIBIDOS)
    .forEach(
      function(handler) {
        triggerConteo[handler] =
          triggers.filter(
            function(trigger) {
              return trigger.handler === handler;
            }
          ).length;
      }
    );

  const triggersProductivosOk =
    triggers.length === 3 &&
    SSV30_TRIGGER_PRODUCTIVOS.every(
      function(handler) {
        return triggerConteo[handler] === 1;
      }
    );

  const triggersProhibidosDetectados =
    SSV30_TRIGGER_PROHIBIDOS.filter(
      function(handler) {
        return triggerConteo[handler] > 0;
      }
    );

  const resumen = {
    versionSalud: 'PUBLIC_MODEL_1.0',
    hojasCriticas: SSV30_HOJAS_CRITICAS.length,
    hojasTotales: nombresActuales.length,
    hojasFaltantes: hojasFaltantes,
    hojasOpcionales: opcionales,
    hojasNoReconocidas: hojasNoReconocidas,
    estructurasRevisadas: Object.keys(estructuras).length,
    estructurasIncorrectas: estructurasIncorrectas,
    cerrarPeriodosAutomaticamente: cierreAuto,
    configuracionCierreOk: configuracionCierreOk,
    politicaCierre: 'INTERMEDIOS_AUTOMATICOS_FINAL_Y_EXCEPCIONES_EN_PORTAL',
    informesPeriodoAutomaticos: true,
    funcionesCriticas: Object.keys(funciones).length,
    funcionesFaltantes: funcionesFaltantes,
    triggersTotales: triggers.length,
    triggersProductivosOk: triggersProductivosOk,
    triggersProhibidosDetectados: triggersProhibidosDetectados,
    triggerFormulario:
      triggerConteo.procesarPostulacionEstandarTrigger || 0,
    triggerOnEdit:
      triggerConteo.manejarEdicionIngresoCursos || 0,
    triggerMotorV2:
      triggerConteo.motorAutomaticoPasantiasV2 || 0,
    estado: 'OK',
    escritura: false
  };

  if (
    hojasFaltantes.length > 0 ||
    hojasNoReconocidas.length > 0 ||
    estructurasIncorrectas.length > 0 ||
    configuracionCierreOk !== true ||
    funcionesFaltantes.length > 0 ||
    triggersProductivosOk !== true ||
    triggersProhibidosDetectados.length > 0
  ) {
    resumen.estado = 'REVISAR';
  }

  console.log(
    '=== SYSTEM HEALTH — PUBLIC MODEL ==='
  );
  console.log(resumen);
  console.log('[CORE SHEETS]', hojas);
  console.log('[OPTIONAL SHEETS]', opcionales);
  console.log('[STRUCTURES]', estructuras);
  console.log('[CRITICAL FUNCTIONS]', funciones);
  console.log('[TRIGGERS]', triggers);

  Logger.log(
    JSON.stringify({
      resumen: resumen,
      hojas: hojas,
      opcionales: opcionales,
      estructuras: estructuras,
      funciones: funciones,
      triggers: triggers
    })
  );

  return {
    resumen: resumen,
    hojas: hojas,
    opcionales: opcionales,
    estructuras: estructuras,
    funciones: funciones,
    triggers: triggers
  };
}

function SSV30_leerConfiguracion_(
  hoja,
  claveBuscada
) {
  if (!hoja) {
    return null;
  }

  const datos =
    hoja.getDataRange().getDisplayValues();

  const buscada =
    String(claveBuscada || '')
      .trim()
      .toUpperCase();

  for (let i = 0; i < datos.length; i++) {
    const clave =
      String(datos[i][0] || '')
        .trim()
        .toUpperCase();

    if (clave === buscada) {
      return String(datos[i][1] || '').trim();
    }
  }

  return null;
}
