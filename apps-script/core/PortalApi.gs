/**
 * Public repository copy: deployment identifiers and private data are externalized.
 * ============================================================
 * API PORTAL V2 — MODELO PRODUCTIVO
 * RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 *
 * OBJETIVO
 * Exponer una capa de lectura estable para el portal administrativo
 * usando Progreso_Pasantias PRODUCTIVO de 16 columnas.
 *
 * CAMBIOS RESPECTO A V1
 * - Ya NO exige las 27 columnas históricas.
 * - Lee por nombre de encabezado, no por posición fija.
 * - Conserva compatibilidad con el HTML actual mediante:
 *     obtenerPanelPasantiasV1()
 *     diagnosticarPortalPasantiasV1()
 * - Expone también nombres V2:
 *     obtenerPanelPasantiasV2()
 *     diagnosticarPortalPasantiasV2()
 * - Solo deriva campos que pueden calcularse sin inventar datos.
 * - NO reconstruye:
 *     Días totales compromiso
 *     Días transcurridos computables
 *     Política horas asistente
 *     Fecha inicio asistente
 *     Fecha fin asistente
 *     Fecha vigencia compromiso V2
 *
 * SEGURIDAD
 * - SOLO LECTURA.
 * - No modifica hojas.
 * - No crea triggers.
 * - No define doGet/doPost.
 * - No devuelve contraseñas, tokens ni campos de Accesos_Internos.
 * ============================================================
 */

const APPV2_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const APPV2_HOJA_PROGRESO =
  'Progreso_Pasantias';

const APPV2_HEADERS = [
  'Correo oficial',
  'Nombre',
  'Estado pasantía',
  'Fecha inicio compromiso',
  'Fecha fin compromiso planificada',
  'Fecha corte progreso',
  'Porcentaje tiempo transcurrido',
  'Horas objetivo',
  'Horas válidas como pasante',
  'Horas convalidadas como asistente',
  'Horas válidas para cumplimiento',
  'Horas restantes',
  'Porcentaje horas cumplidas',
  'Estado datos',
  'Observación',
  'Última actualización'
];


/* ============================================================
 * FUNCIONES PÚBLICAS V2
 * ============================================================ */

function diagnosticarPortalPasantiasV2() {
  const ss =
    SpreadsheetApp.openById(
      APPV2_DB_ID
    );

  const hoja =
    APPV2_requerirHoja_(
      ss
    );

  const validacion =
    APPV2_validarContrato_(
      hoja
    );

  const panel =
    APPV2_construirPanel_(
      ss,
      hoja
    );

  const resumen = {
    version:
      'API_PORTAL_V2_PRODUCTIVO',

    escritura:
      false,

    hoja:
      APPV2_HOJA_PROGRESO,

    filasDatos:
      panel.personas.length,

    columnas:
      hoja.getLastColumn(),

    headersEsperados:
      APPV2_HEADERS.length,

    estructuraExacta:
      validacion.estructuraExacta,

    diferenciasHeaders:
      validacion.diferencias,

    vigentes:
      panel.resumen.vigentes,

    terminadas:
      panel.resumen.terminadas,

    retiradas:
      panel.resumen.retiradas,

    contratadas:
      panel.resumen.contratadas,

    sinEstado:
      panel.resumen.sinEstado,

    conMetaHoras:
      panel.resumen.conMetaHoras,

    sinMetaHoras:
      panel.resumen.sinMetaHoras,

    conAlertasDatos:
      panel.resumen.conAlertasDatos,

    compatibilidadFrontendActual:
      true,

    funcionFrontendActual:
      'obtenerPanelPasantiasV1',

    usaLecturaPorEncabezado:
      true,

    camposDerivadosSeguros: [
      'diferenciaHorasTiempoPp',
      'supera80Horas',
      'supera80Tiempo',
      'porcentajeTiempoGrafico',
      'porcentajeHorasGrafico'
    ],

    camposLegacyNoReconstruidos: [
      'diasTotales',
      'diasTranscurridos',
      'politicaHorasAsistente',
      'fechaInicioAsistente',
      'fechaFinAsistente',
      'fechaVigenciaCompromisoV2'
    ],

    listoPortalLectura:
      (
        validacion.estructuraExacta &&
        validacion.diferencias.length ===
          0
      ),

    estado:
      (
        validacion.estructuraExacta &&
        validacion.diferencias.length ===
          0
      )
        ? 'OK'
        : 'REVISAR'
  };

  console.log(
    '=== DIAGNÓSTICO PORTAL PASANTÍAS V2 ==='
  );

  console.log(
    resumen
  );

  Logger.log(
    JSON.stringify(
      resumen
    )
  );

  return resumen;
}


function obtenerPanelPasantiasV2() {
  const ss =
    SpreadsheetApp.openById(
      APPV2_DB_ID
    );

  const hoja =
    APPV2_requerirHoja_(
      ss
    );

  APPV2_validarContratoEstricto_(
    hoja
  );

  const salida =
    APPV2_construirPanel_(
      ss,
      hoja
    );

  console.log(
    '=== PANEL PASANTÍAS V2 ==='
  );

  console.log({
    personas:
      salida.personas.length,

    resumen:
      salida.resumen,

    actualizado:
      salida.actualizado,

    escritura:
      false
  });

  return salida;
}


/* ============================================================
 * COMPATIBILIDAD CON EL FRONTEND ACTUAL
 * ============================================================
 *
 * El HTML actual llama obtenerPanelPasantiasV1().
 * Se conserva el nombre público, pero la implementación es V2.
 */

function diagnosticarPortalPasantiasV1() {
  return diagnosticarPortalPasantiasV2();
}


function obtenerPanelPasantiasV1() {
  return obtenerPanelPasantiasV2();
}


/* ============================================================
 * CONSTRUCCIÓN DEL PANEL
 * ============================================================ */

function APPV2_construirPanel_(
  ss,
  hoja
) {
  if (
    hoja.getLastRow() <=
      1
  ) {
    return {
      version:
        'API_PORTAL_V2_PRODUCTIVO',

      actualizado:
        null,

      resumen:
        APPV2_resumenVacio_(),

      personas:
        []
    };
  }

  const headers =
    APPV2_leerHeaders_(
      hoja
    );

  const mapa =
    APPV2_mapaHeaders_(
      headers
    );

  const valores =
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        hoja.getLastColumn()
      )
      .getValues();

  const tz =
    ss.getSpreadsheetTimeZone() ||
    Session.getScriptTimeZone() ||
    'America/La_Paz';

  const personas =
    valores
      .filter(
        function(row) {
          return (
            APPV2_textoCampo_(
              row,
              mapa,
              'Correo oficial'
            ) ||
            APPV2_textoCampo_(
              row,
              mapa,
              'Nombre'
            )
          );
        }
      )
      .map(
        function(row) {
          const pctTiempoFraccion =
            APPV2_numeroNullableCampo_(
              row,
              mapa,
              'Porcentaje tiempo transcurrido'
            );

          const pctHorasFraccion =
            APPV2_numeroNullableCampo_(
              row,
              mapa,
              'Porcentaje horas cumplidas'
            );

          const horasObjetivo =
            APPV2_numeroNullableCampo_(
              row,
              mapa,
              'Horas objetivo'
            );

          const horasPasante =
            APPV2_numeroCampo_(
              row,
              mapa,
              'Horas válidas como pasante'
            );

          const horasAsistente =
            APPV2_numeroCampo_(
              row,
              mapa,
              'Horas convalidadas como asistente'
            );

          const horasValidas =
            APPV2_numeroCampo_(
              row,
              mapa,
              'Horas válidas para cumplimiento'
            );

          const horasRestantes =
            APPV2_numeroNullableCampo_(
              row,
              mapa,
              'Horas restantes'
            );

          const estadoDatos =
            APPV2_textoCampo_(
              row,
              mapa,
              'Estado datos'
            );

          const diferenciaPp =
            (
              pctTiempoFraccion !== null &&
              pctHorasFraccion !== null
            )
              ? APPV2_redondear_(
                  (
                    pctHorasFraccion -
                    pctTiempoFraccion
                  ) *
                  100
                )
              : null;

          const pctTiempoGrafico =
            APPV2_limitarFraccion_(
              pctTiempoFraccion
            );

          const pctHorasGrafico =
            APPV2_limitarFraccion_(
              pctHorasFraccion
            );

          const pctTiempoPantalla =
            APPV2_porcentajePantalla_(
              pctTiempoFraccion
            );

          const pctHorasPantalla =
            APPV2_porcentajePantalla_(
              pctHorasFraccion
            );

          return {
            correo:
              APPV2_textoCampo_(
                row,
                mapa,
                'Correo oficial'
              ),

            nombre:
              APPV2_textoCampo_(
                row,
                mapa,
                'Nombre'
              ),

            estado:
              APPV2_textoCampo_(
                row,
                mapa,
                'Estado pasantía'
              ),

            fechaInicio:
              APPV2_fechaISO_(
                APPV2_valorCampo_(
                  row,
                  mapa,
                  'Fecha inicio compromiso'
                ),
                tz
              ),

            fechaFinPlanificada:
              APPV2_fechaISO_(
                APPV2_valorCampo_(
                  row,
                  mapa,
                  'Fecha fin compromiso planificada'
                ),
                tz
              ),

            fechaCorte:
              APPV2_fechaISO_(
                APPV2_valorCampo_(
                  row,
                  mapa,
                  'Fecha corte progreso'
                ),
                tz
              ),

            /*
             * Para compatibilidad visual con el HTML actual,
             * porcentajeTiempo y porcentajeHoras se entregan
             * en escala 0..100.
             */
            porcentajeTiempo:
              pctTiempoPantalla,

            porcentajeTiempoTexto:
              APPV2_porcentajeTextoPantalla_(
                pctTiempoPantalla
              ),

            porcentajeTiempoGrafico:
              pctTiempoGrafico,

            horasObjetivo:
              horasObjetivo,

            horasValidasPasante:
              APPV2_redondear_(
                horasPasante
              ),

            horasConvalidadasAsistente:
              APPV2_redondear_(
                horasAsistente
              ),

            horasValidasCumplimiento:
              APPV2_redondear_(
                horasValidas
              ),

            horasRestantes:
              horasRestantes ===
                null
                ? null
                : APPV2_redondear_(
                    horasRestantes
                  ),

            porcentajeHoras:
              pctHorasPantalla,

            porcentajeHorasTexto:
              APPV2_porcentajeTextoPantalla_(
                pctHorasPantalla
              ),

            porcentajeHorasGrafico:
              pctHorasGrafico,

            diferenciaHorasTiempoPp:
              diferenciaPp,

            supera80Horas:
              pctHorasFraccion ===
                null
                ? 'SIN META'
                : (
                    pctHorasFraccion >
                      0.80
                      ? 'Sí'
                      : 'No'
                  ),

            supera80Tiempo:
              pctTiempoFraccion ===
                null
                ? 'SIN FECHAS'
                : (
                    pctTiempoFraccion >
                      0.80
                      ? 'Sí'
                      : 'No'
                  ),

            estadoDatos:
              estadoDatos,

            tieneAlertasDatos:
              Boolean(
                estadoDatos &&
                APPV2_normalizar_(
                  estadoDatos
                ) !==
                  'ok'
              ),

            observacion:
              APPV2_textoCampo_(
                row,
                mapa,
                'Observación'
              ),

            ultimaActualizacion:
              APPV2_fechaHoraISO_(
                APPV2_valorCampo_(
                  row,
                  mapa,
                  'Última actualización'
                ),
                tz
              )
          };
        }
      );

  personas.sort(
    function(a, b) {
      const ea =
        APPV2_ordenEstado_(
          a.estado
        );

      const eb =
        APPV2_ordenEstado_(
          b.estado
        );

      if (
        ea !==
          eb
      ) {
        return (
          ea -
          eb
        );
      }

      return a.nombre
        .localeCompare(
          b.nombre,
          'es'
        );
    }
  );

  const resumen =
    APPV2_resumir_(
      personas
    );

  let actualizado =
    null;

  personas.forEach(
    function(p) {
      if (
        p.ultimaActualizacion &&
        (
          !actualizado ||
          p.ultimaActualizacion >
            actualizado
        )
      ) {
        actualizado =
          p.ultimaActualizacion;
      }
    }
  );

  return {
    version:
      'API_PORTAL_V2_PRODUCTIVO',

    actualizado:
      actualizado,

    resumen:
      resumen,

    personas:
      personas
  };
}


