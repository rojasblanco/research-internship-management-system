

/**
 * Public repository copy: deployment identifiers and private data are externalized.
 * ============================================================
 * CIERRE Y AJUSTES DE PERIODOS V1
 * RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 *
 * CIERRE NORMAL:
 * - Solo períodos PENDIENTE CIERRE.
 * - I:M se congelan al cierre.
 * - N = horas adicionales aprobadas antes del cierre.
 * - O = ajustes posteriores al cierre.
 * - P = horas finales reconocidas.
 *
 * Regla al cierre:
 *   P = I + N
 *
 * AJUSTES POSTERIORES:
 * - HORAS: modifica O y P, con trazabilidad.
 * - EVIDENCIA: registra respaldo posterior, sin cambiar horas.
 *
 * POLÍTICA V2 DE CIERRE:
 * - Los períodos INTERMEDIOS se cierran automáticamente cuando no tienen bloqueos.
 * - Si un período intermedio tiene un bloqueo, permanece PENDIENTE CIERRE y se muestra como excepción.
 * - El ÚLTIMO período formal (BASE o EXTENSION) siempre requiere revisión humana desde la interfaz.
 * - EXTRA_HISTORICO no se usa para decidir cuál es el último período formal.
 * - El Motor ejecuta el cierre automático de intermedios; ningún operador debe ejecutar funciones manuales para el seguimiento normal.
 * - Los ajustes posteriores siguen siendo trazables mediante Ajustes_Horas.
 * ============================================================
 */

const CAV1_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const CAV1_HEADERS_AJUSTES = [
  'ID ajuste',
  'Correo oficial',
  'Nombre',
  'Periodo',
  'Fecha ajuste',
  'Tipo ajuste',
  'Horas ajuste',
  'Motivo',
  'Evidencia',
  'Aprobado por'
];


/* ============================================================
 * 1. PREPARAR AJUSTES_HORAS
 * ============================================================
 */

function prepararCierreYAjustesV1() {

  const db =
    SpreadsheetApp.openById(
      CAV1_DB_ID
    );

  const hoja =
    exigirHojaCAV1_(
      db,
      'Ajustes_Horas'
    );

  if (
    hoja.getMaxColumns() <
    CAV1_HEADERS_AJUSTES.length
  ) {
    hoja.insertColumnsAfter(
      hoja.getMaxColumns(),
      CAV1_HEADERS_AJUSTES.length -
        hoja.getMaxColumns()
    );
  }

  const filasDatos =
    Math.max(
      hoja.getLastRow() - 1,
      0
    );

  const actuales =
    hoja
      .getRange(
        1,
        1,
        1,
        CAV1_HEADERS_AJUSTES.length
      )
      .getDisplayValues()[0];

  const coincide =
    CAV1_HEADERS_AJUSTES.every(
      function(esperado, i) {
        return (
          normalCAV1_(actuales[i]) ===
          normalCAV1_(esperado)
        );
      }
    );

  if (!coincide) {

    if (filasDatos > 0) {
      throw new Error(
        'Ajustes_Horas ya contiene ' +
        filasDatos +
        ' registro(s) y su estructura no coincide. ' +
        'NO se modificó la hoja.'
      );
    }

    hoja
      .getRange(
        1,
        1,
        1,
        CAV1_HEADERS_AJUSTES.length
      )
      .setValues([
        CAV1_HEADERS_AJUSTES
      ]);
  }

  const encabezado =
    hoja.getRange(
      1,
      1,
      1,
      CAV1_HEADERS_AJUSTES.length
    );

  encabezado
    .setFontWeight('bold')
    .setWrap(true);

  hoja.setFrozenRows(1);

  encabezado.setNotes([[
    'Identificador único del ajuste. No repetir.',
    'Correo oficial o alias reconocido de Variables_Internas.',
    'Nombre para lectura humana. La identidad se resuelve por correo.',
    'P1, P2, P3, E1, E2... Debe corresponder a un período CERRADO.',
    'Fecha administrativa en que se aprobó o registró el ajuste.',
    'HORAS o EVIDENCIA.',
    'Solo para tipo HORAS. Puede ser positivo o negativo. Para EVIDENCIA debe ser 0.',
    'Explicación obligatoria del ajuste.',
    'Enlace o referencia del respaldo. Obligatorio para EVIDENCIA y para incrementos positivos de horas.',
    'Persona que aprueba el ajuste. Si está vacío, el ajuste NO se aplica.'
  ]]);

  SpreadsheetApp.flush();

  const salida = {
    hoja: 'Ajustes_Horas',
    filasDatos: filasDatos,
    encabezados: CAV1_HEADERS_AJUSTES,
    estructuraCorrecta: true,
    datosEliminados: false,
    estado: 'OK'
  };

  console.log(
    '=== PREPARAR CIERRE Y AJUSTES V1 ==='
  );
  console.log(salida);
  Logger.log(JSON.stringify(salida));

  return salida;
}


/* ============================================================
 * 2. DIAGNÓSTICO DE CIERRE NORMAL
 * ============================================================
 */

function diagnosticarCierreNormalPeriodosV1() {

  const resultado =
    construirDiagnosticoCierreCAV1_();

  console.log(
    '=== DIAGNÓSTICO CIERRE NORMAL PERIODOS V1 ==='
  );
  console.log(resultado.resumen);

  resultado.detalle.forEach(
    function(item) {
      console.log(
        '[PERIODO]',
        item
      );
    }
  );

  Logger.log(
    JSON.stringify(resultado)
  );

  return resultado;
}


/* ============================================================
 * 3. CIERRE REAL
 * ============================================================
 *
 * Ejecutar manualmente DESPUÉS de:
 * - revisar diagnosticarCierreNormalPeriodosV1();
 * - registrar en N las horas adicionales aprobadas, si existen.
 *
 * NO se incorpora al Motor.
 * ============================================================
 */

