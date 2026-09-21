/**
 * ============================================================
 * SCHEDULE SUBMISSION BACKEND — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * Este endpoint se usa MIENTRAS la persona todavía está
 * completando el proceso externo de postulación.
 *
 * IMPORTANTE:
 * - En esta etapa NO se crea H1/H2/H3.
 * - NO se escribe en Control_horarios.
 * - NO se exige que la persona ya exista en Variables_Internas.
 * - Cada PDF generado recibe un código único HR-...
 * - El horario queda provisional en Horarios_Postulacion.
 * - La integración de referencia puede vincular después el PDF
 *   seleccionado desde la fuente estructurada de postulación.
 *
 * Si la persona se equivoca puede generar otro PDF y subir
 * únicamente el que finalmente decida usar.
 * ============================================================
 */

const RIM_HP_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const RIM_HP_TURNSTILE_SECRET_PROP =
  'TURNSTILE_SECRET';

const RIM_HP_TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const RIM_HP_TURNSTILE_HOSTNAME =
  'YOUR_SCHEDULE_FORM_HOSTNAME';

const RIM_HP_TURNSTILE_ACTION =
  'guardar_horario';

const RIM_HP_HOJA =
  'Horarios_Postulacion';

const RIM_HP_HORAS_MINIMAS =
  12;

const RIM_HP_DIAS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];


function doPost(e) {
  try {
    const datos =
      JSON.parse(
        e &&
        e.postData &&
        e.postData.contents
          ? e.postData.contents
          : '{}'
      );

    const accion =
      String(
        datos.accion || ''
      ).toLowerCase();

    if (
      accion ===
      'guardar_postulacion'
    ) {
      /*
       * Antes de tocar Horarios_Postulacion, el backend valida
       * el token de Cloudflare Turnstile con Siteverify.
       */
      verificarTurnstileHorarioPostV5_(
        datos.turnstileToken
      );

      return responderHorarioPostV4_(
        guardarHorarioPostulacionV4_(
          datos
        )
      );
    }

    /*
     * Ping sin escritura: útil para diagnóstico del endpoint.
     * No crea ni modifica registros.
     */
    if (
      accion ===
      'ping'
    ) {
      return responderHorarioPostV4_({
        estado:
          'exito',
        mensaje:
          'Servicio disponible.',
        seguridad:
          'TURNSTILE'
      });
    }

    throw new Error(
      'Acción no reconocida.'
    );

  } catch (error) {
    console.error(
      '[HORARIOS POSTULACIÓN]',
      error
    );

    return responderHorarioPostV4_({
      estado:
        'error',
      mensaje:
        error &&
        error.message
          ? error.message
          : String(error)
    });
  }
}


/**
 * Valida un token Turnstile en el servidor.
 *
 * IMPORTANTE:
 * - La Secret Key NO está en este archivo.
 * - Se lee desde Propiedades del script: TURNSTILE_SECRET.
 * - El token recibido del navegador es temporal y de un solo uso.
 */
