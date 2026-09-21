

/**
 * Public repository copy: deployment identifiers and private data are externalized.
 * ============================================================
 * GENERADOR DE INFORMES DE PERÍODO V1.6 - COMPATIBLE MODELO V2 / INFORME AMPLIADO PARA JEFATURA
 * RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 *
 * Genera GOOGLE DOCS, no PDF.
 *
 * DEPENDE DE:
 * - Registro_Informes
 * - Registro_Planner
 * - Configuracion
 *
 * NO modifica:
 * - Control_Periodos
 * - Registro_Planner
 * - Asistencia_Procesada
 * - Variables_Internas
 * - Ajustes_Horas
 *
 * FLUJO PRODUCTIVO:
 * - Registro_Informes identifica automáticamente los períodos cerrados listos.
 * - El Motor llama generarInformesPeriodoPendientesV1() en cada ciclo horario.
 * - Los informes intermedios se generan sin intervención manual cuando Estado datos = LISTO.
 * - Una regeneración explícita crea una nueva versión y conserva la anterior.
 * - La revisión humana especial se reserva para el cierre formal final y para excepciones de datos.
 *
 * POLÍTICA:
 * - Solo genera si Estado datos = LISTO.
 * - Solo genera si Estado informe = PENDIENTE_GENERACION
 *   o REQUIERE_ACTUALIZACION.
 * - Un período bloqueado nunca genera documento.
 * - La prueba crea COMO MÁXIMO 1 documento.
 * - El lote crea COMO MÁXIMO 3 documentos por ejecución.
 * - Si hay actualización, crea una NUEVA VERSIÓN y conserva
 *   el documento anterior en Drive.
 * ============================================================
 */

const GIPV1_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const GIPV1_HOJA_REGISTRO = 'Registro_Informes';
const GIPV1_HOJA_PLANNER = 'Registro_Planner';
const GIPV1_HOJA_CONTROL = 'Control_Periodos';
const GIPV1_HOJA_CONFIG = 'Configuracion';

const GIPV1_CONFIG_CARPETA_ID = 'CARPETA_INFORMES_ID';

const GIPV1_MAX_LOTE = 3; // El Motor lo ejecuta cada hora; los pendientes restantes continúan en el siguiente ciclo.

/* Las pruebas controladas requieren parámetros explícitos; no se hardcodean personas reales. */


/* ============================================================
 * FUNCIONES PÚBLICAS
 * ============================================================ */

function diagnosticarGeneradorInformesPeriodoV1() {
  const db =
    SpreadsheetApp.openById(
      GIPV1_DB_ID
    );

  const registro =
    GIPV1_requerirHoja_(
      db,
      GIPV1_HOJA_REGISTRO
    );

  const planner =
    GIPV1_requerirHoja_(
      db,
      GIPV1_HOJA_PLANNER
    );

  const config =
    GIPV1_requerirHoja_(
      db,
      GIPV1_HOJA_CONFIG
    );

  GIPV1_validarRegistro_(
    registro
  );

  GIPV1_validarPlanner_(
    planner
  );

  const carpetaId =
    GIPV1_leerConfig_(
      config,
      GIPV1_CONFIG_CARPETA_ID
    );

  let carpetaEstado =
    'NO_CONFIGURADA';

  let carpetaNombre =
    '';

  if (carpetaId) {
    try {
      const carpeta =
        DriveApp.getFolderById(
          carpetaId
        );

      carpetaEstado =
        'OK';

      carpetaNombre =
        carpeta.getName();

    } catch (error) {
      carpetaEstado =
        'CONFIGURADA_PERO_INACCESIBLE';
    }
  }

  const candidatos =
    GIPV1_leerCandidatos_(
      registro
    );

  const resumen = {
    carpetaRaizEstado:
      carpetaEstado,

    carpetaRaizNombre:
      carpetaNombre,

    filasRegistro:
      Math.max(
        registro.getLastRow() - 1,
        0
      ),

    pendientesGeneracion:
      candidatos.filter(
        function(x) {
          return (
            x.estadoInforme ===
            'PENDIENTE_GENERACION'
          );
        }
      ).length,

    requierenActualizacion:
      candidatos.filter(
        function(x) {
          return (
            x.estadoInforme ===
            'REQUIERE_ACTUALIZACION'
          );
        }
      ).length,

    candidatosTotales:
      candidatos.length,

    bloqueados:
      GIPV1_contarEstado_(
        registro,
        'BLOQUEADO'
      ),

    escritura:
      false,

    estado:
      (
        carpetaEstado === 'OK'
      )
        ? 'OK'
        : 'REVISAR_CARPETA'
  };

  console.log(
    '=== DIAGNÓSTICO GENERADOR INFORMES PERÍODO V1 ==='
  );

  console.log(
    resumen
  );

  candidatos
    .slice(
      0,
      10
    )
    .forEach(
      function(c) {
        console.log(
          '[CANDIDATO INFORME]',
          {
            filaRegistro:
              c.fila,

            idInforme:
              c.idInforme,

            nombre:
              c.nombre,

            tipoPeriodo:
              c.tipoPeriodo,

            periodo:
              c.periodo,

            fechaInicio:
              c.fechaInicioTexto,

            fechaFin:
              c.fechaFinTexto,

            horasFinales:
              c.horasFinales,

            estadoInforme:
              c.estadoInforme,

            versionActual:
              c.versionActual,

            tieneDocActual:
              !!c.docIdActual
          }
        );
      }
    );

  Logger.log(
    JSON.stringify({
      resumen:
        resumen,

      candidatosMuestra:
        candidatos
          .slice(
            0,
            10
          )
          .map(
            GIPV1_serializarCandidato_
          )
    })
  );

  return {
    resumen:
      resumen,

    candidatos:
      candidatos.map(
        GIPV1_serializarCandidato_
      )
  };
}


function generarInformePeriodoPruebaV1(
  correo,
  tipoPeriodo,
  periodo
) {
  if (
    !String(correo || '').trim() ||
    !String(tipoPeriodo || '').trim() ||
    !String(periodo || '').trim()
  ) {
    throw new Error(
      'La prueba requiere correo, tipoPeriodo y periodo explícitos. No existen personas de prueba hardcodeadas.'
    );
  }

  return GIPV1_generarPeriodoEspecifico_(
    correo,
    tipoPeriodo,
    periodo,
    'PRUEBA_CONTROLADA'
  );
}


function diagnosticarContenidoInformePeriodoPruebaV1(
  correo,
  tipoPeriodo,
  periodo
) {
  if (
    !String(correo || '').trim() ||
    !String(tipoPeriodo || '').trim() ||
    !String(periodo || '').trim()
  ) {
    throw new Error(
      'El diagnóstico requiere correo, tipoPeriodo y periodo explícitos.'
    );
  }

  return GIPV1_diagnosticarContenidoPeriodoEspecifico_(
    correo,
    tipoPeriodo,
    periodo
  );
}


/*
 * Función pública opcional para pruebas futuras.
 * Ejemplo:
 * generarInformePeriodoEspecificoV1(
 *   'correo@ejemplo.com',
 *   'BASE',
 *   'P2'
 * );
 */
function generarInformePeriodoEspecificoV1(
  correo,
  tipoPeriodo,
  periodo
) {
  return GIPV1_generarPeriodoEspecifico_(
    correo,
    tipoPeriodo,
    periodo,
    'PERIODO_ESPECIFICO'
  );
}




/* ============================================================
 * REGENERACIÓN EXPLÍCITA DESDE PORTAL
 * ============================================================
 *
 * Si el informe ya está GENERADO, la función central lo trata como
 * REQUIERE_ACTUALIZACION en memoria y crea una nueva versión sin
 * borrar el Google Doc anterior.
 * ============================================================
 */
function regenerarInformePeriodoDesdePortalV2(
  correo,
  tipoPeriodo,
  periodo
) {
  const salida =
    GIPV1_generarPeriodoEspecifico_(
      correo,
      tipoPeriodo,
      periodo,
      'REGENERACION_PORTAL'
    );

  return {
    ok: true,
    verificado: true,
    message: 'Nueva versión del informe generada. La versión anterior se conserva en Drive.',
    resultado: salida
  };
}


function generarInformesPeriodoPendientesV1() {
  return GIPV1_generarLote_(
    GIPV1_MAX_LOTE,
    'LOTE'
  );
}


/* ============================================================
 * PRUEBA / GENERACIÓN DE UN PERÍODO ESPECÍFICO
 * ============================================================ */

