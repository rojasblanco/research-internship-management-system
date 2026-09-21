/**
 * ============================================================
 * INTAKE AND COURSE PROCESSING — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * ALCANCE ACTUAL:
 * - Ruta de ingreso: PASANTÍA ESTÁNDAR.
 * - Lee directamente el spreadsheet original de respuestas.
 * - Variables_Internas se crea/actualiza SOLO después de una entrevista ACEPTADA.
 * - A/B se consideran aliases de la misma persona.
 * - CI (BM) se utiliza como llave fuerte adicional.
 * - El resultado humano de entrevista se mantiene en C.
 * - J y AO pueden actualizarse por hechos verificables.
 * - Cursos: nota mínima configurable; por defecto 70.
 * - AO guarda solo la FECHA administrativa del último curso,
 *   no la hora exacta del examen.
 * - Un curso cuenta UNA sola vez por persona.
 * - Si hay varios intentos del mismo curso, el intento oficial
 *   automático es el PRIMERO cronológicamente. Los posteriores
 *   NO reemplazan la nota y quedan marcados para revisión.
 *
 * IMPORTANTE:
 * - La automatización de alta descrita aquí cubre la ruta PASANTÍA ESTÁNDAR.
 * - Las rutas de incorporación directa se mantienen separadas y requieren su propio flujo autorizado.
 * ============================================================
 */

const RIM_IC_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const RIM_IC_FORM_ESTANDAR_ID =
  'YOUR_APPLICATION_RESPONSE_SPREADSHEET_ID';

const RIM_IC_FORM_ESTANDAR_HOJA =
  'Respuestas de formulario 1';

const RIM_IC_HOJA_VARIABLES =
  'Variables_Internas';

const RIM_IC_HOJA_DATOS_CURSOS =
  'Datos_Cursos';

const RIM_IC_HOJA_CATALOGO =
  'Catalogo_Cursos';

const RIM_IC_HOJA_CONTROL_CURSOS =
  'Control_Cursos';

const RIM_IC_HOJA_LOG_INGRESO =
  'Log_Ingreso';

const RIM_IC_HOJA_HORARIOS_POST =
  'Horarios_Postulacion';

const RIM_IC_RUTA_ESTANDAR =
  'PASANTÍA ESTÁNDAR';

const RIM_IC_ESTADO_POSTULACION =
  'Postulación recibida';

const RIM_IC_ESTADO_CURSOS =
  'Cursos en progreso';

const RIM_IC_ESTADO_ACEPTADO =
  'Aceptado';

const RIM_IC_ESTADO_DENEGADO =
  'Denegado';


const RIM_IC_CURSOS_DEFAULT = [
  ['Ética e integridad en investigación', 70, 'Sí', 'Sí'],
  ['Gestión de datos de investigación', 70, 'Sí', 'Sí'],
  ['Fundamentos de análisis descriptivo', 70, 'Sí', 'Sí'],
  ['Comunicación científica', 70, 'Sí', 'Sí'],
  ['Participación comunitaria', 70, 'Sí', 'Sí']
];

const RIM_IC_CONTROL_HEADERS = [
  'Correo oficial',
  'Nombre',
  'Curso',
  'Estado curso',
  'Nota oficial',
  'Fecha intento oficial',
  'Correo usado intento oficial',
  'Intentos detectados',
  'Alerta',
  'Fecha procesamiento'
];


function RIM_IC_normalizarHeaderV17_(
  valor
) {
  return rimNormalizarSinAcentos_(
    valor
  );
}


function RIM_IC_mapaHeadersV17_(
  headers
) {
  const mapa = {};

  headers.forEach(
    function(header, index) {
      const clave =
        RIM_IC_normalizarHeaderV17_(
          header
        );

      if (
        clave &&
        !Object.prototype.hasOwnProperty.call(
          mapa,
          clave
        )
      ) {
        mapa[clave] =
          index + 1;
      }
    }
  );

  return mapa;
}


function RIM_IC_columnaV17_(
  mapa,
  aliases,
  opcional
) {
  for (
    let i = 0;
    i < aliases.length;
    i++
  ) {
    const clave =
      RIM_IC_normalizarHeaderV17_(
        aliases[i]
      );

    if (
      Object.prototype.hasOwnProperty.call(
        mapa,
        clave
      )
    ) {
      return mapa[clave];
    }
  }

  if (opcional) {
    return 0;
  }

  throw new Error(
    'Variables_Internas no contiene ninguno de estos encabezados: ' +
    aliases.join(' | ')
  );
}


function RIM_IC_columnasVariablesV17_(
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
    RIM_IC_mapaHeadersV17_(
      headers
    );

  return {
    correoA:
      RIM_IC_columnaV17_(
        mapa,
        ['Correo oficial']
      ),

    correoB:
      RIM_IC_columnaV17_(
        mapa,
        [
          'Correo alternativo cursos',
          'Correo Alternativo (Cursos)'
        ],
        true
      ),

    decision:
      RIM_IC_columnaV17_(
        mapa,
        [
          'Resultado entrevista',
          'Estado'
        ]
      ),

    nombre:
      RIM_IC_columnaV17_(
        mapa,
        [
          'Nombre',
          'Nombre del Pasante'
        ]
      ),

    estadoIngreso:
      RIM_IC_columnaV17_(
        mapa,
        [
          'Estado de ingreso',
          'Estado de Ingreso'
        ]
      ),

    fechaCursos:
      RIM_IC_columnaV17_(
        mapa,
        ['Fecha completado cursos']
      ),

    ci:
      RIM_IC_columnaV17_(
        mapa,
        ['CI']
      ),

    ruta:
      RIM_IC_columnaV17_(
        mapa,
        ['Ruta de ingreso']
      )
  };
}


function RIM_IC_valorFilaV17_(
  row,
  columna
) {
  return columna > 0
    ? row[columna - 1]
    : '';
}





/* ============================================================
 * PREPARACIÓN / DIAGNÓSTICOS
 * ============================================================
 */

function prepararIngresoCursosV1() {
  const ss =
    SpreadsheetApp.openById(
      RIM_IC_DB_ID
    );

  const hojaVariables =
    ss.getSheetByName(
      RIM_IC_HOJA_VARIABLES
    );

  if (!hojaVariables) {
    throw new Error(
      'No existe Variables_Internas.'
    );
  }

  const columnas =
    RIM_IC_columnasVariablesV17_(
      hojaVariables
    );

  hojaVariables
    .getRange(
      1,
      columnas.ruta
    )
    .setNote(
      'Ruta administrativa de entrada. Se escribe por código. ' +
      'Valores previstos: PASANTÍA ESTÁNDAR, ASISTENTE DIRECTO, ' +
      'PASANTÍA TRANSITORIA A CONTRATACIÓN.'
    );

  const reglaIngreso =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        [
          RIM_IC_ESTADO_POSTULACION,
          RIM_IC_ESTADO_CURSOS,
          RIM_IC_ESTADO_ACEPTADO,
          RIM_IC_ESTADO_DENEGADO
        ],
        true
      )
      .setAllowInvalid(true)
      .build();

  hojaVariables
    .getRange(
      2,
      columnas.estadoIngreso,
      Math.max(
        hojaVariables.getMaxRows() - 1,
        1
      ),
      1
    )
    .setDataValidation(
      reglaIngreso
    );

  prepararCatalogoCursosV1_(ss);
  prepararControlCursosV1_(ss);
  prepararLogIngresoV1_(ss);

  const resultado = {
    rutaIngresoColumna:
      columnas.ruta,
    estadoIngresoColumna:
      columnas.estadoIngreso,
    catalogo:
      RIM_IC_HOJA_CATALOGO,
    controlCursos:
      RIM_IC_HOJA_CONTROL_CURSOS,
    logIngreso:
      RIM_IC_HOJA_LOG_INGRESO,
    modeloVariables:
      hojaVariables.getLastColumn() <= 55
        ? 'V2'
        : 'LEGACY',
    formulasNuevas:
      0,
    celdasCombinadas:
      0
  };

  console.log(
    'PREPARACIÓN INGRESO/CURSOS V1.7:',
    resultado
  );

  Logger.log(
    JSON.stringify(resultado)
  );

  return resultado;
}

