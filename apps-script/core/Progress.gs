/**
 * ============================================================
 * INTERNSHIP PROGRESS — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * OBJETIVO
 * Crear una capa estructurada para:
 * - porcentaje de tiempo transcurrido de la pasantía;
 * - porcentaje de horas cumplidas con evidencia;
 * - horas realizadas como PASANTE;
 * - horas convalidadas como ASISTENTE cuando Historial_Roles!G = Sí;
 * - comparación horas vs. tiempo para futura página web;
 * - futura generación del informe final de culminación.
 *
 * PRINCIPIOS
 * 1) NO modifica Registro_Planner.
 * 2) NO modifica Control_Periodos.
 * 3) NO modifica Variables_Internas.
 * 4) NO inventa la meta de horas: usa Variables_Internas!AP.
 * 5) El porcentaje de horas puede superar 100%.
 * 6) El porcentaje gráfico se limita a 100% solo para la barra visual.
 * 7) La evidencia es obligatoria para el cómputo de horas de cumplimiento.
 * 7.1) Los períodos CERRADOS usan su snapshot de Horas finales como
 *      fuente canónica. Los períodos abiertos se calculan con horas que
 *      cuentan para el compromiso y tienen evidencia registrada.
 * 8) Las horas ASISTENTE solo se convalidan cuando el registro ASISTENTE
 *    correspondiente en Historial_Roles tiene:
 *      Cuenta para compromiso pasantía = Sí
 * 9) Un retiro anticipado usa BP como último día computable.
 * 10) Si las horas de ASISTENTE NO cuentan, el inicio de contrato es frontera
 *     temporal para el compromiso: último día computable = inicio asistente - 1.
 *
 * IMPORTANTE
 * - El umbral de reconocimiento se lee de Configuracion; 0.80 es el valor público por defecto.
 * - "Supera 80% tiempo" se conserva como nombre de compatibilidad para un indicador administrativo/visual.
 *   El documento vigente exige más del 80% de la totalidad de la pasantía,
 *   pero no define por separado un umbral temporal. Por eso el sistema NO convierte
 *   automáticamente ese indicador en una decisión jurídica.
 * - "Supera 80% horas" usa una comparación estricta > 80%, no >= 80%.
 *
 * FUNCIONES
 *   diagnosticarProgresoPasantiasV1()  -> solo lectura
 *   prepararProgresoPasantiasV1()      -> crea hoja + config y sincroniza
 *   sincronizarProgresoPasantiasV1()   -> actualiza hoja
 * ============================================================
 */

const PPV15_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const PPV15_HOJA_VARIABLES =
  'Variables_Internas';

const PPV15_HOJA_PLANNER =
  'Registro_Planner';

const PPV15_HOJA_PERIODOS =
  'Control_Periodos';

const PPV15_HOJA_ROLES =
  'Historial_Roles';

const PPV15_HOJA_CONFIG =
  'Configuracion';

const PPV15_HOJA_SALIDA =
  'Progreso_Pasantias';

const PPV15_UMBRAL =
  0.80;


const PPV15_HEADERS = [
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
 * FUNCIONES PÚBLICAS
 * ============================================================ */

function diagnosticarProgresoPasantiasV1() {
  const ss =
    SpreadsheetApp.openById(
      PPV15_DB_ID
    );

  const salida =
    PPV1_construir_(
      ss
    );

  const resumen =
    PPV1_resumir_(
      salida
    );

  resumen.escritura =
    false;

  console.log(
    '=== DIAGNÓSTICO PROGRESO DE PASANTÍAS ==='
  );

  console.log(
    resumen
  );

  salida.forEach(
    function(p) {
      console.log(
        '[PROGRESO PASANTE]',
        PPV1_serializarLog_(
          p,
          ss.getSpreadsheetTimeZone() ||
            Session.getScriptTimeZone()
        )
      );
    }
  );

  Logger.log(
    JSON.stringify({
      resumen:
        resumen,

      detalle:
        salida.map(
          function(p) {
            return PPV1_serializarLog_(
              p,
              ss.getSpreadsheetTimeZone() ||
                Session.getScriptTimeZone()
            );
          }
        )
    })
  );

  return {
    resumen:
      resumen,

    detalle:
      salida
  };
}


function prepararProgresoPasantiasV1() {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const ss =
      SpreadsheetApp.openById(
        PPV15_DB_ID
      );

    const config =
      PPV1_requerirHoja_(
        ss,
        PPV15_HOJA_CONFIG
      );

    PPV1_asegurarConfig_(
      config,
      'UMBRAL_RECONOCIMIENTO_PASANTIA',
      PPV15_UMBRAL
    );

    let hoja =
      ss.getSheetByName(
        PPV15_HOJA_SALIDA
      );

    let creada =
      false;

    if (!hoja) {
      hoja =
        ss.insertSheet(
          PPV15_HOJA_SALIDA
        );

      creada =
        true;
    }

    PPV1_prepararHeaders_(
      hoja
    );

    const sync =
      PPV1_sincronizar_(
        ss,
        hoja
      );

    return {
      hoja:
        PPV15_HOJA_SALIDA,

      creada:
        creada,

      columnas:
        PPV1_detectarEstructuraSalida_(hoja).headers.length,

      estructura:
        PPV1_detectarEstructuraSalida_(hoja).tipo,

      sincronizacion:
        sync,

      estado:
        'OK'
    };

  } finally {
    lock.releaseLock();
  }
}


