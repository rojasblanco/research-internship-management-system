/**
 * ============================================================
 * BASE CONSOLIDATION — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * REGLA CLAVE:
 * - NO basta con "Cuenta actividad para compromiso = Sí".
 * - Solo se consolidan actividades cuya "Etapa actividad" sea:
 *     PASANTE
 *     PASANTE_HISTORICO_SIN_FECHAS
 * - Se excluyen PRE_PASANTIA y ASISTENTE.
 *
 * MODELO ACTUAL:
 * - Control_Periodos, Registro_Planner, Asistencia_Procesada y
 *   Progreso_Pasantias son las fuentes canónicas.
 * - Si Variables_Internas todavía contiene el bloque resumido AQ:AY,
 *   se actualiza únicamente como compatibilidad del despliegue actual.
 *
 * IMPORTANTE:
 * - P4/P5/P6 NO se meten en E1/E2/E3.
 * - Si existen P4/P5/P6, se reportan como períodos no
 *   representables en AQ:AV y se conservan dentro de AW/AX.
 * - SIN_CLASIFICAR también se conserva en AW/AX, pero no se
 *   inventa un período.
 *
 * ORDEN:
 *   1) diagnosticarConsolidacionBaseV11()
 *   2) revisar
 *   3) sincronizarConsolidacionBaseV11()
 * ============================================================
 */

const CBV11_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const CBV11_VARIABLES =
  'Variables_Internas';

const CBV11_PLANNER =
  'Registro_Planner';

const CBV11_ASISTENCIA =
  'Asistencia_Procesada';


function diagnosticarConsolidacionBaseV11() {
  const resultado =
    construirConsolidacionBaseV11_(
      CBV11_VARIABLES
    );

  console.log(
    '=== DRY RUN CONSOLIDACIÓN BASE V1.1 SEGURA ==='
  );

  console.log(
    resultado.resumen
  );

  resultado.detalle.forEach(
    function(fila) {
      console.log(
        '[PERSONA CONSOLIDACIÓN]',
        fila
      );
    }
  );

  Logger.log(
    JSON.stringify({
      resumen:
        resultado.resumen,

      detalle:
        resultado.detalle
    })
  );

  return {
    resumen:
      resultado.resumen,

    detalle:
      resultado.detalle
  };
}