/* ============================================================
 * RESUMEN
 * ============================================================ */

function APPV2_resumir_(
  personas
) {
  const r =
    APPV2_resumenVacio_();

  r.total =
    personas.length;

  personas.forEach(
    function(p) {
      const estado =
        APPV2_normalizar_(
          p.estado
        );

      if (
        estado ===
          'vigente'
      ) {
        r.vigentes++;
      } else if (
        estado ===
          'terminada' ||
        estado ===
          'terminado'
      ) {
        r.terminadas++;
      } else if (
        estado ===
          'retirado' ||
        estado ===
          'retirada'
      ) {
        r.retiradas++;
      } else if (
        estado ===
          'contratado' ||
        estado ===
          'contratada'
      ) {
        r.contratadas++;
      } else {
        r.sinEstado++;
      }

      if (
        p.horasObjetivo !==
          null
      ) {
        r.conMetaHoras++;
      } else {
        r.sinMetaHoras++;
      }

      if (
        p.tieneAlertasDatos
      ) {
        r.conAlertasDatos++;
      }
    }
  );

  return r;
}


function APPV2_resumenVacio_() {
  return {
    total:
      0,

    vigentes:
      0,

    terminadas:
      0,

    retiradas:
      0,

    contratadas:
      0,

    sinEstado:
      0,

    conMetaHoras:
      0,

    sinMetaHoras:
      0,

    conAlertasDatos:
      0
  };
}


/* ============================================================
 * VALIDACIÓN DE CONTRATO
 * ============================================================ */

function APPV2_requerirHoja_(
  ss
) {
  const hoja =
    ss.getSheetByName(
      APPV2_HOJA_PROGRESO
    );

  if (!hoja) {
    throw new Error(
      'No existe ' +
      APPV2_HOJA_PROGRESO +
      '.'
    );
  }

  return hoja;
}


function APPV2_validarContrato_(
  hoja
) {
  const headers =
    APPV2_leerHeaders_(
      hoja
    );

  const diferencias =
    [];

  APPV2_HEADERS.forEach(
    function(esperado, i) {
      const actual =
        headers[i] || '';

      if (
        APPV2_normalizar_(
          actual
        ) !==
        APPV2_normalizar_(
          esperado
        )
      ) {
        diferencias.push({
          columna:
            i + 1,

          esperado:
            esperado,

          encontrado:
            actual
        });
      }
    }
  );

  if (
    headers.length !==
      APPV2_HEADERS.length
  ) {
    diferencias.push({
      columna:
        'TOTAL',

      esperado:
        APPV2_HEADERS.length,

      encontrado:
        headers.length
    });
  }

  return {
    headers:
      headers,

    diferencias:
      diferencias,

    estructuraExacta:
      (
        diferencias.length ===
          0
      )
  };
}


function APPV2_validarContratoEstricto_(
  hoja
) {
  const resultado =
    APPV2_validarContrato_(
      hoja
    );

  if (
    !resultado
      .estructuraExacta
  ) {
    throw new Error(
      'Progreso_Pasantias no coincide con el contrato productivo de 16 columnas. ' +
      JSON.stringify(
        resultado.diferencias
      )
    );
  }

  return resultado;
}