function sincronizarProgresoPasantiasV1() {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const ss =
      SpreadsheetApp.openById(
        PPV15_DB_ID
      );

    const hoja =
      PPV1_requerirHoja_(
        ss,
        PPV15_HOJA_SALIDA
      );

    PPV1_validarHeadersSalida_(
      hoja
    );

    return PPV1_sincronizar_(
      ss,
      hoja
    );

  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
 * SINCRONIZACIÓN
 * ============================================================ */

function PPV1_sincronizar_(
  ss,
  hoja
) {
  const datos =
    PPV1_construir_(
      ss
    );

  const ahora =
    new Date();

  /*
   * La estructura productiva de Progreso_Pasantias es única:
   * 16 columnas. Ya no existe proyección a una estructura legacy.
   */
  const filas =
    datos.map(
      function(p) {
        return [
          p.correo,
          p.nombre,
          p.estadoPasantia,
          p.inicioCompromiso || '',
          p.finCompromiso || '',
          p.fechaCorte || '',
          p.porcentajeTiempo !== null
            ? p.porcentajeTiempo
            : '',
          p.horasObjetivo !== null
            ? p.horasObjetivo
            : '',
          p.horasPasanteValidas,
          p.horasAsistenteConvalidadas,
          p.horasValidas,
          p.horasRestantes !== null
            ? p.horasRestantes
            : '',
          p.porcentajeHoras !== null
            ? p.porcentajeHoras
            : '',
          p.estadoDatos,
          p.observacion,
          ahora
        ];
      }
    );

  const headersSalida =
    PPV15_HEADERS;

  /*
   * Validación defensiva: nunca escribir sobre una estructura
   * distinta de las 16 columnas canónicas.
   */
  PPV1_detectarEstructuraSalida_(
    hoja
  );

  if (
    hoja.getLastRow() > 1
  ) {
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        headersSalida.length
      )
      .clearContent();
  }

  if (
    filas.length
  ) {
    hoja
      .getRange(
        2,
        1,
        filas.length,
        headersSalida.length
      )
      .setValues(
        filas
      );

    const mapaSalida =
      PPV1_mapaHeadersSalida_(
        headersSalida
      );

    [
      'Fecha inicio compromiso',
      'Fecha fin compromiso planificada',
      'Fecha corte progreso',
      'Última actualización'
    ].forEach(function(header) {
      const col =
        mapaSalida[
          PPV1_normalizar_(header)
        ];

      if (col !== undefined) {
        hoja
          .getRange(
            2,
            col + 1,
            filas.length,
            1
          )
          .setNumberFormat(
            'dd/MM/yyyy'
          );
      }
    });

    [
      'Porcentaje tiempo transcurrido',
      'Porcentaje horas cumplidas'
    ].forEach(function(header) {
      const col =
        mapaSalida[
          PPV1_normalizar_(header)
        ];

      if (col !== undefined) {
        hoja
          .getRange(
            2,
            col + 1,
            filas.length,
            1
          )
          .setNumberFormat(
            '0.0%'
          );
      }
    });
  }

  const resumen =
    PPV1_resumir_(
      datos
    );

  resumen.escritura =
    true;

  resumen.estructura =
    'PRODUCTIVO_16';

  resumen.rango =
    filas.length
      ? (
          PPV15_HOJA_SALIDA +
          '!A2:P' +
          (
            filas.length +
            1
          )
        )
      : '';

  console.log(
    '=== SINCRONIZACIÓN PROGRESO DE PASANTÍAS ==='
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

/* ============================================================
 * CONSTRUCCIÓN
 * ============================================================ */

function PPV1_construir_(
  ss
) {
  const variables =
    PPV1_requerirHoja_(
      ss,
      PPV15_HOJA_VARIABLES
    );

  const planner =
    PPV1_requerirHoja_(
      ss,
      PPV15_HOJA_PLANNER
    );

  const roles =
    PPV1_requerirHoja_(
      ss,
      PPV15_HOJA_ROLES
    );

  const controlPeriodos =
    PPV1_requerirHoja_(
      ss,
      PPV15_HOJA_PERIODOS
    );

  const config =
    PPV1_requerirHoja_(
      ss,
      PPV15_HOJA_CONFIG
    );

  const umbralReconocimiento =
    PPV1_leerConfigNumero_(
      config,
      'UMBRAL_RECONOCIMIENTO_PASANTIA',
      PPV15_UMBRAL
    );

  const personas =
    PPV1_leerPersonas_(
      variables
    );

  const indexRoles =
    PPV1_leerRoles_(
      roles
    );

  const actividades =
    PPV1_leerPlanner_(
      planner
    );

  const periodos =
    PPV1_leerPeriodos_(
      controlPeriodos
    );

  const hoy =
    PPV1_fechaDia_(
      new Date()
    );

  return personas
    .filter(
      function(p) {
        return !!p.correo;
      }
    )
    .map(
      function(p) {
        const historial =
          indexRoles[
            p.correo
          ] || [];

        const asistente =
          PPV1_resumenAsistente_(
            historial
          );

        const finPlan =
          PPV1_finCompromisoPlanificado_(
            p
          );

        const corte =
          PPV1_fechaCorte_(
            p,
            asistente,
            finPlan,
            hoy
          );

        const dias =
          PPV1_calcularDias_(
            p.inicioPasantia,
            finPlan,
            corte
          );

        const horas =
          PPV1_calcularHoras_(
            p,
            actividades,
            historial,
            finPlan,
            periodos
          );

        const porcentajeHoras =
          p.horasObjetivo !== null &&
          p.horasObjetivo > 0
            ? (
                horas.total /
                p.horasObjetivo
              )
            : null;

        const horasRestantes =
          porcentajeHoras !== null
            ? Math.max(
                p.horasObjetivo -
                horas.total,
                0
              )
            : null;

        const diferenciaPp =
          porcentajeHoras !== null &&
          dias.porcentaje !== null
            ? PPV1_redondear_(
                (
                  porcentajeHoras -
                  dias.porcentaje
                ) *
                100
              )
            : null;

        const estadoDatos =
          PPV1_estadoDatos_(
            p,
            finPlan,
            dias,
            porcentajeHoras,
            asistente,
            horas
          );

        const observacion =
          PPV1_observacion_(
            p,
            asistente,
            finPlan,
            horas,
            dias
          );

        return {
          correo:
            p.correo,

          nombre:
            p.nombre,

          estadoPasantia:
            p.estadoPasantia,

          inicioCompromiso:
            p.inicioPasantia,

          finCompromiso:
            finPlan,

          fechaCorte:
            corte,

          diasTotales:
            dias.total,

          diasTranscurridos:
            dias.transcurridos,

          porcentajeTiempo:
            dias.porcentaje,

          horasObjetivo:
            p.horasObjetivo,

          horasPasanteValidas:
            horas.pasante,

          _horasPasanteCerradas:
            horas.pasanteCerrado,

          _horasPasanteNoCerradas:
            horas.pasanteNoCerrado,

          _horasPasanteFallback:
            horas.pasanteFallback,

          _periodosCerradosIncompletos:
            horas.periodosCerradosIncompletos,

          _periodosHoras:
            horas.periodosFormales,

          horasAsistenteConvalidadas:
            horas.asistente,

          horasValidas:
            horas.total,

          horasRestantes:
            horasRestantes !== null
              ? PPV1_redondear_(
                  horasRestantes
                )
              : null,

          porcentajeHoras:
            porcentajeHoras,

          diferenciaPp:
            diferenciaPp,

          supera80Horas:
            porcentajeHoras === null
              ? 'SIN META'
              : (
                  porcentajeHoras >
                  umbralReconocimiento
                    ? 'Sí'
                    : 'No'
                ),

          supera80Tiempo:
            dias.porcentaje === null
              ? 'SIN FECHAS'
              : (
                  dias.porcentaje >
                  umbralReconocimiento
                    ? 'Sí'
                    : 'No'
                ),

          politicaAsistente:
            asistente.politica,

          inicioAsistente:
            asistente.inicio,

          finAsistente:
            asistente.fin,

          estadoDatos:
            estadoDatos,

          observacion:
            observacion,

          porcentajeTiempoGrafico:
            dias.porcentaje === null
              ? null
              : Math.min(
                  Math.max(
                    dias.porcentaje,
                    0
                  ),
                  1
                ),

          porcentajeHorasGrafico:
            porcentajeHoras === null
              ? null
              : Math.min(
                  Math.max(
                    porcentajeHoras,
                    0
                  ),
                  1
                )
        };
      }
    );
}


/* ============================================================
 * VARIABLES_INTERNAS
 * ============================================================ */

function PPV1_leerPersonas_(
  hoja
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return [];
  }

  const datos =
    hoja
      .getDataRange()
      .getValues();

  const headers =
    PPV1_mapaHeaders_(
      datos[0]
    );

  const iCorreo =
    PPV1_indiceConFallback_(
      headers,
      [
        'correo oficial'
      ],
      0
    );

  const iNombre =
    PPV1_indiceConFallback_(
      headers,
      [
        'nombre del pasante',
        'nombre'
      ],
      3
    );

  const iEstado =
    PPV1_indiceConFallback_(
      headers,
      [
        'estado de pasantía',
        'estado de pasantia'
      ],
      10
    );

  const iInicio =
    PPV1_indiceConFallback_(
      headers,
      [
        'fecha inicio pasantía',
        'fecha inicio pasantia',
        'inicio pasantía',
        'inicio pasantia'
      ],
      26
    );

  const iFin =
    PPV1_indiceConFallback_(
      headers,
      [
        'fecha fin pasantía',
        'fecha fin pasantia',
        'fin pasantía',
        'fin pasantia'
      ],
      27
    );

  const iInicioExt =
    PPV1_indiceConFallback_(
      headers,
      [
        'fecha inicio extensión',
        'fecha inicio extension',
        'inicio extensión',
        'inicio extension'
      ],
      31
    );

  const iFinExt =
    PPV1_indiceConFallback_(
      headers,
      [
        'fecha fin extensión',
        'fecha fin extension',
        'fin extensión',
        'fin extension'
      ],
      32
    );

  const iHorasObjetivo =
    PPV1_indiceConFallback_(
      headers,
      [
        'horas objetivo',
        'horas a cumplir en pasantía',
        'horas a cumplir en pasantia'
      ],
      41
    );

  const iEstadoManual =
    PPV1_indiceConFallback_(
      headers,
      [
        'estado manual',
        'estado terminación',
        'estado terminacion'
      ],
      66
    );

  const iRetiro =
    PPV1_indiceConFallback_(
      headers,
      [
        'fecha retiro',
        'fecha de retiro',
        'retiro'
      ],
      67
    );

  return datos
    .slice(
      1
    )
    .map(
      function(row, index) {
        const horasObjetivo =
          PPV1_numeroNullable_(
            row[
              iHorasObjetivo
            ]
          );

        return {
          fila:
            index + 2,

          correo:
            PPV1_correo_(
              row[
                iCorreo
              ]
            ),

          nombre:
            String(
              row[
                iNombre
              ] || ''
            ).trim(),

          estadoPasantia:
            String(
              row[
                iEstado
              ] || ''
            ).trim(),

          inicioPasantia:
            PPV1_fechaDia_(
              row[
                iInicio
              ]
            ),

          finPasantia:
            PPV1_fechaDia_(
              row[
                iFin
              ]
            ),

          inicioExtension:
            PPV1_fechaDia_(
              row[
                iInicioExt
              ]
            ),

          finExtension:
            PPV1_fechaDia_(
              row[
                iFinExt
              ]
            ),

          horasObjetivo:
            horasObjetivo !== null &&
            horasObjetivo > 0
              ? horasObjetivo
              : null,

          estadoManual:
            String(
              row[
                iEstadoManual
              ] || ''
            ).trim(),

          fechaRetiro:
            PPV1_fechaDia_(
              row[
                iRetiro
              ]
            )
        };
      }
    );
}


/* ============================================================
 * HISTORIAL_ROLES
 * ============================================================ */

function PPV1_leerRoles_(
  hoja
) {
  const salida =
    {};

  if (
    hoja.getLastRow() <= 1
  ) {
    return salida;
  }

  const datos =
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        9
      )
      .getValues();

  datos.forEach(
    function(row, index) {
      const correo =
        PPV1_correo_(
          row[0]
        );

      if (!correo) {
        return;
      }

      if (
        !salida[
          correo
        ]
      ) {
        salida[
          correo
        ] =
          [];
      }

      salida[
        correo
      ].push({
        fila:
          index + 2,

        rol:
          PPV1_normalizar_(
            row[2]
          ).toUpperCase(),

        fechaInicio:
          PPV1_fechaDia_(
            row[3]
          ),

        fechaFin:
          PPV1_fechaDia_(
            row[4]
          ),

        fuente:
          String(
            row[5] || ''
          ).trim(),

        cuentaCompromiso:
          String(
            row[6] || ''
          ).trim(),

        observacion:
          String(
            row[7] || ''
          ).trim()
      });
    }
  );

  Object.keys(
    salida
  ).forEach(
    function(correo) {
      salida[
        correo
      ].sort(
        function(a, b) {
          return (
            PPV1_ms_(
              a.fechaInicio
            ) -
            PPV1_ms_(
              b.fechaInicio
            )
          );
        }
      );
    }
  );

  return salida;
}


