/**
 * ============================================================
 * OFFICIAL SCHEDULE H1 — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * Convierte un horario de postulación YA VINCULADO en el primer
 * horario oficial de pasantía (H1) solamente cuando la persona
 * realmente inicia la pasantía.
 *
 * REGLAS:
 * - NO modifica Horarios_Postulacion.
 * - NO modifica estructura de Control_horarios.
 * - NO usa fórmulas.
 * - Crea H1 solo si:
 *      Estado de pasantía = Vigente
 *      Fecha inicio pasantía tiene fecha válida
 *      Ruta de ingreso no es ASISTENTE DIRECTO
 *      existe exactamente 1 horario VINCULADO A POSTULACIÓN
 *      no existe ya ningún horario en Control_horarios
 * - Correo oficial es la llave principal escrita en Control_horarios.
 * - Correo oficial / alternativo y CI se usan para reconocer a la persona.
 * - Variables_Internas se lee por encabezado, no por posición fija.
 * - Si hay ambigüedad, NO decide automáticamente.
 *
 * PRIMERO ejecutar SOLO:
 *      diagnosticarHorarioOficialH1V1()
 *
 * NO ejecutar crearH1PendientesV1() hasta revisar el dry run.
 * ============================================================
 */

const RIM_HO_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const RIM_HO_HOJA_VARIABLES =
  'Variables_Internas';

const RIM_HO_HOJA_POSTULACION =
  'Horarios_Postulacion';

const RIM_HO_HOJA_CONTROL =
  'Control_horarios';

const RIM_HO_ESTADO_VIGENTE =
  'vigente';

const RIM_HO_ESTADO_VINCULADO =
  'vinculado a postulacion';

const RIM_HO_RUTA_DIRECTO_ASISTENTE =
  'asistente directo';


/* ============================================================
 * FUNCIÓN PRINCIPAL — DRY RUN
 * ============================================================
 */

function diagnosticarHorarioOficialH1V1() {
  return procesarHorarioOficialH1V1_(
    false,
    RIM_HO_HOJA_VARIABLES
  );
}


/* ============================================================
 * ESCRITURA REAL — NO EJECUTAR HASTA VALIDAR DRY RUN
 * ============================================================
 */

