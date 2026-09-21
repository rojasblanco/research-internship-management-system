/**
 * ============================================================
 * REPORT REGISTRY — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * OBJECTIVE
 * Maintain the current 20-column Registro_Informes contract.
 * Control_Periodos remains the canonical source for closed-period
 * snapshots; this registry stores report metadata, status, links,
 * structured summaries and a data fingerprint.
 *
 * RULES
 * - Does not create Google Docs by itself.
 * - Does not modify Control_Periodos, Registro_Planner or Asistencia_Procesada.
 * - Does not invent final hours.
 * - A closed period without numeric final hours is blocked for reporting.
 * - Existing report metadata is preserved by header, not by fixed position.
 * ============================================================
 */

const RIV1_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const RIV1_HOJA_REGISTRO = 'Registro_Informes';
const RIV1_HOJA_CONTROL = 'Control_Periodos';
const RIV1_HOJA_CONFIG = 'Configuracion';

const RIV1_CONFIG_CARPETA_ID = 'CARPETA_INFORMES_ID';
const RIV1_CONFIG_CARPETA_URL = 'CARPETA_INFORMES_URL';
const RIV1_NOMBRE_CARPETA_RAIZ = 'Internship Reports';

const RIV1_HEADERS = [
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
];


/* ============================================================
 * FUNCIONES PÚBLICAS
 * ============================================================ */

function prepararInfraestructuraInformesV1() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const db = SpreadsheetApp.openById(RIV1_DB_ID);
    const config = RIV1_requerirHoja_(db, RIV1_HOJA_CONFIG);

    const hojaInfo = RIV1_prepararHojaRegistro_(db);
    const carpeta = RIV1_prepararCarpetaRaiz_(config);
    const sync = RIV1_sincronizar_(db, true);

    const salida = {
      hojaRegistro: hojaInfo,
      carpetaRaiz: {
        id: carpeta.getId(),
        nombre: carpeta.getName(),
        url: carpeta.getUrl()
      },
      sincronizacion: sync,
      estado: 'OK'
    };

    console.log('=== PREPARACIÓN INFRAESTRUCTURA INFORMES V1.1 ===');
    console.log(salida);
    Logger.log(JSON.stringify(salida));
    return salida;

  } finally {
    lock.releaseLock();
  }
}


function sincronizarRegistroInformesV1() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const db = SpreadsheetApp.openById(RIV1_DB_ID);

    RIV1_validarHojaRegistro_(
      RIV1_requerirHoja_(db, RIV1_HOJA_REGISTRO)
    );

    const salida = RIV1_sincronizar_(db, true);

    console.log('=== SINCRONIZACIÓN REGISTRO_INFORMES V1.1 ===');
    console.log(salida);
    Logger.log(JSON.stringify(salida));
    return salida;

  } finally {
    lock.releaseLock();
  }
}


function diagnosticarInfraestructuraInformesV1() {
  const db = SpreadsheetApp.openById(RIV1_DB_ID);
  const config = RIV1_requerirHoja_(db, RIV1_HOJA_CONFIG);
  const registro = db.getSheetByName(RIV1_HOJA_REGISTRO);

  const carpetaId = RIV1_leerConfig_(
    config,
    RIV1_CONFIG_CARPETA_ID
  );

  let carpetaEstado = 'NO_CONFIGURADA';
  let carpetaNombre = '';
  let carpetaUrl = '';

  if (carpetaId) {
    try {
      const carpeta = DriveApp.getFolderById(carpetaId);
      carpetaEstado = 'OK';
      carpetaNombre = carpeta.getName();
      carpetaUrl = carpeta.getUrl();
    } catch (error) {
      carpetaEstado = 'CONFIGURADA_PERO_INACCESIBLE';
    }
  }

  let sincronizacion;
  let estructuraRegistro = '';

  if (registro) {
    estructuraRegistro = RIV1_validarHojaRegistro_(registro);
    sincronizacion = RIV1_sincronizar_(db, false);
  } else {
    sincronizacion = {
      hojaRegistroExiste: false,
      escritura: false
    };
  }

  const salida = {
    hojaRegistroExiste: !!registro,
    estructuraRegistro: estructuraRegistro,
    carpeta: {
      estado: carpetaEstado,
      id: carpetaId || '',
      nombre: carpetaNombre,
      url: carpetaUrl
    },
    sincronizacion: sincronizacion,
    escritura: false,
    estado: 'OK'
  };

  console.log('=== DIAGNÓSTICO INFRAESTRUCTURA INFORMES V1.1 ===');
  console.log(salida);
  Logger.log(JSON.stringify(salida));
  return salida;
}