function PPV1_resumenAsistente_(
  historial
) {
  const asistentes =
    historial.filter(
      function(r) {
        return (
          r.rol ===
          'ASISTENTE'
        );
      }
    );

  if (
    !asistentes.length
  ) {
    return {
      inicio:
        null,

      fin:
        null,

      politica:
        'NO APLICA'
    };
  }

  const inicio =
    asistentes
      .map(
        function(r) {
          return r.fechaInicio;
        }
      )
      .filter(Boolean)
      .sort(
        function(a, b) {
          return (
            a.getTime() -
            b.getTime()
          );
        }
      )[0] || null;

  const fines =
    asistentes
      .map(
        function(r) {
          return r.fechaFin;
        }
      )
      .filter(Boolean)
      .sort(
        function(a, b) {
          return (
            b.getTime() -
            a.getTime()
          );
        }
      );

  const politicas =
    asistentes.map(
      function(r) {
        return PPV1_politicaTexto_(
          r.cuentaCompromiso
        );
      }
    );

  let politica =
    'POR REVISAR';

  if (
    politicas.indexOf(
      'Sí'
    ) >= 0 &&
    politicas.indexOf(
      'No'
    ) < 0 &&
    politicas.indexOf(
      'Por revisar'
    ) < 0
  ) {
    politica =
      'Sí';

  } else if (
    politicas.indexOf(
      'No'
    ) >= 0 &&
    politicas.indexOf(
      'Sí'
    ) < 0
  ) {
    politica =
      'No';

  } else if (
    politicas.indexOf(
      'Sí'
    ) >= 0 &&
    politicas.indexOf(
      'No'
    ) >= 0
  ) {
    politica =
      'MIXTA';
  }

  return {
    inicio:
      inicio,

    fin:
      fines.length
        ? fines[0]
        : null,

    politica:
      politica
  };
}