function sincronizarConsolidacionBaseV11() {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const resultado =
      construirConsolidacionBaseV11_(
        CBV11_VARIABLES
      );

    const db =
      SpreadsheetApp.openById(
        CBV11_DB_ID
      );

    const variables =
      requerirHojaCBV11_(
        db,
        CBV11_VARIABLES
      );

    const bloqueLegacy =
      detectarBloqueLegacyConsolidacionCBV12_(
        variables
      );

    const filas =
      resultado.matriz;

    if (
      !bloqueLegacy.disponible
    ) {
      /*
       * MODELO V2:
       * AQ:AY fueron retiradas por normalización.
       * La consolidación deja de duplicar información en el master.
       * Mantener esta función permite que el Motor siga siendo
       * compatible durante la transición sin escribir columnas inexistentes.
       */
      resultado.resumen.escritura =
        false;

      resultado.resumen.estado =
        'OMITIDO_MODELO_V2';

      resultado.resumen.motivo =
        'AQ:AY no existen. Los datos ya tienen fuentes canónicas separadas.';

      resultado.resumen.rangoEscrito =
        '';

      console.log(
        '=== CONSOLIDACIÓN BASE V1.2 — MODELO V2 SIN ESCRITURA LEGACY ==='
      );

      console.log(
        resultado.resumen
      );

      Logger.log(
        JSON.stringify(
          resultado.resumen
        )
      );

      return resultado.resumen;
    }

    if (
      filas.length
    ) {
      variables
        .getRange(
          2,
          bloqueLegacy.columnaInicio,
          filas.length,
          9
        )
        .setValues(
          filas
        );
    }

    documentarCabecerasCBV11_(
      variables
    );

    resultado.resumen.escritura =
      true;

    resultado.resumen.estado =
      'OK_LEGACY_COMPATIBLE';

    resultado.resumen.rangoEscrito =
      'Variables_Internas!' +
      bloqueLegacy.letraInicio +
      '2:' +
      bloqueLegacy.letraFin +
      (
        filas.length + 1
      );

    console.log(
      '=== SINCRONIZACIÓN CONSOLIDACIÓN BASE V1.1 SEGURA ==='
    );

    console.log(
      resultado.resumen
    );

    Logger.log(
      JSON.stringify(
        resultado.resumen
      )
    );

    return resultado.resumen;

  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
 * MOTOR
 * ============================================================
 */

function construirConsolidacionBaseV11_(
  nombreHojaVariables
) {
  const db =
    SpreadsheetApp.openById(
      CBV11_DB_ID
    );

  const variables =
    requerirHojaCBV11_(
      db,
      nombreHojaVariables ||
      CBV11_VARIABLES
    );

  const planner =
    requerirHojaCBV11_(
      db,
      CBV11_PLANNER
    );

  const asistencia =
    requerirHojaCBV11_(
      db,
      CBV11_ASISTENCIA
    );

  const personas =
    leerPersonasCBV11_(
      variables
    );

  const plannerIndex =
    leerPlannerCBV11_(
      planner
    );

  const asistenciaIndex =
    leerAsistenciaCBV11_(
      asistencia
    );

  const resumen = {
    hojaVariables:
      variables.getName(),

    personasVariables:
      personas.length,

    personasConPlannerPasante:
      0,

    personasConEvidencia:
      0,

    personasConAsistencia:
      0,

    horasPlannerPasante:
      0,

    horasEvidenciaPasante:
      0,

    horasAsistenciaCompleta:
      0,

    personasConPlannerSinClasificar:
      0,

    horasPlannerSinClasificar:
      0,

    personasConPeriodosNoRepresentables:
      0,

    horasPeriodosNoRepresentables:
      0,

    detallePeriodosNoRepresentables:
      [],

    escritura:
      false,

    bloqueLegacyAQ_AY:
      detectarBloqueLegacyConsolidacionCBV12_(
        variables
      ).disponible
  };

  const matriz = [];
  const detalle = [];

  personas.forEach(
    function(persona) {
      const p =
        combinarAliasesPlannerCBV11_(
          persona,
          plannerIndex
        );

      const a =
        combinarAliasesAsistenciaCBV11_(
          persona,
          asistenciaIndex
        );

      const slots =
        mapearPeriodosExactosCBV11_(
          p.periodos
        );

      if (
        p.filas >
          0
      ) {
        resumen.personasConPlannerPasante++;
      }

      if (
        p.horasEvidencia >
          0
      ) {
        resumen.personasConEvidencia++;
      }

      if (
        a.filas >
          0
      ) {
        resumen.personasConAsistencia++;
      }

      if (
        p.horasSinClasificar >
          0
      ) {
        resumen.personasConPlannerSinClasificar++;

        resumen.horasPlannerSinClasificar +=
          p.horasSinClasificar;
      }

      if (
        slots.horasNoRepresentables >
          0
      ) {
        resumen.personasConPeriodosNoRepresentables++;

        resumen.horasPeriodosNoRepresentables +=
          slots.horasNoRepresentables;

        resumen.detallePeriodosNoRepresentables.push({
          nombre:
            persona.nombre,

          periodos:
            slots.noRepresentables
        });
      }

      resumen.horasPlannerPasante +=
        p.horasPlanner;

      resumen.horasEvidenciaPasante +=
        p.horasEvidencia;

      resumen.horasAsistenciaCompleta +=
        a.horasCompletas;

      const aw =
        p.filas >
          0
          ? redondearCBV11_(
              p.horasPlanner
            )
          : '';

      const ax =
        p.filas >
          0
          ? redondearCBV11_(
              p.horasEvidencia
            )
          : '';

      const ay =
        a.filas >
          0
          ? redondearCBV11_(
              a.horasCompletas
            )
          : '';

      matriz.push([
        slots.P1,
        slots.P2,
        slots.P3,
        slots.E1,
        slots.E2,
        slots.E3,
        aw,
        ax,
        ay
      ]);

      detalle.push({
        filaVariables:
          persona.fila,

        nombre:
          persona.nombre,

        estadoPasantia:
          persona.estadoPasantia,

        AQ_P1:
          slots.P1,

        AR_P2:
          slots.P2,

        AS_P3:
          slots.P3,

        AT_E1:
          slots.E1,

        AU_E2:
          slots.E2,

        AV_E3:
          slots.E3,

        AW_totalPlannerPasante:
          aw,

        AX_totalEvidenciaPasante:
          ax,

        AY_asistenciaCompleta:
          ay,

        plannerSinClasificar:
          redondearCBV11_(
            p.horasSinClasificar
          ),

        periodosNoRepresentables:
          slots.noRepresentables,

        horasNoRepresentables:
          redondearCBV11_(
            slots.horasNoRepresentables
          ),

        periodosEncontrados:
          p.periodos
      });
    }
  );

  resumen.horasPlannerPasante =
    redondearCBV11_(
      resumen.horasPlannerPasante
    );

  resumen.horasEvidenciaPasante =
    redondearCBV11_(
      resumen.horasEvidenciaPasante
    );

  resumen.horasAsistenciaCompleta =
    redondearCBV11_(
      resumen.horasAsistenciaCompleta
    );

  resumen.horasPlannerSinClasificar =
    redondearCBV11_(
      resumen.horasPlannerSinClasificar
    );

  resumen.horasPeriodosNoRepresentables =
    redondearCBV11_(
      resumen.horasPeriodosNoRepresentables
    );

  return {
    resumen:
      resumen,

    matriz:
      matriz,

    detalle:
      detalle
  };
}


/* ============================================================
 * VARIABLES
 * ============================================================
 */

function leerPersonasCBV11_(
  hoja
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return [];
  }

  const datos =
    hoja.getDataRange()
      .getValues();

  const headers =
    datos[0];

  const mapa =
    {};

  headers.forEach(
    function(h, i) {
      const clave =
        normalizarTextoCBV11_(
          h
        );

      if (
        clave &&
        !Object.prototype.hasOwnProperty.call(
          mapa,
          clave
        )
      ) {
        mapa[clave] =
          i;
      }
    }
  );

  const iCorreoA =
    indiceHeaderCBV11_(
      mapa,
      ['correo oficial']
    );

  let iCorreoB =
    -1;

  try {
    iCorreoB =
      indiceHeaderCBV11_(
        mapa,
        [
          'correo alternativo cursos',
          'correo alternativo (cursos)'
        ]
      );
  } catch (e) {
    iCorreoB =
      -1;
  }

  const iNombre =
    indiceHeaderCBV11_(
      mapa,
      [
        'nombre',
        'nombre del pasante'
      ]
    );

  const iEstado =
    indiceHeaderCBV11_(
      mapa,
      [
        'estado de pasantía',
        'estado de pasantia'
      ]
    );

  return datos
    .slice(1)
    .map(
      function(row, index) {
        return {
          fila:
            index + 2,

          correoA:
            normalizarCorreoCBV11_(
              row[iCorreoA]
            ),

          correoB:
            iCorreoB >= 0
              ? normalizarCorreoCBV11_(
                  row[iCorreoB]
                )
              : '',

          nombre:
            limpiarCBV11_(
              row[iNombre]
            ),

          estadoPasantia:
            limpiarCBV11_(
              row[iEstado]
            )
        };
      }
    )
    .filter(
      function(p) {
        return (
          p.correoA ||
          p.correoB
        );
      }
    );
}