function cerrarPeriodosPendientesV1() {
  /*
   * Compatibilidad con el nombre histórico.
   * Desde V2 este entry point NO cierra el período formal final.
   * Ejecuta únicamente el cierre automático seguro de intermedios.
   */
  return cerrarPeriodosIntermediosAutomaticamenteV2();
}




/* ============================================================
 * 3B. CIERRE AUTOMÁTICO DE PERÍODOS INTERMEDIOS
 * ============================================================
 *
 * Lo ejecuta el Motor horario. No requiere intervención humana.
 * Solo cierra períodos cuyo tratamiento sea CIERRE_AUTOMATICO.
 * El período formal final y las excepciones permanecen pendientes.
 * ============================================================
 */

function cerrarPeriodosIntermediosAutomaticamenteV2() {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const diagnostico =
      construirDiagnosticoCierreCAV1_();

    const db =
      SpreadsheetApp.openById(
        CAV1_DB_ID
      );

    const control =
      exigirHojaCAV1_(
        db,
        'Control_Periodos'
      );

    let cerradosAutomaticamente = 0;
    let finalesPendientes = 0;
    let excepcionesPendientes = 0;
    const cerrados = [];
    const pendientes = [];

    diagnostico.detalle.forEach(
      function(item) {
        if (
          item.tratamiento ===
            'REVISION_FINAL'
        ) {
          finalesPendientes++;
          pendientes.push({
            correo: item.correo,
            tipo: item.tipo,
            periodo: item.periodo,
            motivo: 'REVISION_FINAL'
          });
          return;
        }

        if (
          item.tratamiento ===
            'REVISION_EXCEPCION' ||
          item.accion !==
            'CERRABLE'
        ) {
          excepcionesPendientes++;
          pendientes.push({
            correo: item.correo,
            tipo: item.tipo,
            periodo: item.periodo,
            motivo: 'REVISION_EXCEPCION',
            bloqueos: item.bloqueos
          });
          return;
        }

        if (
          item.tratamiento !==
            'CIERRE_AUTOMATICO'
        ) {
          return;
        }

        const cierre =
          CAV2_cerrarItem_(
            control,
            item
          );

        if (cierre.cerrado) {
          cerradosAutomaticamente++;
          cerrados.push(cierre);
        } else {
          excepcionesPendientes++;
          pendientes.push({
            correo: item.correo,
            tipo: item.tipo,
            periodo: item.periodo,
            motivo: cierre.motivo || 'NO_CERRADO'
          });
        }
      }
    );

    SpreadsheetApp.flush();

    const salida = {
      pendientesEvaluados:
        diagnostico.resumen.pendientes,
      cerradosAutomaticamente:
        cerradosAutomaticamente,
      finalesPendientes:
        finalesPendientes,
      excepcionesPendientes:
        excepcionesPendientes,
      cerrados:
        cerrados,
      pendientes:
        pendientes,
      escritura:
        true,
      cierreFinalAutomatico:
        false,
      estado:
        'OK'
    };

    console.log(
      '=== CIERRE AUTOMÁTICO INTERMEDIOS V2 ==='
    );
    console.log(salida);
    Logger.log(JSON.stringify(salida));

    return salida;

  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
 * 3C. REVISIÓN / CIERRE DESDE PORTAL
 * ============================================================ */

function obtenerRevisionPeriodoPortalV2(
  correo,
  tipo,
  periodo
) {
  const diagnostico =
    construirDiagnosticoCierreCAV1_();

  const item =
    CAV2_buscarItemDiagnostico_(
      diagnostico,
      correo,
      tipo,
      periodo
    );

  if (!item) {
    throw new Error(
      'No existe un período PENDIENTE CIERRE que coincida con la persona y período indicados.'
    );
  }

  return {
    ok: true,
    escritura: false,
    periodo: item
  };
}


function cerrarPeriodoRevisadoDesdePortalV2(
  correo,
  tipo,
  periodo,
  horasAdicionalesAprobadas
) {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const db =
      SpreadsheetApp.openById(
        CAV1_DB_ID
      );

    const control =
      exigirHojaCAV1_(
        db,
        'Control_Periodos'
      );

    let diagnostico =
      construirDiagnosticoCierreCAV1_();

    let item =
      CAV2_buscarItemDiagnostico_(
        diagnostico,
        correo,
        tipo,
        periodo
      );

    if (!item) {
      throw new Error(
        'No existe un período pendiente de cierre con esos datos.'
      );
    }

    if (
      horasAdicionalesAprobadas !==
        undefined &&
      horasAdicionalesAprobadas !==
        null &&
      horasAdicionalesAprobadas !==
        ''
    ) {
      const extras =
        Number(
          horasAdicionalesAprobadas
        );

      if (
        !Number.isFinite(extras) ||
        extras < 0
      ) {
        throw new Error(
          'Las horas adicionales aprobadas deben ser un número mayor o igual a 0.'
        );
      }

      control
        .getRange(
          item.fila,
          14
        )
        .setValue(
          redondearCAV1_(
            extras
          )
        );

      SpreadsheetApp.flush();

      diagnostico =
        construirDiagnosticoCierreCAV1_();

      item =
        CAV2_buscarItemDiagnostico_(
          diagnostico,
          correo,
          tipo,
          periodo
        );
    }

    if (!item) {
      throw new Error(
        'El período dejó de estar pendiente antes de completar el cierre.'
      );
    }

    if (
      item.accion !==
        'CERRABLE'
    ) {
      throw new Error(
        'El período todavía tiene bloqueos y no puede cerrarse: ' +
        (item.bloqueos || []).join(', ')
      );
    }

    const cierre =
      CAV2_cerrarItem_(
        control,
        item
      );

    if (!cierre.cerrado) {
      throw new Error(
        cierre.motivo ||
        'No fue posible cerrar el período.'
      );
    }

    SpreadsheetApp.flush();

    return {
      ok: true,
      verificado: true,
      cerrado: true,
      tratamientoOriginal:
        item.tratamiento,
      esFinalFormal:
        item.esFinalFormal,
      correo:
        item.correo,
      tipo:
        item.tipo,
      periodo:
        item.periodo,
      horasFinales:
        cierre.horasFinales,
      message:
        'Período cerrado y snapshots consolidados.'
    };

  } finally {
    lock.releaseLock();
  }
}