/* ============================================================
 * CONTROL_PERIODOS
 * ============================================================ */

function PPV1_leerPeriodos_(
  hoja
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return [];
  }

  if (
    hoja.getLastColumn() < 16
  ) {
    throw new Error(
      'Control_Periodos debe tener A:P.'
    );
  }

  return hoja
    .getRange(
      2,
      1,
      hoja.getLastRow() - 1,
      16
    )
    .getValues()
    .map(
      function(row, index) {
        return {
          fila:
            index + 2,

          correo:
            PPV1_correo_(
              row[0]
            ),

          nombre:
            String(
              row[1] || ''
            ).trim(),

          tipo:
            PPV1_normalizar_(
              row[2]
            ).toUpperCase(),

          periodo:
            String(
              row[3] || ''
            )
              .trim()
              .toUpperCase(),

          inicio:
            PPV1_fechaDia_(
              row[4]
            ),

          fin:
            PPV1_fechaDia_(
              row[5]
            ),

          estado:
            PPV1_normalizar_(
              row[6]
            ).toUpperCase(),

          fechaCierre:
            PPV1_fechaDia_(
              row[7]
            ),

          horasPlannerCierre:
            PPV1_numeroNullable_(
              row[8]
            ),

          horasEvidenciaCierre:
            PPV1_numeroNullable_(
              row[9]
            ),

          horasFinales:
            PPV1_numeroNullable_(
              row[15]
            )
        };
      }
    );
}


/* ============================================================
 * REGISTRO_PLANNER
 * ============================================================ */

function PPV1_leerPlanner_(
  hoja
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return [];
  }

  /*
   * V1.4:
   * - ya no depende de A:AU ni de posiciones fijas;
   * - funciona con Registro_Planner productivo de 47 columnas;
   * - funciona con el modelo V2 de 33 columnas.
   */
  const datos =
    hoja
      .getDataRange()
      .getValues();

  const headers =
    PPV1_mapaHeaders_(
      datos[0]
    );

  const iCorreo =
    PPV1_indiceConFallback_(
      headers,
      [
        'correo oficial'
      ],
      -1
    );

  const iFecha =
    PPV1_indiceConFallback_(
      headers,
      [
        'fecha'
      ],
      -1
    );

  const iHorasEvidencia =
    PPV1_indiceConFallback_(
      headers,
      [
        'horas con evidencia'
      ],
      -1
    );

  const iHorasCandidatas =
    PPV1_indiceConFallback_(
      headers,
      [
        'horas candidatas compromiso'
      ],
      -1
    );

  const iPeriodo =
    PPV1_indiceConFallback_(
      headers,
      [
        'período',
        'periodo'
      ],
      -1
    );

  const iEtapa =
    PPV1_indiceConFallback_(
      headers,
      [
        'etapa actividad'
      ],
      -1
    );

  const iCuenta =
    PPV1_indiceConFallback_(
      headers,
      [
        'cuenta actividad para compromiso'
      ],
      -1
    );

  const requeridos = {
    correo:
      iCorreo,
    fecha:
      iFecha,
    horasConEvidencia:
      iHorasEvidencia,
    horasCandidatas:
      iHorasCandidatas,
    periodo:
      iPeriodo,
    etapaActividad:
      iEtapa,
    cuentaCompromiso:
      iCuenta
  };

  const faltantes =
    Object.keys(
      requeridos
    ).filter(
      function(k) {
        return requeridos[k] < 0;
      }
    );

  if (
    faltantes.length
  ) {
    throw new Error(
      'Registro_Planner no contiene los campos requeridos por Progreso V1.4: ' +
      faltantes.join(
        ', '
      )
    );
  }

  return datos
    .slice(
      1
    )
    .map(
      function(row, index) {
        return {
          fila:
            index + 2,

          correo:
            PPV1_correo_(
              row[
                iCorreo
              ]
            ),

          fecha:
            PPV1_fechaDia_(
              row[
                iFecha
              ]
            ),

          horasConEvidencia:
            PPV1_numero_(
              row[
                iHorasEvidencia
              ]
            ),

          horasCandidatas:
            PPV1_numero_(
              row[
                iHorasCandidatas
              ]
            ),

          periodo:
            String(
              row[
                iPeriodo
              ] || ''
            )
              .trim()
              .toUpperCase(),

          etapa:
            PPV1_normalizar_(
              row[
                iEtapa
              ]
            ).toUpperCase(),

          cuentaCompromiso:
            PPV1_esSi_(
              row[
                iCuenta
              ]
            )
        };
      }
    );
}