function GIPV1_generarPeriodoEspecifico_(
  correo,
  tipoPeriodo,
  periodo,
  modo
) {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const db =
      SpreadsheetApp.openById(
        GIPV1_DB_ID
      );

    const registro =
      GIPV1_requerirHoja_(
        db,
        GIPV1_HOJA_REGISTRO
      );

    const planner =
      GIPV1_requerirHoja_(
        db,
        GIPV1_HOJA_PLANNER
      );

    const config =
      GIPV1_requerirHoja_(
        db,
        GIPV1_HOJA_CONFIG
      );

    GIPV1_validarRegistro_(
      registro
    );

    GIPV1_validarPlanner_(
      planner
    );

    const carpetaId =
      GIPV1_leerConfig_(
        config,
        GIPV1_CONFIG_CARPETA_ID
      );

    if (!carpetaId) {
      throw new Error(
        'No existe ' +
        GIPV1_CONFIG_CARPETA_ID +
        ' en Configuracion.'
      );
    }

    const carpetaRaiz =
      DriveApp.getFolderById(
        carpetaId
      );

    const correoObjetivo =
      String(
        correo ||
        ''
      )
        .trim()
        .toLowerCase();

    const tipoObjetivo =
      String(
        tipoPeriodo ||
        ''
      )
        .trim()
        .toUpperCase();

    const periodoObjetivo =
      String(
        periodo ||
        ''
      )
        .trim()
        .toUpperCase();

    const candidatos =
      GIPV1_leerCandidatos_(
        registro,
        true
      );

    const coincidencias =
      candidatos.filter(
        function(c) {
          return (
            c.correo ===
              correoObjetivo &&
            c.tipoPeriodo ===
              tipoObjetivo &&
            c.periodo ===
              periodoObjetivo
          );
        }
      );

    if (
      coincidencias.length !==
      1
    ) {
      throw new Error(
        'Se esperaba exactamente 1 candidato para ' +
        correoObjetivo +
        ' | ' +
        tipoObjetivo +
        ' | ' +
        periodoObjetivo +
        ', encontrados: ' +
        coincidencias.length +
        '.'
      );
    }

    const candidato =
      coincidencias[0];

    const estadoInformeOriginal =
      candidato.estadoInforme;

    /*
     * Para una prueba/regeneración explícita permitimos partir de
     * GENERADO. No cambiamos la hoja antes de crear el nuevo documento:
     * únicamente tratamos el objeto en memoria como una actualización.
     * Así se conserva la versión anterior y la nueva será v2, v3, etc.
     */
    if (
      candidato.estadoInforme ===
        'GENERADO'
    ) {
      candidato.estadoInforme =
        'REQUIERE_ACTUALIZACION';
    }

    const filasPlanner =
      GIPV1_leerPlanner_(
        planner
      );

    const salida =
      GIPV1_generarUno_(
        registro,
        filasPlanner,
        carpetaRaiz,
        candidato,
        db.getSpreadsheetTimeZone() ||
          Session.getScriptTimeZone()
      );

    SpreadsheetApp.flush();

    const resumen = {
      modo:
        modo,

      correo:
        correoObjetivo,

      tipoPeriodo:
        tipoObjetivo,

      periodo:
        periodoObjetivo,

      estadoInformeOriginal:
        estadoInformeOriginal,

      regeneracionControlada:
        estadoInformeOriginal ===
          'GENERADO',

      generados:
        1,

      estado:
        'OK'
    };

    console.log(
      '=== GENERACIÓN INFORME PERÍODO ESPECÍFICO V1.2 ==='
    );

    console.log(
      resumen
    );

    console.log(
      '[INFORME GENERADO]',
      salida
    );

    Logger.log(
      JSON.stringify({
        resumen:
          resumen,

        generado:
          salida
      })
    );

    return {
      resumen:
        resumen,

      generado:
        salida
    };

  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
 * DIAGNÓSTICO DE CONTENIDO DEL INFORME
 * ============================================================ */

function GIPV1_diagnosticarContenidoPeriodoEspecifico_(
  correo,
  tipoPeriodo,
  periodo
) {
  const db =
    SpreadsheetApp.openById(
      GIPV1_DB_ID
    );

  const registro =
    GIPV1_requerirHoja_(
      db,
      GIPV1_HOJA_REGISTRO
    );

  const planner =
    GIPV1_requerirHoja_(
      db,
      GIPV1_HOJA_PLANNER
    );

  GIPV1_validarRegistro_(
    registro
  );

  GIPV1_validarPlanner_(
    planner
  );

  const correoObjetivo =
    String(
      correo || ''
    )
      .trim()
      .toLowerCase();

  const tipoObjetivo =
    String(
      tipoPeriodo || ''
    )
      .trim()
      .toUpperCase();

  const periodoObjetivo =
    String(
      periodo || ''
    )
      .trim()
      .toUpperCase();

  const candidatos =
    GIPV1_leerCandidatos_(
      registro,
      true
    );

  const coincidencias =
    candidatos.filter(
      function(c) {
        return (
          c.correo === correoObjetivo &&
          c.tipoPeriodo === tipoObjetivo &&
          c.periodo === periodoObjetivo
        );
      }
    );

  if (
    coincidencias.length !== 1
  ) {
    throw new Error(
      'Se esperaba exactamente 1 registro para ' +
      correoObjetivo +
      ' | ' +
      tipoObjetivo +
      ' | ' +
      periodoObjetivo +
      ', encontrados: ' +
      coincidencias.length +
      '.'
    );
  }

  const c =
    coincidencias[0];

  const filasPlanner =
    GIPV1_leerPlanner_(
      planner
    );

  const delCorreo =
    filasPlanner.filter(
      function(a) {
        return (
          a.correo === c.correo
        );
      }
    );

  const porCodigoPeriodo =
    delCorreo.filter(
      function(a) {
        return (
          a.periodoRegistro === c.periodo
        );
      }
    );

  const porFecha =
    delCorreo.filter(
      function(a) {
        return (
          a.fecha &&
          a.fecha.getTime() >= c.fechaInicio.getTime() &&
          a.fecha.getTime() <= c.fechaFin.getTime()
        );
      }
    );

  const actividades =
    GIPV1_actividadesPeriodo_(
      filasPlanner,
      c
    );

  const resumen =
    GIPV1_resumirActividades_(
      actividades
    );

  const salida = {
    persona:
      c.nombre,

    correo:
      c.correo,

    tipoPeriodo:
      c.tipoPeriodo,

    periodo:
      c.periodo,

    fechaInicio:
      c.fechaInicioTexto,

    fechaFin:
      c.fechaFinTexto,

    filasPlannerPersona:
      delCorreo.length,

    filasMismoCodigoPeriodo:
      porCodigoPeriodo.length,

    filasDentroFechas:
      porFecha.length,

    filasSeleccionadasInforme:
      actividades.length,

    horasCandidatasSeleccionadas:
      GIPV1_redondear_(
        actividades.reduce(
          function(ac, a) {
            return (
              ac +
              (
                a.horasCandidatas > 0
                  ? a.horasCandidatas
                  : 0
              )
            );
          },
          0
        )
      ),

    respaldosSeleccionados:
      actividades.filter(
        function(a) {
          return !!a.respaldoLink;
        }
      ).length,

    actividadesAgrupadas:
      resumen.grupos.length,

    grupos:
      resumen.grupos.map(
        function(g) {
          return {
            actividad:
              g.etiqueta,

            area:
              g.area,

            veces:
              g.filas,

            horas:
              g.horas,

            respaldos:
              g.respaldos.length
          };
        }
      ),

    escritura:
      false,

    estado:
      actividades.length
        ? 'OK'
        : 'SIN_ACTIVIDADES_REVISAR'
  };

  console.log(
    '=== DIAGNÓSTICO CONTENIDO INFORME PERÍODO V1.5 ==='
  );

  console.log(
    salida
  );

  Logger.log(
    JSON.stringify(
      salida
    )
  );

  return salida;
}


/* ============================================================
 * GENERACIÓN CENTRAL
 * ============================================================ */

function GIPV1_generarLote_(
  maximo,
  modo
) {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const db =
      SpreadsheetApp.openById(
        GIPV1_DB_ID
      );

    const registro =
      GIPV1_requerirHoja_(
        db,
        GIPV1_HOJA_REGISTRO
      );

    const planner =
      GIPV1_requerirHoja_(
        db,
        GIPV1_HOJA_PLANNER
      );

    const config =
      GIPV1_requerirHoja_(
        db,
        GIPV1_HOJA_CONFIG
      );

    GIPV1_validarRegistro_(
      registro
    );

    GIPV1_validarPlanner_(
      planner
    );

    const carpetaId =
      GIPV1_leerConfig_(
        config,
        GIPV1_CONFIG_CARPETA_ID
      );

    if (!carpetaId) {
      throw new Error(
        'No existe ' +
        GIPV1_CONFIG_CARPETA_ID +
        ' en Configuracion.'
      );
    }

    const carpetaRaiz =
      DriveApp.getFolderById(
        carpetaId
      );

    const candidatos =
      GIPV1_leerCandidatos_(
        registro
      );

    if (!candidatos.length) {
      const vacio = {
        modo:
          modo,

        candidatos:
          0,

        generados:
          0,

        errores:
          [],

        estado:
          'SIN_PENDIENTES'
      };

      console.log(
        '=== GENERADOR INFORMES PERÍODO V1 ==='
      );

      console.log(
        vacio
      );

      return vacio;
    }

    const filasPlanner =
      GIPV1_leerPlanner_(
        planner
      );

    const seleccion =
      candidatos.slice(
        0,
        Math.max(
          1,
          Number(maximo) || 1
        )
      );

    const generados = [];
    const errores = [];

    seleccion.forEach(
      function(candidato) {
        try {
          const salida =
            GIPV1_generarUno_(
              registro,
              filasPlanner,
              carpetaRaiz,
              candidato,
              db.getSpreadsheetTimeZone() ||
                Session.getScriptTimeZone()
            );

          generados.push(
            salida
          );

        } catch (error) {
          errores.push({
            filaRegistro:
              candidato.fila,

            idInforme:
              candidato.idInforme,

            nombre:
              candidato.nombre,

            periodo:
              candidato.periodo,

            error:
              String(
                error &&
                error.message
                  ? error.message
                  : error
              )
          });
        }
      }
    );

    SpreadsheetApp.flush();

    const resumen = {
      modo:
        modo,

      candidatosDisponibles:
        candidatos.length,

      seleccionados:
        seleccion.length,

      generados:
        generados.length,

      errores:
        errores.length,

      estado:
        errores.length
          ? 'REVISAR'
          : 'OK'
    };

    console.log(
      '=== GENERACIÓN INFORMES PERÍODO V1 ==='
    );

    console.log(
      resumen
    );

    generados.forEach(
      function(item) {
        console.log(
          '[INFORME GENERADO]',
          item
        );
      }
    );

    errores.forEach(
      function(item) {
        console.log(
          '[ERROR INFORME]',
          item
        );
      }
    );

    Logger.log(
      JSON.stringify({
        resumen:
          resumen,

        generados:
          generados,

        errores:
          errores
      })
    );

    return {
      resumen:
        resumen,

      generados:
        generados,

      errores:
        errores
    };

  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
 * GENERAR UN INFORME
 * ============================================================ */

function GIPV1_generarUno_(
  registro,
  filasPlanner,
  carpetaRaiz,
  c,
  tz
) {
  if (
    c.estadoDatos !==
      'LISTO'
  ) {
    throw new Error(
      'El informe no tiene Estado datos = LISTO.'
    );
  }

  if (
    c.estadoInforme !==
      'PENDIENTE_GENERACION' &&
    c.estadoInforme !==
      'REQUIERE_ACTUALIZACION'
  ) {
    throw new Error(
      'Estado informe no generable: ' +
      c.estadoInforme
    );
  }

  if (
    !c.fechaInicio ||
    !c.fechaFin
  ) {
    throw new Error(
      'El período no tiene fechas válidas.'
    );
  }

  if (
    c.horasFinales === null
  ) {
    throw new Error(
      'Horas finales no disponibles.'
    );
  }

  const actividades =
    GIPV1_actividadesPeriodo_(
      filasPlanner,
      c
    );

  const resumenActividades =
    GIPV1_resumirActividades_(
      actividades
    );

  const carpetaPersona =
    GIPV1_obtenerCarpetaPersona_(
      carpetaRaiz,
      c.nombre,
      c.carpetaPersonaIdActual
    );

  const carpetaPeriodos =
    GIPV1_obtenerSubcarpeta_(
      carpetaPersona,
      'Periodos'
    );

  const versionNueva =
    Math.max(
      1,
      Number(
        c.versionActual
      ) || 0
    ) + (
      c.docIdActual
        ? 1
        : 0
    );

  const titulo =
    GIPV1_nombreDocumento_(
      c,
      versionNueva
    );

  const doc =
    DocumentApp.create(
      titulo
    );

  const docId =
    doc.getId();

  const file =
    DriveApp.getFileById(
      docId
    );

  file.moveTo(
    carpetaPeriodos
  );

  GIPV1_escribirDocumento_(
    doc,
    c,
    resumenActividades,
    tz,
    versionNueva
  );

  doc.saveAndClose();

  const url =
    'https://docs.google.com/document/d/' +
    docId +
    '/edit';

  const observacionNueva =
    c.docUrlActual
      ? (
          'Se generó versión ' +
          versionNueva +
          '. Versión anterior conservada en Drive: ' +
          c.docUrlActual
        )
      : '';

  /*
   * V1.6:
   * ya no se escriben posiciones fijas (T:Y, AE:AG, AB, AC).
   * Se resuelven los campos por encabezado para soportar tanto
   * Registro_Informes LEGACY_34 como V2_20.
   */
  GIPV1_actualizarFilaInformeGenerado_(
    registro,
    c.fila,
    {
      estadoInforme:
        'GENERADO',
      version:
        versionNueva,
      fechaGeneracion:
        new Date(),
      docId:
        docId,
      docUrl:
        url,
      carpetaPersonaId:
        carpetaPersona.getId(),
      tareasPrincipales:
        resumenActividades.textoRegistro,
      habilidadesDestacadas:
        '',
      rendimientoOperativo:
        '',
      observacionNueva:
        observacionNueva,
      ultimaActualizacion:
        new Date()
    }
  );

  return {
    filaRegistro:
      c.fila,

    idInforme:
      c.idInforme,

    nombre:
      c.nombre,

    tipoPeriodo:
      c.tipoPeriodo,

    periodo:
      c.periodo,

    version:
      versionNueva,

    actividadesElegibles:
      actividades.length,

    gruposActividades:
      resumenActividades.grupos.length,

    idGoogleDoc:
      docId,

    urlGoogleDoc:
      url,

    idCarpetaPersona:
      carpetaPersona.getId(),

    nombreDocumento:
      titulo
  };
}


/* ============================================================
 * CONTENIDO DEL GOOGLE DOC
 * ============================================================ */

function GIPV1_escribirDocumento_(
  doc,
  c,
  resumenActividades,
  tz,
  version
) {
  const body =
    doc.getBody();

  body.clear();

  const azul =
    '#2F75B5';

  const celeste =
    '#D9EAF7';

  const gris =
    '#F2F2F2';

  const titulo =
    body.appendParagraph(
      'INFORME DE AVANCE DE PASANTÍA'
    );

  titulo
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    );

  titulo
    .editAsText()
    .setBold(
      true
    )
    .setFontSize(
      16
    )
    .setForegroundColor(
      azul
    );

  const nombre =
    body.appendParagraph(
      c.nombre
    );

  nombre
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    );

  nombre
    .editAsText()
    .setBold(
      true
    )
    .setFontSize(
      12
    );

  body
    .appendParagraph(
      'Research Internship Management Program'
    )
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    );

  body.appendParagraph('');

  const porcentajeRespaldo =
    GIPV1_porcentajeRespaldo_(
      c.horasPlanner,
      c.horasEvidencia
    );

  GIPV1_tituloSeccion_(
    body,
    '1. DATOS GENERALES',
    azul
  );

  const datos =
    body.appendTable([
      [
        'Pasante',
        c.nombre
      ],
      [
        'Período evaluado',
        GIPV1_fechaLarga_(
          c.fechaInicio
        ) +
        ' al ' +
        GIPV1_fechaLarga_(
          c.fechaFin
        )
      ],
      [
        'Horas reconocidas',
        GIPV1_horasTexto_(
          c.horasFinales
        )
      ],
      [
        'Horas con respaldo',
        c.horasEvidencia !== null
          ? (
              GIPV1_horasTexto_(
                c.horasEvidencia
              ) +
              (
                porcentajeRespaldo !== null
                  ? (
                      ' (' +
                      porcentajeRespaldo +
                      ' %)'
                    )
                  : ''
              )
            )
          : 'Sin dato disponible'
      ]
    ]);

  GIPV1_estilizarTablaDatos_(
    datos,
    gris
  );

  body.appendParagraph('');

  GIPV1_tituloSeccion_(
    body,
    '2. RESUMEN EJECUTIVO',
    azul
  );

  body.appendParagraph(
    GIPV1_resumenEjecutivoAmpliado_(
      c,
      resumenActividades,
      porcentajeRespaldo
    )
  );

  body.appendParagraph('');

  GIPV1_tituloSeccion_(
    body,
    '3. ACTIVIDADES DESARROLLADAS DURANTE EL PERÍODO',
    azul
  );

  body.appendParagraph(
    resumenActividades.grupos.length
      ? (
          'A continuación se presentan las principales actividades registradas durante el período, agrupando tareas similares para facilitar su lectura.'
        )
      : (
          'No se dispone de actividades descriptivas suficientes para elaborar esta sección.'
        )
  );

  if (
    resumenActividades.grupos.length
  ) {
    const tablaAct =
      body.appendTable();

    const cabecera =
      tablaAct.appendTableRow();

    [
      'Área de trabajo',
      'Actividad',
      'Frecuencia',
      'Horas registradas',
      'Respaldo'
    ].forEach(
      function(t) {
        const celda =
          cabecera.appendTableCell(
            t
          );

        celda
          .setBackgroundColor(
            celeste
          );

        celda
          .editAsText()
          .setBold(
            true
          );
      }
    );

    resumenActividades.grupos
      .slice(
        0,
        10
      )
      .forEach(
        function(g) {
          const fila =
            tablaAct.appendTableRow();

          fila
            .appendTableCell(
              g.area
            );

          fila
            .appendTableCell(
              g.etiqueta
            );

          fila
            .appendTableCell(
              g.filas +
              (
                g.filas === 1
                  ? ' registro'
                  : ' registros'
              )
            );

          fila
            .appendTableCell(
              g.horas > 0
                ? GIPV1_horasTexto_(
                    g.horas
                  )
                : '—'
            );

          const celdaRespaldo =
            fila.appendTableCell(
              g.respaldos.length
                ? (
                    g.respaldos.length +
                    (
                      g.respaldos.length === 1
                        ? ' respaldo'
                        : ' respaldos'
                    )
                  )
                : 'Sin enlace'
            );

          if (
            g.respaldos.length
          ) {
            celdaRespaldo
              .editAsText()
              .setLinkUrl(
                g.respaldos[0]
              );
          }
        }
      );
  }

  body.appendParagraph('');

  GIPV1_tituloSeccion_(
    body,
    '4. PRINCIPALES APORTES DEL PERÍODO',
    azul
  );

  if (
    resumenActividades.grupos.length
  ) {
    resumenActividades.grupos
      .slice(
        0,
        5
      )
      .forEach(
        function(g) {
          let texto =
            g.etiqueta;

          if (
            g.filas > 1
          ) {
            texto +=
              ' (' +
              g.filas +
              ' registros)';
          }

          if (
            g.horas > 0
          ) {
            texto +=
              ', con ' +
              GIPV1_horasTexto_(
                g.horas
              ) +
              ' registradas.';
          } else {
            texto +=
              '.';
          }

          body
            .appendListItem(
              texto
            )
            .setGlyphType(
              DocumentApp.GlyphType.BULLET
            );
        }
      );

  } else {
    body.appendParagraph(
      'No se generaron aportes descriptivos automáticos porque no se recuperó un detalle suficiente de las actividades.'
    );
  }

  body.appendParagraph('');

  GIPV1_tituloSeccion_(
    body,
    '5. CUMPLIMIENTO Y RESPALDO',
    azul
  );

  const tablaCumplimiento =
    body.appendTable([
      [
        'Horas finales reconocidas',
        GIPV1_horasTexto_(
          c.horasFinales
        )
      ],
      [
        'Horas registradas en Planner al cierre',
        c.horasPlanner !== null
          ? GIPV1_horasTexto_(
              c.horasPlanner
            )
          : 'Sin dato disponible'
      ],
      [
        'Horas con evidencia',
        c.horasEvidencia !== null
          ? GIPV1_horasTexto_(
              c.horasEvidencia
            )
          : 'Sin dato disponible'
      ],
      [
        'Cobertura de respaldo',
        porcentajeRespaldo !== null
          ? (
              porcentajeRespaldo +
              ' %'
            )
          : 'No calculable'
      ]
    ]);

  GIPV1_estilizarTablaDatos_(
    tablaCumplimiento,
    gris
  );

  if (
    c.horasAdicionales !== null &&
    c.horasAdicionales !== 0
  ) {
    body
      .appendListItem(
        'Horas adicionales aprobadas antes del cierre: ' +
        GIPV1_horasTexto_(
          c.horasAdicionales
        ) +
        '.'
      )
      .setGlyphType(
        DocumentApp.GlyphType.BULLET
      );
  }

  if (
    c.ajustesPosteriores !== null &&
    c.ajustesPosteriores !== 0
  ) {
    body
      .appendListItem(
        'Ajuste posterior registrado: ' +
        GIPV1_horasTexto_(
          c.ajustesPosteriores
        ) +
        '.'
      )
      .setGlyphType(
        DocumentApp.GlyphType.BULLET
      );
  }

  body.appendParagraph('');

  GIPV1_tituloSeccion_(
    body,
    '6. CONCLUSIÓN',
    azul
  );

  body.appendParagraph(
    GIPV1_conclusionJefatura_(
      c,
      resumenActividades,
      porcentajeRespaldo
    )
  );

  if (
    resumenActividades.detalle.length
  ) {
    body.appendPageBreak();

    GIPV1_tituloSeccion_(
      body,
      '7. ANEXO - DETALLE DE ACTIVIDADES Y RESPALDOS',
      azul
    );

    body.appendParagraph(
      'El siguiente cuadro presenta el detalle de las actividades recuperadas del registro de trabajo para este período.'
    );

    const tablaDetalle =
      body.appendTable();

    const cab =
      tablaDetalle.appendTableRow();

    [
      'Fecha',
      'Actividad',
      'Área',
      'Respaldo'
    ].forEach(
      function(t) {
        const celda =
          cab.appendTableCell(
            t
          );

        celda
          .setBackgroundColor(
            celeste
          );

        celda
          .editAsText()
          .setBold(
            true
          );
      }
    );

    resumenActividades.detalle
      .slice(
        0,
        60
      )
      .forEach(
        function(a) {
          const fila =
            tablaDetalle.appendTableRow();

          fila
            .appendTableCell(
              GIPV1_fechaTextoSimple_(
                a.fecha
              )
            );

          fila
            .appendTableCell(
              GIPV1_descripcionEjecutiva_(
                a
              ) ||
              'Actividad registrada'
            );

          fila
            .appendTableCell(
              GIPV1_areaLegible_(
                a.componente
              )
            );

          const celda =
            fila.appendTableCell(
              a.respaldoLink
                ? 'Abrir respaldo'
                : '—'
            );

          if (
            a.respaldoLink
          ) {
            celda
              .editAsText()
              .setLinkUrl(
                a.respaldoLink
              );
          }
        }
      );

    if (
      resumenActividades.detalle.length >
      60
    ) {
      body.appendParagraph(
        'Nota: el anexo muestra los primeros 60 registros del período. El resto permanece disponible en el sistema.'
      );
    }
  }

  body.appendParagraph('');

  const pie =
    body.appendParagraph(
      'Informe generado a partir del registro consolidado de actividades y horas del período.'
    );

  pie
    .setAlignment(
      DocumentApp.HorizontalAlignment.CENTER
    );

  pie
    .editAsText()
    .setFontSize(
      8
    )
    .setForegroundColor(
      '#666666'
    );
}