function APPV2_leerHeaders_(
  hoja
) {
  if (
    hoja.getLastColumn() <
      1
  ) {
    return [];
  }

  return hoja
    .getRange(
      1,
      1,
      1,
      hoja.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(
      function(v) {
        return String(
          v || ''
        ).trim();
      }
    );
}


function APPV2_mapaHeaders_(
  headers
) {
  const mapa =
    {};

  headers.forEach(
    function(h, i) {
      const clave =
        APPV2_normalizar_(
          h
        );

      if (
        clave &&
        !Object.prototype
          .hasOwnProperty.call(
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

  APPV2_HEADERS.forEach(
    function(header) {
      const clave =
        APPV2_normalizar_(
          header
        );

      if (
        !Object.prototype
          .hasOwnProperty.call(
            mapa,
            clave
          )
      ) {
        throw new Error(
          'Falta el encabezado requerido "' +
          header +
          '" en Progreso_Pasantias.'
        );
      }
    }
  );

  return mapa;
}


/* ============================================================
 * LECTURA POR ENCABEZADO
 * ============================================================ */

function APPV2_valorCampo_(
  row,
  mapa,
  header
) {
  const indice =
    mapa[
      APPV2_normalizar_(
        header
      )
    ];

  return (
    indice ===
      undefined
      ? ''
      : row[
          indice
        ]
  );
}


function APPV2_textoCampo_(
  row,
  mapa,
  header
) {
  return String(
    APPV2_valorCampo_(
      row,
      mapa,
      header
    ) || ''
  ).trim();
}


function APPV2_numeroCampo_(
  row,
  mapa,
  header
) {
  const valor =
    APPV2_valorCampo_(
      row,
      mapa,
      header
    );

  const n =
    Number(
      valor
    );

  return Number.isFinite(
    n
  )
    ? n
    : 0;
}


function APPV2_numeroNullableCampo_(
  row,
  mapa,
  header
) {
  const valor =
    APPV2_valorCampo_(
      row,
      mapa,
      header
    );

  if (
    valor === '' ||
    valor === null ||
    valor === undefined
  ) {
    return null;
  }

  const n =
    Number(
      valor
    );

  return Number.isFinite(
    n
  )
    ? n
    : null;
}


/* ============================================================
 * HELPERS
 * ============================================================ */

function APPV2_normalizar_(
  valor
) {
  return String(
    valor == null
      ? ''
      : valor
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


function APPV2_redondear_(
  valor
) {
  return Math.round(
    (
      Number(
        valor
      ) || 0
    ) *
    100
  ) /
  100;
}


function APPV2_porcentajePantalla_(
  fraccion
) {
  if (
    fraccion === null ||
    fraccion === undefined ||
    fraccion === ''
  ) {
    return null;
  }

  const n =
    Number(
      fraccion
    );

  if (
    !Number.isFinite(
      n
    )
  ) {
    return null;
  }

  return APPV2_redondear_(
    n *
    100
  );
}


function APPV2_porcentajeTextoPantalla_(
  porcentaje
) {
  if (
    porcentaje === null ||
    porcentaje === undefined ||
    porcentaje === ''
  ) {
    return '';
  }

  return Number(
    porcentaje
  )
    .toFixed(
      2
    )
    .replace(
      '.',
      ','
    ) +
    ' %';
}


function APPV2_limitarFraccion_(
  valor
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return null;
  }

  const n =
    Number(
      valor
    );

  if (
    !Number.isFinite(
      n
    )
  ) {
    return null;
  }

  return Math.min(
    Math.max(
      n,
      0
    ),
    1
  );
}


function APPV2_fechaISO_(
  valor,
  tz
) {
  if (
    !(valor instanceof Date) ||
    isNaN(
      valor.getTime()
    )
  ) {
    return '';
  }

  return Utilities.formatDate(
    valor,
    tz,
    'yyyy-MM-dd'
  );
}


function APPV2_fechaHoraISO_(
  valor,
  tz
) {
  if (
    !(valor instanceof Date) ||
    isNaN(
      valor.getTime()
    )
  ) {
    return '';
  }

  return Utilities.formatDate(
    valor,
    tz,
    "yyyy-MM-dd'T'HH:mm:ss"
  );
}


function APPV2_ordenEstado_(
  valor
) {
  const e =
    APPV2_normalizar_(
      valor
    );

  if (
    e ===
      'vigente'
  ) {
    return 1;
  }

  if (
    e ===
      'contratado' ||
    e ===
      'contratada'
  ) {
    return 2;
  }

  if (
    e ===
      'terminada' ||
    e ===
      'terminado'
  ) {
    return 3;
  }

  if (
    e ===
      'retirado' ||
    e ===
      'retirada'
  ) {
    return 4;
  }

  return 5;
}

/**
 * ============================================================
 * API PORTAL V4.1 — LECTURA OPERATIVA + LANZADOR DE INTERFAZ
 * RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 *
 * COMPLEMENTA API PORTAL V2.
 *
 * OBJETIVO
 * Construir la lectura administrativa completa que necesita la
 * página Gestión de pasantes y nuevos miembros, incluyendo:
 * - Seguimiento_Ingreso
 * - Variables_Internas
 * - Catalogo_Cursos
 * - Control_Cursos
 * - Documentacion_Pasantia
 * - Registro_Informes
 * - Progreso_Pasantias
 *
 * POBLACIÓN
 * Unión por Correo oficial de:
 * - Seguimiento_Ingreso
 * - Variables_Internas
 *
 * Esto permite mostrar también postulantes que todavía NO deben
 * existir en Variables_Internas.
 *
 * ASISTENTES DIRECTOS
 * Se mantienen EXPLÍCITAMENTE separados. V3 NO los mezcla con
 * pasantías ni inventa una integración que todavía no existe.
 *
 * SEGURIDAD
 * - SOLO LECTURA.
 * - No modifica hojas.
 * - No crea triggers.
 * - No define doGet/doPost.
 * - No lee Accesos_Internos.
 * - No devuelve credenciales, tokens ni datos sensibles técnicos.
 *
 * FUNCIONES PÚBLICAS
 * - diagnosticarPortalCompletoV3()
 * - obtenerGestionMiembrosV3()
 * ============================================================
 */

const APPV3_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const APPV3_FUENTES = {
  Seguimiento_Ingreso: [
    'Correo oficial',
    'Nombre',
    'Ruta de ingreso',
    'Resultado entrevista',
    'Estado de ingreso',
    'Fecha entrevista',
    'Entrevistador/a',
    'Estado programación entrevista',
    'Cursos aprobados',
    'Cursos requeridos',
    'Estado inducción',
    'Fecha completado cursos',
    '¿Tiene horario de postulación vinculado?',
    'Estado formalización',
    'ID carpeta postulación',
    'URL carpeta postulación',
    'Estado aviso encargados',
    'Fecha aviso encargados',
    'Destinatarios aviso',
    'Observación',
    'ID postulación',
    'Fila formulario',
    'Marca temporal',
    'Fecha inicio plazo cursos',
    'Fecha límite cursos'
  ],

  Variables_Internas: [
    'Correo oficial',
    'Nombre',
    'Ruta de ingreso',
    'Resultado entrevista',
    'Estado de ingreso',
    'Cursos aprobados',
    'Cursos requeridos',
    'Estado inducción',
    'Encargado',
    'Componente 1',
    'Componente 2',
    'Estado de pasantía',
    'Fecha inicio pasantía',
    'Fecha fin pasantía',
    'Horas objetivo',
    'Link Planner',
    'Fecha inicio extensión',
    'Fecha fin extensión',
    'Tiene extensión',
    'Cualidad actual',
    'Cualidad pasada',
    'Estado transición laboral',
    'Fecha inicio transición laboral',
    'Observación transición laboral',
    'Estado vínculo laboral',
    'Fecha fin vínculo laboral',
    'Motivo fin vínculo laboral',
    'Estado documentación física',
    'Documentos completos',
    'Documentos pendientes'
  ],

  Catalogo_Cursos: [
    'Curso',
    'Nota mínima',
    'Obligatorio',
    'Activo'
  ],

  Control_Cursos: [
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
  ],

  Documentacion_Pasantia: [
    'Correo oficial',
    'Nombre',
    'Código documento',
    'Grupo',
    'Documento / control',
    'Aplica',
    'Estado',
    'Fecha recepción',
    'Fecha validación',
    'Actualizado por',
    'Última actualización',
    'Campo legado',
    'Observación'
  ],

  Horarios_Postulacion: [
    'ID horario',
    'Fecha generación',
    'Correo ingresado',
    'Nombre ingresado',
    'Horas semanales',
    'Estado',
    'Fecha vinculación',
    'Correo formulario principal',
    'Correo formulario alternativo',
    'Horas declaradas formulario',
    'ID archivo PDF',
    'Nombre archivo PDF',
    'Fecha última actualización'
  ],

  Control_horarios: [
    'Correo oficial',
    'Nombre del pasante',
    'Versión (H1, H2, H3...)',
    'Vigente (Sí/No)',
    'Fecha inicio',
    'Fecha fin'
  ],

  Control_Periodos: [
    'Correo oficial',
    'Nombre',
    'Tipo',
    'Periodo',
    'Fecha inicio',
    'Fecha fin',
    'Estado periodo',
    'Fecha cierre',
    'Horas planner al cierre',
    'Horas con evidencia al cierre',
    'Horas asistencia al cierre',
    'Horas dentro horario',
    'Horas fuera horario',
    'Horas extras aprobadas',
    'Ajustes',
    'Horas finales'
  ],

  Registro_Informes: [
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
  ],

  Progreso_Pasantias: [
    'Correo oficial',
    'Nombre',
    'Estado pasantía',
    'Fecha inicio compromiso',
    'Fecha fin compromiso planificada',
    'Fecha corte progreso',
    'Porcentaje tiempo transcurrido',
    'Horas objetivo',
    'Horas válidas como pasante',
    'Horas convalidadas como asistente',
    'Horas válidas para cumplimiento',
    'Horas restantes',
    'Porcentaje horas cumplidas',
    'Estado datos',
    'Observación',
    'Última actualización'
  ]
};

/* ============================================================
 * FUNCIONES PÚBLICAS V4 (con alias V3 por compatibilidad)
 * ============================================================ */

function diagnosticarPortalCompletoV3() {
  const ss =
    SpreadsheetApp.openById(
      APPV3_DB_ID
    );

  const validacion =
    APPV3_validarFuentes_(
      ss
    );

  if (
    validacion.errores.length
  ) {
    const salidaError = {
      version:
        'API_PORTAL_V4_1_LECTURA_OPERATIVA',

      escritura:
        false,

      errores:
        validacion.errores,

      listoPortalCompleto:
        false,

      estado:
        'REVISAR'
    };

    console.log(
      '=== DIAGNÓSTICO PORTAL OPERATIVO V4 ==='
    );

    console.log(
      salidaError
    );

    return salidaError;
  }

  const gestion =
    APPV3_construirGestion_(
      ss
    );

  const resumen = {
    version:
      'API_PORTAL_V4_1_LECTURA_OPERATIVA',

    escritura:
      false,

    fuentesEsperadas:
      Object.keys(
        APPV3_FUENTES
      ).length,

    fuentesOk:
      validacion.fuentesOk,

    errores:
      [],

    personasPortal:
      gestion.pasantias.length,

    personasSeguimiento:
      gestion.resumen.personasSeguimiento,

    personasVariables:
      gestion.resumen.personasVariables,

    soloSeguimiento:
      gestion.resumen.soloSeguimiento,

    seguimientoYVariables:
      gestion.resumen.seguimientoYVariables,

    conCursosDetalle:
      gestion.resumen.conCursosDetalle,

    conDocumentacion:
      gestion.resumen.conDocumentacion,

    conInformes:
      gestion.resumen.conInformes,

    conProgreso:
      gestion.resumen.conProgreso,

    conHorarioPostulacion:
      gestion.resumen.conHorarioPostulacion,

    conCarpetaPersonal:
      gestion.resumen.conCarpetaPersonal,

    conHorarioOficial:
      gestion.resumen.conHorarioOficial,

    conPeriodos:
      gestion.resumen.conPeriodos,

    entrevistaPendiente:
      gestion.resumen.entrevistaPendiente,

    cursosEnProgreso:
      gestion.resumen.cursosEnProgreso,

    formalizacionPendiente:
      gestion.resumen.formalizacionPendiente,

    pasantiaActiva:
      gestion.resumen.pasantiaActiva,

    denegados:
      gestion.resumen.denegados,

    otros:
      gestion.resumen.otros,

    asistentesDirectosIntegrados:
      false,

    mezclaAsistentesDirectos:
      false,

    lecturaPorEncabezado:
      true,

    listoPortalCompleto:
      true,

    estado:
      'OK'
  };

  console.log(
    '=== DIAGNÓSTICO PORTAL OPERATIVO V4 ==='
  );

  console.log(
    resumen
  );

  Logger.log(
    JSON.stringify(
      resumen
    )
  );

  return resumen;
}


function obtenerGestionMiembrosV3() {
  const ss =
    SpreadsheetApp.openById(
      APPV3_DB_ID
    );

  const validacion =
    APPV3_validarFuentes_(
      ss
    );

  if (
    validacion.errores.length
  ) {
    throw new Error(
      'Portal V3 bloqueado por contrato de datos: ' +
      validacion.errores.join(
        ' | '
      )
    );
  }

  const salida =
    APPV3_construirGestion_(
      ss
    );

  console.log(
    '=== GESTIÓN DE PASANTES Y NUEVOS MIEMBROS V4 ==='
  );

  console.log({
    personas:
      salida.pasantias.length,

    resumen:
      salida.resumen,

    actualizado:
      salida.actualizado,

    asistentesDirectosIntegrados:
      false,

    escritura:
      false
  });

  return salida;
}



function diagnosticarPortalCompletoV4() {
  return diagnosticarPortalCompletoV3();
}


function obtenerGestionPasantesV4() {
  return obtenerGestionMiembrosV3();
}


/* ============================================================
 * CONSTRUCCIÓN GENERAL
 * ============================================================ */

function APPV3_construirGestion_(
  ss
) {
  const tz =
    ss.getSpreadsheetTimeZone() ||
    Session.getScriptTimeZone() ||
    'America/La_Paz';

  const seguimiento =
    APPV3_indiceUnicoPorCorreo_(
      APPV3_leerTabla_(
        ss,
        'Seguimiento_Ingreso'
      ),
      'Seguimiento_Ingreso'
    );

  const variables =
    APPV3_indiceUnicoPorCorreo_(
      APPV3_leerTabla_(
        ss,
        'Variables_Internas'
      ),
      'Variables_Internas'
    );

  const progreso =
    APPV3_indiceUnicoPorCorreo_(
      APPV3_leerTabla_(
        ss,
        'Progreso_Pasantias'
      ),
      'Progreso_Pasantias'
    );

  const cursos =
    APPV3_agruparPorCorreo_(
      APPV3_leerTabla_(
        ss,
        'Control_Cursos'
      )
    );

  const documentacion =
    APPV3_agruparPorCorreo_(
      APPV3_leerTabla_(
        ss,
        'Documentacion_Pasantia'
      )
    );

  const informes =
    APPV3_agruparPorCorreo_(
      APPV3_leerTabla_(
        ss,
        'Registro_Informes'
      )
    );

  const horariosPostulacion =
    APPV3_leerTabla_(
      ss,
      'Horarios_Postulacion'
    );

  const horariosOficiales =
    APPV3_agruparPorCorreo_(
      APPV3_leerTabla_(
        ss,
        'Control_horarios'
      )
    );

  const periodos =
    APPV3_agruparPorCorreo_(
      APPV3_leerTabla_(
        ss,
        'Control_Periodos'
      )
    );

  const revisionPeriodos =
    APPV4_mapaRevisionPeriodos_();

  const correos =
    APPV3_unionClaves_(
      seguimiento,
      variables
    );

  const personas =
    correos.map(
      function(correo) {
        const seg =
          seguimiento[
            correo
          ] || null;

        const vari =
          variables[
            correo
          ] || null;

        const prog =
          progreso[
            correo
          ] || null;

        const filasCursos =
          cursos[
            correo
          ] || [];

        const filasDocs =
          documentacion[
            correo
          ] || [];

        const filasInformes =
          informes[
            correo
          ] || [];

        const horarioPostulacion =
          APPV3_horarioPostulacionPersona_(
            horariosPostulacion,
            correo
          );

        const filasHorariosOficiales =
          horariosOficiales[
            correo
          ] || [];

        const filasPeriodos =
          periodos[
            correo
          ] || [];

        return APPV3_construirPersona_(
          correo,
          seg,
          vari,
          prog,
          filasCursos,
          filasDocs,
          filasInformes,
          horarioPostulacion,
          filasHorariosOficiales,
          filasPeriodos,
          tz,
          revisionPeriodos
        );
      }
    );

  personas.sort(
    function(a, b) {
      const ea =
        APPV3_ordenEtapa_(
          a.etapaPortal
        );

      const eb =
        APPV3_ordenEtapa_(
          b.etapaPortal
        );

      if (
        ea !==
          eb
      ) {
        return (
          ea -
          eb
        );
      }

      return a.nombre
        .localeCompare(
          b.nombre,
          'es'
        );
    }
  );

  const resumen =
    APPV3_resumirGestion_(
      personas,
      seguimiento,
      variables
    );

  let actualizado =
    null;

  personas.forEach(
    function(p) {
      if (
        p.ultimaActualizacion &&
        (
          !actualizado ||
          p.ultimaActualizacion >
            actualizado
        )
      ) {
        actualizado =
          p.ultimaActualizacion;
      }
    }
  );

  return {
    version:
      'API_PORTAL_V4_1_LECTURA_OPERATIVA',

    actualizado:
      actualizado,

    resumen:
      resumen,

    pasantias:
      personas,

    asistentesDirectos: {
      integrado:
        false,

      personas:
        [],

      motivo:
        (
          'Ruta separada. La integración de asistentes directos ' +
          'no forma parte de esta API de pasantías.'
        )
    }
  };
}


function APPV3_construirPersona_(
  correo,
  seg,
  vari,
  prog,
  filasCursos,
  filasDocs,
  filasInformes,
  horarioPostulacion,
  filasHorariosOficiales,
  filasPeriodos,
  tz,
  revisionPeriodos
) {
  const nombre =
    APPV3_primerTexto_([
      APPV3_campo_(
        vari,
        'Nombre'
      ),
      APPV3_campo_(
        seg,
        'Nombre'
      ),
      APPV3_campo_(
        prog,
        'Nombre'
      )
    ]);

  const ruta =
    APPV3_primerTexto_([
      APPV3_campo_(
        seg,
        'Ruta de ingreso'
      ),
      APPV3_campo_(
        vari,
        'Ruta de ingreso'
      )
    ]);

  const resultadoEntrevista =
    APPV3_primerTexto_([
      APPV3_campo_(
        seg,
        'Resultado entrevista'
      ),
      APPV3_campo_(
        vari,
        'Resultado entrevista'
      )
    ]);

  const estadoIngreso =
    APPV3_primerTexto_([
      APPV3_campo_(
        seg,
        'Estado de ingreso'
      ),
      APPV3_campo_(
        vari,
        'Estado de ingreso'
      )
    ]);

  const cursosAprobados =
    APPV3_primerNumeroNullable_([
      APPV3_campo_(
        seg,
        'Cursos aprobados'
      ),
      APPV3_campo_(
        vari,
        'Cursos aprobados'
      )
    ]);

  const cursosRequeridos =
    APPV3_primerNumeroNullable_([
      APPV3_campo_(
        seg,
        'Cursos requeridos'
      ),
      APPV3_campo_(
        vari,
        'Cursos requeridos'
      )
    ]);

  const estadoPasantia =
    APPV3_primerTexto_([
      APPV3_campo_(
        vari,
        'Estado de pasantía'
      ),
      APPV3_campo_(
        prog,
        'Estado pasantía'
      )
    ]);

  const fechaInicio =
    APPV3_primerValor_([
      APPV3_campo_(
        vari,
        'Fecha inicio pasantía'
      ),
      APPV3_campo_(
        prog,
        'Fecha inicio compromiso'
      )
    ]);

  const fechaFin =
    APPV3_primerValor_([
      APPV3_campo_(
        vari,
        'Fecha fin pasantía'
      ),
      APPV3_campo_(
        prog,
        'Fecha fin compromiso planificada'
      )
    ]);

  const horasObjetivo =
    APPV3_primerNumeroNullable_([
      APPV3_campo_(
        vari,
        'Horas objetivo'
      ),
      APPV3_campo_(
        prog,
        'Horas objetivo'
      )
    ]);

  const pctTiempoFraccion =
    APPV3_numeroNullable_(
      APPV3_campo_(
        prog,
        'Porcentaje tiempo transcurrido'
      )
    );

  const pctHorasFraccion =
    APPV3_numeroNullable_(
      APPV3_campo_(
        prog,
        'Porcentaje horas cumplidas'
      )
    );

  const docs =
    filasDocs.map(
      function(item) {
        return {
          codigo:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Código documento'
              )
            ),

          grupo:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Grupo'
              )
            ),

          documento:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Documento / control'
              )
            ),

          aplica:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Aplica'
              )
            ),

          estado:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Estado'
              )
            ),

          fechaRecepcion:
            APPV3_fechaFlexible_(
              APPV3_campo_(
                item,
                'Fecha recepción'
              ),
              tz
            ),

          fechaValidacion:
            APPV3_fechaFlexible_(
              APPV3_campo_(
                item,
                'Fecha validación'
              ),
              tz
            ),

          observacion:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Observación'
              )
            )
        };
      }
    );

  const resumenDocs =
    APPV3_resumirDocumentacion_(
      docs,
      vari
    );

  const cursosDetalle =
    filasCursos.map(
      function(item) {
        return {
          curso:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Curso'
              )
            ),

          estado:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Estado curso'
              )
            ),

          nota:
            APPV3_numeroNullable_(
              APPV3_campo_(
                item,
                'Nota oficial'
              )
            ),

          fechaIntento:
            APPV3_fechaFlexible_(
              APPV3_campo_(
                item,
                'Fecha intento oficial'
              ),
              tz
            ),

          intentosDetectados:
            APPV3_numeroNullable_(
              APPV3_campo_(
                item,
                'Intentos detectados'
              )
            ),

          alerta:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Alerta'
              )
            )
        };
      }
    );

  const reportes =
    filasInformes.map(
      function(item) {
        const docId =
          APPV3_texto_(
            APPV3_campo_(
              item,
              'ID Google Doc'
            )
          );

        return {
          idInforme:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'ID informe'
              )
            ),

          tipoInforme:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Tipo informe'
              )
            ),

          tipoPeriodo:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Tipo periodo'
              )
            ),

          periodo:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Periodo'
              )
            ),

          estadoDatos:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Estado datos'
              )
            ),

          estadoInforme:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Estado informe'
              )
            ),

          version:
            APPV3_numeroNullable_(
              APPV3_campo_(
                item,
                'Version'
              )
            ),

          fechaGeneracion:
            APPV3_fechaHoraFlexible_(
              APPV3_campo_(
                item,
                'Fecha generacion'
              ),
              tz
            ),

          idGoogleDoc:
            docId,

          urlGoogleDoc:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'URL Google Doc'
              )
            ),

          urlPdf:
            docId
              ? (
                  'https://docs.google.com/document/d/' +
                  encodeURIComponent(docId) +
                  '/export?format=pdf'
                )
              : '',

          observacion:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Observacion'
              )
            ),

          resumenCopiable:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Resumen copiable'
              )
            ),

          tareasPrincipales:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Tareas principales'
              )
            ),

          habilidadesDestacadas:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Habilidades destacadas'
              )
            ),

          rendimientoOperativo:
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Rendimiento operativo'
              )
            )
        };
      }
    );

  const carpetaInformesId =
    APPV3_primerTexto_(
      filasInformes.map(
        function(item) {
          return APPV3_campo_(
            item,
            'ID carpeta persona'
          );
        }
      )
    );

  const horarioPost =
    APPV3_construirHorarioPostulacion_(
      horarioPostulacion,
      tz
    );

  const horarioOficial =
    APPV3_construirHorarioOficial_(
      filasHorariosOficiales,
      tz
    );

  const periodosDetalle =
    APPV3_construirPeriodos_(
      filasPeriodos,
      tz,
      correo,
      revisionPeriodos
    );

  const etapaPortal =
    APPV3_etapaPortal_({
      resultadoEntrevista:
        resultadoEntrevista,

      estadoIngreso:
        estadoIngreso,

      cursosAprobados:
        cursosAprobados,

      cursosRequeridos:
        cursosRequeridos,

      fechaInicio:
        fechaInicio,

      estadoPasantia:
        estadoPasantia
    });

  const actualizaciones = [
    APPV3_campo_(
      seg,
      'Marca temporal'
    ),
    APPV3_campo_(
      prog,
      'Última actualización'
    )
  ];

  filasDocs.forEach(
    function(item) {
      actualizaciones.push(
        APPV3_campo_(
          item,
          'Última actualización'
        )
      );
    }
  );

  filasInformes.forEach(
    function(item) {
      actualizaciones.push(
        APPV3_campo_(
          item,
          'Ultima actualizacion'
        )
      );
    }
  );

  return {
    correo:
      correo,

    nombre:
      nombre,

    origenPortal:
      (
        seg &&
        vari
          ? 'SEGUIMIENTO_Y_VARIABLES'
          : (
              seg
                ? 'SOLO_SEGUIMIENTO'
                : 'SOLO_VARIABLES'
            )
      ),

    ruta:
      ruta,

    etapaPortal:
      etapaPortal,

    entrevista: {
      resultado:
        resultadoEntrevista,

      fecha:
        APPV3_fechaFlexible_(
          APPV3_campo_(
            seg,
            'Fecha entrevista'
          ),
          tz
        ),

      entrevistador:
        APPV3_texto_(
          APPV3_campo_(
            seg,
            'Entrevistador/a'
          )
        ),

      estadoProgramacion:
        APPV3_texto_(
          APPV3_campo_(
            seg,
            'Estado programación entrevista'
          )
        )
    },

    ingreso: {
      estado:
        estadoIngreso,

      estadoInduccion:
        APPV3_primerTexto_([
          APPV3_campo_(
            seg,
            'Estado inducción'
          ),
          APPV3_campo_(
            vari,
            'Estado inducción'
          )
        ]),

      estadoFormalizacion:
        APPV3_texto_(
          APPV3_campo_(
            seg,
            'Estado formalización'
          )
        ),

      horarioPostulacionVinculado:
        APPV3_texto_(
          APPV3_campo_(
            seg,
            '¿Tiene horario de postulación vinculado?'
          )
        ),

      fechaCompletadoCursos:
        APPV3_fechaFlexible_(
          APPV3_primerValor_([
            APPV3_campo_(
              seg,
              'Fecha completado cursos'
            ),
            APPV3_campo_(
              vari,
              'Fecha completado cursos'
            )
          ]),
          tz
        ),

      fechaInicioPlazoCursos:
        APPV3_fechaFlexible_(
          APPV3_campo_(
            seg,
            'Fecha inicio plazo cursos'
          ),
          tz
        ),

      fechaLimiteCursos:
        APPV3_fechaFlexible_(
          APPV3_campo_(
            seg,
            'Fecha límite cursos'
          ),
          tz
        ),

      carpetaPostulacionId:
        APPV3_texto_(
          APPV3_campo_(
            seg,
            'ID carpeta postulación'
          )
        ),

      carpetaPostulacionUrl:
        APPV3_texto_(
          APPV3_campo_(
            seg,
            'URL carpeta postulación'
          )
        ),

      estadoAvisoEncargados:
        APPV3_texto_(
          APPV3_campo_(
            seg,
            'Estado aviso encargados'
          )
        ),

      fechaAvisoEncargados:
        APPV3_fechaHoraFlexible_(
          APPV3_campo_(
            seg,
            'Fecha aviso encargados'
          ),
          tz
        ),

      destinatariosAviso:
        APPV3_texto_(
          APPV3_campo_(
            seg,
            'Destinatarios aviso'
          )
        )
    },

    cursos: {
      aprobados:
        cursosAprobados,

      requeridos:
        cursosRequeridos,

      detalle:
        cursosDetalle
    },

    pasantia: {
      estado:
        estadoPasantia,

      encargado:
        APPV3_texto_(
          APPV3_campo_(
            vari,
            'Encargado'
          )
        ),

      componente1:
        APPV3_texto_(
          APPV3_campo_(
            vari,
            'Componente 1'
          )
        ),

      componente2:
        APPV3_texto_(
          APPV3_campo_(
            vari,
            'Componente 2'
          )
        ),

      fechaInicio:
        APPV3_fechaFlexible_(
          fechaInicio,
          tz
        ),

      fechaFin:
        APPV3_fechaFlexible_(
          fechaFin,
          tz
        ),

      horasObjetivo:
        horasObjetivo,

      linkPlanner:
        APPV3_texto_(
          APPV3_campo_(
            vari,
            'Link Planner'
          )
        ),

      tieneExtension:
        APPV3_texto_(
          APPV3_campo_(
            vari,
            'Tiene extensión'
          )
        ),

      fechaInicioExtension:
        APPV3_fechaFlexible_(
          APPV3_campo_(
            vari,
            'Fecha inicio extensión'
          ),
          tz
        ),

      fechaFinExtension:
        APPV3_fechaFlexible_(
          APPV3_campo_(
            vari,
            'Fecha fin extensión'
          ),
          tz
        ),

      cualidadActual:
        APPV3_texto_(
          APPV3_campo_(
            vari,
            'Cualidad actual'
          )
        ),

      cualidadPasada:
        APPV3_texto_(
          APPV3_campo_(
            vari,
            'Cualidad pasada'
          )
        ),

      transicionLaboral: {
        estado:
          APPV3_texto_(
            APPV3_campo_(
              vari,
              'Estado transición laboral'
            )
          ),

        fechaInicio:
          APPV3_fechaFlexible_(
            APPV3_campo_(
              vari,
              'Fecha inicio transición laboral'
            ),
            tz
          ),

        observacion:
          APPV3_texto_(
            APPV3_campo_(
              vari,
              'Observación transición laboral'
            )
          ),

        estadoVinculo:
          APPV3_texto_(
            APPV3_campo_(
              vari,
              'Estado vínculo laboral'
            )
          ),

        fechaFinVinculo:
          APPV3_fechaFlexible_(
            APPV3_campo_(
              vari,
              'Fecha fin vínculo laboral'
            ),
            tz
          ),

        motivoFinVinculo:
          APPV3_texto_(
            APPV3_campo_(
              vari,
              'Motivo fin vínculo laboral'
            )
          )
      }
    },

    horarioPostulacion:
      horarioPost,

    horarioOficial:
      horarioOficial,

    periodos: {
      existe:
        periodosDetalle.length >
          0,

      cantidad:
        periodosDetalle.length,

      items:
        periodosDetalle
    },

    progreso: {
      existe:
        Boolean(
          prog
        ),

      fechaCorte:
        APPV3_fechaFlexible_(
          APPV3_campo_(
            prog,
            'Fecha corte progreso'
          ),
          tz
        ),

      porcentajeTiempo:
        APPV3_porcentajePantalla_(
          pctTiempoFraccion
        ),

      porcentajeTiempoGrafico:
        APPV3_limitarFraccionV3_(
          pctTiempoFraccion
        ),

      horasObjetivo:
        APPV3_numeroNullable_(
          APPV3_campo_(
            prog,
            'Horas objetivo'
          )
        ),

      horasValidasPasante:
        APPV3_numeroNullable_(
          APPV3_campo_(
            prog,
            'Horas válidas como pasante'
          )
        ),

      horasConvalidadasAsistente:
        APPV3_numeroNullable_(
          APPV3_campo_(
            prog,
            'Horas convalidadas como asistente'
          )
        ),

      horasValidasCumplimiento:
        APPV3_numeroNullable_(
          APPV3_campo_(
            prog,
            'Horas válidas para cumplimiento'
          )
        ),

      horasRestantes:
        APPV3_numeroNullable_(
          APPV3_campo_(
            prog,
            'Horas restantes'
          )
        ),

      porcentajeHoras:
        APPV3_porcentajePantalla_(
          pctHorasFraccion
        ),

      porcentajeHorasGrafico:
        APPV3_limitarFraccionV3_(
          pctHorasFraccion
        ),

      estadoDatos:
        APPV3_texto_(
          APPV3_campo_(
            prog,
            'Estado datos'
          )
        ),

      observacion:
        APPV3_texto_(
          APPV3_campo_(
            prog,
            'Observación'
          )
        )
    },

    documentacion: {
      existe:
        docs.length >
          0,

      resumen:
        resumenDocs,

      items:
        docs
    },

    informes: {
      existe:
        reportes.length >
          0,

      carpetaPersonaId:
        carpetaInformesId,

      carpetaPersonaUrl:
        APPV3_urlCarpetaDrive_(
          carpetaInformesId
        ),

      cantidad:
        reportes.length,

      items:
        reportes
    },

    observacionIngreso:
      APPV3_texto_(
        APPV3_campo_(
          seg,
          'Observación'
        )
      ),

    ultimaActualizacion:
      APPV3_maxFechaHoraISO_(
        actualizaciones,
        tz
      )
  };
}