function PPV1_calcularHoras_(
  persona,
  actividades,
  historial,
  finPlan,
  periodos
) {
  const formal =
    PPV1_calcularHorasPasanteDesdePeriodos_(
      persona,
      actividades,
      periodos
    );

  let asistente =
    0;

  actividades.forEach(
    function(a) {
      if (
        a.correo !==
        persona.correo ||
        !a.fecha ||
        a.horasConEvidencia <= 0
      ) {
        return;
      }

      if (
        persona.inicioPasantia &&
        a.fecha <
          persona.inicioPasantia
      ) {
        return;
      }

      if (
        finPlan &&
        a.fecha >
          finPlan
      ) {
        return;
      }

      if (
        persona.fechaRetiro &&
        a.fecha >
          persona.fechaRetiro
      ) {
        return;
      }

      if (
        a.etapa !==
          'ASISTENTE'
      ) {
        return;
      }

      const rol =
        PPV1_rolAsistenteEnFecha_(
          historial,
          a.fecha
        );

      if (
        rol &&
        PPV1_esSi_(
          rol.cuentaCompromiso
        )
      ) {
        asistente +=
          a.horasConEvidencia;
      }
    }
  );

  return {
    pasante:
      PPV1_redondear_(
        formal.total
      ),

    pasanteCerrado:
      PPV1_redondear_(
        formal.cerrado
      ),

    pasanteNoCerrado:
      PPV1_redondear_(
        formal.noCerrado
      ),

    pasanteFallback:
      PPV1_redondear_(
        formal.fallback
      ),

    periodosCerradosIncompletos:
      formal.periodosCerradosIncompletos,

    periodosFormales:
      formal.periodos,

    asistente:
      PPV1_redondear_(
        asistente
      ),

    total:
      PPV1_redondear_(
        formal.total +
        asistente
      )
  };
}


function PPV1_calcularHorasPasanteDesdePeriodos_(
  persona,
  actividades,
  periodos
) {
  const periodosPersona =
    periodos.filter(
      function(p) {
        return (
          p.correo === persona.correo &&
          (
            p.tipo === 'BASE' ||
            p.tipo === 'EXTENSION'
          )
        );
      }
    );

  let cerrado = 0;
  let noCerrado = 0;
  let fallback = 0;
  let periodosCerradosIncompletos = 0;
  const detalle = [];

  if (periodosPersona.length) {
    periodosPersona.forEach(
      function(p) {
        if (p.estado === 'CERRADO') {
          if (p.horasFinales !== null) {
            const reconocido = Math.max(p.horasFinales, 0);
            cerrado += reconocido;
            detalle.push({
              periodo: p.periodo,
              tipo: p.tipo,
              estado: p.estado,
              fuente: 'CONTROL_PERIODOS_HORAS_FINALES',
              horas: PPV1_redondear_(reconocido)
            });
          } else {
            periodosCerradosIncompletos++;
            detalle.push({
              periodo: p.periodo,
              tipo: p.tipo,
              estado: p.estado,
              fuente: 'CERRADO_SIN_HORAS_FINALES',
              horas: 0
            });
          }
          return;
        }

        if (!p.inicio || !p.fin) {
          detalle.push({
            periodo: p.periodo,
            tipo: p.tipo,
            estado: p.estado,
            fuente: 'SIN_FECHAS',
            horas: 0
          });
          return;
        }

        let horasPeriodo = 0;

        actividades.forEach(
          function(a) {
            if (a.correo !== persona.correo || !a.fecha) return;
            if (a.fecha < p.inicio || a.fecha > p.fin) return;
            if (a.etapa !== 'PASANTE' && a.etapa !== 'PASANTE_HISTORICO_SIN_FECHAS') return;
            if (!a.cuentaCompromiso) return;
            if (a.periodo && a.periodo !== p.periodo) return;

            horasPeriodo += Math.max(a.horasConEvidencia, 0);
          }
        );

        noCerrado += horasPeriodo;
        detalle.push({
          periodo: p.periodo,
          tipo: p.tipo,
          estado: p.estado,
          fuente: 'REGISTRO_PLANNER_HORAS_CON_EVIDENCIA',
          horas: PPV1_redondear_(horasPeriodo)
        });
      }
    );
  } else {
    actividades.forEach(
      function(a) {
        if (a.correo !== persona.correo || !a.fecha) return;
        if ((a.etapa !== 'PASANTE' && a.etapa !== 'PASANTE_HISTORICO_SIN_FECHAS') || !a.cuentaCompromiso) return;
        fallback += Math.max(a.horasConEvidencia, 0);
      }
    );

    if (fallback > 0) {
      detalle.push({
        periodo: 'SIN_LINEA_TEMPORAL',
        tipo: 'FALLBACK',
        estado: 'ABIERTO',
        fuente: 'REGISTRO_PLANNER_HORAS_CON_EVIDENCIA',
        horas: PPV1_redondear_(fallback)
      });
    }
  }

  return {
    cerrado: PPV1_redondear_(cerrado),
    noCerrado: PPV1_redondear_(noCerrado),
    fallback: PPV1_redondear_(fallback),
    periodosCerradosIncompletos: periodosCerradosIncompletos,
    total: PPV1_redondear_(cerrado + noCerrado + fallback),
    periodos: detalle
  };
}