/* ============================================================
 * PLANNER
 * ============================================================
 */

function leerPlannerCBV11_(
  hoja
) {
  const index = {};

  if (
    hoja.getLastRow() <=
      1
  ) {
    return index;
  }

  const headers =
    mapaHeadersCBV11_(
      hoja
    );

  const iCorreo =
    indiceHeaderCBV11_(
      headers,
      [
        'correo oficial'
      ]
    );

  const iPeriodo =
    indiceHeaderCBV11_(
      headers,
      [
        'período',
        'periodo'
      ]
    );

  const iPlanner =
    indiceHeaderCBV11_(
      headers,
      [
        'horas planner'
      ]
    );

  const iEvidencia =
    indiceHeaderCBV11_(
      headers,
      [
        'horas con evidencia'
      ]
    );

  const iEtapa =
    indiceHeaderCBV11_(
      headers,
      [
        'etapa actividad'
      ]
    );

  const iCuenta =
    indiceHeaderCBV11_(
      headers,
      [
        'cuenta actividad para compromiso'
      ]
    );

  const datos =
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        hoja.getLastColumn()
      )
      .getValues();

  datos.forEach(
    function(row) {
      const correo =
        normalizarCorreoCBV11_(
          row[iCorreo]
        );

      if (!correo) {
        return;
      }

      const etapa =
        normalizarTextoCBV11_(
          row[iEtapa]
        )
          .toUpperCase()
          .replace(
            /\s+/g,
            '_'
          );

      const etapaPermitida =
        (
          etapa ===
            'PASANTE'
        ) ||
        (
          etapa ===
            'PASANTE_HISTORICO_SIN_FECHAS'
        );

      if (
        !etapaPermitida
      ) {
        return;
      }

      if (
        normalizarTextoCBV11_(
          row[iCuenta]
        ) !==
          'si'
      ) {
        return;
      }

      if (
        !index[
          correo
        ]
      ) {
        index[
          correo
        ] =
          nuevoPlannerCBV11_();
      }

      const item =
        index[
          correo
        ];

      const horas =
        numeroCBV11_(
          row[iPlanner]
        );

      const evidencia =
        numeroCBV11_(
          row[iEvidencia]
        );

      const periodo =
        limpiarCBV11_(
          row[iPeriodo]
        ) ||
        'SIN_CLASIFICAR';

      item.filas++;

      item.horasPlanner +=
        horas;

      item.horasEvidencia +=
        evidencia;

      if (
        !item.periodos[
          periodo
        ]
      ) {
        item.periodos[
          periodo
        ] = 0;
      }

      item.periodos[
        periodo
      ] +=
        horas;

      if (
        normalizarTextoCBV11_(
          periodo
        ) ===
          'sin_clasificar'
      ) {
        item.horasSinClasificar +=
          horas;
      }
    }
  );

  return index;
}