/* ============================================================
 * PREPARACIÓN
 * ============================================================ */

function RIV1_prepararHojaRegistro_(db) {
  let hoja = db.getSheetByName(RIV1_HOJA_REGISTRO);
  let creada = false;

  if (!hoja) {
    hoja = db.insertSheet(RIV1_HOJA_REGISTRO);
    creada = true;
  }

  const vacia =
    hoja.getLastRow() === 0 ||
    (
      hoja.getLastRow() === 1 &&
      hoja.getLastColumn() <= 1 &&
      !String(hoja.getRange(1, 1).getValue() || '').trim()
    );

  if (vacia) {
    hoja
      .getRange(1, 1, 1, RIV1_HEADERS.length)
      .setValues([RIV1_HEADERS]);
  }

  const estructura = RIV1_validarHojaRegistro_(hoja);
  const headers = RIV1_HEADERS;

  hoja.setFrozenRows(1);
  hoja
    .getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setNotes([RIV1_notasHeaders_()]);

  return {
    nombre: hoja.getName(),
    creada: creada,
    columnas: headers.length,
    estructura: estructura
  };
}


function RIV1_prepararCarpetaRaiz_(config) {
  const carpetaId = RIV1_leerConfig_(
    config,
    RIV1_CONFIG_CARPETA_ID
  );

  if (carpetaId) {
    try {
      return DriveApp.getFolderById(carpetaId);
    } catch (error) {
      throw new Error(
        'Existe ' +
        RIV1_CONFIG_CARPETA_ID +
        ' en Configuracion, pero la carpeta no es accesible. ' +
        'No se creó otra carpeta para evitar duplicados.'
      );
    }
  }

  const carpeta = DriveApp.createFolder(
    RIV1_NOMBRE_CARPETA_RAIZ
  );

  RIV1_escribirConfig_(
    config,
    RIV1_CONFIG_CARPETA_ID,
    carpeta.getId()
  );

  RIV1_escribirConfig_(
    config,
    RIV1_CONFIG_CARPETA_URL,
    carpeta.getUrl()
  );

  return carpeta;
}


/* ============================================================
 * SINCRONIZACIÓN CENTRAL
 * ============================================================ */

function RIV1_sincronizar_(db, escribir) {
  const registro = db.getSheetByName(RIV1_HOJA_REGISTRO);

  if (!registro) {
    throw new Error(
      'No existe Registro_Informes. ' +
      'Ejecuta primero prepararInfraestructuraInformesV1().'
    );
  }

  return RIV1_sincronizarEnHoja_(
    db,
    registro,
    escribir
  );
}