function CAV2_cerrarItem_(
  control,
  item
) {
  const filaActual =
    control
      .getRange(
        item.fila,
        1,
        1,
        16
      )
      .getValues()[0];

  if (
    normalCAV1_(
      filaActual[6]
    ) !==
      'pendiente cierre'
  ) {
    return {
      cerrado: false,
      motivo: 'EL_PERIODO_YA_NO_ESTA_PENDIENTE'
    };
  }

  const extrasActual =
    numeroOpcionalCAV1_(
      filaActual[13]
    );

  if (
    !extrasActual.valido ||
    extrasActual.valor < 0
  ) {
    return {
      cerrado: false,
      motivo: 'HORAS_ADICIONALES_INVALIDAS'
    };
  }

  const final =
    redondearCAV1_(
      item.snapshot.horasPlanner +
      extrasActual.valor
    );

  control
    .getRange(
      item.fila,
      8
    )
    .setValue(
      new Date()
    )
    .setNumberFormat(
      'dd/mm/yyyy'
    );

  control
    .getRange(
      item.fila,
      9,
      1,
      5
    )
    .setValues([[
      item.snapshot.horasPlanner,
      item.snapshot.horasEvidencia,
      item.snapshot.horasAsistencia,
      item.snapshot.horasDentroHorario,
      item.snapshot.horasFueraHorario
    ]]);

  control
    .getRange(
      item.fila,
      15
    )
    .setValue(0);

  control
    .getRange(
      item.fila,
      16
    )
    .setValue(final)
    .setNote(
      'Horas finales al cierre = Planner elegible congelado + horas adicionales aprobadas antes del cierre. ' +
      'Los cambios posteriores solo deben realizarse mediante Ajustes_Horas.'
    );

  control
    .getRange(
      item.fila,
      7
    )
    .setValue(
      'CERRADO'
    );

  return {
    cerrado: true,
    fila: item.fila,
    correo: item.correo,
    tipo: item.tipo,
    periodo: item.periodo,
    horasFinales: final
  };
}


function CAV2_buscarItemDiagnostico_(
  diagnostico,
  correo,
  tipo,
  periodo
) {
  const c =
    correoCAV1_(
      correo
    );

  const t =
    normalCAV1_(
      tipo
    );

  const p =
    normalCAV1_(
      periodo
    );

  return (
    (diagnostico.detalle || [])
      .find(
        function(item) {
          return (
            correoCAV1_(item.correo) === c &&
            normalCAV1_(item.tipo) === t &&
            normalCAV1_(item.periodo) === p
          );
        }
      ) || null
  );
}


function CAV2_clavePeriodo_(
  correo,
  tipo,
  periodo
) {
  const c =
    correoCAV1_(correo);

  const t =
    normalCAV1_(tipo);

  const p =
    normalCAV1_(periodo);

  if (!c || !t || !p) {
    return '';
  }

  return [c, t, p].join('|');
}


/* ============================================================
 * 4. DIAGNÓSTICO DE AJUSTES POSTERIORES
 * ============================================================
 */

function diagnosticarAjustesHorasV1() {

  const resultado =
    analizarAjustesCAV1_();

  console.log(
    '=== DIAGNÓSTICO AJUSTES HORAS V1 ==='
  );
  console.log(resultado.resumen);

  resultado.detalle.forEach(
    function(item) {
      console.log(
        '[AJUSTE]',
        item
      );
    }
  );

  Logger.log(
    JSON.stringify(resultado)
  );

  return resultado;
}


/* ============================================================
 * 5. SINCRONIZAR AJUSTES POSTERIORES
 * ============================================================
 *
 * HORAS:
 * - O = suma vigente de ajustes HORAS válidos y aprobados.
 * - P = base reconocida al cierre + O.
 *
 * EVIDENCIA:
 * - No modifica O ni P.
 * - Queda en Ajustes_Horas para el informe final.
 *
 * SEGURIDAD:
 * - Un ajuste HORAS no se aplica si el período cerrado no tiene
 *   una base numérica en P.
 * - I:M nunca se modifican.
 * ============================================================
 */