function verificarTurnstileHorarioPostV5_(
  token
) {
  const secret =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        RIM_HP_TURNSTILE_SECRET_PROP
      );

  if (!secret) {
    throw new Error(
      'La verificación de seguridad no está configurada. Comunícate con el responsable de pasantías.'
    );
  }

  const tokenLimpio =
    String(
      token || ''
    ).trim();

  if (
    !tokenLimpio ||
    tokenLimpio.length >
      2048
  ) {
    throw new Error(
      'Completa la verificación de seguridad antes de generar el PDF.'
    );
  }

  let respuesta;

  try {
    respuesta =
      UrlFetchApp.fetch(
        RIM_HP_TURNSTILE_VERIFY_URL,
        {
          method:
            'post',
          contentType:
            'application/x-www-form-urlencoded',
          payload: {
            secret:
              secret,
            response:
              tokenLimpio
          },
          muteHttpExceptions:
            true,
          followRedirects:
            true
        }
      );

  } catch (error) {
    console.error(
      '[TURNSTILE] No se pudo consultar Siteverify:',
      error
    );

    throw new Error(
      'No pudimos validar la verificación de seguridad. Inténtalo nuevamente.'
    );
  }

  const codigo =
    respuesta.getResponseCode();

  if (
    codigo < 200 ||
    codigo >= 300
  ) {
    console.error(
      '[TURNSTILE] HTTP ' +
      codigo +
      ': ' +
      respuesta.getContentText()
    );

    throw new Error(
      'No pudimos validar la verificación de seguridad. Inténtalo nuevamente.'
    );
  }

  let resultado;

  try {
    resultado =
      JSON.parse(
        respuesta.getContentText()
      );
  } catch (error) {
    console.error(
      '[TURNSTILE] Respuesta no JSON:',
      respuesta.getContentText()
    );

    throw new Error(
      'No pudimos validar la verificación de seguridad. Inténtalo nuevamente.'
    );
  }

  if (
    !resultado ||
    resultado.success !==
      true
  ) {
    console.warn(
      '[TURNSTILE] Validación rechazada:',
      resultado &&
      resultado['error-codes']
        ? resultado['error-codes']
        : []
    );

    throw new Error(
      'La verificación de seguridad expiró o no fue válida. Complétala nuevamente.'
    );
  }

  if (
    String(
      resultado.hostname || ''
    ).toLowerCase() !==
    RIM_HP_TURNSTILE_HOSTNAME
  ) {
    console.warn(
      '[TURNSTILE] Hostname inesperado:',
      resultado.hostname
    );

    throw new Error(
      'La verificación de seguridad no corresponde al sitio autorizado.'
    );
  }

  if (
    String(
      resultado.action || ''
    ) !==
    RIM_HP_TURNSTILE_ACTION
  ) {
    console.warn(
      '[TURNSTILE] Action inesperada:',
      resultado.action
    );

    throw new Error(
      'La verificación de seguridad no corresponde a esta operación.'
    );
  }

  return {
    valido:
      true,
    hostname:
      resultado.hostname,
    action:
      resultado.action,
    challengeTs:
      resultado.challenge_ts || ''
  };
}


/**
 * Diagnóstico seguro de configuración.
 *
 * NO muestra ni registra la Secret Key.
 * NO llama a Cloudflare.
 * NO escribe en la base.
 */