function RIV1_sincronizarEnHoja_(db, registro, escribir) {
  const control = RIV1_requerirHoja_(
    db,
    RIV1_HOJA_CONTROL
  );

  RIV1_validarControl_(control);

  const estructura =
    RIV1_validarHojaRegistro_(registro);

  const headersRegistro =
    RIV1_HEADERS;

  const tz =
    db.getSpreadsheetTimeZone() ||
    Session.getScriptTimeZone();

  const ahora = new Date();

  const existentes =
    RIV1_leerRegistroExistenteObjetos_(
      registro,
      headersRegistro
    );

  const datosControl =
    control.getLastRow() > 1
      ? control
          .getRange(
            2,
            1,
            control.getLastRow() - 1,
            16
          )
          .getValues()
      : [];

  const cerrados = [];
  const totalesPersona = {};

  datosControl.forEach(function(row, i) {
    if (
      RIV1_normalizar_(row[6]) !== 'cerrado'
    ) {
      return;
    }

    const correo = String(row[0] || '')
      .trim()
      .toLowerCase();

    const nombre = String(row[1] || '').trim();

    const tipo = String(row[2] || '')
      .trim()
      .toUpperCase();

    const periodo = String(row[3] || '')
      .trim()
      .toUpperCase();

    const rawP = row[15];
    const pInfo = RIV1_numeroOpcional_(rawP);

    const tieneP =
      RIV1_tieneValor_(rawP) &&
      pInfo.valido;

    if (!totalesPersona[correo]) {
      totalesPersona[correo] = {
        formal: 0,
        extra: 0
      };
    }

    if (tieneP) {
      if (tipo === 'EXTRA_HISTORICO') {
        totalesPersona[correo].extra += pInfo.valor;
      } else {
        totalesPersona[correo].formal += pInfo.valor;
      }
    }

    cerrados.push({
      filaControl: i + 2,
      row: row,
      correo: correo,
      nombre: nombre,
      tipo: tipo,
      periodo: periodo,
      tieneP: tieneP
    });
  });

  Object.keys(totalesPersona).forEach(function(correo) {
    totalesPersona[correo].formal =
      RIV1_redondear_(totalesPersona[correo].formal);

    totalesPersona[correo].extra =
      RIV1_redondear_(totalesPersona[correo].extra);
  });

  const itemsSalida = [];
  const idsVigentes = {};

  const resumen = {
    estructura: estructura,
    periodosCerrados: cerrados.length,
    listosDatos: 0,
    bloqueadosSinHorasFinales: 0,
    pendientesGeneracion: 0,
    generadosVigentes: 0,
    requierenActualizacion: 0,
    registrosNuevos: 0,
    registrosExistentesActualizados: 0,
    registrosHuerfanosConservados: 0,
    escritura: !!escribir
  };

  cerrados.forEach(function(item) {
    const row = item.row;

    const id = RIV1_idPeriodo_(
      item.correo,
      item.tipo,
      item.periodo
    );

    idsVigentes[id] = true;

    const previo = existentes[id] || null;

    const estadoDatos =
      item.tieneP
        ? 'LISTO'
        : 'INCOMPLETO_SIN_HORAS_FINALES';

    if (item.tieneP) {
      resumen.listosDatos++;
    } else {
      resumen.bloqueadosSinHorasFinales++;
    }

    const huella = RIV1_huellaPeriodo_(
      row,
      item.tipo,
      item.periodo,
      tz
    );

    const previoDocId =
      previo
        ? String(
            RIV1_getPrevio_(
              previo,
              'ID Google Doc'
            ) || ''
          ).trim()
        : '';

    const previoHuella =
      previo
        ? String(
            RIV1_getPrevio_(
              previo,
              'Huella datos'
            ) || ''
          ).trim()
        : '';

    let estadoInforme;

    if (!item.tieneP) {
      estadoInforme =
        previoDocId
          ? 'BLOQUEADO_REVISAR_DATOS'
          : 'BLOQUEADO_DATOS_INSUFICIENTES';

    } else if (!previoDocId) {
      estadoInforme = 'PENDIENTE_GENERACION';
      resumen.pendientesGeneracion++;

    } else if (previoHuella === huella) {
      estadoInforme = 'GENERADO';
      resumen.generadosVigentes++;

    } else {
      estadoInforme = 'REQUIERE_ACTUALIZACION';
      resumen.requierenActualizacion++;
    }

    const totales =
      totalesPersona[item.correo] || {
        formal: 0,
        extra: 0
      };

    const resumenCopiable =
      RIV1_construirResumenCopiable_(
        item,
        row,
        totales,
        tz
      );

    const fila =
      RIV1_construirFilaActual_(
        item,
        previo,
        estadoDatos,
        estadoInforme,
        ahora,
        resumenCopiable,
        huella
      );

    itemsSalida.push({
      row: fila,
      nombre: item.nombre,
      fechaOrden: RIV1_fechaMs_(row[4]),
      periodo: item.periodo
    });

    if (previo) {
      resumen.registrosExistentesActualizados++;
    } else {
      resumen.registrosNuevos++;
    }
  });

  /*
   * Los registros huérfanos se preservan por trazabilidad y se
   * actualizan por encabezado.
   */
  Object.keys(existentes).forEach(function(id) {
    if (idsVigentes[id]) {
      return;
    }

    const previo = existentes[id];
    const fila = previo.row.slice();
    const mapa = previo.headerMap;

    RIV1_setPorHeader_(
      fila,
      mapa,
      'Estado datos',
      'NO_ENCONTRADO_EN_CONTROL_PERIODOS'
    );

    RIV1_setPorHeader_(
      fila,
      mapa,
      'Estado informe',
      'REVISAR_REGISTRO_HUERFANO'
    );

    const obsActual =
      RIV1_getPorHeader_(
        fila,
        mapa,
        'Observacion'
      );

    RIV1_setPorHeader_(
      fila,
      mapa,
      'Observacion',
      RIV1_agregarObservacion_(
        obsActual,
        'Registro conservado por trazabilidad: ya no existe un período CERRADO equivalente en Control_Periodos.'
      )
    );

    RIV1_setPorHeader_(
      fila,
      mapa,
      'Ultima actualizacion',
      ahora
    );

    itemsSalida.push({
      row: fila,
      nombre: String(
        RIV1_getPorHeader_(
          fila,
          mapa,
          'Nombre'
        ) || ''
      ),
      fechaOrden: 0,
      periodo: String(
        RIV1_getPorHeader_(
          fila,
          mapa,
          'Periodo'
        ) || ''
      )
    });

    resumen.registrosHuerfanosConservados++;
  });

  itemsSalida.sort(RIV1_ordenarItemsRegistro_);

  const filasSalida =
    itemsSalida.map(function(x) {
      return x.row;
    });

  if (escribir) {
    const ultimaFila = registro.getLastRow();

    if (ultimaFila > 1) {
      registro
        .getRange(
          2,
          1,
          ultimaFila - 1,
          headersRegistro.length
        )
        .clearContent();
    }

    if (filasSalida.length) {
      registro
        .getRange(
          2,
          1,
          filasSalida.length,
          headersRegistro.length
        )
        .setValues(filasSalida);
    }

    SpreadsheetApp.flush();
  }

  resumen.filasRegistroPropuestas = filasSalida.length;
  resumen.columnasRegistro = headersRegistro.length;

  resumen.rango =
    filasSalida.length
      ? (
          registro.getName() +
          '!A2:' +
          RIV1_columnaLetra_(headersRegistro.length) +
          (filasSalida.length + 1)
        )
      : '';

  return resumen;
}