function sincronizarAjustesHorasV1() {

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {

    const analisis =
      analizarAjustesCAV1_();

    const db =
      SpreadsheetApp.openById(
        CAV1_DB_ID
      );

    const variables =
      exigirHojaCAV1_(
        db,
        'Variables_Internas'
      );

    const control =
      exigirHojaCAV1_(
        db,
        'Control_Periodos'
      );

    const aliases =
      construirAliasesCAV1_(
        variables
      );

    const horasPorPeriodo = {};
    const idsPorPeriodo = {};

    analisis.detalle.forEach(
      function(a) {

        if (
          a.estado !==
            'VALIDO_APROBADO' ||
          a.tipo !==
            'HORAS'
        ) {
          return;
        }

        if (
          !horasPorPeriodo[
            a.clavePeriodo
          ]
        ) {
          horasPorPeriodo[
            a.clavePeriodo
          ] = 0;

          idsPorPeriodo[
            a.clavePeriodo
          ] = [];
        }

        horasPorPeriodo[
          a.clavePeriodo
        ] +=
          a.horas;

        idsPorPeriodo[
          a.clavePeriodo
        ].push(
          a.id
        );
      }
    );

    let periodosActualizados = 0;
    let periodosBloqueados = 0;
    const bloqueos = [];

    if (
      control.getLastRow() > 1
    ) {

      const datos =
        control
          .getRange(
            2,
            1,
            control.getLastRow() - 1,
            16
          )
          .getValues();

      datos.forEach(
        function(row, i) {

          if (
            normalCAV1_(
              row[6]
            ) !==
              'cerrado'
          ) {
            return;
          }

          const correo =
            correoCAV1_(
              row[0]
            );

          const canon =
            aliases[correo] ||
            correo;

          const periodo =
            String(
              row[3] || ''
            )
              .trim()
              .toUpperCase();

          const clave =
            canon +
            '|' +
            periodo;

          const nuevoO =
            redondearCAV1_(
              horasPorPeriodo[
                clave
              ] || 0
            );

          const rawO =
            row[14];

          const rawP =
            row[15];

          const actualOInfo =
            numeroOpcionalCAV1_(
              rawO
            );

          const pVacia =
            rawP === '' ||
            rawP === null;

          const actualPInfo =
            numeroOpcionalCAV1_(
              rawP
            );

          /*
           * Si P está vacío no existe una base reconocida
           * sobre la cual aplicar un ajuste de horas.
           * Evidencias posteriores sí pueden existir porque
           * no necesitan modificar P.
           */
          if (pVacia) {

            if (nuevoO !== 0) {
              periodosBloqueados++;

              bloqueos.push({
                filaControl:
                  i + 2,
                nombre:
                  row[1],
                periodo:
                  periodo,
                motivo:
                  'PERIODO_SIN_BASE_HORAS_FINALES'
              });
            }

            return;
          }

          if (
            !actualOInfo.valido ||
            !actualPInfo.valido
          ) {
            periodosBloqueados++;

            bloqueos.push({
              filaControl:
                i + 2,
              nombre:
                row[1],
              periodo:
                periodo,
              motivo:
                'O_O_P_NO_NUMERICO'
            });

            return;
          }

          const actualO =
            actualOInfo.valor;

          const actualP =
            actualPInfo.valor;

          const baseOriginal =
            redondearCAV1_(
              actualP -
              actualO
            );

          const nuevoP =
            redondearCAV1_(
              baseOriginal +
              nuevoO
            );

          if (nuevoP < 0) {
            periodosBloqueados++;

            bloqueos.push({
              filaControl:
                i + 2,
              nombre:
                row[1],
              periodo:
                periodo,
              motivo:
                'HORAS_FINALES_NEGATIVAS'
            });

            return;
          }

          /*
           * No escribimos si no cambió nada.
           * Esto evita tocar períodos cerrados innecesariamente.
           */
          if (
            redondearCAV1_(
              actualO
            ) ===
              nuevoO &&
            redondearCAV1_(
              actualP
            ) ===
              nuevoP
          ) {
            return;
          }

          control
            .getRange(
              i + 2,
              15
            )
            .setValue(
              nuevoO
            )
            .setNote(
              nuevoO === 0
                ? 'Sin ajustes de horas posteriores vigentes.'
                : (
                    'Suma de ajustes HORAS aprobados en Ajustes_Horas. IDs: ' +
                    (
                      idsPorPeriodo[
                        clave
                      ] || []
                    ).join(', ')
                  )
            );

          control
            .getRange(
              i + 2,
              16
            )
            .setValue(
              nuevoP
            )
            .setNote(
              'Horas finales vigentes = horas reconocidas al cierre + ajustes posteriores de horas. ' +
              'I:M permanecen como snapshot histórico.'
            );

          periodosActualizados++;
        }
      );
    }

    SpreadsheetApp.flush();

    const salida = {
      ajustesLeidos:
        analisis.resumen.filasAjustes,
      ajustesValidosAprobados:
        analisis.resumen.validosAprobados,
      ajustesHoras:
        analisis.resumen.tipoHoras,
      ajustesEvidencia:
        analisis.resumen.tipoEvidencia,
      periodosActualizados:
        periodosActualizados,
      periodosBloqueados:
        periodosBloqueados,
      bloqueos:
        bloqueos,
      escritura: true,
      snapshotsIM:
        'NO MODIFICADOS',
      estado:
        periodosBloqueados
          ? 'REVISAR'
          : 'OK'
    };

    console.log(
      '=== SINCRONIZACIÓN AJUSTES HORAS V1 ==='
    );
    console.log(salida);
    Logger.log(JSON.stringify(salida));

    return salida;

  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
 * DIAGNÓSTICO INTERNO DEL CIERRE
 * ============================================================
 */

function construirDiagnosticoCierreCAV1_() {
  const db =
    SpreadsheetApp.openById(
      CAV1_DB_ID
    );

  const variables =
    exigirHojaCAV1_(
      db,
      'Variables_Internas'
    );

  const planner =
    exigirHojaCAV1_(
      db,
      'Registro_Planner'
    );

  const asistencia =
    exigirHojaCAV1_(
      db,
      'Asistencia_Procesada'
    );

  const control =
    exigirHojaCAV1_(
      db,
      'Control_Periodos'
    );

  const aliases =
    construirAliasesCAV1_(
      variables
    );

  const plannerMap =
    resumirPlannerCAV1_(
      planner,
      aliases
    );

  const asistenciaMap =
    leerAsistenciaCAV1_(
      asistencia,
      aliases
    );

  const detalle = [];

  if (
    control.getLastRow() <= 1
  ) {
    return {
      resumen: {
        pendientes: 0,
        cerrables: 0,
        revisar: 0,
        intermediosCierreAutomatico: 0,
        intermediosConExcepcion: 0,
        finalesRevisionHumana: 0,
        escritura: false
      },
      detalle: []
    };
  }

  const rows =
    control
      .getRange(
        2,
        1,
        control.getLastRow() - 1,
        16
      )
      .getValues();

  /*
   * Se identifica el último período FORMAL de cada persona usando
   * únicamente BASE/EXTENSION. EXTRA_HISTORICO nunca convierte un
   * período en "final" para revisión administrativa.
   */
  const finalFormalPorCorreo = {};

  rows.forEach(
    function(row, i) {
      const correo =
        correoCAV1_(
          row[0]
        );

      const canon =
        aliases[correo] ||
        correo;

      const tipo =
        normalCAV1_(
          row[2]
        );

      if (
        tipo !== 'base' &&
        tipo !== 'extension'
      ) {
        return;
      }

      const periodo =
        String(
          row[3] || ''
        )
          .trim()
          .toUpperCase();

      const fin =
        fechaCAV1_(
          row[5]
        );

      const clave =
        CAV2_clavePeriodo_(
          canon,
          row[2],
          periodo
        );

      if (!clave || !canon) {
        return;
      }

      const actual =
        finalFormalPorCorreo[
          canon
        ] || null;

      const candidato = {
        clave: clave,
        fechaFin: fin,
        fila: i + 2
      };

      if (!actual) {
        finalFormalPorCorreo[canon] =
          candidato;
        return;
      }

      const tiempoActual =
        actual.fechaFin
          ? actual.fechaFin.getTime()
          : -Infinity;

      const tiempoNuevo =
        fin
          ? fin.getTime()
          : -Infinity;

      if (
        tiempoNuevo > tiempoActual ||
        (
          tiempoNuevo === tiempoActual &&
          candidato.fila > actual.fila
        )
      ) {
        finalFormalPorCorreo[canon] =
          candidato;
      }
    }
  );

  rows.forEach(
    function(row, i) {
      if (
        normalCAV1_(
          row[6]
        ) !==
          'pendiente cierre'
      ) {
        return;
      }

      const correo =
        correoCAV1_(
          row[0]
        );

      const canon =
        aliases[correo] ||
        correo;

      const tipoTexto =
        String(
          row[2] || ''
        )
          .trim()
          .toUpperCase();

      const periodo =
        String(
          row[3] || ''
        )
          .trim()
          .toUpperCase();

      const inicio =
        fechaCAV1_(
          row[4]
        );

      const fin =
        fechaCAV1_(
          row[5]
        );

      const clavePlanner =
        canon +
        '|' +
        periodo;

      const claveFormal =
        CAV2_clavePeriodo_(
          canon,
          tipoTexto,
          periodo
        );

      const finalFormal =
        finalFormalPorCorreo[
          canon
        ] || null;

      const esTipoFormal =
        (
          normalCAV1_(tipoTexto) === 'base' ||
          normalCAV1_(tipoTexto) === 'extension'
        );

      const esFinalFormal =
        Boolean(
          esTipoFormal &&
          finalFormal &&
          finalFormal.clave ===
            claveFormal
        );

      const plan =
        plannerMap[clavePlanner] || {
          filas: 0,
          planner: 0,
          evidencia: 0
        };

      const aRows =
        asistenciaMap[canon] || [];

      let horasAsistencia = 0;
      let dentro = 0;
      let fuera = 0;
      let completas = 0;
      let incompletas = 0;
      let conHorario = 0;

      aRows.forEach(
        function(a) {
          if (
            !inicio ||
            !fin ||
            !a.fecha ||
            a.fecha < inicio ||
            a.fecha > fin
          ) {
            return;
          }

          if (a.completa) {
            completas++;
            horasAsistencia +=
              a.duracion;

            if (
              a.clasificacionHorario
            ) {
              conHorario++;
              dentro += a.dentro;
              fuera += a.fuera;
            }
          } else {
            incompletas++;
          }
        }
      );

      const extras =
        numeroOpcionalCAV1_(
          row[13]
        );

      const ajustesPrevios =
        numeroOpcionalCAV1_(
          row[14]
        );

      const bloqueos = [];
      const alertas = [];

      if (!inicio || !fin) {
        bloqueos.push(
          'FECHAS_INVALIDAS'
        );
      }

      if (
        !extras.valido ||
        extras.valor < 0
      ) {
        bloqueos.push(
          'HORAS_ADICIONALES_INVALIDAS'
        );
      }

      if (
        ajustesPrevios.valido &&
        ajustesPrevios.valor !== 0
      ) {
        bloqueos.push(
          'AJUSTE_EN_PERIODO_NO_CERRADO'
        );
      }

      if (
        plan.planner <= 0 &&
        (
          !extras.valido ||
          extras.valor <= 0
        )
      ) {
        bloqueos.push(
          'SIN_HORAS_RECONOCIBLES'
        );
      }

      if (
        plan.evidencia <
        plan.planner
      ) {
        alertas.push(
          'EVIDENCIA_PARCIAL'
        );
      }

      if (
        incompletas > 0
      ) {
        alertas.push(
          'ASISTENCIA_INCOMPLETA_PRESENTE'
        );
      }

      if (
        completas > 0 &&
        conHorario < completas
      ) {
        alertas.push(
          'ASISTENCIA_SIN_CLASIFICACION_HORARIA_COMPLETA'
        );
      }

      const horasPlanner =
        redondearCAV1_(
          plan.planner
        );

      const horasExtra =
        extras.valido
          ? extras.valor
          : 0;

      const accion =
        bloqueos.length
          ? 'REVISAR'
          : 'CERRABLE';

      const tratamiento =
        esFinalFormal
          ? 'REVISION_FINAL'
          : (
              bloqueos.length
                ? 'REVISION_EXCEPCION'
                : 'CIERRE_AUTOMATICO'
            );

      detalle.push({
        fila: i + 2,
        correo: correo,
        nombre: row[1],
        tipo: tipoTexto,
        periodo: periodo,
        estado: row[6],
        esFinalFormal: esFinalFormal,
        tratamiento: tratamiento,
        snapshot: {
          horasPlanner:
            horasPlanner,
          horasEvidencia:
            redondearCAV1_(
              plan.evidencia
            ),
          horasAsistencia:
            redondearCAV1_(
              horasAsistencia
            ),
          horasDentroHorario:
            redondearCAV1_(
              dentro
            ),
          horasFueraHorario:
            redondearCAV1_(
              fuera
            )
        },
        horasAdicionalesAprobadas:
          redondearCAV1_(
            horasExtra
          ),
        horasFinalesPropuestas:
          redondearCAV1_(
            horasPlanner +
            horasExtra
          ),
        trazabilidad: {
          actividadesPlannerElegibles:
            plan.filas,
          sesionesAsistenciaCompletas:
            completas,
          sesionesAsistenciaIncompletas:
            incompletas,
          sesionesConClasificacionHorario:
            conHorario
        },
        alertas: alertas,
        bloqueos: bloqueos,
        accion: accion
      });
    }
  );

  return {
    resumen: {
      pendientes:
        detalle.length,
      cerrables:
        detalle.filter(
          function(x) {
            return x.accion === 'CERRABLE';
          }
        ).length,
      revisar:
        detalle.filter(
          function(x) {
            return x.accion === 'REVISAR';
          }
        ).length,
      intermediosCierreAutomatico:
        detalle.filter(
          function(x) {
            return x.tratamiento === 'CIERRE_AUTOMATICO';
          }
        ).length,
      intermediosConExcepcion:
        detalle.filter(
          function(x) {
            return x.tratamiento === 'REVISION_EXCEPCION';
          }
        ).length,
      finalesRevisionHumana:
        detalle.filter(
          function(x) {
            return x.tratamiento === 'REVISION_FINAL';
          }
        ).length,
      escritura:
        false
    },
    detalle: detalle
  };
}


/* ============================================================
 * PLANNER
 * ============================================================
 */

function resumirPlannerCAV1_(
  hoja,
  aliases
) {

  const salida = {};

  if (
    hoja.getLastRow() <= 1
  ) {
    return salida;
  }

  const h =
    mapaHeadersCAV1_(
      hoja
    );

  const iCorreo =
    indiceCAV1_(
      h,
      ['correo oficial']
    );

  const iPeriodo =
    indiceCAV1_(
      h,
      ['periodo']
    );

  const iCuenta =
    indiceCAV1_(
      h,
      [
        'cuenta actividad para compromiso'
      ]
    );

  const iEtapa =
    indiceCAV1_(
      h,
      [
        'etapa actividad'
      ]
    );

  const iCandidatas =
    indiceCAV1_(
      h,
      [
        'horas candidatas compromiso'
      ]
    );

  const iEvidencia =
    indiceCAV1_(
      h,
      [
        'horas con evidencia'
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

      if (
        normalCAV1_(
          row[iCuenta]
        ) !==
          'si'
      ) {
        return;
      }

      const etapa =
        normalCAV1_(
          row[iEtapa]
        );

      if (
        etapa !==
          'pasante' &&
        etapa !==
          'pasante_historico_sin_fechas'
      ) {
        return;
      }

      const correo =
        correoCAV1_(
          row[iCorreo]
        );

      const canon =
        aliases[correo] ||
        correo;

      const periodo =
        String(
          row[iPeriodo] || ''
        )
          .trim()
          .toUpperCase();

      if (
        !canon ||
        !periodo
      ) {
        return;
      }

      const clave =
        canon +
        '|' +
        periodo;

      if (
        !salida[clave]
      ) {
        salida[clave] = {
          filas: 0,
          planner: 0,
          evidencia: 0
        };
      }

      const horas =
        Math.max(
          numeroCAV1_(
            row[iCandidatas]
          ),
          0
        );

      const evidencia =
        Math.max(
          numeroCAV1_(
            row[iEvidencia]
          ),
          0
        );

      salida[clave].filas++;

      salida[clave].planner +=
        horas;

      salida[clave].evidencia +=
        Math.min(
          evidencia,
          horas
        );
    }
  );

  return salida;
}


/* ============================================================
 * ASISTENCIA
 * ============================================================
 */

function leerAsistenciaCAV1_(
  hoja,
  aliases
) {

  const salida = {};

  if (
    hoja.getLastRow() <= 1
  ) {
    return salida;
  }

  const h =
    mapaHeadersCAV1_(
      hoja
    );

  const iCorreo =
    indiceCAV1_(
      h,
      ['correo oficial']
    );

  const iFecha =
    indiceCAV1_(
      h,
      ['fecha']
    );

  const iDuracion =
    indiceCAV1_(
      h,
      ['duracion']
    );

  const iDentro =
    indiceCAV1_(
      h,
      ['dentro horario']
    );

  const iFuera =
    indiceCAV1_(
      h,
      ['fuera horario']
    );

  const iEstado =
    indiceCAV1_(
      h,
      ['estado']
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
        correoCAV1_(
          row[iCorreo]
        );

      const canon =
        aliases[correo] ||
        correo;

      if (!canon) {
        return;
      }

      if (
        !salida[canon]
      ) {
        salida[canon] = [];
      }

      const rawDentro =
        row[iDentro];

      const rawFuera =
        row[iFuera];

      salida[canon].push({
        fecha:
          fechaCAV1_(
            row[iFecha]
          ),
        duracion:
          Math.max(
            numeroCAV1_(
              row[iDuracion]
            ),
            0
          ),
        completa:
          normalCAV1_(
            row[iEstado]
          ).indexOf(
            'completa'
          ) === 0,
        clasificacionHorario:
          rawDentro !== '' ||
          rawFuera !== '',
        dentro:
          Math.max(
            numeroCAV1_(
              rawDentro
            ),
            0
          ),
        fuera:
          Math.max(
            numeroCAV1_(
              rawFuera
            ),
            0
          )
      });
    }
  );

  return salida;
}


/* ============================================================
 * ANALIZAR AJUSTES
 * ============================================================
 */

function analizarAjustesCAV1_() {

  const db =
    SpreadsheetApp.openById(
      CAV1_DB_ID
    );

  const ajustes =
    exigirHojaCAV1_(
      db,
      'Ajustes_Horas'
    );

  const variables =
    exigirHojaCAV1_(
      db,
      'Variables_Internas'
    );

  const control =
    exigirHojaCAV1_(
      db,
      'Control_Periodos'
    );

  validarHeadersAjustesCAV1_(
    ajustes
  );

  const aliases =
    construirAliasesCAV1_(
      variables
    );

  const periodos = {};

  if (
    control.getLastRow() > 1
  ) {

    const datosControl =
      control
        .getRange(
          2,
          1,
          control.getLastRow() - 1,
          16
        )
        .getValues();

    datosControl.forEach(
      function(row, i) {

        const correo =
          correoCAV1_(
            row[0]
          );

        const canon =
          aliases[correo] ||
          correo;

        const periodo =
          String(
            row[3] || ''
          )
            .trim()
            .toUpperCase();

        if (
          !canon ||
          !periodo
        ) {
          return;
        }

        const rawP =
          row[15];

        periodos[
          canon +
          '|' +
          periodo
        ] = {
          fila:
            i + 2,
          estado:
            normalCAV1_(
              row[6]
            ),
          nombre:
            row[1],
          horasFinalesVacias:
            rawP === '' ||
            rawP === null,
          horasFinalesInfo:
            numeroOpcionalCAV1_(
              rawP
            )
        };
      }
    );
  }

  const filasAjustes = [];

  if (
    ajustes.getLastRow() > 1
  ) {

    const datos =
      ajustes
        .getRange(
          2,
          1,
          ajustes.getLastRow() - 1,
          10
        )
        .getValues();

    datos.forEach(
      function(row, i) {

        const completamenteVacia =
          row.every(
            function(x) {
              return (
                x === '' ||
                x === null
              );
            }
          );

        if (!completamenteVacia) {
          filasAjustes.push({
            fila:
              i + 2,
            row:
              row
          });
        }
      }
    );
  }

  const conteoIds = {};

  filasAjustes.forEach(
    function(item) {

      const id =
        String(
          item.row[0] || ''
        ).trim();

      if (!id) {
        return;
      }

      conteoIds[id] =
        (
          conteoIds[id] ||
          0
        ) + 1;
    }
  );

  const detalle = [];

  filasAjustes.forEach(
    function(item) {

      const row =
        item.row;

      const fila =
        item.fila;

      const id =
        String(
          row[0] || ''
        ).trim();

      const correo =
        correoCAV1_(
          row[1]
        );

      const canon =
        aliases[correo] ||
        correo;

      const periodo =
        String(
          row[3] || ''
        )
          .trim()
          .toUpperCase();

      const tipo =
        String(
          row[5] || ''
        )
          .trim()
          .toUpperCase();

      const horasInfo =
        numeroOpcionalCAV1_(
          row[6]
        );

      const horas =
        horasInfo.valor;

      const motivo =
        String(
          row[7] || ''
        ).trim();

      const evidencia =
        String(
          row[8] || ''
        ).trim();

      const aprobadoPor =
        String(
          row[9] || ''
        ).trim();

      const clave =
        canon +
        '|' +
        periodo;

      const p =
        periodos[clave];

      const errores = [];

      if (!id) {
        errores.push(
          'SIN_ID'
        );

      } else if (
        conteoIds[id] > 1
      ) {
        errores.push(
          'ID_DUPLICADO'
        );
      }

      if (!canon) {
        errores.push(
          'SIN_CORREO'
        );
      }

      if (!periodo) {
        errores.push(
          'SIN_PERIODO'
        );
      }

      if (!p) {
        errores.push(
          'PERIODO_NO_ENCONTRADO'
        );

      } else if (
        p.estado !==
          'cerrado'
      ) {
        errores.push(
          'PERIODO_NO_CERRADO'
        );
      }

      if (
        !fechaCAV1_(
          row[4]
        )
      ) {
        errores.push(
          'FECHA_AJUSTE_INVALIDA'
        );
      }

      if (
        tipo !== 'HORAS' &&
        tipo !== 'EVIDENCIA'
      ) {
        errores.push(
          'TIPO_INVALIDO'
        );
      }

      if (!motivo) {
        errores.push(
          'SIN_MOTIVO'
        );
      }

      if (
        !horasInfo.valido
      ) {
        errores.push(
          'HORAS_INVALIDAS'
        );
      }

      if (
        tipo === 'HORAS'
      ) {

        if (
          horas === 0
        ) {
          errores.push(
            'AJUSTE_HORAS_EN_CERO'
          );
        }

        if (
          horas > 0 &&
          !evidencia
        ) {
          errores.push(
            'HORAS_POSITIVAS_SIN_EVIDENCIA'
          );
        }

        if (
          p &&
          p.horasFinalesVacias
        ) {
          errores.push(
            'PERIODO_SIN_BASE_HORAS_FINALES'
          );
        }
      }

      if (
        tipo === 'EVIDENCIA'
      ) {

        if (
          horas !== 0
        ) {
          errores.push(
            'EVIDENCIA_NO_DEBE_CAMBIAR_HORAS'
          );
        }

        if (!evidencia) {
          errores.push(
            'EVIDENCIA_SIN_RESPALDO'
          );
        }
      }

      let estado;

      if (
        errores.length
      ) {
        estado =
          'REVISAR';

      } else if (
        !aprobadoPor
      ) {
        estado =
          'PENDIENTE_APROBACION';

      } else {
        estado =
          'VALIDO_APROBADO';
      }

      detalle.push({
        fila:
          fila,
        id:
          id,
        correo:
          correo,
        nombre:
          row[2],
        periodo:
          periodo,
        tipo:
          tipo,
        horas:
          redondearCAV1_(
            horas
          ),
        evidencia:
          evidencia
            ? 'SÍ'
            : 'NO',
        aprobadoPor:
          aprobadoPor,
        clavePeriodo:
          clave,
        filaControl:
          p
            ? p.fila
            : null,
        errores:
          errores,
        estado:
          estado
      });
    }
  );

  return {
    resumen: {
      filasAjustes:
        detalle.length,
      validosAprobados:
        detalle.filter(
          function(x) {
            return (
              x.estado ===
              'VALIDO_APROBADO'
            );
          }
        ).length,
      pendientesAprobacion:
        detalle.filter(
          function(x) {
            return (
              x.estado ===
              'PENDIENTE_APROBACION'
            );
          }
        ).length,
      revisar:
        detalle.filter(
          function(x) {
            return (
              x.estado ===
              'REVISAR'
            );
          }
        ).length,
      tipoHoras:
        detalle.filter(
          function(x) {
            return (
              x.estado ===
                'VALIDO_APROBADO' &&
              x.tipo ===
                'HORAS'
            );
          }
        ).length,
      tipoEvidencia:
        detalle.filter(
          function(x) {
            return (
              x.estado ===
                'VALIDO_APROBADO' &&
              x.tipo ===
                'EVIDENCIA'
            );
          }
        ).length,
      escritura:
        false
    },
    detalle:
      detalle
  };
}


/* ============================================================
 * IDENTIDAD
 * ============================================================
 */

function construirAliasesCAV1_(
  hoja
) {

  const salida = {};

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
        2
      )
      .getDisplayValues();

  datos.forEach(
    function(row) {

      const a =
        correoCAV1_(
          row[0]
        );

      const b =
        correoCAV1_(
          row[1]
        );

      if (!a) {
        return;
      }

      salida[a] = a;

      if (b) {
        salida[b] = a;
      }
    }
  );

  return salida;
}