function diagnosticarPostulacionEstandarV1() {
  const ssFuente =
    SpreadsheetApp.openById(
      RIM_IC_FORM_ESTANDAR_ID
    );

  const hoja =
    ssFuente.getSheetByName(
      RIM_IC_FORM_ESTANDAR_HOJA
    );

  if (!hoja) {
    throw new Error(
      'No se encontró la hoja de respuestas estándar.'
    );
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
    mapearFormularioEstandarV1_(
      headers
    );

  const resultado = {
    spreadsheet:
      RIM_IC_FORM_ESTANDAR_ID,
    hoja:
      RIM_IC_FORM_ESTANDAR_HOJA,
    respuestas:
      Math.max(
        0,
        hoja.getLastRow() - 1
      ),
    columnas:
      lastCol,
    mapa:
      mapa,
    soloLectura:
      true
  };

  console.log(
    'DIAGNÓSTICO POSTULACIÓN ESTÁNDAR:',
    resultado
  );

  Logger.log(
    JSON.stringify(resultado)
  );

  return resultado;
}


function diagnosticarCursosTodosV1() {
  return procesarCursosTodosV1_(
    false
  );
}


/**
 * Instala SOLO los triggers de este módulo.
 * No elimina triggers de Planner, horarios u otros módulos.
 */
function instalarAutomatizacionesIngresoCursosV1() {
  eliminarTriggersHandlerV1_(
    'procesarPostulacionEstandarTrigger'
  );

  eliminarTriggersHandlerV1_(
    'sincronizarCursosTodos'
  );

  eliminarTriggersHandlerV1_(
    'manejarEdicionIngresoCursos'
  );

  ScriptApp
    .newTrigger(
      'procesarPostulacionEstandarTrigger'
    )
    .forSpreadsheet(
      RIM_IC_FORM_ESTANDAR_ID
    )
    .onFormSubmit()
    .create();

  ScriptApp
    .newTrigger(
      'sincronizarCursosTodos'
    )
    .timeBased()
    .everyHours(1)
    .create();

  ScriptApp
    .newTrigger(
      'manejarEdicionIngresoCursos'
    )
    .forSpreadsheet(
      RIM_IC_DB_ID
    )
    .onEdit()
    .create();

  const resultado = {
    formulario:
      'instalado',
    cursosCada:
      '1 hora',
    cambiosVariables:
      'onEdit'
  };

  console.log(
    'TRIGGERS INGRESO/CURSOS:',
    resultado
  );

  Logger.log(
    JSON.stringify(resultado)
  );

  return resultado;
}


function eliminarTriggersHandlerV1_(
  handler
) {
  ScriptApp
    .getProjectTriggers()
    .forEach(function(trigger) {
      if (
        trigger.getHandlerFunction() ===
        handler
      ) {
        ScriptApp.deleteTrigger(
          trigger
        );
      }
    });
}


/* ============================================================
 * FORMULARIO ESTÁNDAR
 * ============================================================
 */

function procesarPostulacionEstandarTrigger(
  e
) {
  if (
    !e ||
    !e.range
  ) {
    throw new Error(
      'Esta función debe ejecutarse mediante el trigger de envío del formulario.'
    );
  }

  return procesarPostulacionCompletaV1_(
    e.range.getRow(),
    'TRIGGER_FORMULARIO'
  );
}


/**
 * Reprocesa manualmente una respuesta YA existente del formulario.
 *
 * USO:
 *   reprocesarFilaPostulacionEstandarV1(23)
 *
 * IMPORTANTE:
 * - SÍ escribe en la base.
 * - SÍ organiza adjuntos.
 * - SÍ intenta enviar los avisos a encargados.
 * - El módulo de notificaciones evita reenvíos duplicados por
 *   postulación/destinatario mediante Log_Notificaciones_Postulaciones.
 */
function reprocesarFilaPostulacionEstandarV1(
  fila
) {
  const ssFuente =
    SpreadsheetApp.openById(
      RIM_IC_FORM_ESTANDAR_ID
    );

  const hoja =
    ssFuente.getSheetByName(
      RIM_IC_FORM_ESTANDAR_HOJA
    );

  if (
    !hoja ||
    fila < 2 ||
    fila > hoja.getLastRow()
  ) {
    throw new Error(
      'Fila de postulación no válida: ' +
      fila
    );
  }

  return procesarPostulacionCompletaV1_(
    fila,
    'REPROCESO_MANUAL'
  );
}


/**
 * Reprocesa la última respuesta existente.
 *
 * Úsala solo cuando confirmes que la última fila es la
 * postulación que quieres recuperar/probar.
 */
function diagnosticarPostulacionMasRecienteV1() {
  const seleccion =
    seleccionarPostulacionMasRecienteV1_();

  const salida = {
    fila:
      seleccion.fila,
    timestamp:
      seleccion.timestamp,
    nombre:
      seleccion.nombre,
    correo:
      seleccion.correo,
    escritura:
      false
  };

  console.log(
    '=== POSTULACIÓN MÁS RECIENTE — SOLO LECTURA ==='
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


function reprocesarUltimaPostulacionEstandarV1() {
  const seleccion =
    seleccionarPostulacionMasRecienteV1_();

  console.log(
    'REPROCESO: se seleccionó la fila ' +
    seleccion.fila +
    ' por ser la marca temporal más reciente (' +
    seleccion.timestamp +
    ').'
  );

  return reprocesarFilaPostulacionEstandarV1(
    seleccion.fila
  );
}


function seleccionarPostulacionMasRecienteV1_() {
  const ssFuente =
    SpreadsheetApp.openById(
      RIM_IC_FORM_ESTANDAR_ID
    );

  const hoja =
    ssFuente.getSheetByName(
      RIM_IC_FORM_ESTANDAR_HOJA
    );

  if (
    !hoja ||
    hoja.getLastRow() < 2
  ) {
    throw new Error(
      'No existen postulaciones para revisar.'
    );
  }

  const lastRow =
    hoja.getLastRow();

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
    mapearFormularioEstandarV1_(
      headers
    );

  const datos =
    hoja
      .getRange(
        2,
        1,
        lastRow - 1,
        lastCol
      )
      .getValues();

  let mejor =
    null;

  datos.forEach(
    function(row, i) {
      const valorFecha =
        row[
          mapa.timestamp
        ];

      const fecha =
        valorFecha instanceof Date
          ? valorFecha
          : new Date(
              valorFecha
            );

      if (
        !fecha ||
        isNaN(
          fecha.getTime()
        )
      ) {
        return;
      }

      if (
        !mejor ||
        fecha.getTime() >
          mejor.timestamp.getTime()
      ) {
        const displays =
          hoja
            .getRange(
              i + 2,
              1,
              1,
              lastCol
            )
            .getDisplayValues()[0];

        mejor = {
          fila:
            i + 2,
          timestamp:
            fecha,
          nombre:
            construirNombreFormularioV1_(
              displays,
              mapa
            ),
          correo:
            displays[
              mapa.correoPreferido
            ] || ''
        };
      }
    }
  );

  if (!mejor) {
    throw new Error(
      'No se encontró ninguna marca temporal válida.'
    );
  }

  return mejor;
}


/**
 * Flujo único compartido por:
 * - el trigger real del formulario;
 * - el reproceso manual de una respuesta existente.
 */
function procesarPostulacionCompletaV1_(
  fila,
  origen
) {
  /*
   * V1.6:
   * El formulario solo crea una POSTULACIÓN PENDIENTE.
   * NO crea una persona en Variables_Internas.
   */
  const resultado =
    registrarPostulacionPendienteV16_(
      fila,
      true
    );

  resultado.origenEjecucion =
    origen || '';

  /*
   * Organiza adjuntos, crea/actualiza Seguimiento_Ingreso
   * y notifica SOLO a encargados internos.
   */
  try {
    if (
      typeof notificarFilaPostulacionV1_ ===
        'function'
    ) {
      resultado.avisoEncargados =
        notificarFilaPostulacionV1_(
          fila,
          true
        );
    } else {
      resultado.avisoEncargados = {
        estado:
          'MODULO_NO_INSTALADO',
        observacion:
          'Falta el módulo Ingreso_Documentacion_Notificaciones.'
      };
    }

  } catch (error) {
    const mensaje =
      error &&
      error.message
        ? error.message
        : String(error);

    console.error(
      '[AVISO POSTULACIÓN]',
      mensaje
    );

    resultado.avisoEncargados = {
      estado:
        'ERROR',
      observacion:
        mensaje
    };
  }

  console.log(
    '=== POSTULACIÓN RECIBIDA V1.6 ==='
  );

  console.log(
    resultado
  );

  return resultado;
}


/**
 * Lee y registra una postulación SIN crear Variables_Internas.
 */
function registrarPostulacionPendienteV16_(
  fila,
  escribir
) {
  const post =
    leerPostulacionFormularioV16_(
      fila
    );

  const ss =
    SpreadsheetApp.openById(
      RIM_IC_DB_ID
    );

  const hojaVariables =
    ss.getSheetByName(
      RIM_IC_HOJA_VARIABLES
    );

  if (!hojaVariables) {
    throw new Error(
      'No existe Variables_Internas.'
    );
  }

  /*
   * Se consulta Variables solo para detectar una identidad existente.
   * En esta etapa NO se escribe allí.
   */
  const busqueda =
    rimBuscarPersonaVariables_(
      hojaVariables,
      post.correos,
      post.ci
    );

  let alertaIdentidad =
    '';

  if (busqueda.conflicto) {
    alertaIdentidad =
      'La postulación coincide con más de una fila existente en Variables_Internas. Revisar identidad antes de aceptar.';
  } else if (busqueda.revisionCI) {
    alertaIdentidad =
      busqueda.alertaCI ||
      'El CI ya aparece en Variables_Internas con otro correo. Revisar antes de aceptar.';
  } else if (busqueda.encontrada) {
    alertaIdentidad =
      'La persona ya existe en Variables_Internas (fila ' +
      busqueda.fila +
      '). Revisar antes de aceptar una nueva postulación.';
  }

  const resultado = {
    accion:
      'POSTULACION_RECIBIDA',
    filaFormulario:
      fila,
    filaVariables:
      busqueda.encontrada
        ? busqueda.fila
        : '',
    correos:
      post.correos,
    ci:
      post.ci,
    nombre:
      post.nombre,
    horasDeclaradas:
      post.horasDeclaradas,
    ruta:
      RIM_IC_RUTA_ESTANDAR,
    horarioAdjunto:
      Boolean(
        post.adjuntoHorario
      ),
    alertaCI:
      alertaIdentidad,
    escribir:
      escribir,
    creaVariables:
      false
  };

  if (!escribir) {
    console.log(
      'DRY RUN POSTULACIÓN PENDIENTE V1.6:',
      resultado
    );

    return resultado;
  }

  /*
   * El horario pertenece a la POSTULACIÓN y puede vincularse
   * antes de la aceptación.
   */
  resultado.vinculacionHorario =
    vincularHorarioPostulacionV1_(
      ss,
      post.adjuntoHorario,
      fila,
      post.correos,
      post.ci,
      post.horasDeclaradas
    );

  registrarLogIngresoV1_(
    ss,
    resultado
  );

  return resultado;
}


/**
 * Parser único de la fila del formulario estándar.
 */
function leerPostulacionFormularioV16_(
  fila
) {
  const ssFuente =
    SpreadsheetApp.openById(
      RIM_IC_FORM_ESTANDAR_ID
    );

  const hojaFuente =
    ssFuente.getSheetByName(
      RIM_IC_FORM_ESTANDAR_HOJA
    );

  if (
    !hojaFuente ||
    fila < 2 ||
    fila > hojaFuente.getLastRow()
  ) {
    throw new Error(
      'Fila de postulación no válida.'
    );
  }

  const lastCol =
    hojaFuente.getLastColumn();

  const headers =
    hojaFuente
      .getRange(
        1,
        1,
        1,
        lastCol
      )
      .getDisplayValues()[0];

  const mapa =
    mapearFormularioEstandarV1_(
      headers
    );

  validarMapaFormularioEstandarV1_(
    mapa
  );

  const displays =
    hojaFuente
      .getRange(
        fila,
        1,
        1,
        lastCol
      )
      .getDisplayValues()[0];

  const correoPreferido =
    rimNormalizarCorreo_(
      displays[
        mapa.correoPreferido
      ]
    );

  const correoGoogle =
    rimNormalizarCorreo_(
      displays[
        mapa.correoGoogle
      ]
    );

  const correos =
    [
      correoPreferido,
      correoGoogle
    ]
      .filter(
        function(valor, indice, arr) {
          return (
            valor &&
            rimEsCorreoValido_(
              valor
            ) &&
            arr.indexOf(
              valor
            ) ===
              indice
          );
        }
      );

  if (!correos.length) {
    throw new Error(
      'La postulación no contiene un correo válido.'
    );
  }

  return {
    fila:
      fila,
    correos:
      correos,
    nombre:
      construirNombreFormularioV1_(
        displays,
        mapa
      ),
    ci:
      rimNormalizarCI_(
        displays[
          mapa.ci
        ]
      ),
    horasDeclaradas:
      rimNumero_(
        displays[
          mapa.horasSemanales
        ]
      ),
    adjuntoHorario:
      mapa.horarioPdf ===
        null
          ? ''
          : displays[
              mapa.horarioPdf
            ]
  };
}


/**
 * Prueba SIN ESCRIBIR una fila histórica.
 * Ejemplo:
 * probarFilaPostulacionSinEscribirV1(18)
 */
function probarFilaPostulacionSinEscribirV1(
  fila
) {
  return registrarPostulacionPendienteV16_(
    fila,
    false
  );
}



/* ============================================================
 * RESULTADO DE ENTREVISTA — BACKEND LISTO PARA LA WEB
 * ============================================================
 *
 * ACEPTADO:
 *   crea/actualiza Variables_Internas y activa cursos.
 *
 * RECHAZADO / NO ACEPTADO / DENEGADO:
 *   permanece solo en Seguimiento_Ingreso.
 *
 * Nunca elimina automáticamente una persona ya creada.
 * ============================================================ */

function registrarResultadoEntrevistaV16(
  correo,
  resultado,
  entrevistador,
  fechaEntrevista,
  observacion
) {
  const correoN =
    rimNormalizarCorreo_(
      correo
    );

  if (
    !correoN ||
    !rimEsCorreoValido_(
      correoN
    )
  ) {
    throw new Error(
      'Correo de postulante no válido.'
    );
  }

  const decisionN =
    rimNormalizarSinAcentos_(
      resultado
    );

  const aceptado =
    decisionN ===
      'aceptado';

  const rechazado =
    [
      'rechazado',
      'no aceptado',
      'no_aceptado',
      'denegado'
    ].indexOf(
      decisionN
    ) >= 0;

  if (
    !aceptado &&
    !rechazado
  ) {
    throw new Error(
      'Resultado no permitido. Usa Aceptado o Rechazado/No aceptado.'
    );
  }

  const ss =
    SpreadsheetApp.openById(
      RIM_IC_DB_ID
    );

  const seguimiento =
    ss.getSheetByName(
      'Seguimiento_Ingreso'
    );

  if (!seguimiento) {
    throw new Error(
      'No existe Seguimiento_Ingreso.'
    );
  }

  const seg =
    buscarSeguimientoPorCorreoV16_(
      seguimiento,
      correoN
    );

  if (!seg) {
    throw new Error(
      'No existe una postulación en Seguimiento_Ingreso para ' +
      correoN +
      '.'
    );
  }

  const filaFormulario =
    Number(
      valorSeguimientoPorHeaderV16_(
        seguimiento,
        seg.fila,
        seg.headers,
        'Fila formulario'
      )
    ) ||
    buscarFilaFormularioMasRecientePorCorreoV16_(
      correoN
    );

  if (
    !filaFormulario ||
    filaFormulario < 2
  ) {
    throw new Error(
      'No se pudo identificar la fila fuente del formulario.'
    );
  }

  const fecha =
    fechaEntrevista instanceof Date
      ? fechaEntrevista
      : (
          fechaEntrevista
            ? new Date(
                fechaEntrevista
              )
            : new Date()
        );

  if (
    isNaN(
      fecha.getTime()
    )
  ) {
    throw new Error(
      'Fecha de entrevista no válida.'
    );
  }

  const hojaVariables =
    ss.getSheetByName(
      RIM_IC_HOJA_VARIABLES
    );

  if (!hojaVariables) {
    throw new Error(
      'No existe Variables_Internas.'
    );
  }

  const existenteVariables =
    rimBuscarPersonaVariables_(
      hojaVariables,
      [
        correoN
      ],
      ''
    );

  /*
   * RECHAZADO:
   * queda solo en Seguimiento_Ingreso.
   */
  if (rechazado) {
    if (
      existenteVariables.encontrada ||
      existenteVariables.conflicto
    ) {
      throw new Error(
        'La persona ya existe en Variables_Internas. El rechazo no eliminará datos automáticamente; requiere revisión manual.'
      );
    }

    actualizarDatosEntrevistaSeguimientoV16_(
      seguimiento,
      seg,
      'Rechazado',
      'Denegado',
      entrevistador,
      fecha,
      observacion
    );

    SpreadsheetApp.flush();

    const salidaRechazo = {
      correo:
        correoN,
      resultado:
        'Rechazado',
      filaFormulario:
        filaFormulario,
      creadoEnVariables:
        false,
      estadoIngreso:
        'Denegado',
      escritura:
        true
    };

    console.log(
      '=== RESULTADO ENTREVISTA V1.7 ==='
    );
    console.log(
      salidaRechazo
    );

    return salidaRechazo;
  }

  /*
   * ACEPTADO:
   * recién aquí se crea/actualiza Variables_Internas.
   * Primero completamos el alta; solo si termina correctamente
   * confirmamos la entrevista en Seguimiento_Ingreso.
   */
  const ingreso =
    procesarFilaPostulacionEstandarV1_(
      filaFormulario,
      true,
      true
    );

  const columnasVariablesV17 =
    RIM_IC_columnasVariablesV17_(
      hojaVariables
    );

  hojaVariables
    .getRange(
      ingreso.filaVariables,
      columnasVariablesV17.decision
    )
    .setValue(
      'Aceptado'
    );

  const cursos =
    sincronizarCursosTodos();

  SpreadsheetApp.flush();

  const estadoIngreso =
    hojaVariables
      .getRange(
        ingreso.filaVariables,
        columnasVariablesV17.estadoIngreso
      )
      .getDisplayValue();

  actualizarDatosEntrevistaSeguimientoV16_(
    seguimiento,
    seg,
    'Aceptado',
    estadoIngreso ||
      'Cursos en progreso',
    entrevistador,
    fecha,
    observacion
  );

  SpreadsheetApp.flush();

  const salidaAceptacion = {
    correo:
      correoN,
    resultado:
      'Aceptado',
    filaFormulario:
      filaFormulario,
    filaVariables:
      ingreso.filaVariables,
    creadoEnVariables:
      ingreso.accion ===
        'CREAR_PERSONA',
    accionVariables:
      ingreso.accion,
    estadoIngreso:
      estadoIngreso,
    cursos:
      cursos,
    escritura:
      true
  };

  console.log(
    '=== RESULTADO ENTREVISTA V1.7 ==='
  );
  console.log(
    salidaAceptacion
  );

  return salidaAceptacion;
}


function actualizarDatosEntrevistaSeguimientoV16_(
  hoja,
  seg,
  resultado,
  estadoIngreso,
  entrevistador,
  fecha,
  observacion
) {
  escribirSeguimientoPorHeaderV16_(
    hoja,
    seg.fila,
    seg.headers,
    'Resultado entrevista',
    resultado
  );

  escribirSeguimientoPorHeaderV16_(
    hoja,
    seg.fila,
    seg.headers,
    'Estado de ingreso',
    estadoIngreso
  );

  escribirSeguimientoPorHeaderV16_(
    hoja,
    seg.fila,
    seg.headers,
    'Fecha entrevista',
    fecha
  );

  escribirSeguimientoPorHeaderV16_(
    hoja,
    seg.fila,
    seg.headers,
    'Entrevistador/a',
    entrevistador || ''
  );

  escribirSeguimientoPorHeaderV16_(
    hoja,
    seg.fila,
    seg.headers,
    'Estado programación entrevista',
    'REALIZADA'
  );

  if (observacion) {
    const anterior =
      String(
        valorSeguimientoPorHeaderV16_(
          hoja,
          seg.fila,
          seg.headers,
          'Observación'
        ) || ''
      ).trim();

    escribirSeguimientoPorHeaderV16_(
      hoja,
      seg.fila,
      seg.headers,
      'Observación',
      [
        anterior,
        String(
          observacion
        ).trim()
      ]
        .filter(Boolean)
        .join(
          ' | '
        )
    );
  }
}


function buscarSeguimientoPorCorreoV16_(
  hoja,
  correo
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return null;
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

  const idxCorreo =
    headers.indexOf(
      'Correo oficial'
    );

  if (
    idxCorreo < 0
  ) {
    throw new Error(
      'Seguimiento_Ingreso no tiene la columna Correo oficial.'
    );
  }

  const valores =
    hoja
      .getRange(
        2,
        idxCorreo + 1,
        hoja.getLastRow() - 1,
        1
      )
      .getDisplayValues()
      .flat();

  for (
    let i =
      valores.length - 1;
    i >= 0;
    i--
  ) {
    if (
      rimNormalizarCorreo_(
        valores[i]
      ) ===
        correo
    ) {
      return {
        fila:
          i + 2,
        headers:
          headers
      };
    }
  }

  return null;
}


function valorSeguimientoPorHeaderV16_(
  hoja,
  fila,
  headers,
  header
) {
  const idx =
    headers.indexOf(
      header
    );

  if (
    idx < 0
  ) {
    return '';
  }

  return hoja
    .getRange(
      fila,
      idx + 1
    )
    .getValue();
}


function escribirSeguimientoPorHeaderV16_(
  hoja,
  fila,
  headers,
  header,
  valor
) {
  const idx =
    headers.indexOf(
      header
    );

  if (
    idx < 0
  ) {
    throw new Error(
      'Falta la columna "' +
      header +
      '" en Seguimiento_Ingreso. Ejecuta prepararInfraestructuraIngresoDocumentacionV1().'
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


function buscarFilaFormularioMasRecientePorCorreoV16_(
  correo
) {
  const ssFuente =
    SpreadsheetApp.openById(
      RIM_IC_FORM_ESTANDAR_ID
    );

  const hoja =
    ssFuente.getSheetByName(
      RIM_IC_FORM_ESTANDAR_HOJA
    );

  if (
    !hoja ||
    hoja.getLastRow() < 2
  ) {
    return null;
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
    mapearFormularioEstandarV1_(
      headers
    );

  validarMapaFormularioEstandarV1_(
    mapa
  );

  const valores =
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        lastCol
      )
      .getValues();

  const displays =
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        lastCol
      )
      .getDisplayValues();

  let mejor =
    null;

  valores.forEach(
    function(row, i) {
      const correosFila =
        [
          rimNormalizarCorreo_(
            displays[i][
              mapa.correoPreferido
            ]
          ),
          rimNormalizarCorreo_(
            displays[i][
              mapa.correoGoogle
            ]
          )
        ];

      if (
        correosFila.indexOf(
          correo
        ) < 0
      ) {
        return;
      }

      const fecha =
        row[
          mapa.timestamp
        ] instanceof Date
          ? row[
              mapa.timestamp
            ]
          : new Date(
              row[
                mapa.timestamp
              ]
            );

      if (
        !fecha ||
        isNaN(
          fecha.getTime()
        )
      ) {
        return;
      }

      if (
        !mejor ||
        fecha.getTime() >
          mejor.fecha.getTime()
      ) {
        mejor = {
          fila:
            i + 2,
          fecha:
            fecha
        };
      }
    }
  );

  return mejor
    ? mejor.fila
    : null;
}


/* ============================================================
 * LEGACY DE ALTA A VARIABLES
 * Solo debe llamarse DESPUÉS de una entrevista aceptada.
 * ============================================================ */

function procesarFilaPostulacionEstandarV1_(
  fila,
  escribir,
  omitirSincronizacionCursos
) {
  const ssFuente =
    SpreadsheetApp.openById(
      RIM_IC_FORM_ESTANDAR_ID
    );

  const hojaFuente =
    ssFuente.getSheetByName(
      RIM_IC_FORM_ESTANDAR_HOJA
    );

  if (
    !hojaFuente ||
    fila < 2 ||
    fila > hojaFuente.getLastRow()
  ) {
    throw new Error(
      'Fila de postulación no válida.'
    );
  }

  const lastCol =
    hojaFuente.getLastColumn();

  const headers =
    hojaFuente
      .getRange(
        1,
        1,
        1,
        lastCol
      )
      .getDisplayValues()[0];

  const mapa =
    mapearFormularioEstandarV1_(
      headers
    );

  validarMapaFormularioEstandarV1_(
    mapa
  );

  const valores =
    hojaFuente
      .getRange(
        fila,
        1,
        1,
        lastCol
      )
      .getValues()[0];

  const displays =
    hojaFuente
      .getRange(
        fila,
        1,
        1,
        lastCol
      )
      .getDisplayValues()[0];

  const correoPreferido =
    rimNormalizarCorreo_(
      displays[
        mapa.correoPreferido
      ]
    );

  const correoGoogle =
    rimNormalizarCorreo_(
      displays[
        mapa.correoGoogle
      ]
    );

  const correos =
    [
      correoPreferido,
      correoGoogle
    ]
      .filter(function(valor, indice, arr) {
        return (
          valor &&
          rimEsCorreoValido_(valor) &&
          arr.indexOf(valor) === indice
        );
      });

  if (!correos.length) {
    throw new Error(
      'La postulación no contiene un correo válido.'
    );
  }

  const nombre =
    construirNombreFormularioV1_(
      displays,
      mapa
    );

  const ci =
    rimNormalizarCI_(
      displays[mapa.ci]
    );

  const horasDeclaradas =
    rimNumero_(
      displays[
        mapa.horasSemanales
      ]
    );

  const adjuntoHorario =
    mapa.horarioPdf === null
      ? ''
      : displays[
          mapa.horarioPdf
        ];

  const ss =
    SpreadsheetApp.openById(
      RIM_IC_DB_ID
    );

  const hojaVariables =
    ss.getSheetByName(
      RIM_IC_HOJA_VARIABLES
    );

  if (!hojaVariables) {
    throw new Error(
      'No existe Variables_Internas.'
    );
  }

  const busqueda =
    rimBuscarPersonaVariables_(
      hojaVariables,
      correos,
      ci
    );

  if (busqueda.conflicto) {
    const resultadoConflicto = {
      accion:
        'CONFLICTO_IDENTIDAD',
      filaFormulario:
        fila,
      filasVariables:
        busqueda.filasCoincidentes,
      correos:
        correos,
      ci:
        ci,
      alertaCI:
        busqueda.alertaCI || '',
      escribir:
        escribir
    };

    if (escribir) {
      registrarLogIngresoV1_(
        ss,
        resultadoConflicto
      );
    }

    throw new Error(
      'La postulación coincide por correo con más de una persona en Variables_Internas. No se actualizó automáticamente.'
    );
  }

  if (busqueda.revisionCI) {
    const resultadoRevision = {
      accion:
        'REVISAR_CI_ANTES_DE_CREAR',
      filaFormulario:
        fila,
      filasVariables:
        busqueda.filasCI || [],
      correos:
        correos,
      ci:
        ci,
      nombre:
        nombre,
      alertaCI:
        busqueda.alertaCI || '',
      escribir:
        escribir
    };

    if (escribir) {
      registrarLogIngresoV1_(
        ss,
        resultadoRevision
      );
    }

    throw new Error(
      'No hubo coincidencia por correo, pero el CI ya aparece en Variables_Internas. Se requiere revisión antes de crear una nueva persona.'
    );
  }

  let filaVariables =
    busqueda.encontrada
      ? busqueda.fila
      : hojaVariables.getLastRow() + 1;

  const accion =
    busqueda.encontrada
      ? 'ACTUALIZAR_EXISTENTE'
      : 'CREAR_PERSONA';

  const resultado = {
    accion:
      accion,
    filaFormulario:
      fila,
    filaVariables:
      filaVariables,
    correos:
      correos,
    ci:
      ci,
    nombre:
      nombre,
    horasDeclaradas:
      horasDeclaradas,
    ruta:
      RIM_IC_RUTA_ESTANDAR,
    horarioAdjunto:
      Boolean(adjuntoHorario),
    alertaCI:
      busqueda.alertaCI || '',
    escribir:
      escribir
  };

  if (!escribir) {
    console.log(
      'DRY RUN INGRESO:',
      resultado
    );

    Logger.log(
      JSON.stringify(resultado)
    );

    return resultado;
  }

  if (!busqueda.encontrada) {
    escribirNuevaPersonaV1_(
      hojaVariables,
      filaVariables,
      correos,
      ci,
      nombre
    );
  } else {
    completarIdentidadExistenteV1_(
      hojaVariables,
      filaVariables,
      correos,
      ci,
      nombre
    );
  }

  const vinculacion =
    vincularHorarioPostulacionV1_(
      ss,
      adjuntoHorario,
      fila,
      correos,
      ci,
      horasDeclaradas
    );

  resultado.vinculacionHorario =
    vinculacion;

  registrarLogIngresoV1_(
    ss,
    resultado
  );

  /*
   * Las llamadas auxiliares pueden omitir esta primera sincronización
   * cuando el flujo de aceptación ejecutará sincronizarCursosTodos()
   * inmediatamente después con el estado definitivo.
   */
  if (!omitirSincronizacionCursos) {
    procesarCursosTodosV1_(
      true
    );
  }

  return resultado;
}


function escribirNuevaPersonaV1_(
  hoja,
  fila,
  correos,
  ci,
  nombre
) {
  const columnas =
    RIM_IC_columnasVariablesV17_(
      hoja
    );

  const correoA =
    correos[0] || '';

  const correoB =
    correos.length > 1 &&
    correos[1] !== correoA
      ? correos[1]
      : '';

  hoja
    .getRange(
      fila,
      columnas.correoA
    )
    .setValue(
      correoA
    );

  if (
    columnas.correoB > 0
  ) {
    hoja
      .getRange(
        fila,
        columnas.correoB
      )
      .setValue(
        correoB
      );
  }

  hoja
    .getRange(
      fila,
      columnas.nombre
    )
    .setValue(
      nombre || ''
    );

  hoja
    .getRange(
      fila,
      columnas.estadoIngreso
    )
    .setValue(
      RIM_IC_ESTADO_POSTULACION
    );

  if (ci) {
    hoja
      .getRange(
        fila,
        columnas.ci
      )
      .setValue(
        ci
      );
  }

  hoja
    .getRange(
      fila,
      columnas.ruta
    )
    .setValue(
      RIM_IC_RUTA_ESTANDAR
    );
}

function completarIdentidadExistenteV1_(
  hoja,
  fila,
  correos,
  ci,
  nombre
) {
  const columnas =
    RIM_IC_columnasVariablesV17_(
      hoja
    );

  const row =
    hoja
      .getRange(
        fila,
        1,
        1,
        hoja.getLastColumn()
      )
      .getValues()[0];

  const correoA =
    rimNormalizarCorreo_(
      RIM_IC_valorFilaV17_(
        row,
        columnas.correoA
      )
    );

  const correoB =
    columnas.correoB > 0
      ? rimNormalizarCorreo_(
          RIM_IC_valorFilaV17_(
            row,
            columnas.correoB
          )
        )
      : '';

  if (
    !correoA &&
    correos[0]
  ) {
    hoja
      .getRange(
        fila,
        columnas.correoA
      )
      .setValue(
        correos[0]
      );
  }

  if (
    columnas.correoB > 0 &&
    !correoB
  ) {
    const candidato =
      correos.find(function(correo) {
        return correo !== correoA;
      });

    if (candidato) {
      hoja
        .getRange(
          fila,
          columnas.correoB
        )
        .setValue(
          candidato
        );
    }
  }

  if (
    !rimNormalizarTexto_(
      RIM_IC_valorFilaV17_(
        row,
        columnas.nombre
      )
    ) &&
    nombre
  ) {
    hoja
      .getRange(
        fila,
        columnas.nombre
      )
      .setValue(
        nombre
      );
  }

  const ciActual =
    rimNormalizarCI_(
      RIM_IC_valorFilaV17_(
        row,
        columnas.ci
      )
    );

  if (
    !ciActual &&
    ci
  ) {
    hoja
      .getRange(
        fila,
        columnas.ci
      )
      .setValue(
        ci
      );
  }

  if (
    !rimNormalizarTexto_(
      RIM_IC_valorFilaV17_(
        row,
        columnas.estadoIngreso
      )
    )
  ) {
    hoja
      .getRange(
        fila,
        columnas.estadoIngreso
      )
      .setValue(
        RIM_IC_ESTADO_POSTULACION
      );
  }

  if (
    !rimNormalizarTexto_(
      RIM_IC_valorFilaV17_(
        row,
        columnas.ruta
      )
    )
  ) {
    hoja
      .getRange(
        fila,
        columnas.ruta
      )
      .setValue(
        RIM_IC_RUTA_ESTANDAR
      );
  }
}

function mapearFormularioEstandarV1_(
  headers
) {
  const norm =
    headers.map(
      normalizarHeaderIngresoV1_
    );

  function buscar(condicion) {
    const indice =
      norm.findIndex(
        condicion
      );

    return indice >= 0
      ? indice
      : null;
  }

  return {
    timestamp:
      buscar(function(h) {
        return h === 'marca temporal';
      }),

    correoPreferido:
      buscar(function(h) {
        return (
          h.indexOf('correo') >= 0 &&
          h.indexOf('institucional') >= 0 &&
          h.indexOf('preferencia') >= 0
        );
      }),

    correoGoogle:
      buscar(function(h) {
        return (
          h ===
          'direccion de correo electronico'
        );
      }),

    primerNombre:
      buscar(function(h) {
        return h === 'primer nombre';
      }),

    segundoNombre:
      buscar(function(h) {
        return h === 'segundo nombre';
      }),

    primerApellido:
      buscar(function(h) {
        return h === 'primer apellido';
      }),

    segundoApellido:
      buscar(function(h) {
        return h === 'segundo apellido';
      }),

    ci:
      buscar(function(h) {
        return (
          h.indexOf(
            'carnet de identidad'
          ) >= 0
        );
      }),

    horarioPdf:
      buscar(function(h) {
        return (
          h.indexOf(
            'para generar tu horario'
          ) >= 0
        );
      }),

    horasSemanales:
      buscar(function(h) {
        return (
          h.indexOf(
            'horas a la semana disponible'
          ) >= 0
        );
      })
  };
}


function validarMapaFormularioEstandarV1_(
  mapa
) {
  [
    'correoPreferido',
    'correoGoogle',
    'primerNombre',
    'primerApellido',
    'ci',
    'horasSemanales'
  ].forEach(function(campo) {
    if (
      mapa[campo] === null ||
      mapa[campo] === undefined
    ) {
      throw new Error(
        'No se pudo identificar la columna "' +
        campo +
        '" del formulario.'
      );
    }
  });
}


function construirNombreFormularioV1_(
  valores,
  mapa
) {
  return [
    mapa.primerNombre === null
      ? ''
      : valores[
          mapa.primerNombre
        ],

    mapa.segundoNombre === null
      ? ''
      : valores[
          mapa.segundoNombre
        ],

    mapa.primerApellido === null
      ? ''
      : valores[
          mapa.primerApellido
        ],

    mapa.segundoApellido === null
      ? ''
      : valores[
          mapa.segundoApellido
        ]
  ]
    .map(rimNormalizarTexto_)
    .filter(Boolean)
    .join(' ');
}


function normalizarHeaderIngresoV1_(
  valor
) {
  return rimNormalizarSinAcentos_(
    valor
  )
    .replace(
      /[¿?¡!()[\]{}:;,.\/\\_-]+/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
}


/* ============================================================
 * VINCULAR PDF DE HORARIO ELEGIDO
 * ============================================================
 */

function vincularHorarioPostulacionV1_(
  ss,
  textoAdjunto,
  filaFormulario,
  correos,
  ci,
  horasDeclaradas
) {
  if (!textoAdjunto) {
    return {
      estado:
        'SIN_ADJUNTO',
      observacion:
        'La respuesta no contiene PDF de horario.'
    };
  }

  const hoja =
    ss.getSheetByName(
      RIM_IC_HOJA_HORARIOS_POST
    );

  if (!hoja) {
    return {
      estado:
        'HOJA_NO_PREPARADA',
      observacion:
        'No existe Horarios_Postulacion.'
    };
  }

  const idsDrive =
    extraerIdsDriveIngresoV1_(
      textoAdjunto
    );

  if (!idsDrive.length) {
    return {
      estado:
        'ARCHIVO_NO_IDENTIFICADO',
      observacion:
        'No se pudo extraer el archivo subido.'
    };
  }

  const candidatos = [];

  idsDrive.forEach(function(idDrive) {
    try {
      const archivo =
        DriveApp.getFileById(
          idDrive
        );

      const nombre =
        archivo.getName();

      const match =
        nombre.match(
          /(HR-\d{8}-[A-Z0-9]{8})/i
        );

      if (match) {
        candidatos.push({
          idHorario:
            match[1].toUpperCase(),
          idDrive:
            idDrive,
          nombreArchivo:
            nombre
        });
      }
    } catch (error) {
      /*
       * No se detiene la importación de la persona por un
       * archivo al que momentáneamente no se pueda acceder.
       */
    }
  });

  if (!candidatos.length) {
    return {
      estado:
        'PDF_SIN_CODIGO',
      observacion:
        'El PDF subido no contiene un código HR reconocido en el nombre.'
    };
  }

  if (candidatos.length > 1) {
    return {
      estado:
        'MULTIPLES_PDF_HORARIO',
      observacion:
        'Se detectó más de un PDF con código HR. Revisión necesaria.'
    };
  }

  const candidato =
    candidatos[0];

  const lastRow =
    hoja.getLastRow();

  if (lastRow <= 1) {
    return {
      estado:
        'CODIGO_NO_ENCONTRADO',
      idHorario:
        candidato.idHorario
    };
  }

  const ids =
    hoja
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return rimNormalizarTexto_(
          valor
        ).toUpperCase();
      });

  const indice =
    ids.lastIndexOf(
      candidato.idHorario
    );

  if (indice < 0) {
    return {
      estado:
        'CODIGO_NO_ENCONTRADO',
      idHorario:
        candidato.idHorario
    };
  }

  const fila =
    indice + 2;

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
    {};

  headers.forEach(function(header, idx) {
    mapa[
      normalizarHeaderIngresoV1_(
        header
      )
    ] = idx + 1;
  });

  function col(nombre) {
    return mapa[
      normalizarHeaderIngresoV1_(
        nombre
      )
    ] || 0;
  }

  const correoPrincipal =
    correos[0] || '';

  const correoAlternativo =
    correos.length > 1
      ? correos[1]
      : '';

  const horasHorario =
    rimNumero_(
      hoja
        .getRange(
          fila,
          col(
            'Horas semanales'
          )
        )
        .getValue()
    );

  let observacion = '';

  if (
    horasDeclaradas !== null &&
    horasHorario !== null &&
    Math.abs(
      horasDeclaradas -
      horasHorario
    ) > 0.25
  ) {
    observacion =
      'Las horas declaradas en el formulario (' +
      horasDeclaradas +
      ') no coinciden con el PDF (' +
      horasHorario +
      ').';
  }

  const actualizaciones = [
    [
      'Estado',
      'VINCULADO A POSTULACIÓN'
    ],
    [
      'Fecha vinculación',
      new Date()
    ],
    [
      'Fila respuesta formulario',
      filaFormulario
    ],
    [
      'Correo formulario principal',
      correoPrincipal
    ],
    [
      'Correo formulario alternativo',
      correoAlternativo
    ],
    [
      'CI formulario',
      ci
    ],
    [
      'Horas declaradas formulario',
      horasDeclaradas === null
        ? ''
        : horasDeclaradas
    ],
    [
      'Observación',
      observacion
    ],
    [
      'ID archivo PDF',
      candidato.idDrive
    ],
    [
      'Nombre archivo PDF',
      candidato.nombreArchivo
    ],
    [
      'Fecha última actualización',
      new Date()
    ]
  ];

  actualizaciones.forEach(
    function(par) {
      const c =
        col(par[0]);

      if (c) {
        hoja
          .getRange(
            fila,
            c
          )
          .setValue(
            par[1]
          );
      }
    }
  );

  return {
    estado:
      'VINCULADO',
    idHorario:
      candidato.idHorario,
    filaHorario:
      fila,
    observacion:
      observacion
  };
}


function extraerIdsDriveIngresoV1_(
  texto
) {
  const encontrados =
    String(texto || '')
      .match(
        /[-\w]{25,}/g
      ) || [];

  return encontrados.filter(
    function(valor, indice, arr) {
      return (
        arr.indexOf(valor) === indice
      );
    }
  );
}


/* ============================================================
 * CURSOS
 * ============================================================
 */

function sincronizarCursosTodos() {
  const resultado =
    procesarCursosTodosV1_(
      true
    );

  /*
   * Las tablas de seguimiento/documentación dependen de:
   * - estado de ingreso;
   * - cursos completados;
   * - formalización/extensión.
   *
   * Al integrarlas aquí:
   * - ON_EDIT las actualiza;
   * - el Motor horario las actualiza;
   * - una sincronización manual de cursos también las actualiza.
   *
   * No se agrega un trigger nuevo.
   */
  try {
    if (
      typeof sincronizarSeguimientoIngresoV1 ===
        'function'
    ) {
      resultado.seguimientoIngreso =
        sincronizarSeguimientoIngresoV1();
    }
  } catch (errorSeguimiento) {
    resultado.seguimientoIngreso = {
      estado:
        'ERROR',
      observacion:
        errorSeguimiento &&
        errorSeguimiento.message
          ? errorSeguimiento.message
          : String(errorSeguimiento)
    };
  }

  try {
    if (
      typeof sincronizarDocumentacionPasantiaV1 ===
        'function'
    ) {
      resultado.documentacionPasantia =
        sincronizarDocumentacionPasantiaV1();
    }
  } catch (errorDocumentacion) {
    resultado.documentacionPasantia = {
      estado:
        'ERROR',
      observacion:
        errorDocumentacion &&
        errorDocumentacion.message
          ? errorDocumentacion.message
          : String(errorDocumentacion)
    };
  }

  return resultado;
}


function procesarCursosTodosV1_(
  escribir,
  nombreHojaVariables
) {
  const ss =
    SpreadsheetApp.openById(
      RIM_IC_DB_ID
    );

  const hojaVariables =
    ss.getSheetByName(
      nombreHojaVariables ||
      RIM_IC_HOJA_VARIABLES
    );

  const hojaCursos =
    ss.getSheetByName(
      RIM_IC_HOJA_DATOS_CURSOS
    );

  if (
    !hojaVariables ||
    !hojaCursos
  ) {
    throw new Error(
      'Falta Variables_Internas o Datos_Cursos.'
    );
  }

  if (escribir) {
    prepararCatalogoCursosV1_(
      ss
    );
  }

  const hojaCatalogo =
    ss.getSheetByName(
      RIM_IC_HOJA_CATALOGO
    );

  if (!hojaCatalogo) {
    throw new Error(
      'No existe Catalogo_Cursos.'
    );
  }

  const catalogo =
    leerCatalogoCursosV1_(ss);

  const personas =
    leerPersonasCursosV1_(
      hojaVariables
    );

  const filasCursos =
    leerDatosCursosV1_(
      hojaCursos
    );

  const asignacion =
    asignarCursosAPersonasV1_(
      personas,
      filasCursos
    );

  const control = [];
  let personasCompletas = 0;
  let alertasIntentos = 0;

  personas.forEach(function(persona) {
    let aprobados = 0;
    let fechaCompleta = null;

    catalogo.forEach(function(curso) {
      const clave =
        persona.fila +
        '|' +
        curso.clave;

      const intentos =
        (
          asignacion.porPersonaCurso[
            clave
          ] || []
        )
          .slice()
          .sort(
            compararIntentosCursoV1_
          );

      const oficial =
        intentos.length
          ? intentos[0]
          : null;

      let estado =
        'PENDIENTE';

      let nota = '';
      let fecha = '';
      let correoUsado = '';
      let alerta = '';

      if (oficial) {
        nota =
          oficial.nota === null
            ? ''
            : oficial.nota;

        fecha =
          oficial.fecha || '';

        correoUsado =
          oficial.correoPrincipal ||
          '';

        if (
          oficial.nota !== null &&
          oficial.nota >=
            curso.notaMinima
        ) {
          estado =
            'APROBADO';

          aprobados++;

          if (
            rimFechaValida_(
              oficial.fecha
            ) &&
            (
              !fechaCompleta ||
              oficial.fecha >
                fechaCompleta
            )
          ) {
            fechaCompleta =
              oficial.fecha;
          }
        } else {
          estado =
            'NO APROBADO';
        }

        if (
          intentos.length > 1
        ) {
          alerta =
            'INTENTOS MÚLTIPLES: se tomó únicamente el primer intento cronológico. Revisar si corresponde una excepción.';

          alertasIntentos++;
        }
      }

      control.push({
        filaVariables:
          persona.fila,

        correoA:
          persona.correoA,

        correoB:
          persona.correoB,

        correoOficial:
          persona.correoA,

        nombre:
          persona.nombre,

        curso:
          curso.nombre,

        estadoCurso:
          estado,

        notaOficial:
          nota,

        fechaIntentoOficial:
          fecha,

        correoUsadoIntentoOficial:
          correoUsado,

        intentosDetectados:
          intentos.length,

        correosDetectados:
          intentos
            .reduce(
              function(acum, intento) {
                intento.correos.forEach(
                  function(correo) {
                    if (
                      acum.indexOf(
                        correo
                      ) < 0
                    ) {
                      acum.push(
                        correo
                      );
                    }
                  }
                );
                return acum;
              },
              []
            )
            .join(' | '),

        alerta:
          alerta,

        fechaProcesamiento:
          new Date()
      });
    });

    const completos =
      aprobados ===
      catalogo.length;

    if (completos) {
      personasCompletas++;
    }

    if (escribir) {
      actualizarVariablesDesdeCursosV1_(
        hojaVariables,
        persona,
        completos,
        fechaCompleta
      );
    }
  });

  if (escribir) {
    prepararControlCursosV1_(
      ss
    );

    const hojaControl =
      ss.getSheetByName(
        RIM_IC_HOJA_CONTROL_CURSOS
      );

    const headersControl =
      hojaControl
        .getRange(
          1,
          1,
          1,
          hojaControl.getLastColumn()
        )
        .getDisplayValues()[0];

    const filasControl =
      control.map(
        function(item) {
          return RIM_IC_proyectarControlCurso_(
            item
          );
        }
      );

    if (
      hojaControl.getLastRow() > 1
    ) {
      hojaControl
        .getRange(
          2,
          1,
          hojaControl.getLastRow() - 1,
          hojaControl.getLastColumn()
        )
        .clearContent();
    }

    if (filasControl.length) {
      hojaControl
        .getRange(
          2,
          1,
          filasControl.length,
          headersControl.length
        )
        .setValues(
          filasControl
        );
    }
  }

  const resultado = {
    personas:
      personas.length,
    cursosRequeridos:
      catalogo.length,
    registrosCursos:
      filasCursos.length,
    registrosAsignados:
      asignacion.asignados,
    registrosSinPersona:
      asignacion.sinPersona,
    conflictosIdentidad:
      asignacion.conflictos,
    personasCursosCompletos:
      personasCompletas,
    alertasIntentosMultiples:
      alertasIntentos,
    hojaVariables:
      hojaVariables.getName(),
    filasControlPropuestas:
      control.length,
    escritura:
      escribir
  };

  console.log(
    escribir
      ? 'SINCRONIZACIÓN CURSOS:'
      : 'DRY RUN CURSOS:',
    resultado
  );

  Logger.log(
    JSON.stringify(resultado)
  );

  return resultado;
}


function leerPersonasCursosV1_(
  hoja
) {
  const lastRow =
    hoja.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const columnas =
    RIM_IC_columnasVariablesV17_(
      hoja
    );

  const datos =
    hoja
      .getRange(
        2,
        1,
        lastRow - 1,
        hoja.getLastColumn()
      )
      .getValues();

  return datos.map(
    function(row, indice) {
      return {
        fila:
          indice + 2,

        correoA:
          rimNormalizarCorreo_(
            RIM_IC_valorFilaV17_(
              row,
              columnas.correoA
            )
          ),

        correoB:
          columnas.correoB > 0
            ? rimNormalizarCorreo_(
                RIM_IC_valorFilaV17_(
                  row,
                  columnas.correoB
                )
              )
            : '',

        decision:
          rimNormalizarTexto_(
            RIM_IC_valorFilaV17_(
              row,
              columnas.decision
            )
          ),

        nombre:
          rimNormalizarTexto_(
            RIM_IC_valorFilaV17_(
              row,
              columnas.nombre
            )
          ),

        estadoIngreso:
          rimNormalizarTexto_(
            RIM_IC_valorFilaV17_(
              row,
              columnas.estadoIngreso
            )
          ),

        fechaCursos:
          RIM_IC_valorFilaV17_(
            row,
            columnas.fechaCursos
          ),

        ci:
          rimNormalizarCI_(
            RIM_IC_valorFilaV17_(
              row,
              columnas.ci
            )
          ),

        ruta:
          rimNormalizarTexto_(
            RIM_IC_valorFilaV17_(
              row,
              columnas.ruta
            )
          )
      };
    }
  );
}

function leerDatosCursosV1_(
  hoja
) {
  const lastRow =
    hoja.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const datos =
    hoja
      .getRange(
        2,
        1,
        lastRow - 1,
        8
      )
      .getValues();

  return datos
    .map(function(row, indice) {
      const correos =
        []
          .concat(
            rimExtraerCorreos_(
              row[2]
            )
          )
          .concat(
            rimExtraerCorreos_(
              row[4]
            )
          )
          .filter(
            function(valor, idx, arr) {
              return (
                arr.indexOf(
                  valor
                ) === idx
              );
            }
          );

      return {
        fila:
          indice + 2,
        curso:
          rimNormalizarTexto_(
            row[0]
          ),
        claveCurso:
          normalizarCursoV1_(
            row[0]
          ),
        fecha:
          rimFechaValida_(
            row[1]
          )
            ? row[1]
            : null,
        correos:
          correos,
        correoPrincipal:
          correos[0] || '',
        nombre:
          rimNormalizarTexto_(
            row[3]
          ),
        nota:
          rimNumero_(
            row[7]
          )
      };
    })
    .filter(function(row) {
      return (
        row.curso &&
        row.claveCurso
      );
    });
}


function asignarCursosAPersonasV1_(
  personas,
  filasCursos
) {
  const alias = {};

  personas.forEach(function(persona) {
    [
      persona.correoA,
      persona.correoB
    ].forEach(function(correo) {
      if (correo) {
        alias[correo] =
          persona.fila;
      }
    });
  });

  const asignadas = {};
  const conflictosRows = {};

  /*
   * Varias pasadas permiten que una respuesta donde C coincide
   * con un alias conocido enseñe al proceso que E es otro alias
   * de esa misma persona para las demás respuestas.
   */
  let cambio = true;
  let vueltas = 0;

  while (
    cambio &&
    vueltas < 5
  ) {
    cambio = false;
    vueltas++;

    filasCursos.forEach(function(row) {
      if (
        asignadas[row.fila] ||
        conflictosRows[row.fila]
      ) {
        return;
      }

      const filas =
        row.correos
          .map(function(correo) {
            return alias[correo];
          })
          .filter(Boolean)
          .filter(function(valor, idx, arr) {
            return arr.indexOf(valor) === idx;
          });

      if (filas.length > 1) {
        conflictosRows[
          row.fila
        ] = true;

        return;
      }

      if (filas.length === 1) {
        const filaPersona =
          filas[0];

        asignadas[row.fila] =
          filaPersona;

        row.correos.forEach(
          function(correo) {
            if (!alias[correo]) {
              alias[correo] =
                filaPersona;

              cambio = true;
            }
          }
        );
      }
    });
  }

  const catalogo =
    leerCatalogoCursosDesdeCacheV1_();

  const porPersonaCurso = {};
  let asignados = 0;
  let sinPersona = 0;

  filasCursos.forEach(function(row) {
    const filaPersona =
      asignadas[row.fila];

    if (!filaPersona) {
      sinPersona++;
      return;
    }

    const cursoCanonico =
      catalogo[
        row.claveCurso
      ];

    if (!cursoCanonico) {
      return;
    }

    const clave =
      filaPersona +
      '|' +
      cursoCanonico.clave;

    if (!porPersonaCurso[clave]) {
      porPersonaCurso[clave] =
        [];
    }

    porPersonaCurso[
      clave
    ].push(
      row
    );

    asignados++;
  });

  return {
    porPersonaCurso:
      porPersonaCurso,
    asignados:
      asignados,
    sinPersona:
      sinPersona,
    conflictos:
      Object.keys(
        conflictosRows
      ).length
  };
}


let RIM_IC_CATALOGO_CACHE_V1 =
  null;


function leerCatalogoCursosV1_(
  ss
) {
  const hoja =
    ss.getSheetByName(
      RIM_IC_HOJA_CATALOGO
    );

  const datos =
    hoja
      .getRange(
        2,
        1,
        Math.max(
          0,
          hoja.getLastRow() - 1
        ),
        4
      )
      .getValues();

  const cursos = [];

  datos.forEach(function(row) {
    const nombre =
      rimNormalizarTexto_(
        row[0]
      );

    const nota =
      rimNumero_(
        row[1]
      );

    const obligatorio =
      rimNormalizarSinAcentos_(
        row[2]
      );

    const activo =
      rimNormalizarSinAcentos_(
        row[3]
      );

    if (
      nombre &&
      obligatorio === 'si' &&
      activo === 'si'
    ) {
      cursos.push({
        nombre:
          nombre,
        clave:
          normalizarCursoV1_(
            nombre
          ),
        notaMinima:
          nota === null
            ? 70
            : nota
      });
    }
  });

  RIM_IC_CATALOGO_CACHE_V1 =
    {};

  cursos.forEach(function(curso) {
    RIM_IC_CATALOGO_CACHE_V1[
      curso.clave
    ] = curso;
  });

  return cursos;
}


function leerCatalogoCursosDesdeCacheV1_() {
  return (
    RIM_IC_CATALOGO_CACHE_V1 ||
    {}
  );
}


function normalizarCursoV1_(
  valor
) {
  const t =
    rimNormalizarSinAcentos_(
      valor
    )
      .replace(
        /[^a-z0-9]+/g,
        ' '
      )
      .replace(/\s+/g, ' ')
      .trim();

  if (t.indexOf('etica e integridad en investigacion') >= 0) {
    return 'etica e integridad en investigacion';
  }

  if (t.indexOf('gestion de datos de investigacion') >= 0) {
    return 'gestion de datos de investigacion';
  }

  if (t.indexOf('fundamentos de analisis descriptivo') >= 0) {
    return 'fundamentos de analisis descriptivo';
  }

  if (t.indexOf('comunicacion cientifica') >= 0) {
    return 'comunicacion cientifica';
  }

  if (t.indexOf('participacion comunitaria') >= 0) {
    return 'participacion comunitaria';
  }

  return t;
}


function compararIntentosCursoV1_(
  a,
  b
) {
  if (
    rimFechaValida_(a.fecha) &&
    rimFechaValida_(b.fecha)
  ) {
    return (
      a.fecha.getTime() -
      b.fecha.getTime()
    );
  }

  if (
    rimFechaValida_(a.fecha)
  ) {
    return -1;
  }

  if (
    rimFechaValida_(b.fecha)
  ) {
    return 1;
  }

  return a.fila - b.fila;
}



/**
 * Convierte una marca temporal de curso a una FECHA administrativa
 * sin hora, respetando la zona horaria del spreadsheet.
 *
 * AO significa "Fecha completado cursos", por lo que la hora exacta
 * del examen se conserva en Control_Cursos, no en Variables_Internas.
 */
function fechaCursoSoloDiaV14_(
  fecha,
  zonaHoraria
) {
  if (
    !rimFechaValida_(
      fecha
    )
  ) {
    return null;
  }

  const texto =
    Utilities.formatDate(
      fecha,
      zonaHoraria,
      'yyyy-MM-dd'
    );

  const partes =
    texto
      .split('-')
      .map(Number);

  return new Date(
    partes[0],
    partes[1] - 1,
    partes[2]
  );
}


function claveFechaCursoV14_(
  valor,
  zonaHoraria
) {
  if (
    !rimFechaValida_(
      valor
    )
  ) {
    return '';
  }

  return Utilities.formatDate(
    valor,
    zonaHoraria,
    'yyyy-MM-dd'
  );
}


function actualizarVariablesDesdeCursosV1_(
  hoja,
  persona,
  completos,
  fechaCompleta
) {
  const columnas =
    RIM_IC_columnasVariablesV17_(
      hoja
    );

  const decision =
    rimNormalizarSinAcentos_(
      persona.decision
    );

  const estadoActual =
    rimNormalizarSinAcentos_(
      persona.estadoIngreso
    );

  if (
    decision === 'rechazado'
  ) {
    if (
      estadoActual !==
      rimNormalizarSinAcentos_(
        RIM_IC_ESTADO_DENEGADO
      )
    ) {
      hoja
        .getRange(
          persona.fila,
          columnas.estadoIngreso
        )
        .setValue(
          RIM_IC_ESTADO_DENEGADO
        );
    }

    return;
  }

  if (
    decision === 'aceptado'
  ) {
    if (completos) {
      hoja
        .getRange(
          persona.fila,
          columnas.estadoIngreso
        )
        .setValue(
          RIM_IC_ESTADO_ACEPTADO
        );

      if (
        fechaCompleta
      ) {
        const zonaHoraria =
          hoja
            .getParent()
            .getSpreadsheetTimeZone();

        const fechaAdministrativa =
          fechaCursoSoloDiaV14_(
            fechaCompleta,
            zonaHoraria
          );

        const fechaActual =
          hoja
            .getRange(
              persona.fila,
              columnas.fechaCursos
            )
            .getValue();

        const claveActual =
          claveFechaCursoV14_(
            fechaActual,
            zonaHoraria
          );

        const claveNueva =
          claveFechaCursoV14_(
            fechaAdministrativa,
            zonaHoraria
          );

        if (
          claveNueva &&
          claveActual !==
            claveNueva
        ) {
          hoja
            .getRange(
              persona.fila,
              columnas.fechaCursos
            )
            .setValue(
              fechaAdministrativa
            )
            .setNumberFormat(
              'dd/mm/yyyy'
            );
        }
      }

      return;
    }

    if (
      !estadoActual ||
      estadoActual ===
        rimNormalizarSinAcentos_(
          RIM_IC_ESTADO_POSTULACION
        ) ||
      estadoActual ===
        rimNormalizarSinAcentos_(
          RIM_IC_ESTADO_CURSOS
        )
    ) {
      hoja
        .getRange(
          persona.fila,
          columnas.estadoIngreso
        )
        .setValue(
          RIM_IC_ESTADO_CURSOS
        );
    }

    return;
  }

  if (
    !persona.estadoIngreso &&
    (
      !persona.ruta ||
      persona.ruta ===
        RIM_IC_RUTA_ESTANDAR
    )
  ) {
    hoja
      .getRange(
        persona.fila,
        columnas.estadoIngreso
      )
      .setValue(
        RIM_IC_ESTADO_POSTULACION
      );
  }
}

function diagnosticarFlujoPreAceptacionV16() {
  const ss =
    SpreadsheetApp.openById(
      RIM_IC_DB_ID
    );

  const seguimiento =
    ss.getSheetByName(
      'Seguimiento_Ingreso'
    );

  const variables =
    ss.getSheetByName(
      RIM_IC_HOJA_VARIABLES
    );

  const headersSeguimiento =
    seguimiento
      ? seguimiento
          .getRange(
            1,
            1,
            1,
            seguimiento.getLastColumn()
          )
          .getDisplayValues()[0]
      : [];

  const requeridos = [
    'Correo oficial',
    'Resultado entrevista',
    'Estado de ingreso',
    'ID postulación',
    'Fila formulario',
    'Marca temporal'
  ];

  const faltantes =
    requeridos.filter(
      function(header) {
        return headersSeguimiento.indexOf(
          header
        ) < 0;
      }
    );

  const triggers =
    ScriptApp
      .getProjectTriggers()
      .map(
        function(t) {
          return t.getHandlerFunction();
        }
      );

  const triggerFormulario =
    triggers.filter(
      function(x) {
        return x ===
          'procesarPostulacionEstandarTrigger';
      }
    ).length;

  const salida = {
    variablesExiste:
      Boolean(
        variables
      ),
    seguimientoExiste:
      Boolean(
        seguimiento
      ),
    columnasSeguimiento:
      headersSeguimiento.length,
    headersFaltantes:
      faltantes,
    triggerFormulario:
      triggerFormulario,
    creaVariablesAlEnviarFormulario:
      false,
    creaVariablesAlAceptarEntrevista:
      true,
    estado:
      (
        variables &&
        seguimiento &&
        faltantes.length ===
          0 &&
        triggerFormulario ===
          1
      )
        ? 'OK'
        : 'REVISAR',
    escritura:
      false
  };

  console.log(
    '=== DIAGNÓSTICO FLUJO PRE-ACEPTACIÓN V1.7 ==='
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
 * ON EDIT
 * ============================================================
 */

function manejarEdicionIngresoCursos(
  e
) {
  if (
    !e ||
    !e.range
  ) {
    return;
  }

  const hoja =
    e.range.getSheet();

  if (
    hoja.getParent().getId() !==
      RIM_IC_DB_ID ||
    hoja.getName() !==
      RIM_IC_HOJA_VARIABLES ||
    e.range.getRow() <= 1
  ) {
    return;
  }

  const columnas =
    RIM_IC_columnasVariablesV17_(
      hoja
    );

  const sensibles = [
    columnas.correoA,
    columnas.correoB,
    columnas.decision,
    columnas.ci
  ]
    .filter(
      function(col) {
        return col > 0;
      }
    );

  if (
    sensibles.indexOf(
      e.range.getColumn()
    ) >= 0
  ) {
    sincronizarCursosTodos();
  }
}

function prepararCatalogoCursosV1_(
  ss
) {
  let hoja =
    ss.getSheetByName(
      RIM_IC_HOJA_CATALOGO
    );

  if (!hoja) {
    hoja =
      ss.insertSheet(
        RIM_IC_HOJA_CATALOGO
      );
  }

  const headers = [
    'Curso',
    'Nota mínima',
    'Obligatorio',
    'Activo'
  ];

  hoja
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([
      headers
    ]);

  if (hoja.getLastRow() <= 1) {
    hoja
      .getRange(
        2,
        1,
        RIM_IC_CURSOS_DEFAULT.length,
        4
      )
      .setValues(
        RIM_IC_CURSOS_DEFAULT
      );
  }

  hoja.setFrozenRows(1);
}


function RIM_IC_proyectarControlCurso_(item) {
  return [
    item.correoOficial,
    item.nombre,
    item.curso,
    item.estadoCurso,
    item.notaOficial,
    item.fechaIntentoOficial,
    item.correoUsadoIntentoOficial,
    item.intentosDetectados,
    item.alerta,
    item.fechaProcesamiento
  ];
}


function prepararControlCursosV1_(ss) {
  let hoja =
    ss.getSheetByName(
      RIM_IC_HOJA_CONTROL_CURSOS
    );

  if (!hoja) {
    hoja =
      ss.insertSheet(
        RIM_IC_HOJA_CONTROL_CURSOS
      );

    hoja
      .getRange(
        1,
        1,
        1,
        RIM_IC_CONTROL_HEADERS.length
      )
      .setValues([
        RIM_IC_CONTROL_HEADERS
      ]);
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

  const actuales =
    headers.map(
      RIM_IC_normalizarHeaderV17_
    );

  const esperados =
    RIM_IC_CONTROL_HEADERS.map(
      RIM_IC_normalizarHeaderV17_
    );

  const estructuraExacta =
    actuales.length === esperados.length &&
    actuales.every(
      function(valor, i) {
        return valor === esperados[i];
      }
    );

  if (!estructuraExacta) {
    throw new Error(
      'Control_Cursos no coincide con el contrato público actual de 10 columnas. ' +
      'No se modificó automáticamente.'
    );
  }

  const mapa =
    RIM_IC_mapaHeadersV17_(
      headers
    );

  const colNota =
    RIM_IC_columnaV17_(
      mapa,
      ['Nota oficial']
    );

  const colFechaIntento =
    RIM_IC_columnaV17_(
      mapa,
      ['Fecha intento oficial']
    );

  const colFechaProceso =
    RIM_IC_columnaV17_(
      mapa,
      ['Fecha procesamiento']
    );

  hoja.setFrozenRows(1);

  hoja
    .getRange(
      2,
      colNota,
      Math.max(
        hoja.getMaxRows() - 1,
        1
      ),
      1
    )
    .setNumberFormat('0.00');

  hoja
    .getRange(
      2,
      colFechaIntento,
      Math.max(
        hoja.getMaxRows() - 1,
        1
      ),
      1
    )
    .setNumberFormat('dd/mm/yyyy hh:mm');

  hoja
    .getRange(
      2,
      colFechaProceso,
      Math.max(
        hoja.getMaxRows() - 1,
        1
      ),
      1
    )
    .setNumberFormat('dd/mm/yyyy hh:mm');

  return {
    esquema: 'ACTUAL_10',
    columnas: headers.length
  };
}


function prepararLogIngresoV1_(
  ss
) {
  let hoja =
    ss.getSheetByName(
      RIM_IC_HOJA_LOG_INGRESO
    );

  if (!hoja) {
    hoja =
      ss.insertSheet(
        RIM_IC_HOJA_LOG_INGRESO
      );
  }

  const headers = [
    'Fecha/hora',
    'Acción',
    'Fila formulario',
    'Fila Variables_Internas',
    'Correos',
    'CI',
    'Nombre',
    'Ruta',
    'Estado vínculo horario',
    'ID horario',
    'Observación'
  ];

  hoja
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([
      headers
    ]);

  hoja.setFrozenRows(1);

  hoja
    .getRange('A:A')
    .setNumberFormat(
      'dd/mm/yyyy hh:mm:ss'
    );
}


function registrarLogIngresoV1_(
  ss,
  resultado
) {
  prepararLogIngresoV1_(
    ss
  );

  const hoja =
    ss.getSheetByName(
      RIM_IC_HOJA_LOG_INGRESO
    );

  const vinculo =
    resultado.vinculacionHorario ||
    {};

  hoja.appendRow([
    new Date(),
    resultado.accion || '',
    resultado.filaFormulario || '',
    resultado.filaVariables || '',
    (resultado.correos || [])
      .join(' | '),
    resultado.ci || '',
    resultado.nombre || '',
    resultado.ruta || '',
    vinculo.estado || '',
    vinculo.idHorario || '',
    [
      vinculo.observacion || '',
      resultado.alertaCI || ''
    ]
      .filter(Boolean)
      .join(' | ')
  ]);
}


/* ============================================================
 * DIAGNÓSTICOS DETALLADOS V1.1 — SOLO LECTURA
 * ============================================================
 *
 * Estas funciones NO crean personas, NO cambian J/AO,
 * NO instalan triggers y NO escriben Control_Cursos.
 * Sirven únicamente para revisar los casos que todavía no
 * conviene automatizar.
 * ============================================================
 */


/**
 * Revisa todas las respuestas históricas del formulario estándar
 * e indica si cada una ACTUALIZARÍA una persona existente o
 * CREARÍA una persona nueva.
 *
 * NO ESCRIBE.
 */
/**
 * Explica exactamente:
 * 1) qué filas de Datos_Cursos no pudieron asociarse a ninguna
 *    persona de Variables_Internas;
 * 2) en qué persona/curso existen varios intentos.
 *
 * NO ESCRIBE.
 */
function diagnosticarCursosDetalladoV1() {
  const ss =
    SpreadsheetApp.openById(
      RIM_IC_DB_ID
    );

  const hojaVariables =
    ss.getSheetByName(
      RIM_IC_HOJA_VARIABLES
    );

  const hojaCursos =
    ss.getSheetByName(
      RIM_IC_HOJA_DATOS_CURSOS
    );

  const hojaCatalogo =
    ss.getSheetByName(
      RIM_IC_HOJA_CATALOGO
    );

  if (
    !hojaVariables ||
    !hojaCursos ||
    !hojaCatalogo
  ) {
    throw new Error(
      'Falta Variables_Internas, Datos_Cursos o Catalogo_Cursos.'
    );
  }

  const catalogo =
    leerCatalogoCursosV1_(
      ss
    );

  const personas =
    leerPersonasCursosV1_(
      hojaVariables
    );

  const filasCursos =
    leerDatosCursosV1_(
      hojaCursos
    );

  const asignacion =
    asignarCursosAPersonasV1_(
      personas,
      filasCursos
    );

  /*
   * Reconstruimos el mapa de filas asignadas usando el resultado
   * agrupado por persona/curso. Esto permite detectar las filas
   * que quedaron realmente fuera sin modificar nada.
   */
  const filasAsignadas = {};

  Object.keys(
    asignacion.porPersonaCurso
  ).forEach(function(clave) {
    asignacion
      .porPersonaCurso[clave]
      .forEach(function(intento) {
        filasAsignadas[
          intento.fila
        ] = true;
      });
  });

  const sinPersona =
    filasCursos
      .filter(function(row) {
        return !filasAsignadas[row.fila];
      })
      .map(function(row) {
        return {
          filaDatosCursos:
            row.fila,
          curso:
            row.curso,
          fecha:
            row.fecha || '',
          nombre:
            row.nombre || '',
          correos:
            row.correos || [],
          nota:
            row.nota
        };
      });

  const personaPorFila = {};

  personas.forEach(function(persona) {
    personaPorFila[
      persona.fila
    ] = persona;
  });

  const intentosMultiples = [];

  Object.keys(
    asignacion.porPersonaCurso
  ).forEach(function(clave) {
    const intentos =
      asignacion
        .porPersonaCurso[clave]
        .slice()
        .sort(
          compararIntentosCursoV1_
        );

    if (intentos.length <= 1) {
      return;
    }

    const separador =
      clave.indexOf('|');

    const filaPersona =
      Number(
        clave.slice(
          0,
          separador
        )
      );

    const claveCurso =
      clave.slice(
        separador + 1
      );

    const persona =
      personaPorFila[
        filaPersona
      ] || {};

    const curso =
      catalogo.find(function(c) {
        return c.clave === claveCurso;
      });

    const item = {
      filaVariables:
        filaPersona,
      nombre:
        persona.nombre || '',
      correoA:
        persona.correoA || '',
      correoB:
        persona.correoB || '',
      curso:
        curso
          ? curso.nombre
          : claveCurso,
      intentoOficialAutomatico:
        'PRIMER INTENTO CRONOLÓGICO',
      intentos:
        intentos.map(function(intento, indice) {
          return {
            orden:
              indice + 1,
            filaDatosCursos:
              intento.fila,
            fecha:
              intento.fecha || '',
            correos:
              intento.correos || [],
            nota:
              intento.nota
          };
        })
    };

    intentosMultiples.push(
      item
    );
  });

  console.log(
    '=== CURSOS SIN PERSONA ==='
  );

  sinPersona.forEach(function(item) {
    console.log(
      '[SIN PERSONA]',
      item
    );
  });

  console.log(
    '=== INTENTOS MÚLTIPLES ==='
  );

  intentosMultiples.forEach(function(item) {
    console.log(
      '[INTENTOS]',
      item
    );
  });

  const resumen = {
    registrosCursos:
      filasCursos.length,
    registrosSinPersona:
      sinPersona.length,
    casosPersonaCursoConMultiplesIntentos:
      intentosMultiples.length,
    escritura:
      false
  };

  console.log(
    '=== RESUMEN DIAGNÓSTICO CURSOS DETALLADO ==='
  );

  console.log(
    resumen
  );

  Logger.log(
    JSON.stringify({
      resumen:
        resumen,
      sinPersona:
        sinPersona,
      intentosMultiples:
        intentosMultiples
    })
  );

  return {
    resumen:
      resumen,
    sinPersona:
      sinPersona,
    intentosMultiples:
      intentosMultiples
  };
}


/**
 * DRY RUN: muestra qué cambiaría en Variables_Internas por Cursos
 * antes de ejecutar sincronizarCursosTodos().
 *
 * NO ESCRIBE.
 */
function diagnosticarCambiosVariablesDesdeCursosV1() {
  const ss =
    SpreadsheetApp.openById(
      RIM_IC_DB_ID
    );

  const hojaVariables =
    ss.getSheetByName(
      RIM_IC_HOJA_VARIABLES
    );

  const hojaCursos =
    ss.getSheetByName(
      RIM_IC_HOJA_DATOS_CURSOS
    );

  if (
    !hojaVariables ||
    !hojaCursos
  ) {
    throw new Error(
      'Falta Variables_Internas o Datos_Cursos.'
    );
  }

  prepararCatalogoCursosV1_(
    ss
  );

  const catalogo =
    leerCatalogoCursosV1_(
      ss
    );

  const personas =
    leerPersonasCursosV1_(
      hojaVariables
    );

  const filasCursos =
    leerDatosCursosV1_(
      hojaCursos
    );

  const asignacion =
    asignarCursosAPersonasV1_(
      personas,
      filasCursos
    );

  const cambios = [];

  personas.forEach(function(persona) {
    let aprobados = 0;
    let fechaCompleta = null;

    catalogo.forEach(function(curso) {
      const clave =
        persona.fila +
        '|' +
        curso.clave;

      const intentos =
        (
          asignacion.porPersonaCurso[
            clave
          ] || []
        )
          .slice()
          .sort(
            compararIntentosCursoV1_
          );

      const oficial =
        intentos.length
          ? intentos[0]
          : null;

      if (
        oficial &&
        oficial.nota !== null &&
        oficial.nota >=
          curso.notaMinima
      ) {
        aprobados++;

        if (
          rimFechaValida_(
            oficial.fecha
          ) &&
          (
            !fechaCompleta ||
            oficial.fecha >
              fechaCompleta
          )
        ) {
          fechaCompleta =
            oficial.fecha;
        }
      }
    });

    const completos =
      aprobados ===
      catalogo.length;

    const decision =
      rimNormalizarSinAcentos_(
        persona.decision
      );

    const estadoActual =
      rimNormalizarTexto_(
        persona.estadoIngreso
      );

    const estadoActualNorm =
      rimNormalizarSinAcentos_(
        estadoActual
      );

    let estadoPropuesto =
      estadoActual;

    let fechaPropuesta =
      persona.fechaCursos || '';

    let motivo = '';

    if (
      decision === 'rechazado'
    ) {
      estadoPropuesto =
        RIM_IC_ESTADO_DENEGADO;

      motivo =
        'Decisión humana C = Rechazado';

    } else if (
      decision === 'aceptado'
    ) {
      if (completos) {
        estadoPropuesto =
          RIM_IC_ESTADO_ACEPTADO;

        fechaPropuesta =
          fechaCompleta || '';

        motivo =
          'C = Aceptado y 5/5 cursos aprobados';

      } else if (
        !estadoActualNorm ||
        estadoActualNorm ===
          rimNormalizarSinAcentos_(
            RIM_IC_ESTADO_POSTULACION
          ) ||
        estadoActualNorm ===
          rimNormalizarSinAcentos_(
            RIM_IC_ESTADO_CURSOS
          )
      ) {
        estadoPropuesto =
          RIM_IC_ESTADO_CURSOS;

        motivo =
          'C = Aceptado pero todavía no completa 5/5 cursos';
      }

    } else if (
      !estadoActual &&
      (
        !persona.ruta ||
        persona.ruta ===
          RIM_IC_RUTA_ESTANDAR
      )
    ) {
      estadoPropuesto =
        RIM_IC_ESTADO_POSTULACION;

      motivo =
        'Sin decisión humana todavía';
    }

    const zonaHoraria =
      hojaVariables
        .getParent()
        .getSpreadsheetTimeZone();

    const fechaActualTexto =
      claveFechaCursoV14_(
        persona.fechaCursos,
        zonaHoraria
      );

    const fechaPropuestaAdministrativa =
      rimFechaValida_(
        fechaPropuesta
      )
        ? fechaCursoSoloDiaV14_(
            fechaPropuesta,
            zonaHoraria
          )
        : null;

    const fechaPropuestaTexto =
      claveFechaCursoV14_(
        fechaPropuestaAdministrativa,
        zonaHoraria
      );

    const cambiaEstado =
      estadoPropuesto !==
      estadoActual;

    const cambiaFecha =
      fechaPropuestaTexto !==
      fechaActualTexto;

    if (
      cambiaEstado ||
      cambiaFecha
    ) {
      const item = {
        filaVariables:
          persona.fila,
        nombre:
          persona.nombre,
        decisionC:
          persona.decision,
        cursosAprobados:
          aprobados +
          '/' +
          catalogo.length,
        J_actual:
          estadoActual,
        J_propuesto:
          estadoPropuesto,
        AO_actual:
          fechaActualTexto,
        AO_propuesto:
          fechaPropuestaTexto,
        motivo:
          motivo
      };

      cambios.push(
        item
      );

      console.log(
        '[CAMBIO PROPUESTO]',
        item
      );
    }
  });

  const resumen = {
    personasRevisadas:
      personas.length,
    cambiosPropuestos:
      cambios.length,
    escritura:
      false
  };

  console.log(
    '=== RESUMEN CAMBIOS PROPUESTOS CURSOS ==='
  );

  console.log(
    resumen
  );

  Logger.log(
    JSON.stringify({
      resumen:
        resumen,
      cambios:
        cambios
    })
  );

  return {
    resumen:
      resumen,
    cambios:
      cambios
  };
}


/* ============================================================
 * VALIDACIÓN INTEGRAL FASE 3 — SOLO LECTURA
 * Identidad + Ingreso/Cursos + H1
 * ============================================================ */