function GIPV1_tituloSeccion_(
  body,
  texto,
  color
) {
  const p =
    body.appendParagraph(
      texto
    );

  p
    .editAsText()
    .setBold(
      true
    )
    .setFontSize(
      11
    )
    .setForegroundColor(
      color
    );

  return p;
}


function GIPV1_estilizarTablaDatos_(
  tabla,
  colorPrimeraColumna
) {
  for (
    let r = 0;
    r < tabla.getNumRows();
    r++
  ) {
    const fila =
      tabla.getRow(
        r
      );

    if (
      fila.getNumCells() >= 1
    ) {
      const c0 =
        fila.getCell(
          0
        );

      c0
        .setBackgroundColor(
          colorPrimeraColumna
        );

      c0
        .editAsText()
        .setBold(
          true
        );
    }
  }
}


function GIPV1_bullet_(
  body,
  etiqueta,
  valor
) {
  const item =
    body.appendListItem(
      etiqueta +
      ': ' +
      valor
    );

  item.setGlyphType(
    DocumentApp.GlyphType.BULLET
  );

  return item;
}


function GIPV1_resumenPeriodo_(
  c,
  resumenActividades
) {
  let texto =
    'Durante el período ' +
    c.periodo +
    ', comprendido entre ' +
    GIPV1_fechaTextoSimple_(
      c.fechaInicio
    ) +
    ' y ' +
    GIPV1_fechaTextoSimple_(
      c.fechaFin
    ) +
    ', se reconocieron ' +
    GIPV1_horasTexto_(
      c.horasFinales
    ) +
    '.';

  if (
    resumenActividades.grupos.length
  ) {
    texto +=
      ' Las actividades registradas se concentraron principalmente en ' +
      resumenActividades.grupos
        .slice(
          0,
          3
        )
        .map(
          function(g) {
            return g.etiqueta;
          }
        )
        .join(
          ', '
        ) +
      '.';
  }

  return texto;
}