/* ============================================================
 * HEADERS
 * ============================================================
 */

function mapaHeadersCAV1_(
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
    function(v, i) {

      const k =
        normalCAV1_(v);

      if (
        k &&
        !Object.prototype
          .hasOwnProperty.call(
            mapa,
            k
          )
      ) {
        mapa[k] = i;
      }
    }
  );

  return mapa;
}


function indiceCAV1_(
  mapa,
  opciones
) {

  for (
    let i = 0;
    i < opciones.length;
    i++
  ) {

    const k =
      normalCAV1_(
        opciones[i]
      );

    if (
      Object.prototype
        .hasOwnProperty.call(
          mapa,
          k
        )
    ) {
      return mapa[k];
    }
  }

  throw new Error(
    'No se encontró encabezado: ' +
    opciones.join(' / ')
  );
}


function validarHeadersAjustesCAV1_(
  hoja
) {

  if (
    hoja.getLastColumn() <
    CAV1_HEADERS_AJUSTES.length
  ) {
    throw new Error(
      'Ajustes_Horas tiene menos de 10 columnas. ' +
      'Ejecuta prepararCierreYAjustesV1().'
    );
  }

  const actual =
    hoja
      .getRange(
        1,
        1,
        1,
        CAV1_HEADERS_AJUSTES.length
      )
      .getDisplayValues()[0];

  CAV1_HEADERS_AJUSTES.forEach(
    function(esperado, i) {

      if (
        normalCAV1_(
          actual[i]
        ) !==
        normalCAV1_(
          esperado
        )
      ) {
        throw new Error(
          'Ajustes_Horas no está preparada. ' +
          'Ejecuta prepararCierreYAjustesV1().'
        );
      }
    }
  );
}