function crearH1PendientesV1() {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    return procesarHorarioOficialH1V1_(
      true,
      RIM_HO_HOJA_VARIABLES
    );
  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
 * MOTOR
 * ============================================================
 */

function procesarHorarioOficialH1V1_(
  escribir,
  nombreHojaVariables
) {
  const ss =
    SpreadsheetApp.openById(
      RIM_HO_DB_ID
    );

  const variables =
    ss.getSheetByName(
      nombreHojaVariables ||
      RIM_HO_HOJA_VARIABLES
    );

  const postulacion =
    ss.getSheetByName(
      RIM_HO_HOJA_POSTULACION
    );

  const control =
    ss.getSheetByName(
      RIM_HO_HOJA_CONTROL
    );

  if (
    !variables ||
    !postulacion ||
    !control
  ) {
    throw new Error(
      'Falta Variables_Internas, Horarios_Postulacion o Control_horarios.'
    );
  }

  validarControlHorariosV1_(
    control
  );

  const horariosVinculados =
    leerHorariosVinculadosV1_(
      postulacion
    );

  const controlesExistentes =
    leerControlHorariosV1_(
      control
    );

  const resumen = {
    personasRevisadas: 0,
    creariaH1: 0,
    creadosH1: 0,
    yaTieneControlHorario: 0,
    noVigente: 0,
    sinFechaInicio: 0,
    sinRuta: 0,
    directoAsistente: 0,
    sinHorarioVinculado: 0,
    multiplesHorariosVinculados: 0,
    sinCorreoPrincipalA: 0,
    errores: 0,
    escritura: escribir
  };

  const detalle = [];

  const lastRow =
    variables.getLastRow();

  if (lastRow <= 1) {
    return {
      resumen: resumen,
      detalle: detalle
    };
  }

  /*
   * V1.4:
   * Variables_Internas se resuelve por encabezado.
   * Esto permite usar la estructura legacy o la V2.
   */
  const todosVariables =
    variables
      .getDataRange()
      .getValues();

  const headersVariables =
    todosVariables[0];

  const mapaVariables =
    mapearHeadersHOV1_(
      headersVariables
    );

  const cCorreoA =
    columnaHeaderHOV14_(
      mapaVariables,
      ['Correo oficial']
    );

  const cCorreoB =
    columnaHeaderHOV14_(
      mapaVariables,
      [
        'Correo alternativo cursos',
        'Correo Alternativo (Cursos)'
      ],
      true
    );

  const cNombre =
    columnaHeaderHOV14_(
      mapaVariables,
      [
        'Nombre',
        'Nombre del Pasante'
      ]
    );

  const cEstado =
    columnaHeaderHOV14_(
      mapaVariables,
      ['Estado de pasantía']
    );

  const cInicio =
    columnaHeaderHOV14_(
      mapaVariables,
      [
        'Fecha inicio pasantía',
        'Fecha inicio (Pasantía)'
      ]
    );

  const cCI =
    columnaHeaderHOV14_(
      mapaVariables,
      ['CI']
    );

  const cRuta =
    columnaHeaderHOV14_(
      mapaVariables,
      ['Ruta de ingreso']
    );

  const datosVariables =
    todosVariables.slice(1);

  datosVariables.forEach(
    function(row, index) {
      const filaVariables =
        index + 2;

      const persona = {
        fila:
          filaVariables,

        correoA:
          normalizarCorreoHOV1_(
            row[cCorreoA - 1]
          ),

        correoB:
          cCorreoB > 0
            ? normalizarCorreoHOV1_(
                row[cCorreoB - 1]
              )
            : '',

        nombre:
          limpiarHOV1_(
            row[cNombre - 1]
          ),

        estadoPasantia:
          normalizarHOV1_(
            row[cEstado - 1]
          ),

        fechaInicio:
          row[cInicio - 1],

        ci:
          normalizarCIHOV1_(
            row[cCI - 1]
          ),

        ruta:
          normalizarHOV1_(
            row[cRuta - 1]
          )
      };

      /*
       * Ignoramos filas completamente vacías.
       */
      if (
        !persona.correoA &&
        !persona.correoB &&
        !persona.nombre
      ) {
        return;
      }

      resumen.personasRevisadas++;

      const resultado =
        evaluarPersonaH1V1_(
          persona,
          horariosVinculados,
          controlesExistentes
        );

      const item = {
        filaVariables:
          filaVariables,
        nombre:
          persona.nombre,
        correoA:
          persona.correoA,
        correoB:
          persona.correoB,
        ci:
          persona.ci,
        estadoPasantia:
          limpiarHOV1_(
            row[cEstado - 1]
          ),
        fechaInicio:
          fechaTextoHOV1_(
            persona.fechaInicio,
            ss.getSpreadsheetTimeZone()
          ),
        ruta:
          limpiarHOV1_(
            row[cRuta - 1]
          ),
        accion:
          resultado.accion,
        idHorario:
          resultado.horario
            ? resultado.horario.idHorario
            : '',
        observacion:
          resultado.observacion || ''
      };

      detalle.push(
        item
      );

      incrementarResumenH1V1_(
        resumen,
        resultado.accion
      );

      if (
        resultado.accion ===
          'CREARIA_H1' &&
        escribir
      ) {
        try {
          crearH1V1_(
            control,
            persona,
            resultado.horario,
            ss.getSpreadsheetTimeZone()
          );

          resumen.creadosH1++;

          /*
           * Actualizar caché para impedir duplicados dentro de
           * esta misma ejecución.
           */
          controlesExistentes.push({
            fila:
              control.getLastRow(),
            correo:
              persona.correoA,
            version:
              'H1',
            vigente:
              'si'
          });

          item.accion =
            'H1_CREADO';

        } catch (error) {
          resumen.errores++;

          item.accion =
            'ERROR_CREANDO_H1';

          item.observacion =
            error &&
            error.message
              ? error.message
              : String(error);
        }
      }

      console.log(
        '[HORARIO H1]',
        item
      );
    }
  );

  console.log(
    escribir
      ? '=== CREACIÓN H1 ==='
      : '=== DRY RUN H1 ==='
  );

  console.log(
    resumen
  );

  Logger.log(
    JSON.stringify({
      resumen: resumen,
      detalle: detalle
    })
  );

  return {
    resumen: resumen,
    detalle: detalle
  };
}


/* ============================================================
 * EVALUACIÓN
 * ============================================================
 */

function evaluarPersonaH1V1_(
  persona,
  horariosVinculados,
  controlesExistentes
) {
  if (
    persona.estadoPasantia !==
      RIM_HO_ESTADO_VIGENTE
  ) {
    return {
      accion:
        'NO_VIGENTE',
      observacion:
        'Estado de pasantía todavía no está en Vigente.'
    };
  }

  if (
    !fechaValidaHOV1_(
      persona.fechaInicio
    )
  ) {
    return {
      accion:
        'SIN_FECHA_INICIO',
      observacion:
        'Fecha inicio pasantía no contiene una fecha válida.'
    };
  }

  if (!persona.ruta) {
    return {
      accion:
        'SIN_RUTA',
      observacion:
        'Ruta de ingreso está vacía.'
    };
  }

  if (
    persona.ruta ===
      RIM_HO_RUTA_DIRECTO_ASISTENTE
  ) {
    return {
      accion:
        'DIRECTO_ASISTENTE',
      observacion:
        'La ruta de ingreso no corresponde a una pasantía.'
    };
  }

  if (!persona.correoA) {
    return {
      accion:
        'SIN_CORREO_A',
      observacion:
        'Correo oficial está vacío. No se puede definir la llave principal de Control_horarios.'
    };
  }

  const existentes =
    controlesExistentes.filter(
      function(registro) {
        return (
          registro.correo ===
            persona.correoA ||
          (
            persona.correoB &&
            registro.correo ===
              persona.correoB
          )
        );
      }
    );

  if (existentes.length) {
    return {
      accion:
        'YA_TIENE_CONTROL',
      observacion:
        'La persona ya tiene al menos un registro en Control_horarios.'
    };
  }

  const candidatos =
    horariosVinculados.filter(
      function(horario) {
        const matchCI =
          persona.ci &&
          horario.ci &&
          persona.ci ===
            horario.ci;

        const correosPersona =
          [
            persona.correoA,
            persona.correoB
          ].filter(Boolean);

        const correosHorario =
          [
            horario.correoIngresado,
            horario.correoPrincipal,
            horario.correoAlternativo
          ].filter(Boolean);

        const matchCorreo =
          correosPersona.some(
            function(correo) {
              return (
                correosHorario.indexOf(
                  correo
                ) >= 0
              );
            }
          );

        return (
          matchCI ||
          matchCorreo
        );
      }
    );

  if (candidatos.length === 0) {
    return {
      accion:
        'SIN_HORARIO_VINCULADO',
      observacion:
        'No existe un horario VINCULADO A POSTULACIÓN para esta persona.'
    };
  }

  if (candidatos.length > 1) {
    return {
      accion:
        'MULTIPLES_HORARIOS_VINCULADOS',
      observacion:
        'Hay más de un horario vinculado. Se requiere revisión manual.'
    };
  }

  return {
    accion:
      'CREARIA_H1',
    horario:
      candidatos[0],
    observacion:
      'Cumple condiciones para crear H1.'
  };
}


/* ============================================================
 * CREAR H1
 * ============================================================
 */

function crearH1V1_(
  control,
  persona,
  horario,
  zonaHoraria
) {
  if (
    !horario ||
    !horario.horas ||
    horario.horas.length !== 24
  ) {
    throw new Error(
      'El horario vinculado no contiene las 24 celdas esperadas de lunes a sábado.'
    );
  }

  const fechaInicio =
    fechaSoloDiaHOV1_(
      persona.fechaInicio,
      zonaHoraria
    );

  const datosBase = [
    persona.correoA,
    persona.nombre,
    'H1',
    'Sí',
    fechaInicio,
    ''
  ];

  const nuevaFila =
    control.getLastRow() + 1;

  control
    .getRange(
      nuevaFila,
      1,
      1,
      6
    )
    .setValues([
      datosBase
    ]);

  control
    .getRange(
      nuevaFila,
      5
    )
    .setNumberFormat(
      'dd/mm/yyyy'
    );

  /*
   * Horas como TEXTO real HH:mm para evitar que Sheets cree
   * fechas 1899 y aplique offsets históricos de zona horaria.
   */
  control
    .getRange(
      nuevaFila,
      7,
      1,
      24
    )
    .setNumberFormat(
      '@'
    )
    .setValues([
      horario.horas.map(
        function(hora) {
          return horaTextoSeguroHOV1_(
            hora
          );
        }
      )
    ]);
}


/* ============================================================
 * LECTORES
 * ============================================================
 */

function leerHorariosVinculadosV1_(
  hoja
) {
  const lastRow =
    hoja.getLastRow();

  if (lastRow <= 1) {
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
    mapearHeadersHOV1_(
      headers
    );

  [
    'id horario',
    'correo ingresado',
    'estado',
    'correo formulario principal',
    'correo formulario alternativo',
    'ci formulario'
  ].forEach(
    function(header) {
      if (!mapa[header]) {
        throw new Error(
          'Falta la columna "' +
          header +
          '" en Horarios_Postulacion.'
        );
      }
    }
  );

  const rango =
    hoja.getRange(
      2,
      1,
      lastRow - 1,
      lastCol
    );

  const datos =
    rango.getValues();

  const display =
    rango.getDisplayValues();

  const resultado = [];

  datos.forEach(
    function(row, index) {
      const rowDisplay =
        display[index];
      const estado =
        normalizarHOV1_(
          row[
            mapa['estado'] - 1
          ]
        );

      if (
        estado !==
          RIM_HO_ESTADO_VINCULADO
      ) {
        return;
      }

      /*
       * G:AD = 24 horarios.
       */
      const horas =
        rowDisplay
          .slice(
            6,
            30
          )
          .map(
            horaTextoSeguroHOV1_
          );

      resultado.push({
        fila:
          index + 2,
        idHorario:
          limpiarHOV1_(
            row[
              mapa['id horario'] - 1
            ]
          ),
        correoIngresado:
          normalizarCorreoHOV1_(
            row[
              mapa['correo ingresado'] - 1
            ]
          ),
        correoPrincipal:
          normalizarCorreoHOV1_(
            row[
              mapa[
                'correo formulario principal'
              ] - 1
            ]
          ),
        correoAlternativo:
          normalizarCorreoHOV1_(
            row[
              mapa[
                'correo formulario alternativo'
              ] - 1
            ]
          ),
        ci:
          normalizarCIHOV1_(
            row[
              mapa['ci formulario'] - 1
            ]
          ),
        horas:
          horas
      });
    }
  );

  return resultado;
}


function leerControlHorariosV1_(
  hoja
) {
  const lastRow =
    hoja.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  return hoja
    .getRange(
      2,
      1,
      lastRow - 1,
      4
    )
    .getValues()
    .map(
      function(row, index) {
        return {
          fila:
            index + 2,
          correo:
            normalizarCorreoHOV1_(
              row[0]
            ),
          version:
            limpiarHOV1_(
              row[2]
            ),
          vigente:
            normalizarHOV1_(
              row[3]
            )
        };
      }
    )
    .filter(
      function(registro) {
        return registro.correo;
      }
    );
}


/* ============================================================
 * VALIDACIÓN ESTRUCTURA
 * ============================================================
 */

function validarControlHorariosV1_(
  hoja
) {
  /*
   * Validación POSICIONAL segura.
   *
   * A:F sí se validan por encabezado porque identifican persona,
   * versión, vigencia y fechas.
   *
   * G:AD NO se bloquean por el texto visible del encabezado.
   * La estructura de Control_horarios ya está fijada y el sistema
   * usa esas 24 posiciones por orden:
   * Lunes In1/Out1/In2/Out2 ... Sábado In1/Out1/In2/Out2.
   *
   * Esto evita falsos errores si Google Sheets muestra alguna
   * cabecera con un formato extraño, sin cambiar ninguna columna.
   */
  if (
    hoja.getLastColumn() <
      30
  ) {
    throw new Error(
      'Control_horarios tiene menos de 30 columnas.'
    );
  }

  const base =
    hoja
      .getRange(
        1,
        1,
        1,
        6
      )
      .getDisplayValues()[0]
      .map(
        normalizarCabeceraControlHOV1_
      );

  const reglas = [
    {
      columna: 0,
      acepta: [
        'correo oficial'
      ]
    },
    {
      columna: 1,
      acepta: [
        'nombre del pasante',
        'nombre'
      ]
    },
    {
      columna: 2,
      empiezaCon:
        'version'
    },
    {
      columna: 3,
      empiezaCon:
        'vigente'
    },
    {
      columna: 4,
      acepta: [
        'fecha inicio'
      ]
    },
    {
      columna: 5,
      acepta: [
        'fecha fin'
      ]
    }
  ];

  reglas.forEach(
    function(regla) {
      const actual =
        base[
          regla.columna
        ];

      let valido = false;

      if (
        regla.acepta &&
        regla.acepta.indexOf(
          actual
        ) >= 0
      ) {
        valido = true;
      }

      if (
        regla.empiezaCon &&
        actual.indexOf(
          regla.empiezaCon
        ) === 0
      ) {
        valido = true;
      }

      if (!valido) {
        throw new Error(
          'Control_horarios no coincide en columna ' +
          (regla.columna + 1) +
          '. Se encontró "' +
          actual +
          '".'
        );
      }
    }
  );

  return true;
}


function normalizarCabeceraControlHOV1_(
  valor
) {
  return limpiarHOV1_(
    valor
  )
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[\t\r\n]+/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .toLowerCase();
}


/* ============================================================
 * RESUMEN
 * ============================================================
 */

function incrementarResumenH1V1_(
  resumen,
  accion
) {
  const mapa = {
    CREARIA_H1:
      'creariaH1',
    YA_TIENE_CONTROL:
      'yaTieneControlHorario',
    NO_VIGENTE:
      'noVigente',
    SIN_FECHA_INICIO:
      'sinFechaInicio',
    SIN_RUTA:
      'sinRuta',
    DIRECTO_ASISTENTE:
      'directoAsistente',
    SIN_HORARIO_VINCULADO:
      'sinHorarioVinculado',
    MULTIPLES_HORARIOS_VINCULADOS:
      'multiplesHorariosVinculados',
    SIN_CORREO_A:
      'sinCorreoPrincipalA'
  };

  const clave =
    mapa[accion];

  if (clave) {
    resumen[clave]++;
  }
}


/* ============================================================
 * UTILIDADES
 * ============================================================
 */

function mapearHeadersHOV1_(
  headers
) {
  const mapa = {};

  headers.forEach(
    function(header, index) {
      const clave =
        normalizarHOV1_(
          header
        );

      if (clave) {
        mapa[clave] =
          index + 1;
      }
    }
  );

  return mapa;
}


function columnaHeaderHOV14_(
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
      normalizarHOV1_(
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
    'No se encontró ninguno de estos encabezados: ' +
    aliases.join(' | ')
  );
}


function limpiarHOV1_(
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


function normalizarHOV1_(
  valor
) {
  return limpiarHOV1_(
    valor
  )
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase();
}


function normalizarCorreoHOV1_(
  valor
) {
  return limpiarHOV1_(
    valor
  ).toLowerCase();
}


function normalizarCIHOV1_(
  valor
) {
  return limpiarHOV1_(
    valor
  )
    .toUpperCase()
    .replace(
      /[^A-Z0-9]/g,
      ''
    );
}


function fechaValidaHOV1_(
  valor
) {
  return (
    valor instanceof Date &&
    !isNaN(
      valor.getTime()
    )
  );
}


function fechaTextoHOV1_(
  valor,
  zonaHoraria
) {
  if (
    !fechaValidaHOV1_(
      valor
    )
  ) {
    return '';
  }

  return Utilities.formatDate(
    valor,
    zonaHoraria,
    'dd/MM/yyyy'
  );
}


function fechaSoloDiaHOV1_(
  valor,
  zonaHoraria
) {
  const texto =
    Utilities.formatDate(
      valor,
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


function horaTextoSeguroHOV1_(
  valor
) {
  const texto =
    limpiarHOV1_(
      valor
    );

  if (!texto) {
    return '';
  }

  const match =
    texto.match(
      /^(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return texto;
  }

  return (
    String(
      match[1]
    ).padStart(
      2,
      '0'
    ) +
    ':' +
    match[2]
  );
}


function horaTextoHOV1_(
  valor
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return '';
  }

  /*
   * Si Sheets devolviera una hora como Date, convertirla a HH:mm.
   */
  if (
    valor instanceof Date &&
    !isNaN(
      valor.getTime()
    )
  ) {
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      'HH:mm'
    );
  }

  const texto =
    limpiarHOV1_(
      valor
    );

  const match =
    texto.match(
      /^(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return texto;
  }

  return (
    String(match[1])
      .padStart(2, '0') +
    ':' +
    match[2]
  );
}


function validarCompatibilidadH1V14() {
  const actual =
    diagnosticarHorarioOficialH1V1();

  const preview =
    diagnosticarHorarioOficialH1V2Preview();

  const claves = [
    'personasRevisadas',
    'creariaH1',
    'yaTieneControlHorario',
    'noVigente',
    'sinFechaInicio',
    'sinRuta',
    'directoAsistente',
    'sinHorarioVinculado',
    'multiplesHorariosVinculados',
    'sinCorreoPrincipalA',
    'errores'
  ];

  const diferencias = [];

  claves.forEach(function(k) {
    const a =
      Number(
        actual.resumen[k] || 0
      );

    const b =
      Number(
        preview.resumen[k] || 0
      );

    if (a !== b) {
      diferencias.push({
        campo:
          k,
        actual:
          a,
        previewV2:
          b
      });
    }
  });

  const salida = {
    actual:
      actual.resumen,

    previewV2:
      preview.resumen,

    diferencias:
      diferencias,

    estado:
      diferencias.length === 0
        ? 'OK_H1_V2'
        : 'REVISAR',

    escritura:
      false
  };

  console.log(
    '=== VALIDACIÓN H1 V1.4 ACTUAL ↔ V2 ==='
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

