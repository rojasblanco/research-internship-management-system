

/**
 * Public repository copy: deployment identifiers and private data are externalized.
 * ============================================================
 * MOTOR AUTOMÁTICO PASANTÍAS V2.2 — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 *
 * FLUJO HORARIO:
 * 1) Cursos
 * 2) Asistencia
 * 3) Planner
 * 4) Consolidación
 * 5) Períodos V2
 * 6) Cierre automático de períodos intermedios sin bloqueos
 * 7) Ajustes posteriores
 * 8) Progreso de pasantías
 * 9) Sincronización de Registro_Informes
 * 10) Generación automática de informes pendientes
 *
 * POLÍTICA DE CIERRE:
 * - El último período formal BASE/EXTENSION NO se cierra automáticamente.
 * - Las excepciones permanecen pendientes para revisión desde el portal.
 * - EXTRA_HISTORICO no define el cierre formal final.
 * - No se agrega ningún trigger nuevo: todo usa el trigger horario existente.
 * ============================================================
 */

const MAV2_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const MAV2_HANDLER =
  'motorAutomaticoPasantiasV2';

const MAV2_HANDLERS_REEMPLAZAR = [
  'motorAutomaticoPasantiasV1',
  'sincronizarCursosTodos',
  'sincronizarAsistenciaProcesadaTriggerV1'
];


/* ============================================================
 * DIAGNÓSTICO
 * ============================================================
 */

function diagnosticarMotorAutomaticoV2() {
  const funciones = {
    cursos:
      typeof sincronizarCursosTodos === 'function',
    asistencia:
      typeof sincronizarAsistenciaProcesadaV1 === 'function',
    planner:
      typeof sincronizarPlanners === 'function',
    consolidacion:
      typeof sincronizarConsolidacionBaseV11 === 'function',
    periodosV2:
      typeof sincronizarEstructuraControlPeriodosV2 === 'function',
    cierreIntermedios:
      typeof cerrarPeriodosIntermediosAutomaticamenteV2 === 'function',
    ajustes:
      typeof sincronizarAjustesHorasV1 === 'function',
    progreso:
      typeof sincronizarProgresoPasantiasV1 === 'function',
    registroInformes:
      typeof sincronizarRegistroInformesV1 === 'function',
    generadorInformes:
      typeof generarInformesPeriodoPendientesV1 === 'function'
  };

  const triggers =
    MAV2_listarTriggers_();

  const faltantes =
    Object.keys(funciones)
      .filter(
        function(k) {
          return !funciones[k];
        }
      );

  const salida = {
    funciones: funciones,
    funcionesFaltantes: faltantes,
    listoParaPrueba:
      faltantes.length === 0,
    triggerV2Instalado:
      triggers.some(
        function(t) {
          return t.handler === MAV2_HANDLER;
        }
      ),
    triggersActuales: triggers,
    politicaCierre:
      'INTERMEDIOS_AUTOMATICOS_FINAL_Y_EXCEPCIONES_EN_PORTAL',
    informesAutomaticos:
      true,
    escritura: false
  };

  console.log(
    '=== DIAGNÓSTICO MOTOR AUTOMÁTICO V2.3 ==='
  );
  console.log(salida);
  Logger.log(JSON.stringify(salida));

  return salida;
}


/* ============================================================
 * PRUEBA / EJECUCIÓN
 * ============================================================
 */

function probarMotorAutomaticoV2() {

  const d =
    diagnosticarMotorAutomaticoV2();

  if (
    !d.listoParaPrueba
  ) {
    throw new Error(
      'Faltan módulos: ' +
      d.funcionesFaltantes.join(', ')
    );
  }

  return MAV2_ejecutar_(
    'PRUEBA_MANUAL'
  );
}


function motorAutomaticoPasantiasV2() {

  return MAV2_ejecutar_(
    'TRIGGER_HORARIO'
  );
}


/* ============================================================
 * INSTALACIÓN DEL TRIGGER
 * ============================================================
 */