/* ============================================================
 * REGLAS DE PRESENTACIÓN
 * ============================================================ */

function APPV3_etapaPortal_(
  x
) {
  const resultado =
    APPV3_norm_(
      x.resultadoEntrevista
    );

  const estadoIngreso =
    APPV3_norm_(
      x.estadoIngreso
    );

  const estadoPasantia =
    APPV3_norm_(
      x.estadoPasantia
    );

  if (
    resultado ===
      'rechazado' ||
    resultado ===
      'rechazada' ||
    estadoIngreso ===
      'denegado' ||
    estadoIngreso ===
      'denegada'
  ) {
    return 'Denegado';
  }

  if (
    !resultado
  ) {
    return 'Entrevista pendiente';
  }

  const requeridos =
    x.cursosRequeridos;

  const aprobados =
    x.cursosAprobados;

  if (
    requeridos !== null &&
    requeridos >
      0 &&
    (
      aprobados === null ||
      aprobados <
        requeridos
    )
  ) {
    return 'Cursos en progreso';
  }

  if (
    resultado ===
      'aceptado' ||
    resultado ===
      'aceptada'
  ) {
    if (
      !x.fechaInicio
    ) {
      return 'Formalización pendiente';
    }

    if (
      estadoPasantia ===
        'vigente'
    ) {
      return 'Pasantía activa';
    }
  }

  if (
    estadoPasantia
  ) {
    return x.estadoPasantia;
  }

  if (
    estadoIngreso
  ) {
    return x.estadoIngreso;
  }

  return 'Postulación recibida';
}