function nuevoPlannerCBV11_() {
  return {
    filas:
      0,

    horasPlanner:
      0,

    horasEvidencia:
      0,

    horasSinClasificar:
      0,

    periodos: {}
  };
}


/* ============================================================
 * ASISTENCIA
 * ============================================================
 */

function leerAsistenciaCBV11_(
  hoja
) {
  const index = {};

  if (
    hoja.getLastRow() <=
      1
  ) {
    return index;
  }

  const headers =
    mapaHeadersCBV11_(
      hoja
    );

  const iCorreo =
    indiceHeaderCBV11_(
      headers,
      [
        'correo oficial'
      ]
    );

  const iDuracion =
    indiceHeaderCBV11_(
      headers,
      [
        'duración',
        'duracion'
      ]
    );

  const iEstado =
    indiceHeaderCBV11_(
      headers,
      [
        'estado'
      ]
    );

  const datos =
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        hoja.getLastColumn()
      )
      .getValues();

  datos.forEach(
    function(row) {
      const correo =
        normalizarCorreoCBV11_(
          row[iCorreo]
        );

      if (!correo) {
        return;
      }

      if (
        !index[
          correo
        ]
      ) {
        index[
          correo
        ] = {
          filas:
            0,

          completas:
            0,

          horasCompletas:
            0
        };
      }

      const item =
        index[
          correo
        ];

      item.filas++;

      const estado =
        normalizarTextoCBV11_(
          row[iEstado]
        );

      if (
        estado.indexOf(
          'completa'
        ) ===
          0
      ) {
        item.completas++;

        item.horasCompletas +=
          numeroCBV11_(
            row[iDuracion]
          );
      }
    }
  );

  return index;
}


/* ============================================================
 * MAPEO EXACTO AQ:AV
 * ============================================================
 */