function instalarMotorAutomaticoV2() {

  const d =
    diagnosticarMotorAutomaticoV2();

  if (
    !d.listoParaPrueba
  ) {
    throw new Error(
      'No se instala V2. Faltan módulos: ' +
      d.funcionesFaltantes.join(', ')
    );
  }

  let eliminados = 0;

  ScriptApp
    .getProjectTriggers()
    .forEach(
      function(t) {

        const handler =
          t.getHandlerFunction();

        if (
          handler ===
            MAV2_HANDLER ||
          MAV2_HANDLERS_REEMPLAZAR
            .indexOf(
              handler
            ) >= 0
        ) {

          const tipo =
            String(
              t.getEventType()
            );

          /*
           * Solo quitamos triggers CLOCK.
           * Nunca tocamos ON_EDIT / ON_FORM_SUBMIT.
           */
          if (
            tipo ===
              'CLOCK'
          ) {
            ScriptApp.deleteTrigger(t);
            eliminados++;
          }
        }
      }
    );

  ScriptApp
    .newTrigger(
      MAV2_HANDLER
    )
    .timeBased()
    .everyHours(1)
    .create();

  const salida = {
    instalado: true,
    handler:
      MAV2_HANDLER,
    frecuencia:
      'Cada 1 hora',
    triggersClockReemplazados:
      eliminados,
    conservaOnEdit:
      'manejarEdicionIngresoCursos',
    conservaFormSubmit:
      'procesarPostulacionEstandarTrigger'
  };

  console.log(
    '=== INSTALACIÓN MOTOR AUTOMÁTICO V2.2 ==='
  );
  console.log(salida);

  Logger.log(
    JSON.stringify(salida)
  );

  return salida;
}


function desinstalarMotorAutomaticoV2() {

  let eliminados = 0;

  ScriptApp
    .getProjectTriggers()
    .forEach(
      function(t) {

        if (
          t.getHandlerFunction() ===
            MAV2_HANDLER
        ) {
          ScriptApp.deleteTrigger(t);
          eliminados++;
        }
      }
    );

  return {
    eliminados:
      eliminados,
    handler:
      MAV2_HANDLER
  };
}


/* ============================================================
 * MOTOR INTERNO
 * ============================================================
 */