/* ============================================================
 * ACTIVIDADES DEL PLANNER
 * ============================================================ */

function GIPV1_leerPlanner_(
  hoja
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return [];
  }

  const lastCol =
    hoja.getLastColumn();

  const headers =
    hoja
      .getRange(
        1,
        1,
        1,
        lastCol
      )
      .getDisplayValues()[0];

  const mapa =
    GIPV1_mapaHeaders_(
      headers
    );

  const campos = {
    correo:
      ['Correo oficial'],
    nombre:
      ['Nombre'],
    componente:
      ['compo'],
    subcomponente:
      ['sub_comp'],
    descripcion:
      ['descripcion'],
    fecha:
      ['fecha'],
    duracion:
      ['duracion'],
    estadoActividad:
      ['estado'],
    respaldoLink:
      ['Respaldo-Link'],
    tipoEvidencia:
      ['Tipo evidencia'],
    periodoRegistro:
      ['Período', 'Periodo'],
    etapa:
      ['Etapa actividad'],
    cuenta:
      ['Cuenta actividad para compromiso'],
    horasCandidatas:
      ['Horas candidatas compromiso'],
    idPlanner:
      ['ID Planner'],
    filaOrigen:
      ['Fila origen']
  };

  const indices = {};

  Object.keys(campos)
    .forEach(
      function(k) {
        indices[k] =
          GIPV1_indiceAlternativas_(
            mapa,
            campos[k]
          );
      }
    );

  const requeridos = [
    'correo',
    'componente',
    'subcomponente',
    'descripcion',
    'fecha',
    'duracion',
    'estadoActividad',
    'respaldoLink',
    'tipoEvidencia',
    'periodoRegistro',
    'etapa',
    'cuenta',
    'horasCandidatas'
  ];

  const faltantes =
    requeridos.filter(
      function(k) {
        return indices[k] < 0;
      }
    );

  if (faltantes.length) {
    throw new Error(
      'Registro_Planner no contiene campos requeridos para informes: ' +
      faltantes.join(', ') +
      '.'
    );
  }

  const datos =
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        lastCol
      )
      .getValues();

  return datos.map(
    function(row, i) {
      return {
        fila:
          i + 2,

        correo:
          String(
            GIPV1_valorIndice_(
              row,
              indices.correo
            ) || ''
          )
            .trim()
            .toLowerCase(),

        nombre:
          String(
            GIPV1_valorIndice_(
              row,
              indices.nombre
            ) || ''
          ).trim(),

        componente:
          String(
            GIPV1_valorIndice_(
              row,
              indices.componente
            ) || ''
          ).trim(),

        subcomponente:
          String(
            GIPV1_valorIndice_(
              row,
              indices.subcomponente
            ) || ''
          ).trim(),

        descripcion:
          String(
            GIPV1_valorIndice_(
              row,
              indices.descripcion
            ) || ''
          ).trim(),

        fecha:
          GIPV1_fecha_(
            GIPV1_valorIndice_(
              row,
              indices.fecha
            )
          ),

        horas:
          GIPV1_numero_(
            GIPV1_valorIndice_(
              row,
              indices.duracion
            )
          ),

        estadoActividad:
          String(
            GIPV1_valorIndice_(
              row,
              indices.estadoActividad
            ) || ''
          ).trim(),

        respaldoLink:
          String(
            GIPV1_valorIndice_(
              row,
              indices.respaldoLink
            ) || ''
          ).trim(),

        tipoEvidencia:
          String(
            GIPV1_valorIndice_(
              row,
              indices.tipoEvidencia
            ) || ''
          ).trim(),

        periodoRegistro:
          String(
            GIPV1_valorIndice_(
              row,
              indices.periodoRegistro
            ) || ''
          )
            .trim()
            .toUpperCase(),

        etapa:
          String(
            GIPV1_valorIndice_(
              row,
              indices.etapa
            ) || ''
          )
            .trim()
            .toUpperCase(),

        cuenta:
          GIPV1_esSi_(
            GIPV1_valorIndice_(
              row,
              indices.cuenta
            )
          ),

        horasCandidatas:
          GIPV1_numero_(
            GIPV1_valorIndice_(
              row,
              indices.horasCandidatas
            )
          ),

        idPlanner:
          String(
            GIPV1_valorIndice_(
              row,
              indices.idPlanner
            ) || ''
          ).trim(),

        filaOrigen:
          String(
            GIPV1_valorIndice_(
              row,
              indices.filaOrigen
            ) || ''
          ).trim()
      };
    }
  );
}