function RIV1_construirFilaActual_(
  item,
  previo,
  estadoDatos,
  estadoInforme,
  ahora,
  resumenCopiable,
  huella
) {
  return [
    RIV1_idPeriodo_(item.correo, item.tipo, item.periodo),
    item.correo,
    item.nombre,
    'PERIODO',
    item.tipo,
    item.periodo,
    estadoDatos,
    estadoInforme,
    RIV1_getPrevio_(previo, 'Version'),
    RIV1_getPrevio_(previo, 'Fecha generacion'),
    RIV1_getPrevio_(previo, 'ID Google Doc'),
    RIV1_getPrevio_(previo, 'URL Google Doc'),
    RIV1_getPrevio_(previo, 'ID carpeta persona'),
    RIV1_observacionPeriodo_(item, item.row),
    ahora,
    resumenCopiable,
    RIV1_getPrevio_(previo, 'Tareas principales'),
    RIV1_getPrevio_(previo, 'Habilidades destacadas'),
    RIV1_getPrevio_(previo, 'Rendimiento operativo'),
    huella
  ];
}


function RIV1_validarHojaRegistro_(hoja) {
  const columnas = hoja.getLastColumn();

  if (columnas !== RIV1_HEADERS.length) {
    throw new Error(
      'Registro_Informes debe tener exactamente ' +
      RIV1_HEADERS.length +
      ' columnas en el contrato público actual. Detectadas: ' +
      columnas + '.'
    );
  }

  const actuales = hoja
    .getRange(1, 1, 1, RIV1_HEADERS.length)
    .getDisplayValues()[0];

  if (!RIV1_headersIguales_(actuales, RIV1_HEADERS)) {
    throw new Error(
      'Registro_Informes no coincide con el contrato público actual de 20 columnas.'
    );
  }

  return 'ACTUAL_20';
}


/* ============================================================
 * LECTURA Y VALIDACIÓN
 * ============================================================ */