/* ============================================================
 * HELPERS
 * ============================================================
 */

function exigirHojaCAV1_(
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


function normalCAV1_(
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


function correoCAV1_(
  valor
) {

  return String(
    valor || ''
  )
    .trim()
    .toLowerCase();
}


function numeroCAV1_(
  valor
) {

  if (
    valor === '' ||
    valor === null ||
    valor === undefined
  ) {
    return 0;
  }

  const n =
    Number(
      String(valor)
        .trim()
        .replace(',', '.')
    );

  return isNaN(n)
    ? 0
    : n;
}


function numeroOpcionalCAV1_(
  valor
) {

  if (
    valor === '' ||
    valor === null ||
    valor === undefined
  ) {
    return {
      valido: true,
      valor: 0
    };
  }

  const n =
    Number(
      String(valor)
        .trim()
        .replace(',', '.')
    );

  return {
    valido:
      !isNaN(n),
    valor:
      isNaN(n)
        ? 0
        : n
  };
}


function fechaCAV1_(
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

  const texto =
    String(
      valor || ''
    ).trim();

  if (!texto) {
    return null;
  }

  let m =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (m) {
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3])
    );
  }

  m =
    texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  if (m) {
    return new Date(
      Number(m[3]),
      Number(m[2]) - 1,
      Number(m[1])
    );
  }

  return null;
}


function redondearCAV1_(
  valor
) {

  return (
    Math.round(
      Number(
        valor || 0
      ) *
      100
    ) /
    100
  );
}