function APPV3_resumirDocumentacion_(
  docs,
  vari
) {
  const aplicables =
    docs.filter(
      function(d) {
        const aplica =
          APPV3_norm_(
            d.aplica
          );

        return !(
          aplica ===
            'no' ||
          aplica ===
            'no aplica' ||
          aplica ===
            'n/a'
        );
      }
    );

  const completos =
    aplicables.filter(
      function(d) {
        const estado =
          APPV3_norm_(
            d.estado
          );

        return (
          estado ===
            'completo' ||
          estado ===
            'recibido' ||
          estado ===
            'validado'
        );
      }
    );

  const pendientes =
    Math.max(
      aplicables.length -
      completos.length,
      0
    );

  const pct =
    aplicables.length
      ? Math.round(
          completos.length /
          aplicables.length *
          100
        )
      : null;

  return {
    estadoGlobal:
      APPV3_texto_(
        APPV3_campo_(
          vari,
          'Estado documentación física'
        )
      ),

    documentosCompletosDeclarados:
      APPV3_numeroNullable_(
        APPV3_campo_(
          vari,
          'Documentos completos'
        )
      ),

    documentosPendientesDeclarados:
      APPV3_numeroNullable_(
        APPV3_campo_(
          vari,
          'Documentos pendientes'
        )
      ),

    itemsTotales:
      docs.length,

    aplicables:
      aplicables.length,

    completos:
      completos.length,

    pendientes:
      pendientes,

    porcentaje:
      pct
  };
}