function GIPV1_actividadesPeriodo_(
  filasPlanner,
  c
) {
  const excluidas = {
    'ASISTENTE':
      true,

    'POSTERIOR_RETIRO':
      true,

    'POSTERIOR_ASISTENTE':
      true,

    'PRE_PASANTIA':
      true
  };

  return filasPlanner.filter(
    function(a) {
      if (
        a.correo !==
        c.correo
      ) {
        return false;
      }

      /*
       * El código W del Planner es la referencia preferente.
       * Si una fila todavía no lo tiene, se permite recuperar
       * el detalle por las fechas inclusivas del período.
       */
      const coincideCodigo =
        (
          a.periodoRegistro &&
          a.periodoRegistro ===
            c.periodo
        );

      const coincideFecha =
        (
          a.fecha &&
          a.fecha.getTime() >=
            c.fechaInicio.getTime() &&
          a.fecha.getTime() <=
            c.fechaFin.getTime()
        );

      if (
        !coincideCodigo &&
        !coincideFecha
      ) {
        return false;
      }

      if (
        excluidas[
          a.etapa
        ]
      ) {
        return false;
      }

      if (
        c.tipoPeriodo ===
          'EXTRA_HISTORICO'
      ) {
        return (
          a.etapa ===
            'EXTRA_HISTORICO' ||
          (
            a.periodoRegistro ===
              c.periodo &&
            c.periodo.indexOf(
              'X'
            ) === 0
          )
        );
      }

      if (
        a.etapa ===
          'EXTRA_HISTORICO'
      ) {
        return false;
      }

      /*
       * Para el texto del informe no exigimos AN=Sí.
       * Las horas reconocidas siguen viniendo de Control_Periodos.
       * Así podemos recuperar descripciones históricas aunque una fila
       * no sea candidata para sumar horas.
       */
      return true;
    }
  );
}


function GIPV1_resumirActividades_(
  actividades
) {
  const mapa = {};

  actividades.forEach(
    function(a) {
      const etiqueta =
        GIPV1_descripcionEjecutiva_(
          a
        );

      if (
        !etiqueta
      ) {
        return;
      }

      const area =
        GIPV1_areaLegible_(
          a.componente
        );

      const clave =
        GIPV1_normalizar_(
          area +
          '|' +
          etiqueta
        );

      if (
        !mapa[clave]
      ) {
        mapa[clave] = {
          etiqueta:
            etiqueta,

          area:
            area,

          horas:
            0,

          filas:
            0,

          respaldos:
            [],

          fechaMin:
            null,

          fechaMax:
            null
        };
      }

      const grupo =
        mapa[clave];

      grupo.filas++;

      /*
       * Para el reparto descriptivo usamos primero AO.
       * Si AO no existe/vale 0, no forzamos N como hora reconocida
       * porque el total oficial del informe proviene de Control_Periodos.
       */
      const horas =
        a.horasCandidatas > 0
          ? a.horasCandidatas
          : (
              a.cuenta &&
              a.horas > 0
                ? a.horas
                : 0
            );

      if (
        horas > 0
      ) {
        grupo.horas +=
          horas;
      }

      if (
        a.respaldoLink &&
        grupo.respaldos.indexOf(
          a.respaldoLink
        ) === -1
      ) {
        grupo.respaldos.push(
          a.respaldoLink
        );
      }

      if (
        a.fecha
      ) {
        if (
          !grupo.fechaMin ||
          a.fecha.getTime() <
            grupo.fechaMin.getTime()
        ) {
          grupo.fechaMin =
            a.fecha;
        }

        if (
          !grupo.fechaMax ||
          a.fecha.getTime() >
            grupo.fechaMax.getTime()
        ) {
          grupo.fechaMax =
            a.fecha;
        }
      }
    }
  );

  const grupos =
    Object.keys(
      mapa
    )
      .map(
        function(k) {
          const g =
            mapa[k];

          g.horas =
            GIPV1_redondear_(
              g.horas
            );

          return g;
        }
      )
      .sort(
        function(a, b) {
          if (
            b.horas !==
            a.horas
          ) {
            return (
              b.horas -
              a.horas
            );
          }

          return (
            b.filas -
            a.filas
          );
        }
      );

  const textoRegistro =
    grupos
      .slice(
        0,
        10
      )
      .map(
        function(g) {
          return (
            g.area +
            ': ' +
            g.etiqueta +
            ' (' +
            g.filas +
            (
              g.filas === 1
                ? ' registro'
                : ' registros'
            ) +
            (
              g.horas > 0
                ? (
                    ', ' +
                    GIPV1_horasTexto_(
                      g.horas
                    )
                  )
                : ''
            ) +
            ')'
          );
        }
      )
      .join(
        '\\n'
      );

  return {
    grupos:
      grupos,

    detalle:
      actividades
        .filter(
          function(a) {
            return !!GIPV1_descripcionEjecutiva_(
              a
            );
          }
        )
        .sort(
          function(a, b) {
            const fa =
              a.fecha
                ? a.fecha.getTime()
                : 0;

            const fb =
              b.fecha
                ? b.fecha.getTime()
                : 0;

            return (
              fa -
              fb
            );
          }
        ),

    textoRegistro:
      textoRegistro
  };
}


function GIPV1_descripcionEjecutiva_(
  a
) {
  const descripcion =
    GIPV1_limpiaDescripcion_(
      a.descripcion
    );

  if (
    descripcion
  ) {
    return descripcion;
  }

  if (
    a.subcomponente
  ) {
    return GIPV1_limpiaDescripcion_(
      a.subcomponente
    );
  }

  if (
    a.componente
  ) {
    return GIPV1_limpiaDescripcion_(
      a.componente
    );
  }

  return '';
}


function GIPV1_areaLegible_(
  valor
) {
  const original =
    String(
      valor || ''
    ).trim();

  const clave =
    GIPV1_normalizar_(
      original
    ).toUpperCase();

  const mapa = {
    'INV':
      'Investigación',

    'CEI':
      'Ética en investigación',

    'EDU':
      'Educación y capacitación',

    'MON':
      'Monitoreo, evaluación y aprendizaje',

    'FNZ':
      'Gestión financiera',

    'COM':
      'Comunicación',

    'COORD':
      'Coordinación y reuniones',

    'ETC':
      'Otras actividades'
  };

  return (
    mapa[
      clave
    ] ||
    original ||
    'Otras actividades'
  );
}


function GIPV1_etiquetaActividad_(
  a
) {
  if (
    a.componente &&
    a.subcomponente
  ) {
    return (
      a.componente +
      ' - ' +
      a.subcomponente
    );
  }

  if (
    a.subcomponente
  ) {
    return a.subcomponente;
  }

  if (
    a.componente
  ) {
    return a.componente;
  }

  return 'Otras actividades registradas';
}


function GIPV1_limpiaDescripcion_(
  texto
) {
  let salida =
    String(
      texto ||
      ''
    )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();

  if (
    salida.length >
    220
  ) {
    salida =
      salida.substring(
        0,
        217
      ) +
      '...';
  }

  return salida;
}


/* ============================================================
 * CARPETAS
 * ============================================================ */

function GIPV1_obtenerCarpetaPersona_(
  carpetaRaiz,
  nombre,
  idActual
) {
  if (
    idActual
  ) {
    try {
      const actual =
        DriveApp.getFolderById(
          idActual
        );

      if (
        actual
      ) {
        return actual;
      }

    } catch (error) {
      // Continúa a búsqueda segura por nombre.
    }
  }

  const nombreSeguro =
    GIPV1_nombreCarpeta_(
      nombre
    );

  const existentes =
    carpetaRaiz.getFoldersByName(
      nombreSeguro
    );

  if (
    existentes.hasNext()
  ) {
    return existentes.next();
  }

  return carpetaRaiz.createFolder(
    nombreSeguro
  );
}


function GIPV1_obtenerSubcarpeta_(
  carpetaPadre,
  nombre
) {
  const existentes =
    carpetaPadre.getFoldersByName(
      nombre
    );

  if (
    existentes.hasNext()
  ) {
    return existentes.next();
  }

  return carpetaPadre.createFolder(
    nombre
  );
}


