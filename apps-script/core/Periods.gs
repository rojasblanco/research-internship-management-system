/**
 * ============================================================
 * PERIOD CONSTRUCTION — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * Construye y actualiza la secuencia de períodos sin modificar períodos ya cerrados.
 *
 * Mantiene congelados los CERRADOS y reconstruye únicamente la
 * estructura abierta/futura con fronteras por fecha.
 *
 * REGLAS:
 * - P1, P2, P3, P4... son BASE mientras estén dentro de AA-AB.
 * - E1, E2... son EXTENSION dentro de AF-AG.
 * - Inicio ASISTENTE y BP son fronteras duras.
 * - X1, X2... solo existen si Registro_Planner contiene actividad
 *   EXTRA_HISTORICO posterior al fin formal y previa a la frontera dura.
 *
 * NO llena H:P ni calcula horas finales.
 *
 * FUNCIÓN DE SINCRONIZACIÓN:
 *   sincronizarEstructuraControlPeriodosV2()
 * ============================================================
 */

const PV2_VARIABLES = 'Variables_Internas';
const PV2_ROLES = 'Historial_Roles';
const PV2_CONFIG = 'Configuracion';
const PV2_PLANNER = 'Registro_Planner';

const PV2_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';


function diagnosticarEstructuraControlPeriodosV2() {
  return ejecutarEstructuraControlPeriodosV2_(false);
}


function sincronizarEstructuraControlPeriodosV2() {
  return ejecutarEstructuraControlPeriodosV2_(true);
}


