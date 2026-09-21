/**
 * ============================================================
 * ATTENDANCE PROCESSING — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * OBJETIVO
 * Convertir la fuente cruda de asistencia en una tabla operativa
 * Asistencia_Procesada, sin modificar nunca la fuente original.
 *
 * REGLAS PRINCIPALES
 * - Identidad: SOLO coincidencia exacta CI fuente -> BM Variables_Internas.
 * - CI no encontrado: se ignora para la base de pasantes.
 * - Solo se conservan marcaciones atribuibles a la etapa de PASANTÍA.
 * - Si K=Retirado y faltan fechas administrativas antiguas, se conserva
 *   la marcación real con advertencia de ETAPA NO DELIMITADA. No se
 *   inventan fechas. Si existe transición a ASISTENTE, se excluye desde
 *   esa transición para no mezclar trabajo contratado con pasantía.
 * - Entrada -> Salida = sesión completa.
 * - Se permiten varias sesiones por día (p. ej. salida/entrada por almuerzo).
 * - NO se descuenta automáticamente 13:00-14:00.
 * - Si no hay pausa marcada, se cuenta el intervalo continuo.
 * - Entrada sin salida / salida sin entrada: se conserva como INCOMPLETA.
 * - Nunca se inventa una hora faltante.
 * - Entrada repetida antes de una salida: se conserva la primera entrada,
 *   se cuenta hasta la salida y se deja trazabilidad para revisión.
 * - Dentro/fuera de horario es informativo: NO invalida horas.
 * - Las marcaciones incompletas se conservan para revisión y nunca se
 *   convierten automáticamente en horas válidas.
 *
 * FUENTE CRUDA (SOLO LECTURA)
 * Spreadsheet: YOUR_ATTENDANCE_SOURCE_SPREADSHEET_ID
 * Hoja: base_diaria
 * A ID | B USUARIO(CI) | C FECHA | D ETIQUETA | E UBICACION |
 * F FOTO(no se lee) | G OBSERVACION
 *
 * DESTINO
 * Spreadsheet DB: YOUR_DB_SPREADSHEET_ID
 * Hoja: Asistencia_Procesada A:O
 *
 * VALIDACIÓN RECOMENDADA
 * 1) prepararAsistenciaProcesadaV1()
 * 2) diagnosticarAsistenciaProcesadaV1()
 * 3) sincronizarAsistenciaProcesadaV1()
 * 4) Revisar visualmente la hoja.
 * ============================================================
 */

const APV1_SRC_ID =
  'YOUR_ATTENDANCE_SOURCE_SPREADSHEET_ID';

const APV1_SRC_HOJA =
  'base_diaria';

const APV1_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const APV1_HOJA_DESTINO =
  'Asistencia_Procesada';

const APV1_HOJA_VARIABLES =
  'Variables_Internas';

const APV1_HOJA_CONTROL =
  'Control_horarios';

const APV1_HOJA_ROLES =
  'Historial_Roles';



/* ============================================================
 * FUNCIONES PÚBLICAS
 * ============================================================
 */