function GIPV1_nombreCarpeta_(
  nombre
) {
  return String(
    nombre ||
    'Sin nombre'
  )
    .replace(
      /[\/\\:*?"<>|]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


/* ============================================================
 * REGISTRO_INFORMES
 * ============================================================ */

function GIPV1_leerCandidatos_(
  hoja,
  incluirGenerados
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return [];
  }

  const estructura =
    GIPV1_validarRegistro_(
      hoja
    );

  const lastCol =
    hoja.getLastColumn();

  const headers =
    hoja
      .getRange(
        1,
        1,
        1,
        lastCol
      )
      .getDisplayValues()[0];

  const mapa =
    GIPV1_mapaHeaders_(
      headers
    );

  const datos =
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        lastCol
      )
      .getValues();

  /*
   * V1.6: Control_Periodos es fuente canónica del período.
   * Esto permite que V2_Registro_Informes no persista G:R.
   */
  const db =
    hoja.getParent();

  const control =
    GIPV1_requerirHoja_(
      db,
      GIPV1_HOJA_CONTROL
    );

  const indiceControl =
    GIPV1_indexarControlPeriodos_(
      control
    );

  const candidatos = [];

  datos.forEach(
    function(row, i) {
      const estadoDatos =
        String(
          GIPV1_valorHeader_(
            row,
            mapa,
            'Estado datos'
          ) || ''
        )
          .trim()
          .toUpperCase();

      const estadoInforme =
        String(
          GIPV1_valorHeader_(
            row,
            mapa,
            'Estado informe'
          ) || ''
        )
          .trim()
          .toUpperCase();

      if (
        estadoDatos !==
          'LISTO'
      ) {
        return;
      }

      const estadoGenerableNormal =
        (
          estadoInforme ===
            'PENDIENTE_GENERACION' ||
          estadoInforme ===
            'REQUIERE_ACTUALIZACION'
        );

      const estadoGenerableExplicito =
        (
          !!incluirGenerados &&
          estadoInforme ===
            'GENERADO'
        );

      if (
        !estadoGenerableNormal &&
        !estadoGenerableExplicito
      ) {
        return;
      }

      const idInforme =
        String(
          GIPV1_valorHeader_(
            row,
            mapa,
            'ID informe'
          ) || ''
        ).trim();

      const correo =
        String(
          GIPV1_valorHeader_(
            row,
            mapa,
            'Correo oficial'
          ) || ''
        )
          .trim()
          .toLowerCase();

      const nombre =
        String(
          GIPV1_valorHeader_(
            row,
            mapa,
            'Nombre'
          ) || ''
        ).trim();

      const tipoInforme =
        String(
          GIPV1_valorHeader_(
            row,
            mapa,
            'Tipo informe'
          ) || ''
        )
          .trim()
          .toUpperCase();

      const tipoPeriodo =
        String(
          GIPV1_valorHeader_(
            row,
            mapa,
            'Tipo periodo'
          ) || ''
        )
          .trim()
          .toUpperCase();

      const periodo =
        String(
          GIPV1_valorHeader_(
            row,
            mapa,
            'Periodo'
          ) || ''
        )
          .trim()
          .toUpperCase();

      const claveControl =
        GIPV1_claveControlPeriodo_(
          correo,
          tipoPeriodo,
          periodo
        );

      const periodoControl =
        indiceControl[
          claveControl
        ] || null;

      /*
       * En estructura V2 el Control es obligatorio porque las columnas
       * snapshot ya no existen. En legacy se admite fallback al snapshot
       * únicamente para no romper una investigación histórica si faltara
       * excepcionalmente la fila equivalente de Control_Periodos.
       */
      let fuentePeriodo =
        periodoControl;

      if (
        !fuentePeriodo &&
        estructura === 'LEGACY_34'
      ) {
        fuentePeriodo =
          GIPV1_periodoDesdeSnapshotLegacy_(
            row,
            mapa
          );
      }

      if (
        !fuentePeriodo
      ) {
        return;
      }

      const p =
        GIPV1_numeroOpcional_(
          fuentePeriodo.horasFinales
        );

      if (
        !p.tieneValor ||
        !p.valido
      ) {
        return;
      }

      candidatos.push({
        fila:
          i + 2,

        idInforme:
          idInforme,

        correo:
          correo,

        nombre:
          nombre,

        tipoInforme:
          tipoInforme,

        tipoPeriodo:
          tipoPeriodo,

        periodo:
          periodo,

        fechaInicio:
          GIPV1_fecha_(
            fuentePeriodo.fechaInicio
          ),

        fechaInicioTexto:
          GIPV1_fechaTextoSimple_(
            fuentePeriodo.fechaInicio
          ),

        fechaFin:
          GIPV1_fecha_(
            fuentePeriodo.fechaFin
          ),

        fechaFinTexto:
          GIPV1_fechaTextoSimple_(
            fuentePeriodo.fechaFin
          ),

        horasPlanner:
          GIPV1_numeroNullable_(
            fuentePeriodo.horasPlanner
          ),

        horasEvidencia:
          GIPV1_numeroNullable_(
            fuentePeriodo.horasEvidencia
          ),

        horasAsistencia:
          GIPV1_numeroNullable_(
            fuentePeriodo.horasAsistencia
          ),

        horasDentro:
          GIPV1_numeroNullable_(
            fuentePeriodo.horasDentro
          ),

        horasFuera:
          GIPV1_numeroNullable_(
            fuentePeriodo.horasFuera
          ),

        horasAdicionales:
          GIPV1_numeroNullable_(
            fuentePeriodo.horasAdicionales
          ),

        ajustesPosteriores:
          GIPV1_numeroNullable_(
            fuentePeriodo.ajustesPosteriores
          ),

        horasFinales:
          p.valor,

        estadoDatos:
          estadoDatos,

        estadoInforme:
          estadoInforme,

        versionActual:
          Number(
            GIPV1_valorHeader_(
              row,
              mapa,
              'Version'
            ) || 0
          ),

        docIdActual:
          String(
            GIPV1_valorHeader_(
              row,
              mapa,
              'ID Google Doc'
            ) || ''
          ).trim(),

        docUrlActual:
          String(
            GIPV1_valorHeader_(
              row,
              mapa,
              'URL Google Doc'
            ) || ''
          ).trim(),

        carpetaPersonaIdActual:
          String(
            GIPV1_valorHeader_(
              row,
              mapa,
              'ID carpeta persona'
            ) || ''
          ).trim(),

        huella:
          String(
            GIPV1_valorHeader_(
              row,
              mapa,
              'Huella datos'
            ) || ''
          ).trim(),

        fuentePeriodo:
          periodoControl
            ? 'CONTROL_PERIODOS'
            : 'SNAPSHOT_LEGACY_FALLBACK'
      });
    }
  );

  return candidatos;
}


function GIPV1_contarEstado_(
  hoja,
  prefijo
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return 0;
  }

  const lastCol =
    hoja.getLastColumn();

  const headers =
    hoja
      .getRange(
        1,
        1,
        1,
        lastCol
      )
      .getDisplayValues()[0];

  const mapa =
    GIPV1_mapaHeaders_(
      headers
    );

  const idxEstado =
    GIPV1_indiceAlternativas_(
      mapa,
      ['Estado informe']
    );

  if (
    idxEstado < 0
  ) {
    throw new Error(
      'Registro_Informes no contiene Estado informe.'
    );
  }

  const estados =
    hoja
      .getRange(
        2,
        idxEstado + 1,
        hoja.getLastRow() - 1,
        1
      )
      .getDisplayValues();

  const p =
    String(
      prefijo ||
      ''
    )
      .trim()
      .toUpperCase();

  return estados.filter(
    function(row) {
      return String(
        row[0] ||
        ''
      )
        .trim()
        .toUpperCase()
        .indexOf(
          p
        ) === 0;
    }
  ).length;
}


function GIPV1_serializarCandidato_(
  c
) {
  return {
    fila:
      c.fila,

    idInforme:
      c.idInforme,

    nombre:
      c.nombre,

    tipoPeriodo:
      c.tipoPeriodo,

    periodo:
      c.periodo,

    fechaInicio:
      c.fechaInicioTexto,

    fechaFin:
      c.fechaFinTexto,

    horasFinales:
      c.horasFinales,

    estadoInforme:
      c.estadoInforme,

    versionActual:
      c.versionActual,

    tieneDocActual:
      !!c.docIdActual
  };
}


/* ============================================================
 * REDACCIÓN PARA JEFATURA
 * ============================================================ */

function GIPV1_resumenEjecutivoAmpliado_(
  c,
  resumenActividades,
  porcentajeRespaldo
) {
  let texto =
    'Durante el período comprendido entre ' +
    GIPV1_fechaLarga_(
      c.fechaInicio
    ) +
    ' y ' +
    GIPV1_fechaLarga_(
      c.fechaFin
    ) +
    ', ' +
    c.nombre +
    ' registró ' +
    GIPV1_horasTexto_(
      c.horasFinales
    ) +
    ' de actividades de pasantía.';

  if (
    resumenActividades.detalle.length
  ) {
    texto +=
      ' Para este informe se recuperaron ' +
      resumenActividades.detalle.length +
      ' registros de actividad, agrupados en ' +
      resumenActividades.grupos.length +
      (
        resumenActividades.grupos.length === 1
          ? ' actividad principal.'
          : ' actividades principales.'
      );
  }

  if (
    porcentajeRespaldo !== null
  ) {
    texto +=
      ' El respaldo disponible cubre el ' +
      porcentajeRespaldo +
      ' % de las horas registradas al cierre del período.';
  }

  if (
    resumenActividades.grupos.length
  ) {
    const principales =
      resumenActividades.grupos
        .slice(
          0,
          3
        )
        .map(
          function(g) {
            return g.etiqueta;
          }
        );

    texto +=
      ' Entre las actividades con mayor presencia se encuentran: ' +
      principales.join(
        '; '
      ) +
      '.';
  }

  return texto;
}


function GIPV1_conclusionJefatura_(
  c,
  resumenActividades,
  porcentajeRespaldo
) {
  let texto =
    'En el período evaluado se reconocieron ' +
    GIPV1_horasTexto_(
      c.horasFinales
    ) +
    ' de pasantía.';

  if (
    resumenActividades.grupos.length
  ) {
    const principales =
      resumenActividades.grupos
        .slice(
          0,
          4
        )
        .map(
          function(g) {
            return (
              g.etiqueta +
              (
                g.filas > 1
                  ? (
                      ' (' +
                      g.filas +
                      ' registros)'
                    )
                  : ''
              )
            );
          }
        );

    texto +=
      ' El trabajo desarrollado se concentró principalmente en ' +
      principales.join(
        '; '
      ) +
      '.';
  }

  if (
    porcentajeRespaldo === 100
  ) {
    texto +=
      ' La totalidad de las horas registradas al cierre cuenta con respaldo.';
  } else if (
    porcentajeRespaldo !== null
  ) {
    texto +=
      ' El ' +
      porcentajeRespaldo +
      ' % de las horas registradas al cierre cuenta con respaldo.';
  }

  texto +=
    ' Este resumen permite identificar de forma clara el volumen de trabajo y las principales actividades realizadas durante el período.';

  return texto;
}