function RIV1_leerRegistroExistente_(hoja) {
  RIV1_validarHojaRegistro_(hoja);
  const headers = RIV1_HEADERS;
  const objetos = RIV1_leerRegistroExistenteObjetos_(hoja, headers);
  const salida = {};

  Object.keys(objetos).forEach(function(id) {
    salida[id] = objetos[id].row;
  });

  return salida;
}


function RIV1_leerRegistroExistenteObjetos_(hoja, headers) {
  const salida = {};

  if (hoja.getLastRow() <= 1) {
    return salida;
  }

  const datos = hoja
    .getRange(
      2,
      1,
      hoja.getLastRow() - 1,
      headers.length
    )
    .getValues();

  const headerMap = RIV1_mapaHeaders_(headers);

  datos.forEach(function(row) {
    const id = String(
      RIV1_getPorHeader_(
        row,
        headerMap,
        'ID informe'
      ) || ''
    ).trim();

    if (!id) {
      return;
    }

    if (salida[id]) {
      throw new Error(
        'ID duplicado en Registro_Informes: ' + id
      );
    }

    salida[id] = {
      row: row,
      headers: headers,
      headerMap: headerMap
    };
  });

  return salida;
}


function RIV1_headersIguales_(actuales, esperados) {
  if (
    !actuales ||
    !esperados ||
    actuales.length !== esperados.length
  ) {
    return false;
  }

  for (let i = 0; i < esperados.length; i++) {
    if (
      RIV1_normalizar_(actuales[i]) !==
      RIV1_normalizar_(esperados[i])
    ) {
      return false;
    }
  }

  return true;
}


function RIV1_validarControl_(hoja) {
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

  if (hoja.getLastColumn() < 16) {
    throw new Error(
      'Control_Periodos debe tener A:P.'
    );
  }

  const actuales = hoja
    .getRange(1, 1, 1, 16)
    .getDisplayValues()[0]
    .map(RIV1_normalizar_);

  esperados.forEach(function(h, i) {
    if (actuales[i] !== h) {
      throw new Error(
        'Control_Periodos columna ' +
        (i + 1) +
        ': esperado "' +
        h +
        '", encontrado "' +
        actuales[i] +
        '".'
      );
    }
  });
}


/* ============================================================
 * CONFIGURACIÓN
 * ============================================================ */

function RIV1_leerConfig_(hoja, clave) {
  if (hoja.getLastRow() < 1) {
    return '';
  }

  const datos = hoja
    .getRange(
      1,
      1,
      hoja.getLastRow(),
      Math.max(2, hoja.getLastColumn())
    )
    .getDisplayValues();

  const objetivo = RIV1_normalizar_(clave);

  for (let i = 0; i < datos.length; i++) {
    if (
      RIV1_normalizar_(datos[i][0]) === objetivo
    ) {
      return String(datos[i][1] || '').trim();
    }
  }

  return '';
}


function RIV1_escribirConfig_(hoja, clave, valor) {
  const objetivo = RIV1_normalizar_(clave);

  const lastRow = Math.max(
    hoja.getLastRow(),
    1
  );

  const datos = hoja
    .getRange(
      1,
      1,
      lastRow,
      2
    )
    .getDisplayValues();

  for (let i = 0; i < datos.length; i++) {
    if (
      RIV1_normalizar_(datos[i][0]) === objetivo
    ) {
      hoja
        .getRange(i + 1, 2)
        .setValue(valor);
      return;
    }
  }

  hoja.appendRow([
    clave,
    valor
  ]);
}


/* ============================================================
 * CONSTRUCCIÓN DE DATOS
 * ============================================================ */

function RIV1_idPeriodo_(correo, tipo, periodo) {
  return [
    'PERIODO',
    String(correo || '').trim().toLowerCase(),
    String(tipo || '').trim().toUpperCase(),
    String(periodo || '').trim().toUpperCase()
  ].join('::');
}