function PPV1_rolAsistenteEnFecha_(
  historial,
  fecha
) {
  const candidatos =
    historial.filter(
      function(r) {
        if (
          r.rol !==
          'ASISTENTE' ||
          !r.fechaInicio
        ) {
          return false;
        }

        if (
          fecha <
          r.fechaInicio
        ) {
          return false;
        }

        if (
          r.fechaFin &&
          fecha >
          r.fechaFin
        ) {
          return false;
        }

        return true;
      }
    );

  if (
    !candidatos.length
  ) {
    return null;
  }

  return candidatos[
    candidatos.length -
    1
  ];
}


/* ============================================================
 * TIEMPO
 * ============================================================ */

function PPV1_finCompromisoPlanificado_(
  p
) {
  /*
   * Una extensión formal real amplía el compromiso hasta AG.
   * Si AF/AG no existen, se usa AB.
   */
  if (
    p.inicioExtension &&
    p.finExtension
  ) {
    return p.finExtension;
  }

  return p.finPasantia;
}


function PPV1_fechaCorte_(
  p,
  asistente,
  finPlan,
  hoy
) {
  if (
    !p.inicioPasantia ||
    !finPlan
  ) {
    return null;
  }

  let corte =
    PPV1_minFecha_(
      hoy,
      finPlan
    );

  /*
   * Retiro: BP es el último día incluido.
   */
  if (
    p.fechaRetiro
  ) {
    corte =
      PPV1_minFecha_(
        corte,
        p.fechaRetiro
      );
  }

  /*
   * Si el contrato NO cuenta para compromiso, el día anterior
   * al inicio como asistente es el último día computable.
   * Si la política es Sí, la línea temporal del compromiso continúa.
   * MIXTA/POR REVISAR no se trunca automáticamente: se conserva
   * la planificación y se marca revisión.
   */
  if (
    asistente.inicio &&
    asistente.politica ===
      'No'
  ) {
    const anterior =
      PPV1_sumarDias_(
        asistente.inicio,
        -1
      );

    corte =
      PPV1_minFecha_(
        corte,
        anterior
      );
  }

  if (
    corte <
    p.inicioPasantia
  ) {
    return p.inicioPasantia;
  }

  return corte;
}


function PPV1_calcularDias_(
  inicio,
  fin,
  corte
) {
  if (
    !inicio ||
    !fin ||
    fin <
      inicio
  ) {
    return {
      total:
        null,

      transcurridos:
        null,

      porcentaje:
        null
    };
  }

  const total =
    PPV1_diasInclusivos_(
      inicio,
      fin
    );

  if (
    !corte
  ) {
    return {
      total:
        total,

      transcurridos:
        0,

      porcentaje:
        0
    };
  }

  const corteLimitado =
    PPV1_minFecha_(
      PPV1_maxFecha_(
        corte,
        inicio
      ),
      fin
    );

  const transcurridos =
    PPV1_diasInclusivos_(
      inicio,
      corteLimitado
    );

  return {
    total:
      total,

    transcurridos:
      transcurridos,

    porcentaje:
      total > 0
        ? (
            transcurridos /
            total
          )
        : null
  };
}


/* ============================================================
 * ESTADOS Y OBSERVACIONES
 * ============================================================ */

function PPV1_estadoDatos_(
  p,
  finPlan,
  dias,
  porcentajeHoras,
  asistente,
  horas
) {
  const problemas =
    [];

  if (
    !p.inicioPasantia
  ) {
    problemas.push(
      'SIN_FECHA_INICIO'
    );
  }

  if (
    !finPlan
  ) {
    problemas.push(
      'SIN_FECHA_FIN'
    );
  }

  if (
    p.horasObjetivo ===
      null
  ) {
    problemas.push(
      'SIN_META_HORAS'
    );
  }

  if (
    asistente.politica ===
      'POR REVISAR' ||
    asistente.politica ===
      'MIXTA'
  ) {
    problemas.push(
      'POLITICA_ASISTENTE_REVISAR'
    );
  }

  if (
    horas &&
    horas.periodosCerradosIncompletos > 0
  ) {
    problemas.push(
      'PERIODO_CERRADO_SIN_HORAS_FINALES'
    );
  }

  if (
    problemas.length
  ) {
    return problemas.join(
      ' | '
    );
  }

  return 'OK';
}


function PPV1_observacion_(
  p,
  asistente,
  finPlan,
  horas,
  dias
) {
  const partes =
    [];

  if (
    !p.horasObjetivo
  ) {
    partes.push(
      'Falta completar "Horas a cumplir en pasantía" en Variables_Internas; no se calcula porcentaje de horas.'
    );
  }

  if (
    asistente.politica ===
      'Sí'
  ) {
    partes.push(
      'Las horas con evidencia realizadas como ASISTENTE dentro del compromiso planificado se convalidan para el cumplimiento.'
    );
  }

  if (
    asistente.politica ===
      'No'
  ) {
    partes.push(
      'Las horas realizadas desde el inicio como ASISTENTE no se convalidan para el compromiso.'
    );
  }

  if (
    asistente.politica ===
      'POR REVISAR' ||
    asistente.politica ===
      'MIXTA'
  ) {
    partes.push(
      'Existe transición a ASISTENTE con política de convalidación no uniforme o no definida; revisar Historial_Roles!G.'
    );
  }

  if (
    p.fechaRetiro
  ) {
    partes.push(
      'Retiro registrado: el avance temporal se detiene en la fecha BP y las horas posteriores no se computan.'
    );
  }

  if (
    p.inicioExtension &&
    p.finExtension
  ) {
    partes.push(
      'El porcentaje de tiempo usa la extensión formal y toma como fin planificado la fecha AG.'
    );
  }

  partes.push(
    'Horas válidas de pasantía según régimen aplicable: ' +
    horas.pasante +
    ' h (cerradas/legacy=' +
    horas.pasanteCerrado +
    ', no cerradas=' +
    horas.pasanteNoCerrado +
    ', fallback histórico=' +
    horas.pasanteFallback +
    ').'
  );

  if (
    horas.periodosCerradosIncompletos > 0
  ) {
    partes.push(
      'Existen ' +
      horas.periodosCerradosIncompletos +
      ' período(s) período(s) cerrado(s) sin horas finales reconocidas; el total no debe usarse para una decisión final hasta resolverlos.'
    );
  }

  if (
    horas.asistente >
    0
  ) {
    partes.push(
      'Horas convalidadas como asistente: ' +
      horas.asistente +
      ' h.'
    );
  }

  if (
    dias.porcentaje !== null
  ) {
    partes.push(
      'Avance temporal calculado con días calendario inclusivos.'
    );
  }

  return partes.join(
    ' '
  );
}