function APPV3_resumirGestion_(
  personas,
  seguimiento,
  variables
) {
  const r = {
    total:
      personas.length,

    personasSeguimiento:
      Object.keys(
        seguimiento
      ).length,

    personasVariables:
      Object.keys(
        variables
      ).length,

    soloSeguimiento:
      0,

    seguimientoYVariables:
      0,

    conCursosDetalle:
      0,

    conDocumentacion:
      0,

    conInformes:
      0,

    conProgreso:
      0,

    conHorarioPostulacion:
      0,

    conCarpetaPersonal:
      0,

    conHorarioOficial:
      0,

    conPeriodos:
      0,

    entrevistaPendiente:
      0,

    cursosEnProgreso:
      0,

    formalizacionPendiente:
      0,

    pasantiaActiva:
      0,

    denegados:
      0,

    otros:
      0
  };

  personas.forEach(
    function(p) {
      if (
        p.origenPortal ===
          'SOLO_SEGUIMIENTO'
      ) {
        r.soloSeguimiento++;
      }

      if (
        p.origenPortal ===
          'SEGUIMIENTO_Y_VARIABLES'
      ) {
        r.seguimientoYVariables++;
      }

      if (
        p.cursos.detalle.length >
          0
      ) {
        r.conCursosDetalle++;
      }

      if (
        p.documentacion.existe
      ) {
        r.conDocumentacion++;
      }

      if (
        p.informes.existe
      ) {
        r.conInformes++;
      }

      if (
        p.progreso.existe
      ) {
        r.conProgreso++;
      }

      if (
        p.horarioPostulacion &&
        p.horarioPostulacion.existe
      ) {
        r.conHorarioPostulacion++;
      }

      if (
        p.pasantia &&
        p.pasantia.linkPlanner
      ) {
        r.conCarpetaPersonal++;
      }

      if (
        p.horarioOficial &&
        p.horarioOficial.existe
      ) {
        r.conHorarioOficial++;
      }

      if (
        p.periodos &&
        p.periodos.existe
      ) {
        r.conPeriodos++;
      }

      const etapa =
        APPV3_norm_(
          p.etapaPortal
        );

      if (
        etapa ===
          'entrevista pendiente'
      ) {
        r.entrevistaPendiente++;
      } else if (
        etapa ===
          'cursos en progreso'
      ) {
        r.cursosEnProgreso++;
      } else if (
        etapa ===
          'formalizacion pendiente'
      ) {
        r.formalizacionPendiente++;
      } else if (
        etapa ===
          'pasantia activa'
      ) {
        r.pasantiaActiva++;
      } else if (
        etapa ===
          'denegado' ||
        etapa ===
          'denegada'
      ) {
        r.denegados++;
      } else {
        r.otros++;
      }
    }
  );

  return r;
}


/* ============================================================
 * LECTURA DE TABLAS
 * ============================================================ */

function APPV3_leerTabla_(
  ss,
  nombreHoja
) {
  const hoja =
    ss.getSheetByName(
      nombreHoja
    );

  if (!hoja) {
    throw new Error(
      'No existe ' +
      nombreHoja +
      '.'
    );
  }

  const lastCol =
    hoja.getLastColumn();

  const lastRow =
    hoja.getLastRow();

  if (
    lastCol <
      1
  ) {
    return [];
  }

  const headers =
    hoja
      .getRange(
        1,
        1,
        1,
        lastCol
      )
      .getDisplayValues()[0]
      .map(
        function(h) {
          return String(
            h || ''
          ).trim();
        }
      );

  if (
    lastRow <=
      1
  ) {
    return [];
  }

  const values =
    hoja
      .getRange(
        2,
        1,
        lastRow - 1,
        lastCol
      )
      .getValues();

  return values.map(
    function(row) {
      const item = {
        _headers:
          headers
      };

      headers.forEach(
        function(header, i) {
          item[
            APPV3_norm_(
              header
            )
          ] =
            row[
              i
            ];
        }
      );

      return item;
    }
  );
}


function APPV3_indiceUnicoPorCorreo_(
  filas,
  nombreHoja
) {
  const out =
    {};

  filas.forEach(
    function(item) {
      const correo =
        APPV3_correo_(
          APPV3_campo_(
            item,
            'Correo oficial'
          )
        );

      if (!correo) {
        return;
      }

      if (
        out[
          correo
        ]
      ) {
        throw new Error(
          nombreHoja +
          ' contiene más de una fila para ' +
          correo +
          '.'
        );
      }

      out[
        correo
      ] =
        item;
    }
  );

  return out;
}


function APPV3_agruparPorCorreo_(
  filas
) {
  const out =
    {};

  filas.forEach(
    function(item) {
      const correo =
        APPV3_correo_(
          APPV3_campo_(
            item,
            'Correo oficial'
          )
        );

      if (!correo) {
        return;
      }

      if (
        !out[
          correo
        ]
      ) {
        out[
          correo
        ] =
          [];
      }

      out[
        correo
      ].push(
        item
      );
    }
  );

  return out;
}



function APPV3_horarioPostulacionPersona_(
  filas,
  correo
) {
  const correoN =
    APPV3_correo_(
      correo
    );

  const candidatos =
    (filas || [])
      .filter(
        function(item) {
          const principal =
            APPV3_correo_(
              APPV3_campo_(
                item,
                'Correo formulario principal'
              )
            );

          const ingresado =
            APPV3_correo_(
              APPV3_campo_(
                item,
                'Correo ingresado'
              )
            );

          const alternativo =
            APPV3_correo_(
              APPV3_campo_(
                item,
                'Correo formulario alternativo'
              )
            );

          return (
            principal === correoN ||
            ingresado === correoN ||
            alternativo === correoN
          );
        }
      );

  if (!candidatos.length) {
    return null;
  }

  const vinculados =
    candidatos.filter(
      function(item) {
        const estado =
          APPV3_norm_(
            APPV3_campo_(
              item,
              'Estado'
            )
          );

        return (
          estado.indexOf(
            'vinc'
          ) >=
            0 ||
          Boolean(
            APPV3_campo_(
              item,
              'Fecha vinculación'
            )
          )
        );
      }
    );

  const fuente =
    vinculados.length
      ? vinculados
      : candidatos;

  fuente.sort(
    function(a, b) {
      const fa =
        APPV3_campo_(
          a,
          'Fecha última actualización'
        );

      const fb =
        APPV3_campo_(
          b,
          'Fecha última actualización'
        );

      const ta =
        fa instanceof Date
          ? fa.getTime()
          : 0;

      const tb =
        fb instanceof Date
          ? fb.getTime()
          : 0;

      return tb - ta;
    }
  );

  return fuente[0];
}