function prepararAsistenciaProcesadaV1() {
  const db =
    SpreadsheetApp.openById(
      APV1_DB_ID
    );

  let hoja =
    db.getSheetByName(
      APV1_HOJA_DESTINO
    );

  if (!hoja) {
    hoja =
      db.insertSheet(
        APV1_HOJA_DESTINO
      );
  }

  const headers =
    headersAPV1_();

  if (
    hoja.getMaxColumns() <
      headers.length
  ) {
    hoja.insertColumnsAfter(
      hoja.getMaxColumns(),
      headers.length -
        hoja.getMaxColumns()
    );
  }

  const actual =
    hoja
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .getDisplayValues()[0];

  const filaVacia =
    actual.every(
      function(x) {
        return !limpiarAPV1_(x);
      }
    );

  if (!filaVacia) {
    validarHeadersDestinoAPV1_(
      actual
    );
  }

  /*
   * Normalizamos SOLO los nombres de cabecera a la versión
   * canónica y autoexplicativa. No mueve columnas ni datos.
   */
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

  formatearDestinoAPV1_(
    hoja
  );

  const salida = {
    hoja:
      APV1_HOJA_DESTINO,
    columnas:
      headers.length,
    modificaFuente:
      false,
    modificaVariablesInternas:
      false,
    modificaControlHorarios:
      false
  };

  console.log(
    '=== PREPARAR ASISTENCIA PROCESADA V1 ==='
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


function diagnosticarAsistenciaProcesadaV1() {
  return ejecutarAsistenciaProcesadaV1_(
    false
  );
}


function sincronizarAsistenciaProcesadaV1() {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    return ejecutarAsistenciaProcesadaV1_(
      true
    );
  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
 * MOTOR PRINCIPAL
 * ============================================================
 */

function ejecutarAsistenciaProcesadaV1_(
  escribir
) {
  const srcSS =
    SpreadsheetApp.openById(
      APV1_SRC_ID
    );

  const src =
    srcSS.getSheetByName(
      APV1_SRC_HOJA
    );

  if (!src) {
    throw new Error(
      'No existe la hoja fuente ' +
      APV1_SRC_HOJA +
      '.'
    );
  }

  validarFuenteAPV1_(
    src
  );

  const db =
    SpreadsheetApp.openById(
      APV1_DB_ID
    );

  const destino =
    db.getSheetByName(
      APV1_HOJA_DESTINO
    );

  const variables =
    db.getSheetByName(
      APV1_HOJA_VARIABLES
    );

  const control =
    db.getSheetByName(
      APV1_HOJA_CONTROL
    );

  const roles =
    db.getSheetByName(
      APV1_HOJA_ROLES
    );

  if (
    !destino ||
    !variables ||
    !control
  ) {
    throw new Error(
      'Falta Asistencia_Procesada, Variables_Internas o Control_horarios. Ejecuta prepararAsistenciaProcesadaV1() primero.'
    );
  }

  validarHeadersDestinoAPV1_(
    destino
      .getRange(
        1,
        1,
        1,
        15
      )
      .getDisplayValues()[0]
  );

  const zonaFuente =
    srcSS.getSpreadsheetTimeZone();

  const localeFuente =
    srcSS.getSpreadsheetLocale();

  const zonaDB =
    db.getSpreadsheetTimeZone();

  const personas =
    indexarPersonasAPV1_(
      variables,
      zonaDB
    );

  const mapaCI =
    construirMapaCIAPV1_(
      personas
    );

  const rolesIndex =
    indexarRolesAPV1_(
      roles,
      zonaDB
    );

  const horarios =
    indexarHorariosAPV1_(
      control,
      zonaDB
    );

  const marcas =
    leerFuenteAPV1_(
      src,
      zonaFuente,
      localeFuente
    );


  const procesado =
    construirSalidaAPV1_(
      marcas,
      mapaCI,
      rolesIndex,
      horarios,
      zonaFuente
    );

  procesado.resumen.escritura =
    escribir;

  procesado.resumen.modificaFuente =
    false;

  procesado.resumen.modificaVariablesInternas =
    false;

  procesado.resumen.modificaControlHorarios =
    false;

  if (escribir) {
    escribirDestinoAPV1_(
      destino,
      procesado.filas,
      zonaFuente
    );
  }

  console.log(
    escribir
      ? '=== SINCRONIZACIÓN ASISTENCIA PROCESADA ==='
      : '=== DRY RUN ASISTENCIA PROCESADA ==='
  );

  console.log(
    procesado.resumen
  );

  procesado.muestra
    .slice(
      0,
      25
    )
    .forEach(
      function(item) {
        console.log(
          '[MUESTRA ASISTENCIA]',
          item
        );
      }
    );

  Logger.log(
    JSON.stringify({
      resumen:
        procesado.resumen,
      muestra:
        procesado.muestra.slice(
          0,
          15
        )
    })
  );

  return {
    resumen:
      procesado.resumen,
    muestra:
      procesado.muestra
  };
}


/* ============================================================
 * CONSTRUIR SALIDA A:O
 * ============================================================
 */

function construirSalidaAPV1_(
  marcas,
  mapaCI,
  roles,
  horarios,
  zonaFuente
) {
  const resumen = {
    filasFuenteLeidas:
      marcas.length,
    marcacionesCIExacto:
      0,
    marcacionesCIIgnorado:
      0,
    ciDuplicadoEnBM:
      0,
    diasPersonaEvaluados:
      0,
    filasSalida:
      0,
    sesionesCompletas:
      0,
    filasIncompletas:
      0,
    entradasRepetidas:
      0,
    sesionesMultiplesMismoDia:
      0,
    horasCompletasTotales:
      0,
    filasConHorarioOficial:
      0,
    filasSinHorarioOficial:
      0,
    conflictosHorario:
      0,
    horasDentroHorarioInformativas:
      0,
    horasFueraHorarioInformativas:
      0,
    marcacionesFueraEtapaPasantiaIgnoradas:
      0,
    personasProcesadas:
      0
  };

  const grupos = {};
  const personasProcesadas = {};

  marcas.forEach(
    function(marca) {
      if (!marca.ci) {
        resumen.marcacionesCIIgnorado++;
        return;
      }

      const lookup =
        mapaCI[marca.ci];

      if (
        !lookup ||
        lookup.duplicado
      ) {
        resumen.marcacionesCIIgnorado++;

        if (
          lookup &&
          lookup.duplicado
        ) {
          resumen.ciDuplicadoEnBM++;
        }

        return;
      }

      const persona =
        lookup.persona;

      resumen.marcacionesCIExacto++;

      const clave =
        persona.fila +
        '|' +
        marca.fechaClave;

      if (!grupos[clave]) {
        grupos[clave] = {
          persona:
            persona,
          fechaClave:
            marca.fechaClave,
          eventos:
            []
        };
      }

      grupos[clave].eventos.push(
        marca
      );
    }
  );

  const filas = [];
  const muestra = [];

  Object.keys(
    grupos
  )
    .sort()
    .forEach(
      function(clave) {
        const grupo =
          grupos[clave];

        resumen.diasPersonaEvaluados++;

        grupo.eventos.sort(
          compararEventosAPV1_
        );

        const emparejado =
          emparejarEventosAPV1_(
            grupo
          );

        resumen.entradasRepetidas +=
          emparejado.entradasRepetidas;

        const completasEtapa = [];
        const incompletasEtapa = [];

        emparejado.sesiones.forEach(
          function(sesion) {
            const etapa =
              estaEnEtapaPasantiaAPV1_(
                grupo.persona,
                sesion.fechaClave,
                roles
              );

            if (!etapa) {
              resumen.marcacionesFueraEtapaPasantiaIgnoradas +=
                2 +
                sesion.entradasRepetidas.length;
              return;
            }

            completasEtapa.push(
              sesion
            );
          }
        );

        emparejado.incompletas.forEach(
          function(item) {
            const etapa =
              estaEnEtapaPasantiaAPV1_(
                grupo.persona,
                item.fechaClave,
                roles
              );

            if (!etapa) {
              resumen.marcacionesFueraEtapaPasantiaIgnoradas++;
              return;
            }

            incompletasEtapa.push(
              item
            );
          }
        );

        if (
          completasEtapa.length +
            incompletasEtapa.length ===
          0
        ) {
          return;
        }

        personasProcesadas[
          grupo.persona.fila
        ] = true;

        if (
          completasEtapa.length >
            1
        ) {
          resumen.sesionesMultiplesMismoDia++;
        }

        completasEtapa.forEach(
          function(sesion, indice) {
            const horario =
              horarioParaFechaAPV1_(
                grupo.persona,
                sesion.fechaClave,
                horarios
              );

            const cruce =
              cruceSesionHorarioAPV1_(
                sesion,
                horario,
                zonaFuente
              );

            const tempranoTarde =
              indice === 0
                ? calcularTempranoTardeAPV1_(
                    sesion,
                    horario,
                    zonaFuente
                  )
                : {
                    temprano: '',
                    tarde: ''
                  };

            const periodo =
              'SISTEMA ACTUAL';

            let estado =
              'COMPLETA';

            if (
              sesion.entradasRepetidas.length
            ) {
              estado =
                'COMPLETA - REVISAR ENTRADA REPETIDA';
            }

            if (
              sesion.duracionSegundos <
                60
            ) {
              estado =
                'COMPLETA - REVISAR DURACIÓN < 1 MIN';
            }

            const observacion =
              construirObservacionCompletaAPV1_(
                sesion,
                periodo,
                horario,
                grupo.persona
              );

            const fila = [
              grupo.persona.correoA,
              grupo.persona.nombre,
              grupo.persona.ci,
              fechaDateAPV1_(
                sesion.fechaClave,
                zonaFuente
              ),
              sesion.entradaTexto,
              sesion.salidaTexto,
              redondear4APV1_(
                sesion.duracionHoras
              ),
              combinarUbicacionAPV1_(
                sesion.ubicacionEntrada,
                sesion.ubicacionSalida
              ),
              horarioTextoAPV1_(
                horario
              ),
              cruce.dentro,
              cruce.fuera,
              tempranoTarde.temprano,
              tempranoTarde.tarde,
              estado,
              observacion
            ];

            filas.push(
              fila
            );

            resumen.sesionesCompletas++;
            resumen.horasCompletasTotales +=
              sesion.duracionHoras;

            if (horario.conflicto) {
              resumen.conflictosHorario++;

            } else if (
              horario.registro
            ) {
              resumen.filasConHorarioOficial++;
              resumen.horasDentroHorarioInformativas +=
                Number(
                  cruce.dentro || 0
                );
              resumen.horasFueraHorarioInformativas +=
                Number(
                  cruce.fuera || 0
                );

            } else {
              resumen.filasSinHorarioOficial++;
            }

            if (
              muestra.length <
                50
            ) {
              muestra.push({
                nombre:
                  grupo.persona.nombre,
                ci:
                  grupo.persona.ci,
                fecha:
                  sesion.fechaClave,
                entrada:
                  sesion.entradaTexto,
                salida:
                  sesion.salidaTexto,
                horas:
                  redondear4APV1_(
                    sesion.duracionHoras
                  ),
                horario:
                  horarioTextoAPV1_(
                    horario
                  ),
                estado:
                  estado
              });
            }
          }
        );

        incompletasEtapa.forEach(
          function(item) {
            const horario =
              horarioParaFechaAPV1_(
                grupo.persona,
                item.fechaClave,
                horarios
              );

            const periodo =
              'SISTEMA ACTUAL';

            let tempranoTarde = {
              temprano: '',
              tarde: ''
            };

            if (
              item.tipo ===
                'FALTA_SALIDA'
            ) {
              tempranoTarde =
                calcularTempranoTardeAPV1_(
                  {
                    entradaTexto:
                      item.entradaTexto
                  },
                  horario,
                  zonaFuente
                );
            }

            const fila = [
              grupo.persona.correoA,
              grupo.persona.nombre,
              grupo.persona.ci,
              fechaDateAPV1_(
                item.fechaClave,
                zonaFuente
              ),
              item.entradaTexto || '',
              item.salidaTexto || '',
              '',
              item.ubicacion || '',
              horarioTextoAPV1_(
                horario
              ),
              '',
              '',
              tempranoTarde.temprano,
              tempranoTarde.tarde,
              item.tipo ===
                'FALTA_SALIDA'
                ? 'INCOMPLETA - FALTA SALIDA'
                : 'INCOMPLETA - FALTA ENTRADA',
              construirObservacionIncompletaAPV1_(
                item,
                periodo,
                horario,
                grupo.persona
              )
            ];

            filas.push(
              fila
            );

            resumen.filasIncompletas++;

            if (horario.conflicto) {
              resumen.conflictosHorario++;

            } else if (
              horario.registro
            ) {
              resumen.filasConHorarioOficial++;

            } else {
              resumen.filasSinHorarioOficial++;
            }
          }
        );
      }
    );

  filas.sort(
    function(a, b) {
      const ciA =
        normalizarCIAPV1_(
          a[2]
        );

      const ciB =
        normalizarCIAPV1_(
          b[2]
        );

      if (ciA < ciB) {
        return -1;
      }

      if (ciA > ciB) {
        return 1;
      }

      const fechaA =
        a[3] instanceof Date
          ? a[3].getTime()
          : 0;

      const fechaB =
        b[3] instanceof Date
          ? b[3].getTime()
          : 0;

      if (fechaA !== fechaB) {
        return fechaA - fechaB;
      }

      return String(
        a[4] || a[5] || ''
      ).localeCompare(
        String(
          b[4] || b[5] || ''
        )
      );
    }
  );

  resumen.filasSalida =
    filas.length;

  resumen.personasProcesadas =
    Object.keys(
      personasProcesadas
    ).length;

  [
    'horasCompletasTotales',
    'horasCompletasHistoricas',
    'horasCompletasNuevoSistema',
    'horasDentroHorarioInformativas',
    'horasFueraHorarioInformativas'
  ].forEach(
    function(campo) {
      resumen[campo] =
        Math.round(
          resumen[campo] *
          100
        ) /
        100;
    }
  );

  return {
    filas:
      filas,
    resumen:
      resumen,
    muestra:
      muestra
  };
}


/* ============================================================
 * EMPAREJAMIENTO FLEXIBLE
 * ============================================================
 */

function emparejarEventosAPV1_(
  grupo
) {
  let abierta = null;
  let repetidas = [];
  let entradasRepetidas = 0;

  const sesiones = [];
  const incompletas = [];

  grupo.eventos.forEach(
    function(evento) {
      if (
        evento.etiqueta ===
          'entrada'
      ) {
        if (!abierta) {
          abierta =
            evento;
          repetidas = [];

        } else {
          entradasRepetidas++;
          repetidas.push(
            evento
          );
        }

        return;
      }

      if (
        evento.etiqueta ===
          'salida'
      ) {
        if (!abierta) {
          incompletas.push({
            tipo:
              'FALTA_ENTRADA',
            fechaClave:
              evento.fechaClave,
            entradaTexto:
              '',
            salidaTexto:
              evento.horaTexto,
            id:
              evento.id,
            ubicacion:
              evento.ubicacion,
            observacion:
              evento.observacion
          });

          return;
        }

        const ms =
          evento.fechaHora.getTime() -
          abierta.fechaHora.getTime();

        if (
          ms <= 0
        ) {
          incompletas.push({
            tipo:
              'FALTA_SALIDA',
            fechaClave:
              abierta.fechaClave,
            entradaTexto:
              abierta.horaTexto,
            salidaTexto:
              '',
            id:
              abierta.id,
            ubicacion:
              abierta.ubicacion,
            observacion:
              'Salida no posterior a la entrada; requiere revisión.'
          });

          incompletas.push({
            tipo:
              'FALTA_ENTRADA',
            fechaClave:
              evento.fechaClave,
            entradaTexto:
              '',
            salidaTexto:
              evento.horaTexto,
            id:
              evento.id,
            ubicacion:
              evento.ubicacion,
            observacion:
              'Salida no posterior a la entrada; requiere revisión.'
          });

        } else {
          sesiones.push({
            fechaClave:
              abierta.fechaClave,
            entrada:
              abierta.fechaHora,
            salida:
              evento.fechaHora,
            entradaTexto:
              abierta.horaTexto,
            salidaTexto:
              evento.horaTexto,
            duracionSegundos:
              ms /
              1000,
            duracionHoras:
              ms /
              3600000,
            idEntrada:
              abierta.id,
            idSalida:
              evento.id,
            ubicacionEntrada:
              abierta.ubicacion,
            ubicacionSalida:
              evento.ubicacion,
            observacionEntrada:
              abierta.observacion,
            observacionSalida:
              evento.observacion,
            entradasRepetidas:
              repetidas.slice()
          });
        }

        abierta = null;
        repetidas = [];
      }
    }
  );

  if (abierta) {
    incompletas.push({
      tipo:
        'FALTA_SALIDA',
      fechaClave:
        abierta.fechaClave,
      entradaTexto:
        abierta.horaTexto,
      salidaTexto:
        '',
      id:
        abierta.id,
      ubicacion:
        abierta.ubicacion,
      observacion:
        abierta.observacion,
      entradasRepetidas:
        repetidas.slice()
    });
  }

  return {
    sesiones:
      sesiones,
    incompletas:
      incompletas,
    entradasRepetidas:
      entradasRepetidas
  };
}


/* ============================================================
 * ETAPA PASANTE
 * ============================================================
 */

function estaEnEtapaPasantiaAPV1_(
  persona,
  fechaClave,
  roles
) {
  if (
    persona.ruta ===
      'asistente directo'
  ) {
    return false;
  }

  const estados = [
    'vigente',
    'retirado',
    'contratado',
    'terminada'
  ];

  if (
    estados.indexOf(
      persona.estado
    ) < 0
  ) {
    return false;
  }

  const inicioAsistente =
    buscarInicioAsistenteAPV1_(
      persona,
      roles
    );

  /*
   * Si existe una transición real a ASISTENTE, ninguna
   * marcación desde esa fecha se considera pasantía.
   */
  if (
    inicioAsistente &&
    fechaClave >=
      inicioAsistente
  ) {
    return false;
  }

  /*
   * VIGENTE / TERMINADA / CONTRATADO:
   * para estas etapas sí exigimos una fecha de inicio de pasantía.
   * Los nuevos pasantes deben tener AA correctamente registrada.
   */
  if (
    persona.estado !==
      'retirado' &&
    !persona.fechaInicioClave
  ) {
    return false;
  }

  if (
    persona.fechaInicioClave &&
    fechaClave <
      persona.fechaInicioClave
  ) {
    return false;
  }

  if (
    persona.estado ===
      'retirado'
  ) {
    const fin =
      persona.fechaRetiroClave ||
      persona.fechaSalidaClave;

    /*
     * Si existe cierre administrativo, respetarlo.
     */
    if (
      fin &&
      fechaClave >
        fin
    ) {
      return false;
    }

    /*
     * Si faltan AA/BP/AB en un retiro antiguo, no se inventa
     * ningún límite. La marcación exacta por CI se conserva y
     * queda explícitamente señalada como ETAPA NO DELIMITADA.
     *
     * 01/09/2026 NO interviene en esta decisión.
     */
    return true;
  }

  if (
    persona.estado ===
      'terminada'
  ) {
    return (
      !!persona.fechaSalidaClave &&
      fechaClave <=
        persona.fechaSalidaClave
    );
  }

  if (
    persona.estado ===
      'contratado'
  ) {
    /*
     * Preferimos Historial_Roles (ya excluido arriba).
     * Si no existe transición registrada, usamos fecha salida
     * de pasantía como único fallback seguro.
     */
    if (
      inicioAsistente
    ) {
      return true;
    }

    return (
      !!persona.fechaSalidaClave &&
      fechaClave <=
        persona.fechaSalidaClave
    );
  }

  /* Vigente */
  return true;
}


/* ============================================================
 * HORARIO OFICIAL / CRUCE INFORMATIVO
 * ============================================================
 */

function horarioParaFechaAPV1_(
  persona,
  fechaClave,
  horarios
) {
  const candidatos =
    horarios.filter(
      function(h) {
        const mismoCorreo =
          h.correo ===
            persona.correoA ||
          (
            persona.correoB &&
            h.correo ===
              persona.correoB
          );

        if (!mismoCorreo) {
          return false;
        }

        if (
          fechaClave <
            h.fechaInicioClave
        ) {
          return false;
        }

        if (
          h.fechaFinClave &&
          fechaClave >
            h.fechaFinClave
        ) {
          return false;
        }

        return true;
      }
    );

  if (
    candidatos.length ===
      1
  ) {
    return {
      registro:
        candidatos[0],
      conflicto:
        false,
      versiones:
        [
          candidatos[0].version
        ]
    };
  }

  if (
    candidatos.length >
      1
  ) {
    return {
      registro:
        null,
      conflicto:
        true,
      versiones:
        candidatos.map(
          function(h) {
            return h.version;
          }
        )
    };
  }

  return {
    registro:
      null,
    conflicto:
      false,
    versiones:
      []
  };
}


function cruceSesionHorarioAPV1_(
  sesion,
  horario,
  zonaFuente
) {
  if (
    horario.conflicto ||
    !horario.registro
  ) {
    return {
      dentro:
        '',
      fuera:
        ''
    };
  }

  const intervalos =
    intervalosDiaHorarioAPV1_(
      horario.registro,
      sesion.fechaClave
    );

  const ini =
    minutosDiaConSegundosAPV1_(
      sesion.entrada,
      zonaFuente
    );

  const fin =
    minutosDiaConSegundosAPV1_(
      sesion.salida,
      zonaFuente
    );

  const total =
    Math.max(
      0,
      fin - ini
    );

  let dentroMin = 0;

  intervalos.forEach(
    function(intv) {
      const a =
        Math.max(
          ini,
          intv.inicio
        );

      const b =
        Math.min(
          fin,
          intv.fin
        );

      if (b > a) {
        dentroMin +=
          b - a;
      }
    }
  );

  dentroMin =
    Math.min(
      total,
      Math.max(
        0,
        dentroMin
      )
    );

  return {
    dentro:
      redondear4APV1_(
        dentroMin /
        60
      ),
    fuera:
      redondear4APV1_(
        (
          total -
          dentroMin
        ) /
        60
      )
  };
}


function calcularTempranoTardeAPV1_(
  sesion,
  horario,
  zonaFuente
) {
  if (
    horario.conflicto ||
    !horario.registro ||
    !sesion.entradaTexto
  ) {
    return {
      temprano: '',
      tarde: ''
    };
  }

  const intervalos =
    intervalosDiaHorarioAPV1_(
      horario.registro,
      sesion.fechaClave || ''
    );

  if (!intervalos.length) {
    return {
      temprano: '',
      tarde: ''
    };
  }

  const entrada =
    horaAMinutosAPV1_(
      sesion.entradaTexto
    );

  if (entrada === null) {
    return {
      temprano: '',
      tarde: ''
    };
  }

  for (
    let i = 0;
    i < intervalos.length;
    i++
  ) {
    const intv =
      intervalos[i];

    if (
      entrada <
        intv.inicio
    ) {
      return {
        temprano:
          Math.round(
            intv.inicio -
            entrada
          ),
        tarde:
          0
      };
    }

    if (
      entrada >=
        intv.inicio &&
      entrada <=
        intv.fin
    ) {
      return {
        temprano:
          0,
        tarde:
          Math.round(
            entrada -
            intv.inicio
          )
      };
    }
  }

  /*
   * Si la primera entrada del día ocurre después de todos los
   * bloques oficiales, no imponemos una "tardanza" artificial.
   * Ya quedará reflejada como fuera de horario.
   */
  return {
    temprano: '',
    tarde: ''
  };
}


function intervalosDiaHorarioAPV1_(
  horario,
  fechaClave
) {
  const partes =
    fechaClave
      .split('-')
      .map(
        Number
      );

  if (
    partes.length !== 3 ||
    partes.some(
      function(x) {
        return !isFinite(x);
      }
    )
  ) {
    return [];
  }

  /*
   * UTC evita que la zona horaria del proyecto cambie el día
   * de la semana de una fecha calendario.
   * Domingo = 0; lunes = 1 ... sábado = 6.
   */
  const dia =
    new Date(
      Date.UTC(
        partes[0],
        partes[1] - 1,
        partes[2]
      )
    ).getUTCDay();

  if (
    dia === 0
  ) {
    return [];
  }

  const indiceDia =
    dia - 1;

  if (
    indiceDia < 0 ||
    indiceDia > 5
  ) {
    return [];
  }

  const base =
    indiceDia *
    4;

  const salida = [];

  agregarIntervaloAPV1_(
    salida,
    horario.horas[base],
    horario.horas[base + 1]
  );

  agregarIntervaloAPV1_(
    salida,
    horario.horas[base + 2],
    horario.horas[base + 3]
  );

  return salida;
}


function agregarIntervaloAPV1_(
  lista,
  entrada,
  salida
) {
  const ini =
    horaAMinutosAPV1_(
      entrada
    );

  const fin =
    horaAMinutosAPV1_(
      salida
    );

  if (
    ini === null ||
    fin === null ||
    fin <= ini
  ) {
    return;
  }

  lista.push({
    inicio:
      ini,
    fin:
      fin
  });
}


/* ============================================================
 * LEER FUENTE (NO FOTO)
 * ============================================================
 */

function leerFuenteAPV1_(
  hoja,
  zonaFuente,
  localeFuente
) {
  const lastRow =
    hoja.getLastRow();

  if (
    lastRow <= 1
  ) {
    return [];
  }

  const aE =
    hoja
      .getRange(
        2,
        1,
        lastRow - 1,
        5
      )
      .getValues();

  const g =
    hoja
      .getRange(
        2,
        7,
        lastRow - 1,
        1
      )
      .getValues();

  const salida = [];

  aE.forEach(
    function(row, index) {
      const fechaHora =
        convertirFechaAPV1_(
          row[2],
          localeFuente
        );

      if (
        !fechaValidaAPV1_(
          fechaHora
        )
      ) {
        return;
      }

      const etiqueta =
        normalizarTextoAPV1_(
          row[3]
        );

      if (
        etiqueta !==
          'entrada' &&
        etiqueta !==
          'salida'
      ) {
        return;
      }

      salida.push({
        filaFuente:
          index + 2,
        id:
          limpiarAPV1_(
            row[0]
          ),
        ci:
          normalizarCIAPV1_(
            row[1]
          ),
        fechaHora:
          fechaHora,
        fechaClave:
          Utilities.formatDate(
            fechaHora,
            zonaFuente,
            'yyyy-MM-dd'
          ),
        horaTexto:
          Utilities.formatDate(
            fechaHora,
            zonaFuente,
            'HH:mm:ss'
          ),
        etiqueta:
          etiqueta,
        ubicacion:
          limpiarAPV1_(
            row[4]
          ),
        observacion:
          limpiarAPV1_(
            g[index][0]
          )
      });
    }
  );

  return salida;
}


/* ============================================================
 * VARIABLES INTERNAS / IDENTIDAD
 * ============================================================
 */

function indexarPersonasAPV1_(
  hoja,
  zonaDB
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return [];
  }

  const columnas =
    mapearVariablesAPV15_(
      hoja
    );

  const lastCol =
    hoja.getLastColumn();

  return hoja
    .getRange(
      2,
      1,
      hoja.getLastRow() - 1,
      lastCol
    )
    .getValues()
    .map(
      function(row, index) {
        return {
          fila:
            index + 2,

          correoA:
            normalizarCorreoAPV1_(
              valorVariableAPV15_(
                row,
                columnas.correoA
              )
            ),

          correoB:
            normalizarCorreoAPV1_(
              valorVariableAPV15_(
                row,
                columnas.correoB
              )
            ),

          nombre:
            limpiarAPV1_(
              valorVariableAPV15_(
                row,
                columnas.nombre
              )
            ),

          estado:
            normalizarTextoAPV1_(
              valorVariableAPV15_(
                row,
                columnas.estado
              )
            ),

          fechaInicioClave:
            fechaClaveDesdeValorAPV1_(
              valorVariableAPV15_(
                row,
                columnas.fechaInicio
              ),
              zonaDB
            ),

          fechaSalidaClave:
            fechaClaveDesdeValorAPV1_(
              valorVariableAPV15_(
                row,
                columnas.fechaSalida
              ),
              zonaDB
            ),

          ci:
            normalizarCIAPV1_(
              valorVariableAPV15_(
                row,
                columnas.ci
              )
            ),

          fechaRetiroClave:
            fechaClaveDesdeValorAPV1_(
              valorVariableAPV15_(
                row,
                columnas.fechaRetiro
              ),
              zonaDB
            ),

          ruta:
            normalizarTextoAPV1_(
              valorVariableAPV15_(
                row,
                columnas.ruta
              )
            )
        };
      }
    )
    .filter(
      function(p) {
        return p.ci;
      }
    );
}


/**
 * VARIABLES_INTERNAS V1.5
 *
 * Lee por encabezado y no por posiciones fijas.
 * Compatible con:
 * - modelo legacy de 75 columnas;
 * - modelo V2 de 52 columnas.
 */
function mapearVariablesAPV15_(
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
    {};

  headers.forEach(
    function(header, index) {
      const clave =
        normalizarHeaderAPV15_(
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

  return {
    correoA:
      columnaVariableAPV15_(
        mapa,
        [
          'Correo oficial'
        ],
        false
      ),

    correoB:
      columnaVariableAPV15_(
        mapa,
        [
          'Correo alternativo cursos',
          'Correo Alternativo (Cursos)'
        ],
        true
      ),

    nombre:
      columnaVariableAPV15_(
        mapa,
        [
          'Nombre',
          'Nombre del Pasante'
        ],
        false
      ),

    estado:
      columnaVariableAPV15_(
        mapa,
        [
          'Estado de pasantía'
        ],
        false
      ),

    fechaInicio:
      columnaVariableAPV15_(
        mapa,
        [
          'Fecha inicio pasantía',
          'Fecha inicio (Pasantía)'
        ],
        false
      ),

    fechaSalida:
      columnaVariableAPV15_(
        mapa,
        [
          'Fecha fin pasantía',
          'Fecha salida (Pasantía)'
        ],
        false
      ),

    ci:
      columnaVariableAPV15_(
        mapa,
        [
          'CI'
        ],
        false
      ),

    fechaRetiro:
      columnaVariableAPV15_(
        mapa,
        [
          'Fecha retiro'
        ],
        true
      ),

    ruta:
      columnaVariableAPV15_(
        mapa,
        [
          'Ruta de ingreso'
        ],
        false
      )
  };
}


function columnaVariableAPV15_(
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
      normalizarHeaderAPV15_(
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
    'Variables_Internas no contiene ninguno de estos encabezados requeridos: ' +
    aliases.join(' | ')
  );
}


function valorVariableAPV15_(
  row,
  columna
) {
  return (
    columna > 0
      ? row[columna - 1]
      : ''
  );
}


function normalizarHeaderAPV15_(
  valor
) {
  return String(
    valor || ''
  )
    .normalize(
      'NFD'
    )
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      ' '
    );
}


function construirMapaCIAPV1_(
  personas
) {
  const mapa = {};

  personas.forEach(
    function(persona) {
      if (!mapa[persona.ci]) {
        mapa[persona.ci] = {
          persona:
            persona,
          duplicado:
            false
        };

      } else {
        mapa[persona.ci] = {
          persona:
            null,
          duplicado:
            true
        };
      }
    }
  );

  return mapa;
}


/* ============================================================
 * HISTORIAL DE ROLES
 * ============================================================
 */

function indexarRolesAPV1_(
  hoja,
  zonaDB
) {
  if (
    !hoja ||
    hoja.getLastRow() <= 1
  ) {
    return [];
  }

  return hoja
    .getRange(
      2,
      1,
      hoja.getLastRow() - 1,
      5
    )
    .getValues()
    .map(
      function(row) {
        return {
          correo:
            normalizarCorreoAPV1_(
              row[0]
            ),
          rol:
            normalizarTextoAPV1_(
              row[2]
            ),
          fechaInicioClave:
            fechaClaveDesdeValorAPV1_(
              row[3],
              zonaDB
            )
        };
      }
    )
    .filter(
      function(r) {
        return (
          r.correo &&
          r.rol &&
          r.fechaInicioClave
        );
      }
    );
}


function buscarInicioAsistenteAPV1_(
  persona,
  roles
) {
  const candidatos =
    roles
      .filter(
        function(r) {
          return (
            r.rol ===
              'asistente' &&
            (
              r.correo ===
                persona.correoA ||
              (
                persona.correoB &&
                r.correo ===
                  persona.correoB
              )
            )
          );
        }
      )
      .map(
        function(r) {
          return r.fechaInicioClave;
        }
      )
      .sort();

  return (
    candidatos.length
      ? candidatos[0]
      : ''
  );
}


/* ============================================================
 * CONTROL_HORARIOS
 * ============================================================
 */

function indexarHorariosAPV1_(
  hoja,
  zonaDB
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return [];
  }

  const rango =
    hoja.getRange(
      2,
      1,
      hoja.getLastRow() - 1,
      30
    );

  const valores =
    rango.getValues();

  const display =
    rango.getDisplayValues();

  return valores
    .map(
      function(row, index) {
        return {
          fila:
            index + 2,
          correo:
            normalizarCorreoAPV1_(
              row[0]
            ),
          version:
            limpiarAPV1_(
              row[2]
            ),
          fechaInicioClave:
            fechaClaveDesdeValorAPV1_(
              row[4],
              zonaDB
            ),
          fechaFinClave:
            fechaClaveDesdeValorAPV1_(
              row[5],
              zonaDB
            ),
          horas:
            display[index]
              .slice(
                6,
                30
              )
              .map(
                normalizarHoraAPV1_
              )
        };
      }
    )
    .filter(
      function(h) {
        return (
          h.correo &&
          h.fechaInicioClave
        );
      }
    );
}


/* ============================================================
 * ESCRIBIR DESTINO
 * ============================================================
 */

function escribirDestinoAPV1_(
  hoja,
  filas,
  zonaFuente
) {
  const lastRow =
    hoja.getLastRow();

  /*
   * V1.5 — BARRERA DE SEGURIDAD
   *
   * Nunca vaciar una tabla previamente poblada si el cálculo
   * devuelve cero filas. Un cambio de esquema, una fuente temporalmente
   * vacía o un problema de identidad no debe destruir el snapshot derivado
   * existente.
   */
  if (!filas.length) {
    console.warn(
      '[ASISTENCIA V1.5] Cálculo con 0 filas. Se conserva Asistencia_Procesada sin borrar datos existentes.'
    );

    return;
  }

  if (
    lastRow > 1
  ) {
    hoja
      .getRange(
        2,
        1,
        lastRow - 1,
        15
      )
      .clearContent();
  }

  const necesarias =
    filas.length +
    1;

  if (
    hoja.getMaxRows() <
      necesarias
  ) {
    hoja.insertRowsAfter(
      hoja.getMaxRows(),
      necesarias -
        hoja.getMaxRows()
    );
  }

  hoja
    .getRange(
      2,
      1,
      filas.length,
      15
    )
    .setValues(
      filas
    );

  hoja
    .getRange(
      2,
      4,
      filas.length,
      1
    )
    .setNumberFormat(
      'dd/mm/yyyy'
    );

  hoja
    .getRange(
      2,
      5,
      filas.length,
      2
    )
    .setNumberFormat(
      '@'
    );

  hoja
    .getRange(
      2,
      7,
      filas.length,
      1
    )
    .setNumberFormat(
      '0.00'
    );

  hoja
    .getRange(
      2,
      10,
      filas.length,
      2
    )
    .setNumberFormat(
      '0.00'
    );

  hoja
    .getRange(
      2,
      12,
      filas.length,
      2
    )
    .setNumberFormat(
      '0'
    );

  formatearDestinoAPV1_(
    hoja
  );
}


function formatearDestinoAPV1_(
  hoja
) {
  hoja.setFrozenRows(
    1
  );

  hoja
    .getRange(
      1,
      1,
      1,
      15
    )
    .setFontWeight(
      'bold'
    )
    .setFontColor(
      '#ffffff'
    )
    .setBackground(
      '#174777'
    )
    .setWrap(
      true
    );

  const anchos = [
    230,
    220,
    100,
    105,
    90,
    90,
    90,
    300,
    120,
    105,
    105,
    95,
    95,
    220,
    420
  ];

  anchos.forEach(
    function(ancho, index) {
      hoja.setColumnWidth(
        index + 1,
        ancho
      );
    }
  );

  hoja
    .getRange(
      1,
      1,
      Math.max(
        hoja.getLastRow(),
        2
      ),
      15
    )
    .setVerticalAlignment(
      'middle'
    );

  hoja
    .getRange(
      2,
      14,
      Math.max(
        hoja.getLastRow() - 1,
        1
      ),
      2
    )
    .setWrap(
      true
    );
}


function esRetiradoConEtapaNoDelimitadaAPV1_(
  persona
) {
  return (
    persona &&
    persona.estado ===
      'retirado' &&
    (
      !persona.fechaInicioClave ||
      (
        !persona.fechaRetiroClave &&
        !persona.fechaSalidaClave
      )
    )
  );
}


/* ============================================================
 * OBSERVACIONES AUTODOCUMENTADAS
 * ============================================================
 */

function construirObservacionCompletaAPV1_(
  sesion,
  periodo,
  horario,
  persona
) {
  const partes = [
    periodo,
    'Fuente IDs: E=' +
      sesion.idEntrada +
      ', S=' +
      sesion.idSalida
  ];

  if (
    esRetiradoConEtapaNoDelimitadaAPV1_(
      persona
    )
  ) {
    partes.push(
      'ETAPA PASANTÍA NO DELIMITADA: faltan fechas administrativas del retiro; se conserva la marcación real por CI exacto sin inventar inicio ni salida.'
    );
  }

  if (
    sesion.entradasRepetidas.length
  ) {
    partes.push(
      'Entradas repetidas ignoradas para no recortar horas: ' +
      sesion.entradasRepetidas
        .map(
          function(x) {
            return (
              x.horaTexto +
              ' (ID ' +
              x.id +
              ')'
            );
          }
        )
        .join(', ')
    );
  }

  if (
    horario.conflicto
  ) {
    partes.push(
      'CONFLICTO DE HORARIO: ' +
      horario.versiones.join(', ')
    );

  } else if (
    !horario.registro
  ) {
    partes.push(
      'Sin horario oficial disponible para esta fecha; duración conservada sin clasificar dentro/fuera.'
    );
  }

  const obs = [];

  if (
    sesion.observacionEntrada
  ) {
    obs.push(
      'Entrada: ' +
      sesion.observacionEntrada
    );
  }

  if (
    sesion.observacionSalida &&
    sesion.observacionSalida !==
      sesion.observacionEntrada
  ) {
    obs.push(
      'Salida: ' +
      sesion.observacionSalida
    );
  }

  if (obs.length) {
    partes.push(
      obs.join(' | ')
    );
  }

  return partes.join(
    ' | '
  );
}


function construirObservacionIncompletaAPV1_(
  item,
  periodo,
  horario,
  persona
) {
  const partes = [
    periodo,
    'Fuente ID=' +
      item.id,
    'Marcación incompleta: no se inventa la hora faltante.'
  ];

  if (
    esRetiradoConEtapaNoDelimitadaAPV1_(
      persona
    )
  ) {
    partes.push(
      'ETAPA PASANTÍA NO DELIMITADA: faltan fechas administrativas del retiro; se conserva la marcación real por CI exacto.'
    );
  }

  if (
    horario.conflicto
  ) {
    partes.push(
      'CONFLICTO DE HORARIO: ' +
      horario.versiones.join(', ')
    );

  } else if (
    !horario.registro
  ) {
    partes.push(
      'Sin horario oficial disponible para esta fecha.'
    );
  }

  if (item.observacion) {
    partes.push(
      item.observacion
    );
  }

  return partes.join(
    ' | '
  );
}


function combinarUbicacionAPV1_(
  entrada,
  salida
) {
  const e =
    limpiarAPV1_(
      entrada
    );

  const s =
    limpiarAPV1_(
      salida
    );

  if (
    e &&
    s &&
    e === s
  ) {
    return e;
  }

  if (
    e &&
    s
  ) {
    return (
      'Entrada: ' +
      e +
      ' | Salida: ' +
      s
    );
  }

  return e || s || '';
}


function horarioTextoAPV1_(
  horario
) {
  if (
    horario.conflicto
  ) {
    return 'CONFLICTO';
  }

  if (
    horario.registro
  ) {
    return horario.registro.version;
  }

  return 'SIN HORARIO';
}


/* ============================================================
 * VALIDACIONES
 * ============================================================
 */

function validarFuenteAPV1_(
  hoja
) {
  const esperado = [
    'id',
    'usuario',
    'fecha',
    'etiqueta',
    'ubicacion',
    'foto',
    'observacion'
  ];

  const actual =
    hoja
      .getRange(
        1,
        1,
        1,
        7
      )
      .getDisplayValues()[0]
      .map(
        normalizarTextoAPV1_
      );

  esperado.forEach(
    function(header, index) {
      if (
        actual[index] !==
          header
      ) {
        throw new Error(
          'Fuente de asistencia no coincide en columna ' +
          (index + 1) +
          '. Esperado "' +
          header +
          '", encontrado "' +
          actual[index] +
          '".'
        );
      }
    }
  );
}


function validarHeadersDestinoAPV1_(
  actual
) {
  const recibido =
    actual.map(
      normalizarTextoAPV1_
    );

  const aliasPorColumna = [
    ['correo', 'correo oficial'],
    ['nombre'],
    ['ci'],
    ['fecha'],
    ['entrada'],
    ['salida'],
    ['duracion'],
    ['ubicacion'],
    ['version horario'],
    ['dentro horario'],
    ['fuera horario'],
    ['min temprano', 'minutos temprano'],
    ['min tarde', 'minutos tarde'],
    ['estado'],
    ['observacion', 'observacion sistema']
  ];

  aliasPorColumna.forEach(
    function(alias, index) {
      if (
        alias.indexOf(
          recibido[index]
        ) < 0
      ) {
        throw new Error(
          'Asistencia_Procesada no coincide en columna ' +
          (index + 1) +
          '. Se encontró "' +
          actual[index] +
          '". Esta validación acepta: ' +
          alias.join(' / ') +
          '.'
        );
      }
    }
  );
}


function headersAPV1_() {
  return [
    'Correo oficial',
    'Nombre',
    'CI',
    'Fecha',
    'Entrada',
    'Salida',
    'Duración',
    'Ubicación',
    'Versión horario',
    'Dentro horario',
    'Fuera horario',
    'Minutos temprano',
    'Minutos tarde',
    'Estado',
    'Observación sistema'
  ];
}


/* ============================================================
 * UTILIDADES FECHA / HORA
 * ============================================================
 */

function fechaClaveDesdeValorAPV1_(
  valor,
  zona
) {
  if (
    !fechaValidaAPV1_(
      valor
    )
  ) {
    return '';
  }

  return Utilities.formatDate(
    valor,
    zona,
    'yyyy-MM-dd'
  );
}


function fechaDateAPV1_(
  fechaClave,
  zona
) {
  return Utilities.parseDate(
    fechaClave,
    zona,
    'yyyy-MM-dd'
  );
}


function convertirFechaAPV1_(
  valor,
  locale
) {
  if (
    valor instanceof Date &&
    !isNaN(
      valor.getTime()
    )
  ) {
    return valor;
  }

  const texto =
    limpiarAPV1_(
      valor
    );

  const m =
    texto.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );

  if (!m) {
    return null;
  }

  const a =
    Number(
      m[1]
    );

  const b =
    Number(
      m[2]
    );

  const y =
    Number(
      m[3]
    );

  const h =
    Number(
      m[4] || 0
    );

  const min =
    Number(
      m[5] || 0
    );

  const sec =
    Number(
      m[6] || 0
    );

  const esUS =
    normalizarTextoAPV1_(
      locale
    ).indexOf(
      'en_us'
    ) === 0;

  const dia =
    esUS
      ? b
      : a;

  const mes =
    esUS
      ? a
      : b;

  const fecha =
    new Date(
      y,
      mes - 1,
      dia,
      h,
      min,
      sec
    );

  return (
    isNaN(
      fecha.getTime()
    )
      ? null
      : fecha
  );
}


function fechaValidaAPV1_(
  valor
) {
  return (
    valor instanceof Date &&
    !isNaN(
      valor.getTime()
    )
  );
}


function minutosDiaConSegundosAPV1_(
  fecha,
  zona
) {
  const texto =
    Utilities.formatDate(
      fecha,
      zona,
      'HH:mm:ss'
    );

  const p =
    texto
      .split(':')
      .map(
        Number
      );

  return (
    p[0] * 60 +
    p[1] +
    p[2] / 60
  );
}


function normalizarHoraAPV1_(
  valor
) {
  const texto =
    limpiarAPV1_(
      valor
    );

  if (!texto) {
    return '';
  }

  const m =
    texto.match(
      /^(\d{1,2}):(\d{2})/
    );

  if (!m) {
    return '';
  }

  return (
    String(
      m[1]
    ).padStart(
      2,
      '0'
    ) +
    ':' +
    m[2]
  );
}


function horaAMinutosAPV1_(
  valor
) {
  const hora =
    normalizarHoraAPV1_(
      valor
    );

  const m =
    hora.match(
      /^(\d{2}):(\d{2})$/
    );

  if (!m) {
    return null;
  }

  const h =
    Number(
      m[1]
    );

  const min =
    Number(
      m[2]
    );

  if (
    h < 0 ||
    h > 23 ||
    min < 0 ||
    min > 59
  ) {
    return null;
  }

  return (
    h * 60 +
    min
  );
}


/* ============================================================
 * UTILIDADES GENERALES
 * ============================================================
 */

function compararEventosAPV1_(
  a,
  b
) {
  const diff =
    a.fechaHora.getTime() -
    b.fechaHora.getTime();

  if (diff !== 0) {
    return diff;
  }

  return (
    Number(
      a.id || 0
    ) -
    Number(
      b.id || 0
    )
  );
}


function redondear4APV1_(
  valor
) {
  return (
    Math.round(
      Number(valor) *
      10000
    ) /
    10000
  );
}


function limpiarAPV1_(
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


function normalizarTextoAPV1_(
  valor
) {
  return limpiarAPV1_(
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


function normalizarCorreoAPV1_(
  valor
) {
  return limpiarAPV1_(
    valor
  ).toLowerCase();
}


function normalizarCIAPV1_(
  valor
) {
  let texto =
    limpiarAPV1_(
      valor
    )
      .toUpperCase()
      .replace(
        /\s+/g,
        ''
      );

  texto =
    texto.replace(
      /\.0$/,
      ''
    );

  return texto.replace(
    /[^A-Z0-9]/g,
    ''
  );
}