/* ============================================================
 * RESUMEN
 * ============================================================ */

function PPV1_resumir_(
  datos
) {
  const resumen = {
    personas:
      datos.length,

    conFechasCompletas:
      0,

    conMetaHoras:
      0,

    sinMetaHoras:
      0,

    conPoliticaAsistenteSi:
      0,

    conPoliticaAsistenteNo:
      0,

    politicaAsistenteRevisar:
      0,

    horasPasanteValidas:
      0,

    horasAsistenteConvalidadas:
      0,

    horasValidasTotales:
      0,

    supera80Horas:
      0,

    supera80Tiempo:
      0
  };

  datos.forEach(
    function(p) {
      if (
        p.inicioCompromiso &&
        p.finCompromiso
      ) {
        resumen.conFechasCompletas++;
      }

      if (
        p.horasObjetivo !==
        null
      ) {
        resumen.conMetaHoras++;
      } else {
        resumen.sinMetaHoras++;
      }

      if (
        p.politicaAsistente ===
          'Sí'
      ) {
        resumen.conPoliticaAsistenteSi++;

      } else if (
        p.politicaAsistente ===
          'No'
      ) {
        resumen.conPoliticaAsistenteNo++;

      } else if (
        p.politicaAsistente !==
          'NO APLICA'
      ) {
        resumen.politicaAsistenteRevisar++;
      }

      resumen.horasPasanteValidas +=
        p.horasPasanteValidas;

      resumen.horasAsistenteConvalidadas +=
        p.horasAsistenteConvalidadas;

      resumen.horasValidasTotales +=
        p.horasValidas;

      if (
        p.supera80Horas ===
          'Sí'
      ) {
        resumen.supera80Horas++;
      }

      if (
        p.supera80Tiempo ===
          'Sí'
      ) {
        resumen.supera80Tiempo++;
      }
    }
  );

  [
    'horasPasanteValidas',
    'horasAsistenteConvalidadas',
    'horasValidasTotales'
  ].forEach(
    function(k) {
      resumen[
        k
      ] =
        PPV1_redondear_(
          resumen[
            k
          ]
        );
    }
  );

  return resumen;
}


function PPV1_serializarLog_(
  p,
  tz
) {
  return {
    correo:
      p.correo,

    nombre:
      p.nombre,

    estadoPasantia:
      p.estadoPasantia,

    inicio:
      PPV1_fechaTexto_(
        p.inicioCompromiso,
        tz
      ),

    fin:
      PPV1_fechaTexto_(
        p.finCompromiso,
        tz
      ),

    dias:
      p.diasTranscurridos !==
        null &&
      p.diasTotales !==
        null
        ? (
            p.diasTranscurridos +
            '/' +
            p.diasTotales
          )
        : '',

    porcentajeTiempo:
      p.porcentajeTiempo !==
        null
        ? PPV1_redondear_(
            p.porcentajeTiempo *
            100
          )
        : null,

    horasObjetivo:
      p.horasObjetivo,

    horasPasante:
      p.horasPasanteValidas,

    horasPasanteCerradas:
      p._horasPasanteCerradas !== undefined
        ? p._horasPasanteCerradas
        : null,

    horasPasanteNoCerradas:
      p._horasPasanteNoCerradas !== undefined
        ? p._horasPasanteNoCerradas
        : null,

    horasPasanteFallback:
      p._horasPasanteFallback !== undefined
        ? p._horasPasanteFallback
        : null,

    periodosCerradosIncompletos:
      p._periodosCerradosIncompletos !== undefined
        ? p._periodosCerradosIncompletos
        : null,

    horasAsistenteConvalidadas:
      p.horasAsistenteConvalidadas,

    horasValidas:
      p.horasValidas,

    porcentajeHoras:
      p.porcentajeHoras !==
        null
        ? PPV1_redondear_(
            p.porcentajeHoras *
            100
          )
        : null,

    diferenciaPp:
      p.diferenciaPp,

    politicaAsistente:
      p.politicaAsistente,

    estadoDatos:
      p.estadoDatos
  };
}


/* ============================================================
 * HOJA DE SALIDA
 * ============================================================ */

function PPV1_mapaHeadersSalida_(
  headers
) {
  const mapa = {};

  headers.forEach(function(h, i) {
    const k = PPV1_normalizar_(h);
    if (
      k &&
      !Object.prototype.hasOwnProperty.call(
        mapa,
        k
      )
    ) {
      mapa[k] = i;
    }
  });

  return mapa;
}


function PPV1_headersIguales_(
  actuales,
  esperados
) {
  if (actuales.length !== esperados.length) {
    return false;
  }

  return esperados.every(function(h, i) {
    return (
      PPV1_normalizar_(actuales[i]) ===
      PPV1_normalizar_(h)
    );
  });
}


function PPV1_detectarEstructuraSalida_(
  hoja
) {
  const columnas =
    hoja.getLastColumn();

  const actuales =
    hoja
      .getRange(
        1,
        1,
        1,
        columnas
      )
      .getDisplayValues()[0];

  if (
    PPV1_headersIguales_(
      actuales,
      PPV15_HEADERS
    )
  ) {
    return {
      tipo:
        'PRODUCTIVO_16',

      headers:
        PPV15_HEADERS
    };
  }

  throw new Error(
    PPV15_HOJA_SALIDA +
    ' debe tener exactamente la estructura productiva de 16 columnas. ' +
    'Columnas detectadas: ' +
    columnas +
    '. No se modificó la hoja.'
  );
}