/* ============================================================
 * REDACCIÓN EJECUTIVA
 * ============================================================ */

function GIPV1_porcentajeRespaldo_(
  horasPlanner,
  horasEvidencia
) {
  if (
    horasPlanner === null ||
    horasEvidencia === null ||
    Number(
      horasPlanner
    ) <= 0
  ) {
    return null;
  }

  return Math.round(
    (
      Number(
        horasEvidencia
      ) /
      Number(
        horasPlanner
      )
    ) *
    100
  );
}


function GIPV1_resumenEjecutivo_(
  c,
  resumenActividades,
  porcentajeRespaldo
) {
  let texto =
    'Durante el período comprendido entre ' +
    GIPV1_fechaLarga_(
      c.fechaInicio
    ) +
    ' y ' +
    GIPV1_fechaLarga_(
      c.fechaFin
    ) +
    ', ' +
    c.nombre +
    ' registró ' +
    GIPV1_horasTexto_(
      c.horasFinales
    ) +
    ' de actividades de pasantía.';

  if (
    porcentajeRespaldo !== null
  ) {
    texto +=
      ' El ' +
      porcentajeRespaldo +
      ' % de las horas registradas cuenta con respaldo.';
  }

  if (
    resumenActividades.grupos.length
  ) {
    texto +=
      ' Las principales actividades del período se detallan a continuación.';
  }

  return texto;
}


function GIPV1_conclusionEjecutiva_(
  c,
  resumenActividades,
  porcentajeRespaldo
) {
  let texto =
    'El período registra ' +
    GIPV1_horasTexto_(
      c.horasFinales
    ) +
    ' de trabajo de pasantía.';

  if (
    porcentajeRespaldo === 100
  ) {
    texto +=
      ' La totalidad de las horas cuenta con respaldo documental.';
  } else if (
    porcentajeRespaldo !== null
  ) {
    texto +=
      ' El respaldo disponible cubre el ' +
      porcentajeRespaldo +
      ' % de las horas registradas.';
  }

  if (
    resumenActividades.grupos.length
  ) {
    texto +=
      ' El detalle de actividades permite identificar los principales aportes desarrollados durante este período.';
  }

  return texto;
}


function GIPV1_fechaLarga_(
  fecha
) {
  if (
    !fecha
  ) {
    return '';
  }

  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
  ];

  return (
    fecha.getDate() +
    ' de ' +
    meses[
      fecha.getMonth()
    ] +
    ' de ' +
    fecha.getFullYear()
  );
}


/* ============================================================
 * VALIDACIONES
 * ============================================================ */

function GIPV1_validarRegistro_(
  hoja
) {
  const headersActuales =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0];

  const mapa =
    GIPV1_mapaHeaders_(
      headersActuales
    );

  const requeridos = [
    'ID informe',
    'Correo oficial',
    'Nombre',
    'Tipo informe',
    'Tipo periodo',
    'Periodo',
    'Estado datos',
    'Estado informe',
    'Version',
    'Fecha generacion',
    'ID Google Doc',
    'URL Google Doc',
    'ID carpeta persona',
    'Observacion',
    'Ultima actualizacion',
    'Resumen copiable',
    'Tareas principales',
    'Habilidades destacadas',
    'Rendimiento operativo',
    'Huella datos'
  ];

  const faltantes =
    requeridos.filter(
      function(h) {
        return (
          GIPV1_indiceAlternativas_(
            mapa,
            [h]
          ) < 0
        );
      }
    );

  if (
    faltantes.length
  ) {
    throw new Error(
      'Registro_Informes no contiene campos requeridos: ' +
      faltantes.join(', ') +
      '.'
    );
  }

  const tieneSnapshotLegacy =
    GIPV1_indiceAlternativas_(
      mapa,
      ['Horas finales vigentes']
    ) >= 0;

  return tieneSnapshotLegacy
    ? 'LEGACY_34'
    : 'V2_20';
}


function GIPV1_validarPlanner_(
  hoja
) {
  const headers =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0];

  const mapa =
    GIPV1_mapaHeaders_(
      headers
    );

  const requeridos = [
    ['Correo oficial'],
    ['compo'],
    ['sub_comp'],
    ['descripcion'],
    ['fecha'],
    ['duracion'],
    ['estado'],
    ['Respaldo-Link'],
    ['Tipo evidencia'],
    ['Período', 'Periodo'],
    ['Etapa actividad'],
    ['Cuenta actividad para compromiso'],
    ['Horas candidatas compromiso']
  ];

  const faltantes = [];

  requeridos.forEach(
    function(alternativas) {
      if (
        GIPV1_indiceAlternativas_(
          mapa,
          alternativas
        ) < 0
      ) {
        faltantes.push(
          alternativas.join(' / ')
        );
      }
    }
  );

  if (
    faltantes.length
  ) {
    throw new Error(
      'Registro_Planner no contiene campos requeridos: ' +
      faltantes.join(', ') +
      '.'
    );
  }

  return {
    columnas:
      hoja.getLastColumn(),

    camposRequeridos:
      requeridos.length,

    estado:
      'OK'
  };
}



/* ============================================================
 * COMPATIBILIDAD MODELO V2 — HEADERS / CONTROL_PERIODOS
 * ============================================================ */

function GIPV1_mapaHeaders_(
  headers
) {
  const mapa = {};

  headers.forEach(
    function(h, i) {
      const clave =
        GIPV1_normalizar_(
          h
        );

      if (
        clave &&
        !Object.prototype.hasOwnProperty.call(
          mapa,
          clave
        )
      ) {
        mapa[
          clave
        ] =
          i;
      }
    }
  );

  return mapa;
}


function GIPV1_indiceAlternativas_(
  mapa,
  alternativas
) {
  for (
    let i = 0;
    i < alternativas.length;
    i++
  ) {
    const clave =
      GIPV1_normalizar_(
        alternativas[i]
      );

    if (
      Object.prototype.hasOwnProperty.call(
        mapa,
        clave
      )
    ) {
      return mapa[
        clave
      ];
    }
  }

  return -1;
}


function GIPV1_valorIndice_(
  row,
  indice
) {
  if (
    indice === null ||
    indice === undefined ||
    indice < 0
  ) {
    return '';
  }

  return row[
    indice
  ];
}


function GIPV1_valorHeader_(
  row,
  mapa,
  header
) {
  const idx =
    GIPV1_indiceAlternativas_(
      mapa,
      [header]
    );

  return GIPV1_valorIndice_(
    row,
    idx
  );
}


function GIPV1_setHeader_(
  hoja,
  fila,
  mapa,
  header,
  valor
) {
  const idx =
    GIPV1_indiceAlternativas_(
      mapa,
      [header]
    );

  if (
    idx < 0
  ) {
    throw new Error(
      'No se encontró el campo "' +
      header +
      '" en ' +
      hoja.getName() +
      '.'
    );
  }

  hoja
    .getRange(
      fila,
      idx + 1
    )
    .setValue(
      valor
    );
}


function GIPV1_actualizarFilaInformeGenerado_(
  hoja,
  fila,
  datos
) {
  const headers =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0];

  const mapa =
    GIPV1_mapaHeaders_(
      headers
    );

  const pares = [
    ['Estado informe', datos.estadoInforme],
    ['Version', datos.version],
    ['Fecha generacion', datos.fechaGeneracion],
    ['ID Google Doc', datos.docId],
    ['URL Google Doc', datos.docUrl],
    ['ID carpeta persona', datos.carpetaPersonaId],
    ['Tareas principales', datos.tareasPrincipales],
    ['Habilidades destacadas', datos.habilidadesDestacadas],
    ['Rendimiento operativo', datos.rendimientoOperativo]
  ];

  pares.forEach(
    function(par) {
      GIPV1_setHeader_(
        hoja,
        fila,
        mapa,
        par[0],
        par[1]
      );
    }
  );

  if (
    datos.observacionNueva
  ) {
    const idxObs =
      GIPV1_indiceAlternativas_(
        mapa,
        ['Observacion']
      );

    const actual =
      String(
        hoja
          .getRange(
            fila,
            idxObs + 1
          )
          .getValue() ||
        ''
      ).trim();

    GIPV1_setHeader_(
      hoja,
      fila,
      mapa,
      'Observacion',
      actual
        ? (
            actual +
            ' | ' +
            datos.observacionNueva
          )
        : datos.observacionNueva
    );
  }

  GIPV1_setHeader_(
    hoja,
    fila,
    mapa,
    'Ultima actualizacion',
    datos.ultimaActualizacion
  );
}


function GIPV1_claveControlPeriodo_(
  correo,
  tipo,
  periodo
) {
  return [
    'PERIODO',
    String(correo || '')
      .trim()
      .toLowerCase(),
    String(tipo || '')
      .trim()
      .toUpperCase(),
    String(periodo || '')
      .trim()
      .toUpperCase()
  ].join('::');
}