function APPV3_construirHorarioPostulacion_(
  item,
  tz
) {
  if (!item) {
    return {
      existe:
        false,

      vinculado:
        false,

      idHorario:
        '',

      horasSemanales:
        null,

      horasDeclaradasFormulario:
        null,

      estado:
        '',

      fechaVinculacion:
        null,

      pdfId:
        '',

      pdfNombre:
        '',

      pdfUrl:
        ''
    };
  }

  const estado =
    APPV3_texto_(
      APPV3_campo_(
        item,
        'Estado'
      )
    );

  const fechaVinculacionRaw =
    APPV3_campo_(
      item,
      'Fecha vinculación'
    );

  const pdfId =
    APPV3_texto_(
      APPV3_campo_(
        item,
        'ID archivo PDF'
      )
    );

  return {
    existe:
      true,

    vinculado:
      (
        APPV3_norm_(
          estado
        ).indexOf(
          'vinc'
        ) >=
          0 ||
        Boolean(
          fechaVinculacionRaw
        )
      ),

    idHorario:
      APPV3_texto_(
        APPV3_campo_(
          item,
          'ID horario'
        )
      ),

    horasSemanales:
      APPV3_numeroNullable_(
        APPV3_campo_(
          item,
          'Horas semanales'
        )
      ),

    horasDeclaradasFormulario:
      APPV3_numeroNullable_(
        APPV3_campo_(
          item,
          'Horas declaradas formulario'
        )
      ),

    estado:
      estado,

    fechaVinculacion:
      APPV3_fechaHoraFlexible_(
        fechaVinculacionRaw,
        tz
      ),

    pdfId:
      pdfId,

    pdfNombre:
      APPV3_texto_(
        APPV3_campo_(
          item,
          'Nombre archivo PDF'
        )
      ),

    pdfUrl:
      pdfId
        ? (
            'https://drive.google.com/file/d/' +
            encodeURIComponent(
              pdfId
            ) +
            '/view'
          )
        : ''
  };
}


function APPV3_construirHorarioOficial_(
  filas,
  tz
) {
  const items =
    (filas || [])
      .map(
        function(item) {
          return {
            version:
              APPV3_texto_(
                APPV3_campo_(
                  item,
                  'Versión (H1, H2, H3...)'
                )
              ),

            vigente:
              APPV3_texto_(
                APPV3_campo_(
                  item,
                  'Vigente (Sí/No)'
                )
              ),

            fechaInicio:
              APPV3_fechaFlexible_(
                APPV3_campo_(
                  item,
                  'Fecha inicio'
                ),
                tz
              ),

            fechaFin:
              APPV3_fechaFlexible_(
                APPV3_campo_(
                  item,
                  'Fecha fin'
                ),
                tz
              )
          };
        }
      );

  const vigente =
    items.find(
      function(item) {
        const v =
          APPV3_norm_(
            item.vigente
          );

        return (
          v === 'si' ||
          v === 'sí'
        );
      }
    ) ||
    null;

  return {
    existe:
      items.length >
        0,

    cantidad:
      items.length,

    vigente:
      vigente,

    items:
      items
  };
}


function APPV3_construirPeriodos_(
  filas,
  tz,
  correo,
  revisionPeriodos
) {
  const revisionMap =
    revisionPeriodos || {};

  const items =
    (filas || [])
      .map(
        function(item) {
          const estadoRaw =
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Estado periodo'
              )
            );

          const tipo =
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Tipo'
              )
            );

          const periodo =
            APPV3_texto_(
              APPV3_campo_(
                item,
                'Periodo'
              )
            );

          const clave =
            APPV4_clavePeriodo_(
              correo,
              tipo,
              periodo
            );

          const revision =
            revisionMap[clave] || null;

          return {
            tipo: tipo,
            periodo: periodo,
            fechaInicio:
              APPV3_fechaFlexible_(
                APPV3_campo_(
                  item,
                  'Fecha inicio'
                ),
                tz
              ),
            fechaFin:
              APPV3_fechaFlexible_(
                APPV3_campo_(
                  item,
                  'Fecha fin'
                ),
                tz
              ),
            estado: estadoRaw,
            fechaCierre:
              APPV3_fechaFlexible_(
                APPV3_campo_(
                  item,
                  'Fecha cierre'
                ),
                tz
              ),
            horasPlannerCierre:
              APPV3_numeroNullable_(
                APPV3_campo_(
                  item,
                  'Horas planner al cierre'
                )
              ),
            horasEvidenciaCierre:
              APPV3_numeroNullable_(
                APPV3_campo_(
                  item,
                  'Horas con evidencia al cierre'
                )
              ),
            horasAsistenciaCierre:
              APPV3_numeroNullable_(
                APPV3_campo_(
                  item,
                  'Horas asistencia al cierre'
                )
              ),
            horasDentroHorario:
              APPV3_numeroNullable_(
                APPV3_campo_(
                  item,
                  'Horas dentro horario'
                )
              ),
            horasFueraHorario:
              APPV3_numeroNullable_(
                APPV3_campo_(
                  item,
                  'Horas fuera horario'
                )
              ),
            horasExtrasAprobadas:
              APPV3_numeroNullable_(
                APPV3_campo_(
                  item,
                  'Horas extras aprobadas'
                )
              ),
            ajustes:
              APPV3_numeroNullable_(
                APPV3_campo_(
                  item,
                  'Ajustes'
                )
              ),
            horasFinales:
              APPV3_numeroNullable_(
                APPV3_campo_(
                  item,
                  'Horas finales'
                )
              ),
            revision:
              revision
                ? {
                    tratamiento:
                      revision.tratamiento || '',
                    esFinalFormal:
                      revision.esFinalFormal === true,
                    accion:
                      revision.accion || '',
                    horasFinalesPropuestas:
                      revision.horasFinalesPropuestas,
                    horasAdicionalesAprobadas:
                      revision.horasAdicionalesAprobadas,
                    snapshot:
                      revision.snapshot || {},
                    alertas:
                      revision.alertas || [],
                    bloqueos:
                      revision.bloqueos || []
                  }
                : null
          };
        }
      )
      .sort(
        function(a, b) {
          const fa =
            a.fechaInicio
              ? new Date(a.fechaInicio).getTime()
              : 0;
          const fb =
            b.fechaInicio
              ? new Date(b.fechaInicio).getTime()
              : 0;
          return fa - fb;
        }
      );

  let finalFormal = null;

  items.forEach(
    function(item) {
      const tipo =
        APPV3_norm_(
          item.tipo
        );

      if (
        tipo !== 'base' &&
        tipo !== 'extension'
      ) {
        return;
      }

      if (
        !finalFormal ||
        String(item.fechaFin || '') >=
          String(finalFormal.fechaFin || '')
      ) {
        finalFormal = item;
      }
    }
  );

  items.forEach(
    function(item) {
      const pendiente =
        APPV3_norm_(item.estado) ===
          'pendiente cierre';

      const esFinalFormal =
        Boolean(
          finalFormal &&
          APPV4_clavePeriodo_(
            correo,
            item.tipo,
            item.periodo
          ) ===
          APPV4_clavePeriodo_(
            correo,
            finalFormal.tipo,
            finalFormal.periodo
          )
        );

      item.esFinalFormal =
        item.revision
          ? item.revision.esFinalFormal
          : esFinalFormal;

      item.tipoRevision =
        item.revision
          ? item.revision.tratamiento
          : (
              pendiente
                ? (
                    item.esFinalFormal
                      ? 'REVISION_FINAL'
                      : 'REVISION_EXCEPCION'
                  )
                : ''
            );

      item.requiereRevision =
        Boolean(
          pendiente &&
          item.tipoRevision !== 'CIERRE_AUTOMATICO'
        );

      item.estadoPantalla =
        APPV3_estadoPeriodoPantalla_(
          item.estado,
          item.tipoRevision
        );
    }
  );

  return items;
}


function APPV3_estadoPeriodoPantalla_(
  estado,
  tipoRevision
) {
  const e =
    APPV3_norm_(
      estado
    );

  if (e === 'futuro') {
    return 'Aún no inicia';
  }

  if (e === 'abierto') {
    return 'En curso';
  }

  if (
    e === 'pendiente cierre' ||
    e === 'vencido pendiente cierre'
  ) {
    if (
      tipoRevision ===
        'CIERRE_AUTOMATICO'
    ) {
      return 'Procesamiento automático pendiente';
    }

    if (
      tipoRevision ===
        'REVISION_FINAL'
    ) {
      return 'Revisión final pendiente';
    }

    return 'Revisión requerida';
  }

  if (e === 'cerrado') {
    return 'Cerrado';
  }

  return estado || '';
}


function APPV3_unionClaves_(
  a,
  b
) {
  const out =
    {};

  Object.keys(
    a || {}
  ).forEach(
    function(k) {
      out[
        k
      ] =
        true;
    }
  );

  Object.keys(
    b || {}
  ).forEach(
    function(k) {
      out[
        k
      ] =
        true;
    }
  );

  return Object.keys(
    out
  );
}


/* ============================================================
 * VALIDACIÓN
 * ============================================================ */