function MAV2_ejecutar_(
  origen
) {
  const inicio =
    new Date();

  const salida = {
    origen: origen,
    cursos: null,
    asistencia: null,
    planner: null,
    consolidacion: null,
    periodos: null,
    cierreIntermedios: null,
    ajustes: null,
    progreso: null,
    registroInformes: null,
    informes: null,
    errores: [],
    finalizado: false
  };

  /* 1. CURSOS */
  salida.cursos =
    MAV2_paso_(
      'cursos',
      function() {
        return sincronizarCursosTodos();
      },
      salida
    );

  /* 2. ASISTENCIA */
  salida.asistencia =
    MAV2_paso_(
      'asistencia',
      function() {
        return sincronizarAsistenciaProcesadaV1();
      },
      salida
    );

  /* 3. PLANNER */
  salida.planner =
    MAV2_paso_(
      'planner',
      function() {
        return sincronizarPlanners();
      },
      salida
    );

  /* 4. CONSOLIDACIÓN */
  if (
    salida.planner &&
    salida.planner.ok
  ) {
    salida.consolidacion =
      MAV2_paso_(
        'consolidacion',
        function() {
          return sincronizarConsolidacionBaseV11();
        },
        salida
      );
  } else {
    salida.consolidacion = {
      ok: false,
      omitido: true,
      motivo: 'Planner falló en esta corrida.'
    };
  }

  /* 5. PERIODOS V2 + PROTECCIÓN DE N */
  salida.periodos =
    MAV2_paso_(
      'periodosV2',
      function() {
        return MAV2_sincronizarPeriodosProtegiendoExtras_();
      },
      salida
    );

  /* 6. CIERRE AUTOMÁTICO DE INTERMEDIOS */
  if (
    salida.periodos &&
    salida.periodos.ok
  ) {
    salida.cierreIntermedios =
      MAV2_paso_(
        'cierreIntermedios',
        function() {
          return cerrarPeriodosIntermediosAutomaticamenteV2();
        },
        salida
      );
  } else {
    salida.cierreIntermedios = {
      ok: false,
      omitido: true,
      motivo: 'Periodos V2 falló en esta corrida.'
    };
  }

  /* 7. AJUSTES POSTERIORES */
  if (
    salida.periodos &&
    salida.periodos.ok
  ) {
    salida.ajustes =
      MAV2_paso_(
        'ajustes',
        function() {
          return sincronizarAjustesHorasV1();
        },
        salida
      );
  } else {
    salida.ajustes = {
      ok: false,
      omitido: true,
      motivo: 'Periodos V2 falló en esta corrida.'
    };
  }

  /* 8. PROGRESO */
  if (
    salida.ajustes &&
    salida.ajustes.ok
  ) {
    salida.progreso =
      MAV2_paso_(
        'progreso',
        function() {
          return sincronizarProgresoPasantiasV1();
        },
        salida
      );
  } else {
    salida.progreso = {
      ok: false,
      omitido: true,
      motivo: 'Ajustes posteriores falló o fue omitido.'
    };
  }

  /* 9. REGISTRO DE INFORMES */
  if (
    salida.periodos &&
    salida.periodos.ok
  ) {
    salida.registroInformes =
      MAV2_paso_(
        'registroInformes',
        function() {
          return sincronizarRegistroInformesV1();
        },
        salida
      );
  } else {
    salida.registroInformes = {
      ok: false,
      omitido: true,
      motivo: 'No se sincronizan informes porque Periodos V2 falló.'
    };
  }

  /* 10. GENERACIÓN AUTOMÁTICA DE INFORMES */
  if (
    salida.registroInformes &&
    salida.registroInformes.ok
  ) {
    salida.informes =
      MAV2_paso_(
        'informes',
        function() {
          return generarInformesPeriodoPendientesV1();
        },
        salida
      );
  } else {
    salida.informes = {
      ok: false,
      omitido: true,
      motivo: 'Registro_Informes no quedó sincronizado en esta corrida.'
    };
  }

  const fin =
    new Date();

  salida.finalizado = true;
  salida.duracionSegundos =
    Math.round(
      (
        fin.getTime() -
        inicio.getTime()
      ) /
      1000
    );

  salida.estado =
    salida.errores.length === 0
      ? 'OK'
      : 'OK_CON_ALERTAS';

  console.log(
    '=== MOTOR AUTOMÁTICO PASANTÍAS V2.3 ==='
  );
  console.log(salida);
  Logger.log(JSON.stringify(salida));

  return salida;
}


/* ============================================================
 * PERIODOS V2 CON PROTECCIÓN DE HORAS ADICIONALES (N)
 * ============================================================
 *
 * Periodos V2 conserva completos los CERRADOS, pero reconstruye
 * ABIERTO/FUTURO/PENDIENTE CIERRE dejando H:P vacíos.
 *
 * Para que una aprobación ingresada en N durante PENDIENTE CIERRE
 * no desaparezca en el siguiente ciclo horario:
 *
 * 1) guarda N de los PENDIENTE CIERRE;
 * 2) ejecuta Periodos V2;
 * 3) restaura N solo si el mismo período sigue PENDIENTE CIERRE.
 *
 * No protege H:M, O ni P porque no deben llenarse antes del cierre.
 * ============================================================
 */