function GIPV1_indexarControlPeriodos_(
  hoja
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return {};
  }

  const headers =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0];

  const mapa =
    GIPV1_mapaHeaders_(
      headers
    );

  const campos = {
    correo:
      ['Correo oficial'],
    nombre:
      ['Nombre'],
    tipo:
      ['Tipo'],
    periodo:
      ['Periodo', 'Período'],
    fechaInicio:
      ['Fecha inicio'],
    fechaFin:
      ['Fecha fin'],
    estadoPeriodo:
      ['Estado periodo'],
    fechaCierre:
      ['Fecha cierre'],
    horasPlanner:
      ['Horas planner al cierre'],
    horasEvidencia:
      ['Horas con evidencia al cierre'],
    horasAsistencia:
      ['Horas asistencia al cierre'],
    horasDentro:
      ['Horas dentro horario'],
    horasFuera:
      ['Horas fuera horario'],
    horasAdicionales:
      ['Horas extras aprobadas'],
    ajustesPosteriores:
      ['Ajustes'],
    horasFinales:
      ['Horas finales']
  };

  const idx = {};

  Object.keys(campos)
    .forEach(
      function(k) {
        idx[k] =
          GIPV1_indiceAlternativas_(
            mapa,
            campos[k]
          );
      }
    );

  const faltantes =
    Object.keys(idx)
      .filter(
        function(k) {
          return idx[k] < 0;
        }
      );

  if (
    faltantes.length
  ) {
    throw new Error(
      'Control_Periodos no contiene campos requeridos por el generador: ' +
      faltantes.join(', ') +
      '.'
    );
  }

  const datos =
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        hoja.getLastColumn()
      )
      .getValues();

  const salida = {};

  datos.forEach(
    function(row, i) {
      const correo =
        String(
          row[idx.correo] || ''
        )
          .trim()
          .toLowerCase();

      const tipo =
        String(
          row[idx.tipo] || ''
        )
          .trim()
          .toUpperCase();

      const periodo =
        String(
          row[idx.periodo] || ''
        )
          .trim()
          .toUpperCase();

      const estado =
        String(
          row[idx.estadoPeriodo] || ''
        )
          .trim()
          .toUpperCase();

      if (
        !correo ||
        !tipo ||
        !periodo ||
        estado !== 'CERRADO'
      ) {
        return;
      }

      const clave =
        GIPV1_claveControlPeriodo_(
          correo,
          tipo,
          periodo
        );

      if (
        salida[
          clave
        ]
      ) {
        throw new Error(
          'Control_Periodos contiene clave cerrada duplicada: ' +
          clave +
          '.'
        );
      }

      salida[
        clave
      ] = {
        fila:
          i + 2,
        correo:
          correo,
        nombre:
          String(
            row[idx.nombre] || ''
          ).trim(),
        tipo:
          tipo,
        periodo:
          periodo,
        fechaInicio:
          row[idx.fechaInicio],
        fechaFin:
          row[idx.fechaFin],
        estadoPeriodo:
          row[idx.estadoPeriodo],
        fechaCierre:
          row[idx.fechaCierre],
        horasPlanner:
          row[idx.horasPlanner],
        horasEvidencia:
          row[idx.horasEvidencia],
        horasAsistencia:
          row[idx.horasAsistencia],
        horasDentro:
          row[idx.horasDentro],
        horasFuera:
          row[idx.horasFuera],
        horasAdicionales:
          row[idx.horasAdicionales],
        ajustesPosteriores:
          row[idx.ajustesPosteriores],
        horasFinales:
          row[idx.horasFinales]
      };
    }
  );

  return salida;
}


function GIPV1_periodoDesdeSnapshotLegacy_(
  row,
  mapa
) {
  const idxFinal =
    GIPV1_indiceAlternativas_(
      mapa,
      ['Horas finales vigentes']
    );

  if (
    idxFinal < 0
  ) {
    return null;
  }

  return {
    fechaInicio:
      GIPV1_valorHeader_(
        row,
        mapa,
        'Fecha inicio'
      ),
    fechaFin:
      GIPV1_valorHeader_(
        row,
        mapa,
        'Fecha fin'
      ),
    horasPlanner:
      GIPV1_valorHeader_(
        row,
        mapa,
        'Horas planner al cierre'
      ),
    horasEvidencia:
      GIPV1_valorHeader_(
        row,
        mapa,
        'Horas con evidencia al cierre'
      ),
    horasAsistencia:
      GIPV1_valorHeader_(
        row,
        mapa,
        'Horas asistencia al cierre'
      ),
    horasDentro:
      GIPV1_valorHeader_(
        row,
        mapa,
        'Horas dentro horario'
      ),
    horasFuera:
      GIPV1_valorHeader_(
        row,
        mapa,
        'Horas fuera horario'
      ),
    horasAdicionales:
      GIPV1_valorHeader_(
        row,
        mapa,
        'Horas adicionales aprobadas antes del cierre'
      ),
    ajustesPosteriores:
      GIPV1_valorHeader_(
        row,
        mapa,
        'Ajustes posteriores'
      ),
    horasFinales:
      GIPV1_valorHeader_(
        row,
        mapa,
        'Horas finales vigentes'
      )
  };
}


/* ============================================================
 * CONFIG Y HELPERS
 * ============================================================ */

function GIPV1_leerConfig_(
  hoja,
  clave
) {
  if (
    hoja.getLastRow() < 1
  ) {
    return '';
  }

  const datos =
    hoja
      .getRange(
        1,
        1,
        hoja.getLastRow(),
        Math.max(
          2,
          hoja.getLastColumn()
        )
      )
      .getDisplayValues();

  const objetivo =
    GIPV1_normalizar_(
      clave
    );

  for (
    let i = 0;
    i < datos.length;
    i++
  ) {
    if (
      GIPV1_normalizar_(
        datos[i][0]
      ) ===
      objetivo
    ) {
      return String(
        datos[i][1] ||
        ''
      ).trim();
    }
  }

  return '';
}


function GIPV1_requerirHoja_(
  ss,
  nombre
) {
  const hoja =
    ss.getSheetByName(
      nombre
    );

  if (
    !hoja
  ) {
    throw new Error(
      'No existe la hoja "' +
      nombre +
      '".'
    );
  }

  return hoja;
}


function GIPV1_normalizar_(
  valor
) {
  return String(
    valor ||
    ''
  )
    .trim()
    .toLowerCase()
    .normalize(
      'NFD'
    )
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    );
}


function GIPV1_esSi_(
  valor
) {
  const t =
    GIPV1_normalizar_(
      valor
    );

  return (
    t === 'si' ||
    t === 'sí' ||
    t === 'yes' ||
    t === 'true' ||
    t === '1'
  );
}


function GIPV1_numero_(
  valor
) {
  const n =
    Number(
      String(
        valor === null ||
        valor === undefined
          ? ''
          : valor
      )
        .trim()
        .replace(
          ',',
          '.'
        )
    );

  return isNaN(
    n
  )
    ? 0
    : n;
}


function GIPV1_numeroNullable_(
  valor
) {
  if (
    valor === '' ||
    valor === null ||
    valor === undefined
  ) {
    return null;
  }

  const n =
    Number(
      String(
        valor
      )
        .trim()
        .replace(
          ',',
          '.'
        )
    );

  return isNaN(
    n
  )
    ? null
    : GIPV1_redondear_(
        n
      );
}


function GIPV1_numeroOpcional_(
  valor
) {
  if (
    valor === '' ||
    valor === null ||
    valor === undefined
  ) {
    return {
      tieneValor:
        false,

      valido:
        true,

      valor:
        null
    };
  }

  const n =
    Number(
      String(
        valor
      )
        .trim()
        .replace(
          ',',
          '.'
        )
    );

  return {
    tieneValor:
      true,

    valido:
      !isNaN(
        n
      ),

    valor:
      isNaN(
        n
      )
        ? null
        : GIPV1_redondear_(
            n
          )
  };
}


function GIPV1_redondear_(
  valor
) {
  const n =
    Number(
      valor
    );

  if (
    isNaN(
      n
    )
  ) {
    return 0;
  }

  return Math.round(
    n * 100
  ) / 100;
}


function GIPV1_fecha_(
  valor
) {
  if (
    valor instanceof Date &&
    !isNaN(
      valor.getTime()
    )
  ) {
    return new Date(
      valor.getFullYear(),
      valor.getMonth(),
      valor.getDate()
    );
  }

  return null;
}


function GIPV1_fechaTextoSimple_(
  valor
) {
  const fecha =
    GIPV1_fecha_(
      valor
    );

  if (
    !fecha
  ) {
    return '';
  }

  return [
    String(
      fecha.getDate()
    ).padStart(
      2,
      '0'
    ),
    String(
      fecha.getMonth() +
      1
    ).padStart(
      2,
      '0'
    ),
    fecha.getFullYear()
  ].join(
    '/'
  );
}


function GIPV1_fechaTexto_(
  fecha,
  tz
) {
  if (
    !fecha
  ) {
    return '';
  }

  return Utilities.formatDate(
    fecha,
    tz,
    'dd/MM/yyyy'
  );
}


function GIPV1_horasTexto_(
  horas
) {
  const n =
    GIPV1_redondear_(
      horas
    );

  const enteras =
    Math.floor(
      Math.abs(
        n
      )
    );

  const minutos =
    Math.round(
      (
        Math.abs(
          n
        ) -
        enteras
      ) *
      60
    );

  const signo =
    n < 0
      ? '-'
      : '';

  let h =
    enteras;

  let m =
    minutos;

  if (
    m === 60
  ) {
    h++;
    m = 0;
  }

  if (
    m === 0
  ) {
    return (
      signo +
      h +
      (
        h === 1
          ? ' hora'
          : ' horas'
      )
    );
  }

  return (
    signo +
    h +
    (
      h === 1
        ? ' hora'
        : ' horas'
    ) +
    ' y ' +
    m +
    (
      m === 1
        ? ' minuto'
        : ' minutos'
    )
  );
}


function GIPV1_nombreTipoPeriodo_(
  tipo
) {
  const t =
    String(
      tipo ||
      ''
    )
      .trim()
      .toUpperCase();

  if (
    t === 'BASE'
  ) {
    return 'Pasantía base';
  }

  if (
    t === 'EXTENSION'
  ) {
    return 'Extensión formal';
  }

  if (
    t === 'EXTRA_HISTORICO'
  ) {
    return 'Actividad adicional posterior a la pasantía';
  }

  return tipo;
}


function GIPV1_nombreDocumento_(
  c,
  version
) {
  return (
    'Informe de avance de pasantía - ' +
    c.nombre +
    ' - ' +
    c.periodo +
    ' - v' +
    version
  );
}