function RIV1_huellaPeriodo_(row, tipo, periodo, tz) {
  const piezas = [
    String(row[0] || '').trim().toLowerCase(),
    String(tipo || '').trim().toUpperCase(),
    String(periodo || '').trim().toUpperCase(),
    RIV1_textoFecha_(row[4], tz),
    RIV1_textoFecha_(row[5], tz),
    String(row[6] || '').trim(),
    RIV1_textoFecha_(row[7], tz),
    RIV1_valorHuella_(row[8]),
    RIV1_valorHuella_(row[9]),
    RIV1_valorHuella_(row[10]),
    RIV1_valorHuella_(row[11]),
    RIV1_valorHuella_(row[12]),
    RIV1_valorHuella_(row[13]),
    RIV1_valorHuella_(row[14]),
    RIV1_valorHuella_(row[15])
  ];

  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    piezas.join('|'),
    Utilities.Charset.UTF_8
  );

  return Utilities
    .base64EncodeWebSafe(bytes)
    .replace(/=+$/g, '')
    .substring(0, 24);
}


function RIV1_construirResumenCopiable_(
  item,
  row,
  totales,
  tz
) {
  const partes = [];

  partes.push(
    item.nombre +
    ' | ' +
    item.periodo +
    ' (' +
    item.tipo +
    ')'
  );

  partes.push(
    RIV1_textoFecha_(row[4], tz) +
    ' a ' +
    RIV1_textoFecha_(row[5], tz)
  );

  if (RIV1_tieneValor_(row[15])) {
    partes.push(
      RIV1_redondear_(
        Number(
          String(row[15]).replace(',', '.')
        )
      ) +
      ' h reconocidas'
    );
  } else {
    partes.push(
      'horas finales no disponibles'
    );
  }

  partes.push(
    'Total formal acumulado: ' +
    RIV1_redondear_(totales.formal) +
    ' h'
  );

  if (
    RIV1_redondear_(totales.extra) !== 0
  ) {
    partes.push(
      'Actividad extra histórica: ' +
      RIV1_redondear_(totales.extra) +
      ' h'
    );
  }

  return partes.join(' | ');
}


function RIV1_observacionPeriodo_(item, row) {
  if (!item.tieneP) {
    if (RIV1_tieneValor_(row[10])) {
      return (
        'Período histórico cerrado sin horas finales reconocidas. ' +
        'Existe asistencia como control, pero no se usa para inferir P.'
      );
    }

    return (
      'Período histórico cerrado sin horas finales reconocidas y sin ' +
      'fuente reconstruible automática. Requiere revisión de fuente ' +
      'antes de generar informe.'
    );
  }

  if (item.tipo === 'EXTRA_HISTORICO') {
    return (
      'Actividad adicional posterior al fin formal de pasantía/extensión ' +
      'y previa a una frontera de retiro o contratación.'
    );
  }

  return '';
}


function RIV1_agregarObservacion_(actual, nueva) {
  const a = String(actual || '').trim();

  if (!a) {
    return nueva;
  }

  if (a.indexOf(nueva) !== -1) {
    return a;
  }

  return a + ' | ' + nueva;
}


/* ============================================================
 * HELPERS DE COMPATIBILIDAD POR ENCABEZADO
 * ============================================================ */

function RIV1_mapaHeaders_(headers) {
  const mapa = {};

  headers.forEach(function(h, i) {
    const clave = RIV1_normalizar_(h);

    if (
      clave &&
      !Object.prototype.hasOwnProperty.call(
        mapa,
        clave
      )
    ) {
      mapa[clave] = i;
    }
  });

  return mapa;
}


function RIV1_getPorHeader_(row, mapa, header) {
  const clave = RIV1_normalizar_(header);

  if (
    !Object.prototype.hasOwnProperty.call(
      mapa,
      clave
    )
  ) {
    return '';
  }

  return row[mapa[clave]];
}


function RIV1_setPorHeader_(row, mapa, header, valor) {
  const clave = RIV1_normalizar_(header);

  if (
    Object.prototype.hasOwnProperty.call(
      mapa,
      clave
    )
  ) {
    row[mapa[clave]] = valor;
  }
}


function RIV1_getPrevio_(previo, header) {
  if (!previo) {
    return '';
  }

  return RIV1_getPorHeader_(
    previo.row,
    previo.headerMap,
    header
  );
}


function RIV1_ordenarItemsRegistro_(a, b) {
  const nombreA = String(a.nombre || '');
  const nombreB = String(b.nombre || '');

  const porNombre =
    nombreA.localeCompare(nombreB);

  if (porNombre !== 0) {
    return porNombre;
  }

  if (a.fechaOrden !== b.fechaOrden) {
    return a.fechaOrden - b.fechaOrden;
  }

  return String(a.periodo || '')
    .localeCompare(String(b.periodo || ''));
}