function mapearPeriodosExactosCBV11_(
  periodos
) {
  const normalizados = {};

  Object.keys(
    periodos || {}
  ).forEach(
    function(k) {
      const clave =
        limpiarCBV11_(
          k
        )
          .toUpperCase()
          .replace(
            /\s+/g,
            '_'
          );

      normalizados[
        clave
      ] =
        numeroCBV11_(
          periodos[
            k
          ]
        );
    }
  );

  const representables = {
    P1: true,
    P2: true,
    P3: true,
    E1: true,
    E2: true,
    E3: true,
    SIN_CLASIFICAR: true,
    FUERA_RANGO: true
  };

  const noRepresentables = {};
  let horasNoRepresentables = 0;

  Object.keys(
    normalizados
  ).forEach(
    function(k) {
      if (
        !representables[
          k
        ]
      ) {
        noRepresentables[
          k
        ] =
          redondearCBV11_(
            normalizados[
              k
            ]
          );

        horasNoRepresentables +=
          normalizados[
            k
          ];
      }
    }
  );

  return {
    P1:
      valorExactoCBV11_(
        normalizados,
        'P1'
      ),

    P2:
      valorExactoCBV11_(
        normalizados,
        'P2'
      ),

    P3:
      valorExactoCBV11_(
        normalizados,
        'P3'
      ),

    E1:
      valorExactoCBV11_(
        normalizados,
        'E1'
      ),

    E2:
      valorExactoCBV11_(
        normalizados,
        'E2'
      ),

    E3:
      valorExactoCBV11_(
        normalizados,
        'E3'
      ),

    noRepresentables:
      noRepresentables,

    horasNoRepresentables:
      horasNoRepresentables
  };
}


function valorExactoCBV11_(
  mapa,
  clave
) {
  return Object.prototype.hasOwnProperty.call(
    mapa,
    clave
  )
    ? redondearCBV11_(
        mapa[
          clave
        ]
      )
    : '';
}


/* ============================================================
 * ALIASES A/B
 * ============================================================
 */

function combinarAliasesPlannerCBV11_(
  persona,
  index
) {
  const salida =
    nuevoPlannerCBV11_();

  correosPersonaCBV11_(
    persona
  ).forEach(
    function(correo) {
      const item =
        index[
          correo
        ];

      if (!item) {
        return;
      }

      salida.filas +=
        item.filas;

      salida.horasPlanner +=
        item.horasPlanner;

      salida.horasEvidencia +=
        item.horasEvidencia;

      salida.horasSinClasificar +=
        item.horasSinClasificar;

      Object.keys(
        item.periodos
      ).forEach(
        function(periodo) {
          if (
            !salida.periodos[
              periodo
            ]
          ) {
            salida.periodos[
              periodo
            ] = 0;
          }

          salida.periodos[
            periodo
          ] +=
            item.periodos[
              periodo
            ];
        }
      );
    }
  );

  return salida;
}


function combinarAliasesAsistenciaCBV11_(
  persona,
  index
) {
  const salida = {
    filas:
      0,

    completas:
      0,

    horasCompletas:
      0
  };

  correosPersonaCBV11_(
    persona
  ).forEach(
    function(correo) {
      const item =
        index[
          correo
        ];

      if (!item) {
        return;
      }

      salida.filas +=
        item.filas;

      salida.completas +=
        item.completas;

      salida.horasCompletas +=
        item.horasCompletas;
    }
  );

  return salida;
}


function correosPersonaCBV11_(
  persona
) {
  const salida = [];

  if (
    persona.correoA
  ) {
    salida.push(
      persona.correoA
    );
  }

  if (
    persona.correoB &&
    persona.correoB !==
      persona.correoA
  ) {
    salida.push(
      persona.correoB
    );
  }

  return salida;
}


/* ============================================================
 * COMPATIBILIDAD LEGACY AQ:AY
 * ============================================================ */

function detectarBloqueLegacyConsolidacionCBV12_(
  hoja
) {
  const esperados = [
    'horas planner período 1',
    'horas planner período 2',
    'horas planner período 3',
    'horas planner período 1 extensión',
    'horas planner período  2 extensión',
    'horas planner período 3 extensión',
    'horas totales del número total de actividades del planner',
    'horas totales (con evidencia)',
    'horas totales dentro de rango marcado de entrada/salida'
  ];

  const headers =
    hoja.getRange(
      1,
      1,
      1,
      Math.max(
        hoja.getLastColumn(),
        1
      )
    ).getDisplayValues()[0];

  const norm =
    headers.map(
      normalizarTextoCBV11_
    );

  const posiciones =
    esperados.map(
      function(h) {
        return norm.indexOf(
          normalizarTextoCBV11_(
            h
          )
        );
      }
    );

  const todos =
    posiciones.every(
      function(p) {
        return p >= 0;
      }
    );

  const contiguos =
    todos &&
    posiciones.every(
      function(p, i) {
        return (
          i === 0 ||
          p === posiciones[0] + i
        );
      }
    );

  if (
    !todos ||
    !contiguos
  ) {
    return {
      disponible:
        false,
      posiciones:
        posiciones
    };
  }

  const inicio =
    posiciones[0] + 1;

  return {
    disponible:
      true,
    columnaInicio:
      inicio,
    columnaFin:
      inicio + 8,
    letraInicio:
      columnaALetraCBV12_(
        inicio
      ),
    letraFin:
      columnaALetraCBV12_(
        inicio + 8
      )
  };
}