function APPV3_validarFuentes_(
  ss
) {
  const errores =
    [];

  let fuentesOk =
    0;

  Object.keys(
    APPV3_FUENTES
  ).forEach(
    function(nombreHoja) {
      const hoja =
        ss.getSheetByName(
          nombreHoja
        );

      if (!hoja) {
        errores.push(
          'Falta ' +
          nombreHoja
        );

        return;
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
        {};

      const duplicados =
        [];

      headers.forEach(
        function(h, i) {
          const clave =
            APPV3_norm_(
              h
            );

          if (!clave) {
            return;
          }

          if (
            Object.prototype
              .hasOwnProperty.call(
                mapa,
                clave
              )
          ) {
            duplicados.push(
              h
            );
          } else {
            mapa[
              clave
            ] =
              i;
          }
        }
      );

      const faltantes =
        APPV3_FUENTES[
          nombreHoja
        ].filter(
          function(h) {
            return !Object.prototype
              .hasOwnProperty.call(
                mapa,
                APPV3_norm_(
                  h
                )
              );
          }
        );

      if (
        faltantes.length
      ) {
        errores.push(
          nombreHoja +
          ' faltan: ' +
          faltantes.join(
            ', '
          )
        );
      }

      if (
        duplicados.length
      ) {
        errores.push(
          nombreHoja +
          ' headers duplicados: ' +
          duplicados.join(
            ', '
          )
        );
      }

      if (
        !faltantes.length &&
        !duplicados.length
      ) {
        fuentesOk++;
      }
    }
  );

  return {
    fuentesOk:
      fuentesOk,

    errores:
      errores
  };
}


/* ============================================================
 * HELPERS
 * ============================================================ */

function APPV3_campo_(
  item,
  header
) {
  if (!item) {
    return '';
  }

  const clave =
    APPV3_norm_(
      header
    );

  return Object.prototype
    .hasOwnProperty.call(
      item,
      clave
    )
      ? item[
          clave
        ]
      : '';
}


function APPV3_correo_(
  valor
) {
  return String(
    valor || ''
  )
    .trim()
    .toLowerCase();
}


function APPV3_texto_(
  valor
) {
  if (
    valor ===
      null ||
    valor ===
      undefined
  ) {
    return '';
  }

  return String(
    valor
  ).trim();
}


function APPV3_primerTexto_(
  valores
) {
  for (
    let i = 0;
    i < valores.length;
    i++
  ) {
    const t =
      APPV3_texto_(
        valores[
          i
        ]
      );

    if (t) {
      return t;
    }
  }

  return '';
}


function APPV3_primerValor_(
  valores
) {
  for (
    let i = 0;
    i < valores.length;
    i++
  ) {
    const v =
      valores[
        i
      ];

    if (
      v !== '' &&
      v !== null &&
      v !== undefined
    ) {
      return v;
    }
  }

  return '';
}


function APPV3_numeroNullable_(
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
      valor
    );

  return Number.isFinite(
    n
  )
    ? n
    : null;
}


function APPV3_primerNumeroNullable_(
  valores
) {
  for (
    let i = 0;
    i < valores.length;
    i++
  ) {
    const n =
      APPV3_numeroNullable_(
        valores[
          i
        ]
      );

    if (
      n !==
        null
    ) {
      return n;
    }
  }

  return null;
}


function APPV3_porcentajePantalla_(
  fraccion
) {
  if (
    fraccion ===
      null
  ) {
    return null;
  }

  return Math.round(
    fraccion *
    10000
  ) /
  100;
}


function APPV3_limitarFraccionV3_(
  fraccion
) {
  if (
    fraccion ===
      null
  ) {
    return null;
  }

  return Math.min(
    Math.max(
      fraccion,
      0
    ),
    1
  );
}


function APPV3_fechaFlexible_(
  valor,
  tz
) {
  if (
    valor instanceof Date &&
    !isNaN(
      valor.getTime()
    )
  ) {
    return Utilities.formatDate(
      valor,
      tz,
      'yyyy-MM-dd'
    );
  }

  return APPV3_texto_(
    valor
  );
}


function APPV3_fechaHoraFlexible_(
  valor,
  tz
) {
  if (
    valor instanceof Date &&
    !isNaN(
      valor.getTime()
    )
  ) {
    return Utilities.formatDate(
      valor,
      tz,
      "yyyy-MM-dd'T'HH:mm:ss"
    );
  }

  return APPV3_texto_(
    valor
  );
}


function APPV3_maxFechaHoraISO_(
  valores,
  tz
) {
  let max =
    null;

  valores.forEach(
    function(v) {
      if (
        v instanceof Date &&
        !isNaN(
          v.getTime()
        )
      ) {
        if (
          !max ||
          v.getTime() >
            max.getTime()
        ) {
          max =
            v;
        }
      }
    }
  );

  return max
    ? Utilities.formatDate(
        max,
        tz,
        "yyyy-MM-dd'T'HH:mm:ss"
      )
    : '';
}


function APPV3_urlCarpetaDrive_(
  id
) {
  const t =
    APPV3_texto_(
      id
    );

  if (!t) {
    return '';
  }

  if (
    /^https?:\/\//i.test(
      t
    )
  ) {
    return t;
  }

  return (
    'https://drive.google.com/drive/folders/' +
    t
  );
}


function APPV3_ordenEtapa_(
  etapa
) {
  const e =
    APPV3_norm_(
      etapa
    );

  if (
    e ===
      'entrevista pendiente'
  ) {
    return 1;
  }

  if (
    e ===
      'cursos en progreso'
  ) {
    return 2;
  }

  if (
    e ===
      'formalizacion pendiente'
  ) {
    return 3;
  }

  if (
    e ===
      'pasantia activa'
  ) {
    return 4;
  }

  if (
    e ===
      'denegado' ||
    e ===
      'denegada'
  ) {
    return 8;
  }

  return 6;
}


function APPV3_norm_(
  valor
) {
  return String(
    valor == null
      ? ''
      : valor
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



/* ============================================================
 * REVISIÓN DE PERÍODOS / ACCIONES DE INFORMES PARA EL PORTAL
 * ============================================================ */

function APPV4_clavePeriodo_(
  correo,
  tipo,
  periodo
) {
  const c =
    String(correo || '')
      .trim()
      .toLowerCase();

  const t =
    APPV3_norm_(tipo);

  const p =
    APPV3_norm_(periodo);

  if (!c || !t || !p) {
    return '';
  }

  return [c, t, p].join('|');
}


function APPV4_mapaRevisionPeriodos_() {
  const mapa = {};

  if (
    typeof construirDiagnosticoCierreCAV1_ !==
      'function'
  ) {
    return mapa;
  }

  try {
    const diagnostico =
      construirDiagnosticoCierreCAV1_();

    (diagnostico.detalle || [])
      .forEach(
        function(item) {
          const clave =
            APPV4_clavePeriodo_(
              item.correo,
              item.tipo,
              item.periodo
            );

          if (clave) {
            mapa[clave] = item;
          }
        }
      );
  } catch (error) {
    console.warn(
      '[PORTAL] No se pudo enriquecer la revisión de períodos:',
      error && error.message
        ? error.message
        : String(error)
    );
  }

  return mapa;
}


function ejecutarAccionReportesPortalV5(
  action,
  correo,
  payload
) {
  const accion =
    String(action || '')
      .trim()
      .toLowerCase();

  if (
    accion ===
      'obtener_revision_periodo'
  ) {
    return obtenerRevisionPeriodoDesdePortalV5(
      correo,
      payload
    );
  }

  if (
    accion ===
      'cerrar_periodo_revisado'
  ) {
    return cerrarPeriodoDesdePortalV5(
      correo,
      payload
    );
  }

  if (
    accion ===
      'regenerar_informe_periodo'
  ) {
    return regenerarInformeDesdePortalV5(
      correo,
      payload
    );
  }

  throw new Error(
    'Acción de períodos/informes no reconocida: ' +
    accion
  );
}


function obtenerRevisionPeriodoDesdePortalV5(
  correo,
  payload
) {
  const p = payload || {};

  return obtenerRevisionPeriodoPortalV2(
    correo,
    p.tipoPeriodo,
    p.periodo
  );
}


function cerrarPeriodoDesdePortalV5(
  correo,
  payload
) {
  const p = payload || {};

  const cierre =
    cerrarPeriodoRevisadoDesdePortalV2(
      correo,
      p.tipoPeriodo,
      p.periodo,
      p.horasAdicionalesAprobadas
    );

  let progreso = null;
  let registroInformes = null;
  let informe = null;
  const advertencias = [];

  try {
    if (
      typeof sincronizarProgresoPasantiasV1 ===
        'function'
    ) {
      progreso =
        sincronizarProgresoPasantiasV1();
    }
  } catch (error) {
    advertencias.push(
      'El período se cerró, pero no pudo actualizarse Progreso_Pasantias: ' +
      (error && error.message ? error.message : String(error))
    );
  }

  try {
    registroInformes =
      sincronizarRegistroInformesV1();

    informe =
      generarInformePeriodoEspecificoV1(
        correo,
        p.tipoPeriodo,
        p.periodo
      );
  } catch (error) {
    advertencias.push(
      'El período se cerró, pero el informe no pudo generarse en esta ejecución: ' +
      (error && error.message ? error.message : String(error))
    );
  }

  return {
    ok: true,
    verificado: true,
    cierre: cierre,
    progreso: progreso,
    registroInformes: registroInformes,
    informe: informe,
    advertencias: advertencias,
    message:
      advertencias.length
        ? 'Período cerrado. Revisar advertencias de sincronización/generación.'
        : 'Período cerrado e informe generado.'
  };
}


function regenerarInformeDesdePortalV5(
  correo,
  payload
) {
  const p = payload || {};

  sincronizarRegistroInformesV1();

  return regenerarInformePeriodoDesdePortalV2(
    correo,
    p.tipoPeriodo,
    p.periodo
  );
}


/* ============================================================
 * LANZADOR DE LA INTERFAZ — SOLO LECTURA
 * ============================================================
 *
 * Requiere un archivo HTML en este proyecto llamado:
 *   Management_Portal
 *
 * No crea doGet/doPost y por tanto no interfiere con el endpoint
 * de Horarios_Postulacion.
 */
function abrirGestionPasantesV4() {
  const html =
    HtmlService
      .createHtmlOutputFromFile(
        'Management_Portal'
      )
      .setWidth(
        1400
      )
      .setHeight(
        850
      );

  SpreadsheetApp
    .getUi()
    .showModalDialog(
      html,
      'Gestión de pasantes y nuevos miembros'
    );
}