/*
 * Se conserva la función histórica por compatibilidad con posibles
 * consumidores. Para V2 no debe usarse como criterio principal porque
 * la fecha ya no se persiste en Registro_Informes.
 */
function RIV1_ordenarFilasRegistro_(a, b) {
  const nombreA = String(a[2] || '');
  const nombreB = String(b[2] || '');

  const porNombre =
    nombreA.localeCompare(nombreB);

  if (porNombre !== 0) {
    return porNombre;
  }

  const fechaA = RIV1_fechaMs_(a[6]);
  const fechaB = RIV1_fechaMs_(b[6]);

  if (fechaA !== fechaB) {
    return fechaA - fechaB;
  }

  return String(a[5] || '')
    .localeCompare(String(b[5] || ''));
}


/* ============================================================
 * HELPERS GENERALES
 * ============================================================ */

function RIV1_requerirHoja_(ss, nombre) {
  const hoja = ss.getSheetByName(nombre);

  if (!hoja) {
    throw new Error(
      'No existe la hoja "' +
      nombre +
      '".'
    );
  }

  return hoja;
}


function RIV1_normalizar_(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}


function RIV1_tieneValor_(valor) {
  return !(
    valor === '' ||
    valor === null ||
    valor === undefined
  );
}


function RIV1_numeroOpcional_(valor) {
  if (!RIV1_tieneValor_(valor)) {
    return {
      valido: true,
      valor: 0,
      vacio: true
    };
  }

  const numero = Number(
    String(valor)
      .trim()
      .replace(',', '.')
  );

  return {
    valido: !isNaN(numero),
    valor: isNaN(numero) ? 0 : numero,
    vacio: false
  };
}


function RIV1_redondear_(numero) {
  const n = Number(numero);

  if (isNaN(n)) {
    return 0;
  }

  return Math.round(n * 100) / 100;
}


function RIV1_textoFecha_(valor, tz) {
  if (
    valor instanceof Date &&
    !isNaN(valor.getTime())
  ) {
    return Utilities.formatDate(
      valor,
      tz,
      'yyyy-MM-dd'
    );
  }

  return '';
}


function RIV1_fechaMs_(valor) {
  if (
    valor instanceof Date &&
    !isNaN(valor.getTime())
  ) {
    return valor.getTime();
  }

  return 0;
}


function RIV1_valorHuella_(valor) {
  if (
    valor instanceof Date &&
    !isNaN(valor.getTime())
  ) {
    return String(valor.getTime());
  }

  if (typeof valor === 'number') {
    return String(
      RIV1_redondear_(valor)
    );
  }

  return String(valor || '').trim();
}


function RIV1_columnaLetra_(numero) {
  let n = Number(numero);
  let salida = '';

  while (n > 0) {
    const resto = (n - 1) % 26;
    salida = String.fromCharCode(65 + resto) + salida;
    n = Math.floor((n - 1) / 26);
  }

  return salida;
}

function RIV1_notasHeaders_() {
  return [
    'Identificador estable del informe de período.',
    'Correo principal de la persona.',
    'Nombre de la persona.',
    'Tipo de informe. Actualmente PERIODO.',
    'BASE, EXTENSION o EXTRA_HISTORICO.',
    'P1, P2... E1, E2... o X1, X2...',
    'LISTO o estado de insuficiencia de datos.',
    'PENDIENTE_GENERACION, GENERADO, REQUIERE_ACTUALIZACION o BLOQUEADO.',
    'Versión del documento generado.',
    'Fecha de creación/actualización del documento.',
    'ID estable del documento.',
    'Enlace directo al documento.',
    'Carpeta individual de la persona.',
    'Observación administrativa/auditable; el detalle del período vive en Control_Periodos.',
    'Última sincronización de esta fila.',
    'Resumen corto derivado de Control_Periodos.',
    'Campo estructurado para tareas principales.',
    'Campo estructurado para habilidades destacadas.',
    'Campo estructurado para rendimiento operativo.',
    'Huella de datos usada para detectar desactualización.'
  ];
}