function MAV2_sincronizarPeriodosProtegiendoExtras_() {

  const db =
    SpreadsheetApp.openById(
      MAV2_DB_ID
    );

  const hoja =
    db.getSheetByName(
      'Control_Periodos'
    );

  if (!hoja) {
    throw new Error(
      'No existe Control_Periodos.'
    );
  }

  const respaldo = {};

  if (
    hoja.getLastRow() > 1
  ) {

    const antes =
      hoja
        .getRange(
          2,
          1,
          hoja.getLastRow() - 1,
          16
        )
        .getValues();

    antes.forEach(
      function(row) {

        if (
          MAV2_normal_(
            row[6]
          ) !==
            'pendiente cierre'
        ) {
          return;
        }

        const valorN =
          row[13];

        if (
          valorN === '' ||
          valorN === null
        ) {
          return;
        }

        const clave =
          MAV2_clavePeriodo_(
            row[0],
            row[2],
            row[3]
          );

        if (clave) {
          respaldo[clave] =
            valorN;
        }
      }
    );
  }

  const resultado =
    sincronizarEstructuraControlPeriodosV2();

  let restauradas = 0;
  const noRestauradas = [];

  if (
    Object.keys(
      respaldo
    ).length &&
    hoja.getLastRow() > 1
  ) {

    const despues =
      hoja
        .getRange(
          2,
          1,
          hoja.getLastRow() - 1,
          16
        )
        .getValues();

    const encontrados = {};

    despues.forEach(
      function(row, i) {

        if (
          MAV2_normal_(
            row[6]
          ) !==
            'pendiente cierre'
        ) {
          return;
        }

        const clave =
          MAV2_clavePeriodo_(
            row[0],
            row[2],
            row[3]
          );

        if (
          !clave ||
          !Object.prototype
            .hasOwnProperty.call(
              respaldo,
              clave
            )
        ) {
          return;
        }

        hoja
          .getRange(
            i + 2,
            14
          )
          .setValue(
            respaldo[clave]
          );

        encontrados[clave] =
          true;

        restauradas++;
      }
    );

    Object.keys(
      respaldo
    ).forEach(
      function(clave) {

        if (
          !encontrados[clave]
        ) {
          noRestauradas.push(
            clave
          );
        }
      }
    );

    SpreadsheetApp.flush();
  }

  resultado.horasAdicionalesProtegidas = {
    respaldadas:
      Object.keys(
        respaldo
      ).length,

    restauradas:
      restauradas,

    noRestauradas:
      noRestauradas
  };

  return resultado;
}


/* ============================================================
 * PASO SEGURO
 * ============================================================
 */

function MAV2_paso_(
  nombre,
  fn,
  salida
) {

  const inicio =
    new Date();

  try {

    const resultado =
      fn();

    return {
      ok:
        true,

      duracionSegundos:
        Math.round(
          (
            new Date().getTime() -
            inicio.getTime()
          ) /
          1000
        ),

      resultado:
        resultado
    };

  } catch (error) {

    const mensaje =
      error &&
      error.message
        ? error.message
        : String(error);

    salida.errores.push({
      paso:
        nombre,
      mensaje:
        mensaje
    });

    console.error(
      '[MOTOR V2 ERROR]',
      nombre,
      mensaje
    );

    return {
      ok:
        false,
      error:
        mensaje
    };
  }
}


/* ============================================================
 * TRIGGERS
 * ============================================================
 */

function MAV2_listarTriggers_() {

  return ScriptApp
    .getProjectTriggers()
    .map(
      function(t) {
        return {
          handler:
            t.getHandlerFunction(),
          eventType:
            String(
              t.getEventType()
            ),
          triggerSource:
            String(
              t.getTriggerSource()
            )
        };
      }
    );
}


/* ============================================================
 * HELPERS DEL MOTOR
 * ============================================================
 */

function MAV2_normal_(
  valor
) {

  return String(
    valor || ''
  )
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    );
}


function MAV2_clavePeriodo_(
  correo,
  tipo,
  periodo
) {

  const c =
    String(
      correo || ''
    )
      .trim()
      .toLowerCase();

  const t =
    MAV2_normal_(
      tipo
    );

  const p =
    MAV2_normal_(
      periodo
    );

  if (
    !c ||
    !t ||
    !p
  ) {
    return '';
  }

  return [
    c,
    t,
    p
  ].join('|');
}