function PPV1_prepararHeaders_(
  hoja
) {
  const vacia =
    hoja.getLastRow() === 0 ||
    (
      hoja.getLastRow() === 1 &&
      !String(
        hoja
          .getRange(
            1,
            1
          )
          .getValue() ||
        ''
      ).trim()
    );

  if (vacia) {
    if (
      hoja.getMaxColumns() <
        PPV15_HEADERS.length
    ) {
      hoja.insertColumnsAfter(
        hoja.getMaxColumns(),
        PPV15_HEADERS.length -
          hoja.getMaxColumns()
      );
    }

    hoja
      .getRange(
        1,
        1,
        1,
        PPV15_HEADERS.length
      )
      .setValues([
        PPV15_HEADERS
      ]);
  }

  const estructura =
    PPV1_detectarEstructuraSalida_(
      hoja
    );

  hoja
    .getRange(
      1,
      1,
      1,
      PPV15_HEADERS.length
    )
    .setFontWeight(
      'bold'
    );

  hoja.setFrozenRows(
    1
  );

  return estructura;
}


function PPV1_validarHeadersSalida_(
  hoja
) {
  return PPV1_detectarEstructuraSalida_(
    hoja
  );
}

function PPV1_leerConfigNumero_(
  hoja,
  clave,
  fallback
) {
  const objetivo =
    PPV1_normalizar_(
      clave
    );

  const lastRow =
    Math.max(
      hoja.getLastRow(),
      1
    );

  const datos =
    hoja
      .getRange(
        1,
        1,
        lastRow,
        2
      )
      .getValues();

  for (
    let i = 0;
    i < datos.length;
    i++
  ) {
    if (
      PPV1_normalizar_(
        datos[i][0]
      ) ===
      objetivo
    ) {
      const n =
        Number(
          datos[i][1]
        );

      return Number.isFinite(
        n
      )
        ? n
        : fallback;
    }
  }

  return fallback;
}


function PPV1_asegurarConfig_(
  hoja,
  clave,
  valor
) {
  const objetivo =
    PPV1_normalizar_(
      clave
    );

  const lastRow =
    Math.max(
      hoja.getLastRow(),
      1
    );

  const datos =
    hoja
      .getRange(
        1,
        1,
        lastRow,
        2
      )
      .getDisplayValues();

  for (
    let i = 0;
    i < datos.length;
    i++
  ) {
    if (
      PPV1_normalizar_(
        datos[i][0]
      ) ===
      objetivo
    ) {
      return;
    }
  }

  hoja.appendRow([
    clave,
    valor
  ]);
}


/* ============================================================
 * HELPERS
 * ============================================================ */

function PPV1_requerirHoja_(
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


function PPV1_mapaHeaders_(
  headers
) {
  const mapa =
    {};

  headers.forEach(
    function(h, i) {
      const clave =
        PPV1_normalizar_(
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


function PPV1_indiceConFallback_(
  mapa,
  alternativas,
  fallback
) {
  for (
    let i = 0;
    i < alternativas.length;
    i++
  ) {
    const clave =
      PPV1_normalizar_(
        alternativas[
          i
        ]
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

  return fallback;
}


function PPV1_normalizar_(
  valor
) {
  return String(
    valor || ''
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


function PPV1_correo_(
  valor
) {
  return String(
    valor || ''
  )
    .trim()
    .toLowerCase();
}


function PPV1_esSi_(
  valor
) {
  return (
    PPV1_normalizar_(
      valor
    ) ===
    'si'
  );
}


function PPV1_politicaTexto_(
  valor
) {
  const n =
    PPV1_normalizar_(
      valor
    );

  if (
    n === 'si'
  ) {
    return 'Sí';
  }

  if (
    n === 'no'
  ) {
    return 'No';
  }

  return 'Por revisar';
}


function PPV1_numero_(
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


function PPV1_numeroNullable_(
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
    : n;
}


function PPV1_redondear_(
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
    n *
    100
  ) /
  100;
}


function PPV1_fechaDia_(
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

  if (
    typeof valor ===
      'string' &&
    valor.trim()
  ) {
    const d =
      new Date(
        valor
      );

    if (
      !isNaN(
        d.getTime()
      )
    ) {
      return new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      );
    }
  }

  return null;
}


function PPV1_ms_(
  fecha
) {
  return fecha
    ? fecha.getTime()
    : Number.MAX_SAFE_INTEGER;
}


function PPV1_sumarDias_(
  fecha,
  dias
) {
  const d =
    new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate()
    );

  d.setDate(
    d.getDate() +
    dias
  );

  return d;
}


function PPV1_diasInclusivos_(
  inicio,
  fin
) {
  const msDia =
    24 *
    60 *
    60 *
    1000;

  const a =
    Date.UTC(
      inicio.getFullYear(),
      inicio.getMonth(),
      inicio.getDate()
    );

  const b =
    Date.UTC(
      fin.getFullYear(),
      fin.getMonth(),
      fin.getDate()
    );

  return (
    Math.floor(
      (
        b -
        a
      ) /
      msDia
    ) +
    1
  );
}


function PPV1_minFecha_(
  a,
  b
) {
  if (!a) {
    return b || null;
  }

  if (!b) {
    return a;
  }

  return (
    a.getTime() <=
    b.getTime()
  )
    ? a
    : b;
}


function PPV1_maxFecha_(
  a,
  b
) {
  if (!a) {
    return b || null;
  }

  if (!b) {
    return a;
  }

  return (
    a.getTime() >=
    b.getTime()
  )
    ? a
    : b;
}


function PPV1_fechaTexto_(
  fecha,
  tz
) {
  if (!fecha) {
    return '';
  }

  return Utilities.formatDate(
    fecha,
    tz,
    'dd/MM/yyyy'
  );
}