function columnaALetraCBV12_(
  columna
) {
  let n =
    columna;

  let salida =
    '';

  while (
    n > 0
  ) {
    const resto =
      (n - 1) % 26;

    salida =
      String.fromCharCode(
        65 + resto
      ) +
      salida;

    n =
      Math.floor(
        (n - 1) / 26
      );
  }

  return salida;
}


/* ============================================================
 * AUTODOCUMENTACIÓN
 * ============================================================
 */

function documentarCabecerasCBV11_(
  hoja
) {
  const notas = [
    'AQ. Horas Planner del período base P1. Solo actividades de etapa PASANTE/PASANTE_HISTORICO_SIN_FECHAS que cuentan para compromiso.',
    'AR. Horas Planner del período base P2.',
    'AS. Horas Planner del período base P3.',
    'AT. Horas Planner de extensión E1. P4 NO se coloca aquí automáticamente.',
    'AU. Horas Planner de extensión E2. P5 NO se coloca aquí automáticamente.',
    'AV. Horas Planner de extensión E3. P6 NO se coloca aquí automáticamente.',
    'AW. Total Planner de etapa PASANTE. Excluye PRE_PASANTIA y ASISTENTE. Puede incluir horas de un período histórico no representable en AQ:AV; el detalle queda en Registro_Planner/Control_Periodos.',
    'AX. Total con evidencia de etapa PASANTE. Es verificación del Planner, no horas adicionales.',
    'AY. Total de asistencia con Entrada→Salida completa atribuida a pasantía. Incompletas no inventan duración.'
  ];

  hoja
    .getRange(
      1,
      43,
      1,
      9
    )
    .setNotes([
      notas
    ]);
}


/* ============================================================
 * UTILIDADES
 * ============================================================
 */

function mapaHeadersCBV11_(
  hoja
) {
  const valores =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0];

  const mapa = {};

  valores.forEach(
    function(valor, index) {
      const clave =
        normalizarTextoCBV11_(
          valor
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
        ] = index;
      }
    }
  );

  return mapa;
}


function indiceHeaderCBV11_(
  mapa,
  alternativas
) {
  for (
    let i = 0;
    i <
      alternativas.length;
    i++
  ) {
    const clave =
      normalizarTextoCBV11_(
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

  throw new Error(
    'No se encontró cabecera: ' +
    alternativas.join(
      ' / '
    )
  );
}


function requerirHojaCBV11_(
  ss,
  nombre
) {
  const hoja =
    ss.getSheetByName(
      nombre
    );

  if (!hoja) {
    throw new Error(
      'No existe la hoja "' +
      nombre +
      '".'
    );
  }

  return hoja;
}


function numeroCBV11_(
  valor
) {
  const n =
    Number(
      valor
    );

  return isNaN(
    n
  )
    ? 0
    : n;
}


function redondearCBV11_(
  valor
) {
  return (
    Math.round(
      numeroCBV11_(
        valor
      ) *
      100
    ) /
    100
  );
}


function limpiarCBV11_(
  valor
) {
  return String(
    valor === null ||
    valor === undefined
      ? ''
      : valor
  )
    .trim()
    .replace(
      /\s+/g,
      ' '
    );
}


function normalizarTextoCBV11_(
  valor
) {
  return limpiarCBV11_(
    valor
  )
    .normalize(
      'NFD'
    )
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase();
}


function normalizarCorreoCBV11_(
  valor
) {
  return limpiarCBV11_(
    valor
  ).toLowerCase();
}