function diagnosticarTurnstileHorariosV5() {
  const secret =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        RIM_HP_TURNSTILE_SECRET_PROP
      );

  const salida = {
    secretConfigurado:
      Boolean(
        String(
          secret || ''
        ).trim()
      ),
    propiedad:
      RIM_HP_TURNSTILE_SECRET_PROP,
    hostnameEsperado:
      RIM_HP_TURNSTILE_HOSTNAME,
    actionEsperada:
      RIM_HP_TURNSTILE_ACTION,
    endpoint:
      RIM_HP_TURNSTILE_VERIFY_URL,
    escritura:
      false,
    muestraSecret:
      false,
    estado:
      String(
        secret || ''
      ).trim()
        ? 'OK'
        : 'REVISAR'
  };

  console.log(
    '=== DIAGNÓSTICO TURNSTILE HORARIOS V5 ==='
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


/**
 * Diagnóstico de conexión con Cloudflare — SIN ESCRITURA.
 *
 * Envía deliberadamente un token inválido. El objetivo NO es
 * obtener success=true, sino comprobar:
 * - que UrlFetchApp puede llegar a Siteverify;
 * - que existe una Secret Key;
 * - que Cloudflare no la reporta como inválida.
 *
 * NO imprime la Secret Key.
 */
function diagnosticarConexionTurnstileHorariosV5() {
  const secret =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        RIM_HP_TURNSTILE_SECRET_PROP
      );

  if (
    !String(
      secret || ''
    ).trim()
  ) {
    const sinSecret = {
      estado:
        'REVISAR',
      conexion:
        false,
      secretConfigurado:
        false,
      escritura:
        false,
      muestraSecret:
        false
    };

    console.log(
      '=== DIAGNÓSTICO CONEXIÓN TURNSTILE V5 ==='
    );
    console.log(
      sinSecret
    );

    return sinSecret;
  }

  let response;

  try {
    response =
      UrlFetchApp.fetch(
        RIM_HP_TURNSTILE_VERIFY_URL,
        {
          method:
            'post',
          contentType:
            'application/x-www-form-urlencoded',
          payload: {
            secret:
              secret,
            response:
              'DIAGNOSTICO_TOKEN_INVALIDO'
          },
          muteHttpExceptions:
            true,
          followRedirects:
            true
        }
      );
  } catch (error) {
    const falloConexion = {
      estado:
        'REVISAR',
      conexion:
        false,
      secretConfigurado:
        true,
      observacion:
        error &&
        error.message
          ? error.message
          : String(error),
      escritura:
        false,
      muestraSecret:
        false
    };

    console.log(
      '=== DIAGNÓSTICO CONEXIÓN TURNSTILE V5 ==='
    );
    console.log(
      falloConexion
    );

    return falloConexion;
  }

  let data = {};

  try {
    data =
      JSON.parse(
        response.getContentText()
      );
  } catch (_) {}

  const errores =
    Array.isArray(
      data['error-codes']
    )
      ? data['error-codes']
      : [];

  const secretInvalido =
    errores.indexOf(
      'invalid-input-secret'
    ) >= 0 ||
    errores.indexOf(
      'missing-input-secret'
    ) >= 0;

  const salida = {
    estado:
      (
        response.getResponseCode() >= 200 &&
        response.getResponseCode() < 300 &&
        !secretInvalido
      )
        ? 'OK'
        : 'REVISAR',
    conexion:
      response.getResponseCode() >= 200 &&
      response.getResponseCode() < 300,
    secretConfigurado:
      true,
    secretAceptadoPorCloudflare:
      !secretInvalido,
    respuestaEsperadamenteExitosa:
      false,
    http:
      response.getResponseCode(),
    errorCodes:
      errores,
    escritura:
      false,
    muestraSecret:
      false
  };

  console.log(
    '=== DIAGNÓSTICO CONEXIÓN TURNSTILE V5 ==='
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


function prepararHorariosPostulacionV4() {
  const ss =
    SpreadsheetApp.openById(
      RIM_HP_DB_ID
    );

  const hoja =
    asegurarHojaHorariosPostV4_(
      ss
    );

  const resultado = {
    hoja:
      hoja.getName(),
    columnas:
      hoja.getLastColumn(),
    controlHorariosModificado:
      false,
    formulas:
      0,
    celdasCombinadas:
      0
  };

  console.log(
    'HORARIOS POSTULACIÓN V4 PREPARADO:',
    resultado
  );

  Logger.log(
    JSON.stringify(resultado)
  );

  return resultado;
}


function diagnosticarHorariosPostulacionV4() {
  const ss =
    SpreadsheetApp.openById(
      RIM_HP_DB_ID
    );

  const hoja =
    asegurarHojaHorariosPostV4_(
      ss
    );

  const resultado = {
    hoja:
      hoja.getName(),
    registros:
      Math.max(
        0,
        hoja.getLastRow() - 1
      ),
    horasMinimas:
      RIM_HP_HORAS_MINIMAS,
    modificaControlHorarios:
      false,
    seguridad:
      'TURNSTILE'
  };

  console.log(
    'DIAGNÓSTICO HORARIOS POSTULACIÓN:',
    resultado
  );

  Logger.log(
    JSON.stringify(resultado)
  );

  return resultado;
}


function guardarHorarioPostulacionV4_(
  datos
) {
  const nombre =
    limpiarHorarioPostV4_(
      datos.nombre
    );

  const correo =
    normalizarCorreoHorarioPostV4_(
      datos.correo
    );

  const requestId =
    limpiarHorarioPostV4_(
      datos.requestId
    );

  if (!nombre) {
    throw new Error(
      'Ingresa tu nombre completo.'
    );
  }

  if (
    !correo ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      correo
    )
  ) {
    throw new Error(
      'Ingresa un correo electrónico válido.'
    );
  }

  if (!requestId) {
    throw new Error(
      'No se recibió el identificador del envío. Recarga la página e inténtalo nuevamente.'
    );
  }

  const horario =
    normalizarHorarioPostV4_(
      datos.horarios
    );

  const horas =
    validarHorarioPostV4_(
      horario
    );

  if (
    horas <
    RIM_HP_HORAS_MINIMAS
  ) {
    throw new Error(
      'El horario debe sumar al menos ' +
      RIM_HP_HORAS_MINIMAS +
      ' horas semanales.'
    );
  }

  const ss =
    SpreadsheetApp.openById(
      RIM_HP_DB_ID
    );

  const hoja =
    asegurarHojaHorariosPostV4_(
      ss
    );

  /*
   * Idempotencia para doble clic/reintento de la misma solicitud.
   */
  const existente =
    buscarRequestHorarioPostV4_(
      hoja,
      requestId
    );

  if (existente) {
    return {
      estado:
        'exito',
      idHorario:
        existente.idHorario,
      horasSemanales:
        existente.horas,
      duplicado:
        true,
      mensaje:
        'El horario ya había sido registrado. No se creó un duplicado.'
    };
  }

  const ahora =
    new Date();

  const idHorario =
    crearIdHorarioPostV4_(
      ahora
    );

  const fila = [
    idHorario,
    ahora,
    requestId,
    correo,
    nombre,
    horas
  ];

  RIM_HP_DIAS.forEach(
    function(dia) {
      const d =
        horario[dia];

      fila.push(
        d.in1,
        d.out1,
        d.in2,
        d.out2
      );
    }
  );

  fila.push(
    'GENERADO',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ahora
  );

  hoja.appendRow(
    fila
  );

  return {
    estado:
      'exito',
    idHorario:
      idHorario,
    horasSemanales:
      horas,
    duplicado:
      false,
    mensaje:
      'Horario generado correctamente. Sube este PDF en el formulario de postulación.'
  };
}


function asegurarHojaHorariosPostV4_(
  ss
) {
  let hoja =
    ss.getSheetByName(
      RIM_HP_HOJA
    );

  if (!hoja) {
    hoja =
      ss.insertSheet(
        RIM_HP_HOJA
      );
  }

  const headers = [
    'ID horario',
    'Fecha generación',
    'ID solicitud',
    'Correo ingresado',
    'Nombre ingresado',
    'Horas semanales'
  ];

  RIM_HP_DIAS.forEach(
    function(dia) {
      headers.push(
        dia + ' In1',
        dia + ' Out1',
        dia + ' In2',
        dia + ' Out2'
      );
    }
  );

  headers.push(
    'Estado',
    'Fecha vinculación',
    'Fila respuesta formulario',
    'Correo formulario principal',
    'Correo formulario alternativo',
    'CI formulario',
    'Horas declaradas formulario',
    'Observación',
    'ID archivo PDF',
    'Nombre archivo PDF',
    'Fecha última actualización'
  );

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
    .getRange('B:B')
    .setNumberFormat(
      'dd/mm/yyyy hh:mm:ss'
    );

  const colFechaVinculo =
    6 +
    RIM_HP_DIAS.length * 4 +
    2;

  hoja
    .getRange(
      1,
      colFechaVinculo,
      hoja.getMaxRows(),
      1
    )
    .setNumberFormat(
      'dd/mm/yyyy hh:mm:ss'
    );

  return hoja;
}


function crearIdHorarioPostV4_(
  fecha
) {
  const tz =
    Session.getScriptTimeZone() ||
    'America/La_Paz';

  const dia =
    Utilities.formatDate(
      fecha,
      tz,
      'yyyyMMdd'
    );

  const aleatorio =
    Utilities
      .getUuid()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase();

  return (
    'HR-' +
    dia +
    '-' +
    aleatorio
  );
}


function buscarRequestHorarioPostV4_(
  hoja,
  requestId
) {
  const lastRow =
    hoja.getLastRow();

  if (lastRow <= 1) {
    return null;
  }

  const datos =
    hoja
      .getRange(
        2,
        1,
        lastRow - 1,
        6
      )
      .getValues();

  for (
    let i = datos.length - 1;
    i >= 0;
    i--
  ) {
    if (
      String(
        datos[i][2] || ''
      ) ===
      requestId
    ) {
      return {
        idHorario:
          datos[i][0],
        horas:
          datos[i][5]
      };
    }
  }

  return null;
}


function normalizarHorarioPostV4_(
  horarios
) {
  const resultado = {};

  RIM_HP_DIAS.forEach(
    function(dia) {
      const origen =
        horarios &&
        horarios[dia]
          ? horarios[dia]
          : {};

      resultado[dia] = {
        in1:
          normalizarHoraPostV4_(
            origen.in1
          ),
        out1:
          normalizarHoraPostV4_(
            origen.out1
          ),
        in2:
          normalizarHoraPostV4_(
            origen.in2
          ),
        out2:
          normalizarHoraPostV4_(
            origen.out2
          )
      };
    }
  );

  return resultado;
}


function normalizarHoraPostV4_(
  valor
) {
  const texto =
    limpiarHorarioPostV4_(
      valor
    );

  if (!texto) return '';

  if (
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
      texto
    )
  ) {
    throw new Error(
      'Se recibió una hora inválida.'
    );
  }

  return texto;
}