function ejecutarEstructuraControlPeriodosV2_(escribir) {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const db =
      SpreadsheetApp.openById(
        PV2_DB_ID
      );

    const tz =
      db.getSpreadsheetTimeZone() ||
      Session.getScriptTimeZone();

    const hoja =
      db.getSheetByName(
        'Control_Periodos'
      );

    if (!hoja) {
      throw new Error(
        'No existe Control_Periodos.'
      );
    }

    validarHeadersPV2_(
      hoja
    );

    const duracion =
      leerDuracionPeriodoPV2_(
        db
      );

    const personas =
      leerPersonasPV2_(
        db,
        tz
      );

    const roles =
      leerRolesPV2_(
        db,
        tz
      );

    const extrasPlanner =
      leerExtrasHistoricosPlannerPV2_(
        db,
        tz
      );

    const hoy =
      normalizarFechaPV2_(
        new Date(),
        tz
      );

    const existentes =
      leerExistentesPV2_(
        hoja
      );

    const cerrados = {};
    const cerradosExtra = [];
    const noCerradosExistentes = {};

    existentes.forEach(
      function(row) {
        const clave =
          clavePV2_(
            row[0],
            row[2],
            row[3]
          );

        if (!clave) {
          return;
        }

        if (
          normalizarTextoPV2_(
            row[6]
          ) ===
            'cerrado'
        ) {
          cerrados[clave] = row;
          cerradosExtra.push(row);
        } else {
          noCerradosExistentes[clave] = row;
        }
      }
    );

    const filas = [];
    const clavesGeneradas = {};

    const resumen = {
      personasConEstadoPasantia:
        0,

      personasConPeriodos:
        0,

      personasSinFechaInicio:
        0,

      periodosTotales:
        0,

      periodosBase:
        0,

      periodosExtension:
        0,

      periodosExtraHistorico:
        0,

      extrasPlannerFilas:
        extrasPlanner.totalFilas,

      extrasPlannerHoras:
        redondearPV2_(
          extrasPlanner.totalHoras
        ),

      extrasConColisionCodigo:
        0,

      pendientesCierre:
        0,

      abiertos:
        0,

      futuros:
        0,

      cerradosConservados:
        0,

      fronterasAB_AFReparadas:
        0,

      noCerradosNuevos:
        0,

      noCerradosQueDesaparecen:
        0,

      detalleNoCerradosQueDesaparecen:
        [],

      escritura:
        false
    };

    personas.forEach(
      function(persona) {
        if (
          !esEstadoPasantiaPV2_(
            persona.estado
          )
        ) {
          return;
        }

        resumen
          .personasConEstadoPasantia++;

        if (!persona.aa) {
          resumen
            .personasSinFechaInicio++;

          return;
        }

        const inicioAsistente =
          buscarInicioAsistentePV2_(
            persona,
            roles
          );

        const extrasPersona =
          extrasPersonaPV2_(
            persona,
            extrasPlanner.porCorreo
          );

        const linea =
          construirLineaTemporalPV2_(
            persona,
            inicioAsistente,
            duracion,
            hoy,
            tz,
            extrasPersona
          );

        if (
          !linea.periodos.length
        ) {
          return;
        }

        resumen
          .personasConPeriodos++;

        if (
          linea.fronteraCorregida
        ) {
          resumen
            .fronterasAB_AFReparadas++;
        }

        resumen.extrasConColisionCodigo +=
          linea.extrasConColisionCodigo || 0;

        linea.periodos.forEach(
          function(p) {
            const clave =
              clavePV2_(
                persona.correoA,
                p.tipo,
                p.periodo
              );

            clavesGeneradas[
              clave
            ] = true;

            if (
              cerrados[
                clave
              ]
            ) {
              filas.push(
                cerrados[
                  clave
                ]
              );

              resumen
                .cerradosConservados++;

              return;
            }

            const estado =
              traducirEstadoPV2_(
                p.estado
              );

            filas.push([
              persona.correoA,
              persona.nombre,
              p.tipo,
              p.periodo,
              p.inicio,
              p.fin,
              estado,
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              ''
            ]);

            resumen
              .periodosTotales++;

            if (
              p.tipo ===
                'BASE'
            ) {
              resumen
                .periodosBase++;

            } else if (
              p.tipo ===
                'EXTENSION'
            ) {
              resumen
                .periodosExtension++;

            } else if (
              p.tipo ===
                'EXTRA_HISTORICO'
            ) {
              resumen
                .periodosExtraHistorico++;
            }

            if (
              !noCerradosExistentes[
                clave
              ]
            ) {
              resumen.noCerradosNuevos++;
            }

            if (
              estado ===
                'PENDIENTE CIERRE'
            ) {
              resumen
                .pendientesCierre++;

            } else if (
              estado ===
                'ABIERTO'
            ) {
              resumen
                .abiertos++;

            } else if (
              estado ===
                'FUTURO'
            ) {
              resumen
                .futuros++;
            }
          }
        );
      }
    );

    /*
     * Un período CERRADO nunca se elimina automáticamente.
     * Si la línea administrativa cambia, se conserva como histórico.
     */
    cerradosExtra.forEach(
      function(row) {
        const clave =
          clavePV2_(
            row[0],
            row[2],
            row[3]
          );

        if (
          clave &&
          !clavesGeneradas[
            clave
          ]
        ) {
          filas.push(
            row
          );

          resumen
            .cerradosConservados++;
        }
      }
    );

    Object.keys(
      noCerradosExistentes
    ).forEach(
      function(clave) {
        if (
          clavesGeneradas[
            clave
          ]
        ) {
          return;
        }

        const row =
          noCerradosExistentes[
            clave
          ];

        resumen
          .noCerradosQueDesaparecen++;

        resumen
          .detalleNoCerradosQueDesaparecen
          .push({
            nombre:
              String(row[1] || ''),
            tipo:
              String(row[2] || ''),
            periodo:
              String(row[3] || ''),
            estado:
              String(row[6] || '')
          });
      }
    );

    filas.sort(
      function(a, b) {
        const correoA =
          String(
            a[0] || ''
          ).toLowerCase();

        const correoB =
          String(
            b[0] || ''
          ).toLowerCase();

        if (
          correoA !==
            correoB
        ) {
          return correoA.localeCompare(
            correoB
          );
        }

        const fa =
          a[4] instanceof Date
            ? a[4].getTime()
            : 0;

        const fb =
          b[4] instanceof Date
            ? b[4].getTime()
            : 0;

        return fa - fb;
      }
    );

    if (!escribir) {
      resumen.rangoPropuesto =
        filas.length
          ? (
              'Control_Periodos!A2:P' +
              (
                filas.length + 1
              )
            )
          : 'SIN FILAS';

      console.log(
        '=== DIAGNÓSTICO ESTRUCTURA CONTROL_PERIODOS V2.3 ==='
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

    if (
      hoja.getLastRow() >
        1
    ) {
      hoja
        .getRange(
          2,
          1,
          hoja.getLastRow() - 1,
          16
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
          16
        )
        .setValues(
          filas
        );

      hoja
        .getRange(
          2,
          5,
          filas.length,
          2
        )
        .setNumberFormat(
          'dd/mm/yyyy'
        );
    }

    documentarPV2_(
      hoja
    );

    resumen.escritura =
      true;

    resumen.rangoEscrito =
      filas.length
        ? (
            'Control_Periodos!A2:P' +
            (
              filas.length + 1
            )
          )
        : 'SIN FILAS';

    console.log(
      '=== SINCRONIZACIÓN ESTRUCTURA CONTROL_PERIODOS V2.3 ==='
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

  } finally {
    lock.releaseLock();
  }
}

function leerExistentesPV2_(
  hoja
) {
  if (
    hoja.getLastRow() <=
      1
  ) {
    return [];
  }

  return hoja
    .getRange(
      2,
      1,
      hoja.getLastRow() - 1,
      16
    )
    .getValues()
    .filter(
      function(row) {
        return row.some(
          function(v) {
            return (
              v !== '' &&
              v !== null
            );
          }
        );
      }
    );
}


function clavePV2_(
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
    normalizarTextoPV2_(
      tipo
    );

  const p =
    normalizarTextoPV2_(
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


function traducirEstadoPV2_(
  estado
) {
  if (
    estado ===
      'VENCIDO_PENDIENTE_CIERRE'
  ) {
    return 'PENDIENTE CIERRE';
  }

  return estado;
}


function validarHeadersPV2_(
  hoja
) {
  const esperados = [
    'correo oficial',
    'nombre',
    'tipo',
    'periodo',
    'fecha inicio',
    'fecha fin',
    'estado periodo',
    'fecha cierre',
    'horas planner al cierre',
    'horas con evidencia al cierre',
    'horas asistencia al cierre',
    'horas dentro horario',
    'horas fuera horario',
    'horas extras aprobadas',
    'ajustes',
    'horas finales'
  ];

  if (
    hoja.getLastColumn() <
      16
  ) {
    throw new Error(
      'Control_Periodos debe tener A:P.'
    );
  }

  const actuales =
    hoja
      .getRange(
        1,
        1,
        1,
        16
      )
      .getDisplayValues()[0]
      .map(
        normalizarTextoPV2_
      );

  esperados.forEach(
    function(h, i) {
      if (
        actuales[i] !== h
      ) {
        throw new Error(
          'Control_Periodos columna ' +
          (
            i + 1
          ) +
          ': esperado "' +
          h +
          '", encontrado "' +
          actuales[i] +
          '".'
        );
      }
    }
  );
}


function documentarPV2_(
  hoja
) {
  const notas = [
    'Correo principal A de Variables_Internas.',
    'Nombre del pasante.',
    'BASE, EXTENSION o EXTRA_HISTORICO.',
    'P1, P2... para base; E1, E2... para extensión; X1, X2... para actividad adicional posterior al fin formal y anterior a retiro/contrato.',
    'Inicio inclusivo del período.',
    'Fin inclusivo. El último período puede ser menor de 30 días.',
    'FUTURO, ABIERTO, PENDIENTE CIERRE o CERRADO.',
    'Solo se llena al cerrar formalmente el período.',
    'Snapshot Planner congelado al cierre.',
    'Snapshot evidencia congelado al cierre; no son horas adicionales.',
    'Snapshot de asistencia completa al cierre.',
    'Clasificación dentro de horario al cierre.',
    'Fuera de horario es informativo; no equivale a horas extra aprobadas.',
    'Horas extra expresamente aprobadas.',
    'Ajustes trazables de Ajustes_Horas.',
    'Horas finales reconocidas. Después del cierre solo cambia mediante ajustes trazables.'
  ];

  hoja
    .getRange(
      1,
      1,
      1,
      16
    )
    .setNotes([
      notas
    ]);
}


/* ============================================================
 * HELPERS AUTÓNOMOS DE LÍNEA TEMPORAL
 * ============================================================ */

function buscarInicioAsistentePV2_(
  persona,
  roles
) {
  const candidatos = [];

  correosPersonaPV2_(
    persona
  ).forEach(
    function(correo) {
      if (
        roles[
          correo
        ]
      ) {
        candidatos.push(
          roles[
            correo
          ]
        );
      }
    }
  );

  if (
    !candidatos.length
  ) {
    return null;
  }

  candidatos.sort(
    function(a, b) {
      return (
        a.getTime() -
        b.getTime()
      );
    }
  );

  return candidatos[0];
}

function compararFechasPV2_(
  a,
  b
) {
  const ta =
    Date.UTC(
      a.getFullYear(),
      a.getMonth(),
      a.getDate()
    );

  const tb =
    Date.UTC(
      b.getFullYear(),
      b.getMonth(),
      b.getDate()
    );

  if (
    ta <
      tb
  ) {
    return -1;
  }

  if (
    ta >
      tb
  ) {
    return 1;
  }

  return 0;
}

function construirLineaTemporalPV2_(
  persona,
  inicioAsistente,
  duracion,
  hoy,
  tz,
  extrasPersona
) {
  const salida = {
    tieneLinea:
      false,

    periodos:
      [],

    fronteraCorregida:
      false,

    fronteraEstado:
      'SIN_EXTENSION',

    abTexto:
      textoFechaPV2_(
        persona.ab,
        tz
      ),

    afOriginalTexto:
      textoFechaPV2_(
        persona.af,
        tz
      ),

    afEfectivaTexto:
      '',

    finEtapaTexto:
      '',

    fuenteFin:
      '',

    extrasConColisionCodigo:
      0,

    observacion:
      ''
  };

  if (
    !persona.aa
  ) {
    salida.observacion =
      'SIN FECHA AA: no se inventan períodos. Los datos históricos pueden conservarse en AW/AX/AY sin asignarlos a P/E/X.';

    return salida;
  }

  const frontera =
    obtenerFronteraDuraPV2_(
      persona,
      inicioAsistente
    );

  salida.finEtapaTexto =
    textoFechaPV2_(
      frontera.fecha,
      tz
    );

  salida.fuenteFin =
    frontera.fuente;

  let inicioExtension =
    persona.af;

  if (
    persona.af &&
    persona.ab &&
    compararFechasPV2_(
      persona.af,
      persona.ab
    ) <=
      0
  ) {
    inicioExtension =
      sumarDiasPV2_(
        persona.ab,
        1
      );

    salida.fronteraCorregida =
      true;

    salida.fronteraEstado =
      'AF<=AB: base conserva AB y extensión empieza AB+1.';

  } else if (
    persona.af
  ) {
    salida.fronteraEstado =
      'SIN_SOLAPE';
  }

  salida.afEfectivaTexto =
    textoFechaPV2_(
      inicioExtension,
      tz
    );

  /* ========================================================
   * 1. BASE FORMAL
   * ========================================================
   * El número del período NO limita la base a P3.
   * P4, P5... continúan siendo BASE mientras estén dentro de AA-AB.
   * Si existe una frontera dura previa (retiro o contrato), se trunca.
   * ======================================================== */
  let finBaseNominal =
    persona.ab;

  if (
    !finBaseNominal &&
    inicioExtension
  ) {
    finBaseNominal =
      sumarDiasPV2_(
        inicioExtension,
        -1
      );
  }

  if (
    !finBaseNominal &&
    frontera.fecha
  ) {
    finBaseNominal =
      frontera.fecha;
  }

  let finBase =
    finBaseNominal;

  if (
    finBase &&
    frontera.fecha
  ) {
    finBase =
      minimoFechaPV2_(
        finBase,
        frontera.fecha
      );
  }

  if (
    finBase &&
    compararFechasPV2_(
      persona.aa,
      finBase
    ) <=
      0
  ) {
    salida.periodos =
      salida.periodos.concat(
        crearBloquesPV2_(
          'BASE',
          'P',
          persona.aa,
          finBase,
          duracion,
          hoy
        )
      );
  }

  /* ========================================================
   * 2. EXTENSIÓN FORMAL
   * ======================================================== */
  if (
    inicioExtension &&
    persona.ag
  ) {
    let finExtension =
      persona.ag;

    if (
      frontera.fecha
    ) {
      finExtension =
        minimoFechaPV2_(
          finExtension,
          frontera.fecha
        );
    }

    if (
      compararFechasPV2_(
        inicioExtension,
        finExtension
      ) <=
        0
    ) {
      salida.periodos =
        salida.periodos.concat(
          crearBloquesPV2_(
            'EXTENSION',
            'E',
            inicioExtension,
            finExtension,
            duracion,
            hoy
          )
        );
    }
  }

  /* ========================================================
   * 3. EXTRA HISTÓRICO
   * ========================================================
   * No se crean X1/X2 por el mero paso del tiempo.
   * Solo aparecen cuando Registro_Planner contiene actividades
   * clasificadas como EXTRA_HISTORICO por Planners V8.6+.
   * Nunca cuentan automáticamente para el compromiso formal.
   * ======================================================== */
  const extras =
    crearPeriodosExtraDesdePlannerPV2_(
      persona,
      inicioExtension,
      frontera.fecha,
      extrasPersona || [],
      duracion,
      hoy
    );

  salida.extrasConColisionCodigo =
    extras.colisiones;

  salida.periodos =
    salida.periodos.concat(
      extras.periodos
    );

  salida.tieneLinea =
    salida.periodos.length > 0;

  if (
    !salida.tieneLinea &&
    !salida.observacion
  ) {
    salida.observacion =
      'No se pudo construir un rango formal seguro para esta persona.';
  }

  return salida;
}


function crearPeriodosExtraDesdePlannerPV2_(
  persona,
  inicioExtension,
  fronteraDura,
  extrasPersona,
  duracion,
  hoy
) {
  const salida = {
    periodos: [],
    colisiones: 0
  };

  if (
    !extrasPersona ||
    !extrasPersona.length
  ) {
    return salida;
  }

  const grupos = {};

  extrasPersona.forEach(
    function(item) {
      const fecha =
        item.fecha;

      const codigo =
        String(
          item.periodo || ''
        )
          .trim()
          .toUpperCase();

      if (
        !fecha ||
        !/^X\d+$/.test(
          codigo
        )
      ) {
        return;
      }

      /* La frontera dura es inclusiva: desde contrato ya no hay X. */
      if (
        fronteraDura &&
        compararFechasPV2_(
          fecha,
          fronteraDura
        ) >
          0
      ) {
        return;
      }

      let referencia = null;
      let zona = '';
      let limiteSuperior =
        fronteraDura;

      if (
        persona.ab &&
        inicioExtension &&
        compararFechasPV2_(
          fecha,
          persona.ab
        ) >
          0 &&
        compararFechasPV2_(
          fecha,
          inicioExtension
        ) <
          0
      ) {
        referencia =
          persona.ab;
        zona =
          'POST_BASE_PRE_EXTENSION';
        limiteSuperior =
          sumarDiasPV2_(
            inicioExtension,
            -1
          );

      } else if (
        inicioExtension &&
        persona.ag &&
        compararFechasPV2_(
          fecha,
          persona.ag
        ) >
          0
      ) {
        referencia =
          persona.ag;
        zona =
          'POST_EXTENSION';

      } else if (
        !inicioExtension &&
        persona.ab &&
        compararFechasPV2_(
          fecha,
          persona.ab
        ) >
          0
      ) {
        referencia =
          persona.ab;
        zona =
          'POST_BASE';
      }

      if (!referencia) {
        return;
      }

      const claveGrupo =
        zona + '|' + codigo;

      if (
        !grupos[
          claveGrupo
        ]
      ) {
        grupos[
          claveGrupo
        ] = {
          zona: zona,
          codigo: codigo,
          referencia:
            copiarFechaPV2_(
              referencia
            ),
          limiteSuperior:
            limiteSuperior
              ? copiarFechaPV2_(
                  limiteSuperior
                )
              : null,
          minFecha:
            copiarFechaPV2_(
              fecha
            ),
          maxFecha:
            copiarFechaPV2_(
              fecha
            )
        };
      } else {
        if (
          compararFechasPV2_(
            fecha,
            grupos[
              claveGrupo
            ].minFecha
          ) <
            0
        ) {
          grupos[
            claveGrupo
          ].minFecha =
            copiarFechaPV2_(
              fecha
            );
        }

        if (
          compararFechasPV2_(
            fecha,
            grupos[
              claveGrupo
            ].maxFecha
          ) >
            0
        ) {
          grupos[
            claveGrupo
          ].maxFecha =
            copiarFechaPV2_(
              fecha
            );
        }
      }
    }
  );

  const porCodigo = {};

  Object.keys(
    grupos
  ).forEach(
    function(k) {
      const g = grupos[k];
      if (!porCodigo[g.codigo]) {
        porCodigo[g.codigo] = [];
      }
      porCodigo[g.codigo].push(g);
    }
  );

  Object.keys(
    porCodigo
  ).sort(
    ordenarCodigoExtraPV2_
  ).forEach(
    function(codigo) {
      const lista =
        porCodigo[
          codigo
        ];

      if (
        lista.length > 1
      ) {
        /*
         * Un mismo Xn no puede representar dos zonas separadas.
         * No mezclamos períodos silenciosamente: se deja para revisión.
         */
        salida.colisiones++;
        return;
      }

      const g = lista[0];
      const numero =
        Number(
          codigo.substring(1)
        );

      let inicio =
        sumarDiasPV2_(
          g.referencia,
          1 +
          (
            numero - 1
          ) *
          duracion
        );

      let fin =
        sumarDiasPV2_(
          inicio,
          duracion - 1
        );

      if (
        g.limiteSuperior &&
        compararFechasPV2_(
          fin,
          g.limiteSuperior
        ) >
          0
      ) {
        fin =
          copiarFechaPV2_(
            g.limiteSuperior
          );
      }

      /*
       * Si no hay una frontera administrativa posterior y el bloque aún
       * está en curso, no extendemos artificialmente más allá de hoy.
       */
      if (
        compararFechasPV2_(
          fin,
          hoy
        ) >
          0
      ) {
        fin =
          copiarFechaPV2_(
            hoy
          );
      }

      if (
        compararFechasPV2_(
          inicio,
          fin
        ) >
          0
      ) {
        return;
      }

      salida.periodos.push({
        tipo:
          'EXTRA_HISTORICO',
        periodo:
          codigo,
        inicio:
          inicio,
        fin:
          fin,
        estado:
          estadoPeriodoPV2_(
            inicio,
            fin,
            hoy
          )
      });
    }
  );

  return salida;
}


function ordenarCodigoExtraPV2_(
  a,
  b
) {
  return (
    Number(
      String(a).substring(1)
    ) -
    Number(
      String(b).substring(1)
    )
  );
}

function convertirFechaPV2_(
  valor,
  tz
) {
  if (
    valor instanceof Date &&
    !isNaN(
      valor.getTime()
    )
  ) {
    return normalizarFechaPV2_(
      valor,
      tz
    );
  }

  const texto =
    limpiarPV2_(
      valor
    );

  if (!texto) {
    return null;
  }

  const m =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (m) {
    return new Date(
      Number(
        m[1]
      ),
      Number(
        m[2]
      ) - 1,
      Number(
        m[3]
      )
    );
  }

  return null;
}

function copiarFechaPV2_(
  fecha
) {
  return new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate()
  );
}

function correosPersonaPV2_(
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

function crearBloquesPV2_(
  tipo,
  prefijo,
  inicio,
  fin,
  duracion,
  hoy
) {
  const salida = [];

  let cursor =
    copiarFechaPV2_(
      inicio
    );

  let numero = 1;

  while (
    compararFechasPV2_(
      cursor,
      fin
    ) <=
      0
  ) {
    let finBloque =
      sumarDiasPV2_(
        cursor,
        duracion - 1
      );

    if (
      compararFechasPV2_(
        finBloque,
        fin
      ) >
        0
    ) {
      finBloque =
        copiarFechaPV2_(
          fin
        );
    }

    salida.push({
      tipo:
        tipo,

      periodo:
        prefijo +
        numero,

      inicio:
        copiarFechaPV2_(
          cursor
        ),

      fin:
        copiarFechaPV2_(
          finBloque
        ),

      estado:
        estadoPeriodoPV2_(
          cursor,
          finBloque,
          hoy
        )
    });

    cursor =
      sumarDiasPV2_(
        finBloque,
        1
      );

    numero++;
  }

  return salida;
}

function esEstadoPasantiaPV2_(
  estado
) {
  return [
    'vigente',
    'retirado',
    'contratado',
    'terminada'
  ].indexOf(
    estado
  ) >=
    0;
}

function estadoPeriodoPV2_(
  inicio,
  fin,
  hoy
) {
  if (
    compararFechasPV2_(
      fin,
      hoy
    ) <
      0
  ) {
    return 'VENCIDO_PENDIENTE_CIERRE';
  }

  if (
    compararFechasPV2_(
      inicio,
      hoy
    ) >
      0
  ) {
    return 'FUTURO';
  }

  return 'ABIERTO';
}

function indiceHeaderPV2_(
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
      normalizarTextoPV2_(
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

function leerDuracionPeriodoPV2_(
  db
) {
  const hoja =
    requerirHojaPV2_(
      db,
      PV2_CONFIG
    );

  if (
    hoja.getLastRow() <=
      1
  ) {
    return 30;
  }

  const datos =
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        2
      )
      .getValues();

  for (
    let i = 0;
    i <
      datos.length;
    i++
  ) {
    if (
      normalizarTextoPV2_(
        datos[
          i
        ][0]
      ) ===
        'duracion_periodo'
    ) {
      const n =
        Number(
          datos[
            i
          ][1]
        );

      if (
        isFinite(
          n
        ) &&
        n >
          0
      ) {
        return Math.floor(
          n
        );
      }
    }
  }

  return 30;
}

function leerPersonasPV2_(
  db,
  tz
) {
  const hoja =
    requerirHojaPV2_(
      db,
      PV2_VARIABLES
    );

  if (
    hoja.getLastRow() <=
      1
  ) {
    return [];
  }

  const datos =
    hoja
      .getDataRange()
      .getValues();

  const headers =
    datos[0];

  const mapa =
    {};

  headers.forEach(
    function(h, i) {
      const clave =
        normalizarTextoPV2_(
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

  const iCorreoA =
    indiceHeaderPV2_(
      mapa,
      [
        'Correo oficial'
      ]
    );

  const iCorreoB =
    indiceHeaderPV2_(
      mapa,
      [
        'Correo alternativo cursos',
        'Correo Alternativo (Cursos)'
      ]
    );

  const iNombre =
    indiceHeaderPV2_(
      mapa,
      [
        'Nombre',
        'Nombre del Pasante'
      ]
    );

  const iEstado =
    indiceHeaderPV2_(
      mapa,
      [
        'Estado de pasantía',
        'Estado de pasantia'
      ]
    );

  const iInicio =
    indiceHeaderPV2_(
      mapa,
      [
        'Fecha inicio pasantía',
        'Fecha inicio pasantia',
        'Fecha inicio (Pasantía)'
      ]
    );

  const iFin =
    indiceHeaderPV2_(
      mapa,
      [
        'Fecha fin pasantía',
        'Fecha fin pasantia',
        'Fecha salida (Pasantía)'
      ]
    );

  const iInicioExt =
    indiceHeaderPV2_(
      mapa,
      [
        'Fecha inicio extensión',
        'Fecha inicio extension',
        'Fecha inicio (Extensión)'
      ]
    );

  const iFinExt =
    indiceHeaderPV2_(
      mapa,
      [
        'Fecha fin extensión',
        'Fecha fin extension',
        'Fecha salida (Extensión)'
      ]
    );

  const iRetiro =
    indiceHeaderPV2_(
      mapa,
      [
        'Fecha retiro'
      ]
    );

  return datos
    .slice(
      1
    )
    .map(
      function(row, index) {
        return {
          fila:
            index + 2,

          correoA:
            normalizarCorreoPV2_(
              row[
                iCorreoA
              ]
            ),

          correoB:
            normalizarCorreoPV2_(
              row[
                iCorreoB
              ]
            ),

          nombre:
            limpiarPV2_(
              row[
                iNombre
              ]
            ),

          estado:
            normalizarTextoPV2_(
              row[
                iEstado
              ]
            ),

          aa:
            convertirFechaPV2_(
              row[
                iInicio
              ],
              tz
            ),

          ab:
            convertirFechaPV2_(
              row[
                iFin
              ],
              tz
            ),

          af:
            convertirFechaPV2_(
              row[
                iInicioExt
              ],
              tz
            ),

          ag:
            convertirFechaPV2_(
              row[
                iFinExt
              ],
              tz
            ),

          bp:
            convertirFechaPV2_(
              row[
                iRetiro
              ],
              tz
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

function leerRolesPV2_(
  db,
  tz
) {
  const hoja =
    db.getSheetByName(
      PV2_ROLES
    );

  const index = {};

  if (
    !hoja ||
    hoja.getLastRow() <=
      1
  ) {
    return index;
  }

  const headers =
    mapaHeadersPV2_(
      hoja
    );

  const iCorreo =
    indiceHeaderPV2_(
      headers,
      [
        'correo oficial'
      ]
    );

  const iRol =
    indiceHeaderPV2_(
      headers,
      [
        'rol'
      ]
    );

  const iInicio =
    indiceHeaderPV2_(
      headers,
      [
        'fecha inicio'
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
        normalizarCorreoPV2_(
          row[iCorreo]
        );

      if (
        !correo ||
        normalizarTextoPV2_(
          row[iRol]
        ) !==
          'asistente'
      ) {
        return;
      }

      const fecha =
        convertirFechaPV2_(
          row[iInicio],
          tz
        );

      if (!fecha) {
        return;
      }

      if (
        !index[
          correo
        ] ||
        compararFechasPV2_(
          fecha,
          index[
            correo
          ]
        ) <
          0
      ) {
        index[
          correo
        ] =
          fecha;
      }
    }
  );

  return index;
}

function leerExtrasHistoricosPlannerPV2_(
  db,
  tz
) {
  const salida = {
    porCorreo: {},
    totalFilas: 0,
    totalHoras: 0
  };

  const hoja =
    db.getSheetByName(
      PV2_PLANNER
    );

  if (
    !hoja ||
    hoja.getLastRow() <=
      1
  ) {
    return salida;
  }

  const headers =
    mapaHeadersPV2_(
      hoja
    );

  const iCorreo =
    indiceHeaderPV2_(
      headers,
      ['correo oficial']
    );

  const iFecha =
    indiceHeaderPV2_(
      headers,
      ['fecha']
    );

  const iPeriodo =
    indiceHeaderPV2_(
      headers,
      ['periodo', 'período']
    );

  const iEtapa =
    indiceHeaderPV2_(
      headers,
      ['etapa actividad']
    );

  const iHoras =
    indiceHeaderPV2_(
      headers,
      ['horas planner']
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
        normalizarCorreoPV2_(
          row[iCorreo]
        );

      const periodo =
        String(
          row[iPeriodo] || ''
        )
          .trim()
          .toUpperCase();

      const etapa =
        normalizarTextoPV2_(
          row[iEtapa]
        );

      if (
        !correo ||
        etapa !==
          'extra_historico' ||
        !/^X\d+$/.test(
          periodo
        )
      ) {
        return;
      }

      const fecha =
        convertirFechaPV2_(
          row[iFecha],
          tz
        );

      if (!fecha) {
        return;
      }

      const horas =
        Number(
          row[iHoras]
        );

      const item = {
        fecha:
          fecha,
        periodo:
          periodo,
        horas:
          isFinite(horas)
            ? horas
            : 0
      };

      if (
        !salida.porCorreo[
          correo
        ]
      ) {
        salida.porCorreo[
          correo
        ] = [];
      }

      salida.porCorreo[
        correo
      ].push(
        item
      );

      salida.totalFilas++;
      salida.totalHoras +=
        item.horas;
    }
  );

  return salida;
}


function extrasPersonaPV2_(
  persona,
  porCorreo
) {
  const salida = [];
  const vistos = {};

  correosPersonaPV2_(
    persona
  ).forEach(
    function(correo) {
      const filas =
        porCorreo[
          correo
        ] || [];

      filas.forEach(
        function(item) {
          const clave =
            textoFechaPV2_(
              item.fecha,
              'GMT'
            ) +
            '|' +
            item.periodo +
            '|' +
            item.horas;

          if (
            vistos[
              clave
            ]
          ) {
            return;
          }

          vistos[
            clave
          ] = true;
          salida.push(item);
        }
      );
    }
  );

  return salida;
}


function redondearPV2_(
  valor
) {
  return Math.round(
    Number(valor || 0) * 100
  ) / 100;
}


function limpiarPV2_(
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

function mapaHeadersPV2_(
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
        normalizarTextoPV2_(
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

function minimoFechaPV2_(
  a,
  b
) {
  return compararFechasPV2_(
    a,
    b
  ) <=
    0
    ? copiarFechaPV2_(
        a
      )
    : copiarFechaPV2_(
        b
      );
}

function normalizarCorreoPV2_(
  valor
) {
  return limpiarPV2_(
    valor
  ).toLowerCase();
}

function normalizarFechaPV2_(
  fecha,
  tz
) {
  const texto =
    Utilities.formatDate(
      fecha,
      tz,
      'yyyy-MM-dd'
    );

  const partes =
    texto.split(
      '-'
    );

  return new Date(
    Number(
      partes[0]
    ),
    Number(
      partes[1]
    ) - 1,
    Number(
      partes[2]
    )
  );
}

function normalizarTextoPV2_(
  valor
) {
  return limpiarPV2_(
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

function obtenerFronteraDuraPV2_(
  persona,
  inicioAsistente
) {
  const candidatos = [];

  if (
    inicioAsistente
  ) {
    candidatos.push({
      fecha:
        sumarDiasPV2_(
          inicioAsistente,
          -1
        ),
      fuente:
        'DÍA ANTERIOR A INICIO ASISTENTE'
    });
  }

  if (
    persona.bp
  ) {
    candidatos.push({
      fecha:
        persona.bp,
      fuente:
        'BP FECHA RETIRO'
    });
  }

  if (
    !candidatos.length
  ) {
    return {
      fecha: null,
      fuente: ''
    };
  }

  candidatos.sort(
    function(a, b) {
      return compararFechasPV2_(
        a.fecha,
        b.fecha
      );
    }
  );

  return candidatos[0];
}

function requerirHojaPV2_(
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

function sumarDiasPV2_(
  fecha,
  dias
) {
  const copia =
    copiarFechaPV2_(
      fecha
    );

  copia.setDate(
    copia.getDate() +
    dias
  );

  return copia;
}

function textoFechaPV2_(
  fecha,
  tz
) {
  if (!fecha) {
    return '';
  }

  return Utilities.formatDate(
    fecha,
    tz,
    'yyyy-MM-dd'
  );
}


/**
 * VALIDACIÓN INTEGRAL FASE 2 — SOLO LECTURA
 * Ejecutar después de reemplazar:
 * - Periodos V2.2 -> V2.3
 * - Progreso V1.3.1 -> V1.4
 *
 * No escribe porque llama únicamente a los diagnósticos de ambos módulos.
 */
function validarFase2PeriodosProgresoV2() {
  const periodos =
    diagnosticarEstructuraControlPeriodosV2();

  if (
    typeof diagnosticarProgresoPasantiasV1 !==
      'function'
  ) {
    throw new Error(
      'No está cargado el módulo de Progreso compatible V2.'
    );
  }

  const progreso =
    diagnosticarProgresoPasantiasV1();

  const salida = {
    periodos: {
      personasConEstadoPasantia:
        periodos.personasConEstadoPasantia,
      personasConPeriodos:
        periodos.personasConPeriodos,
      personasSinFechaInicio:
        periodos.personasSinFechaInicio,
      periodosTotales:
        periodos.periodosTotales,
      periodosBase:
        periodos.periodosBase,
      periodosExtension:
        periodos.periodosExtension,
      periodosExtraHistorico:
        periodos.periodosExtraHistorico,
      noCerradosQueDesaparecen:
        periodos.noCerradosQueDesaparecen,
      escritura:
        periodos.escritura
    },

    progreso:
      progreso &&
      progreso.resumen
        ? progreso.resumen
        : progreso,

    estado:
      (
        periodos.escritura === false &&
        periodos.noCerradosQueDesaparecen === 0
      )
        ? 'OK_FASE2_DRY_RUN'
        : 'REVISAR',

    escritura:
      false
  };

  console.log(
    '=== VALIDACIÓN INTEGRAL FASE 2 — PERIODOS + PROGRESO ==='
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