function validarHorarioPostV4_(
  horario
) {
  let minutos = 0;

  RIM_HP_DIAS.forEach(
    function(dia) {
      const d =
        horario[dia];

      const t1 =
        validarTurnoPostV4_(
          dia,
          1,
          d.in1,
          d.out1
        );

      const t2 =
        validarTurnoPostV4_(
          dia,
          2,
          d.in2,
          d.out2
        );

      if (
        t1 &&
        t2 &&
        t2.inicio <
          t1.fin
      ) {
        throw new Error(
          dia +
          ': los dos turnos se superponen.'
        );
      }

      if (t1) {
        minutos +=
          t1.fin -
          t1.inicio;
      }

      if (t2) {
        minutos +=
          t2.fin -
          t2.inicio;
      }
    }
  );

  if (minutos <= 0) {
    throw new Error(
      'Debes registrar al menos un turno completo.'
    );
  }

  return (
    Math.round(
      (minutos / 60) * 100
    ) / 100
  );
}


function validarTurnoPostV4_(
  dia,
  numero,
  entrada,
  salida
) {
  if (
    !entrada &&
    !salida
  ) {
    return null;
  }

  if (
    !entrada ||
    !salida
  ) {
    throw new Error(
      dia +
      ': completa entrada y salida del turno ' +
      numero +
      '.'
    );
  }

  const inicio =
    horaAMinutosPostV4_(
      entrada
    );

  const fin =
    horaAMinutosPostV4_(
      salida
    );

  if (fin <= inicio) {
    throw new Error(
      dia +
      ': la salida del turno ' +
      numero +
      ' debe ser posterior a la entrada.'
    );
  }

  return {
    inicio:
      inicio,
    fin:
      fin
  };
}


function horaAMinutosPostV4_(
  hora
) {
  const partes =
    hora.split(':');

  return (
    Number(partes[0]) * 60 +
    Number(partes[1])
  );
}


function normalizarCorreoHorarioPostV4_(
  valor
) {
  return limpiarHorarioPostV4_(
    valor
  ).toLowerCase();
}


function limpiarHorarioPostV4_(
  valor
) {
  return String(
    valor === null ||
    valor === undefined
      ? ''
      : valor
  )
    .trim()
    .replace(/\s+/g, ' ');
}


function responderHorarioPostV4_(
  objeto
) {
  return ContentService
    .createTextOutput(
      JSON.stringify(
        objeto
      )
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}
