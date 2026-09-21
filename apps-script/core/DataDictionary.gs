/**
 * ============================================================
 * DATA DICTIONARY — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * OBJETIVO
 * Reconstruir Diccionario_Datos a partir de las 21 hojas del
 * modelo público actual y de sus encabezados reales, redactado
 * para una persona que necesita aprender cómo funciona el sistema.
 *
 * Mantiene las mismas 9 columnas del contrato de diccionario
 * utilizado por el sistema.
 * Al sincronizar, Diccionario_Datos queda VISIBLE como hoja de
 * consulta al final del bloque operativo.
 *
 * SEGURIDAD
 * - diagnosticarGeneracionDiccionarioDatosV2(): SOLO LECTURA.
 * - sincronizarDiccionarioDatosV2(): reconstruye SOLO Diccionario_Datos.
 * - No crea hojas auxiliares.
 * - No modifica ninguna otra hoja.
 * - No documenta valores personales: solo estructura/metadatos.
 *
 * ORDEN
 * 1) Ejecutar diagnosticarGeneracionDiccionarioDatosV2()
 * 2) Revisar que estado = LISTO_PARA_ESCRIBIR
 * 3) Ejecutar sincronizarDiccionarioDatosV2()
 * ============================================================
 */

const DDG20_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const DDG20_HOJA_DICCIONARIO =
  'Diccionario_Datos';

const DDG20_HEADERS = [
  'Hoja',
  'Columna',
  'Cabezal',
  'Bloque',
  'Qué significa',
  'Origen',
  '¿Editar manualmente?',
  'Valores esperados',
  'Para qué sirve'
];

const DDG20_HOJAS = [
  'Variables_Internas',
  'Seguimiento_Ingreso',
  'Catalogo_Documentos_Pasantia',
  'Documentacion_Pasantia',
  'Config_Encargados_Componentes',
  'Log_Notificaciones_Postulaciones',
  'Log_Ingreso',
  'Datos_Cursos',
  'Catalogo_Cursos',
  'Control_Cursos',
  'Horarios_Postulacion',
  'Control_horarios',
  'Registro_Planner',
  'Asistencia_Procesada',
  'Control_Periodos',
  'Ajustes_Horas',
  'Configuracion',
  'Historial_Roles',
  'Diccionario_Datos',
  'Registro_Informes',
  'Progreso_Pasantias'
];

const DDG20_HOJAS_OPCIONALES = [
  'Accesos_Internos',
  'Excepciones_Regimen',
  'Respuestas de formulario 1'
];

const DDG20_PROPOSITO_HOJA = {
  Variables_Internas:
    'Base maestra de pasantes aceptados. Una fila por persona. Aquí conviven datos administrativos que se completan manualmente y resúmenes que los códigos actualizan automáticamente.',
  Seguimiento_Ingreso:
    'Bandeja del proceso de ingreso antes y durante la aceptación: postulación, aviso a encargados, entrevista, cursos, inducción y formalización.',
  Catalogo_Documentos_Pasantia:
    'Lista maestra de documentos y controles que pueden pedirse a un pasante. Agregar un ítem aquí permite que el checklist crezca sin crear columnas nuevas.',
  Documentacion_Pasantia:
    'Checklist real de documentación: una fila por persona y por documento/control. Es la fuente que la página debe editar.',
  Accesos_Internos:
    'Recursos internos asignados a la persona, incluidos datos sensibles. Debe permanecer oculta y protegida.',
  Excepciones_Regimen:
    'Excepciones explícitas a las reglas automáticas de clasificación de actividades o transición. Solo se usa cuando el caso no sigue la regla general.',
  Config_Encargados_Componentes:
    'Define responsables, componentes y destinatarios de avisos de nuevas postulaciones.',
  Log_Notificaciones_Postulaciones:
    'Bitácora automática de avisos enviados a encargados. Sirve para saber qué se envió, cuándo y si hubo error.',
  Log_Ingreso:
    'Bitácora automática de hechos relevantes del ingreso. No se usa para trabajar día a día; sirve para auditoría y diagnóstico.',
  'Respuestas de formulario 1':
    'Hoja técnica conservada como seguridad local. La fuente principal del formulario estándar está en un Spreadsheet externo.',
  Datos_Cursos:
    'Datos crudos/consolidados provenientes de los formularios o fuentes de los cursos. No deben editarse para cambiar el resultado de una persona.',
  Catalogo_Cursos:
    'Configuración de los cursos requeridos, nota mínima, obligatoriedad y vigencia.',
  Control_Cursos:
    'Resultado procesado por persona y curso. La página lo muestra como progreso de inducción; no se corrige manualmente desde aquí.',
  Horarios_Postulacion:
    'Horario/disponibilidad que se obtiene durante la postulación. No es lo mismo que el horario oficial H1.',
  Control_horarios:
    'Historial de horarios oficiales H1/H2/H3 una vez que la relación de pasantía ya está formalizada.',
  Registro_Planner:
    'Registro canónico de las actividades importadas desde cada Planner. Conserva detalle y evidencia sin repetir todo el contexto de la persona.',
  Asistencia_Procesada:
    'Sesiones de asistencia calculadas desde las marcaciones. Sirve para revisar presencia y duración; no reemplaza Planner.',
  Control_Periodos:
    'Períodos P1/P2/P3/E1, etc. Conserva snapshots y horas finales. Los períodos intermedios elegibles se cierran automáticamente; excepciones y cierre final requieren revisión administrativa.',
  Ajustes_Horas:
    'Correcciones excepcionales y auditables de horas. Solo deben usarse cuando existe una decisión/justificación explícita.',
  Configuracion:
    'Parámetros técnicos y reglas globales que usan los códigos.',
  Historial_Roles:
    'Historial de cambios PASANTE/ASISTENTE y reglas de convalidación. Permite saber qué rol tenía la persona en cada etapa.',
  Diccionario_Datos:
    'Guía de consulta de todas las hojas y columnas: qué significa cada campo, de dónde sale, quién puede editarlo y para qué se usa.',
  Registro_Informes:
    'Metadatos, estado y enlaces de informes generados. Los snapshots de períodos permanecen en Control_Periodos.',
  Progreso_Pasantias:
    'Resumen automático vigente de fechas, horas y porcentajes de avance por persona.'
};


function diagnosticarGeneracionDiccionarioDatosV2() {
  const construido =
    DDG20_construir_();

  const resumen =
    DDG20_resumir_(
      construido,
      false
    );

  console.log(
    '=== DRY RUN DICCIONARIO DATOS V2.1.3.1 ==='
  );

  console.log(
    resumen
  );

  console.log(
    '[FILAS POR HOJA]',
    construido.filasPorHoja
  );

  console.log(
    '[ADVERTENCIAS]',
    construido.advertencias
  );

  Logger.log(
    JSON.stringify({
      resumen:
        resumen,
      filasPorHoja:
        construido.filasPorHoja,
      advertencias:
        construido.advertencias
    })
  );

  return {
    resumen:
      resumen,
    filasPorHoja:
      construido.filasPorHoja,
    advertencias:
      construido.advertencias
  };
}


function sincronizarDiccionarioDatosV2() {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const construido =
      DDG20_construir_();

    if (
      construido.hojasFaltantes.length ||
      construido.hojasNoCanonicas.length ||
      construido.columnasSinCabezalCriticas.length
    ) {
      throw new Error(
        'Diccionario no escrito. La validación previa no está limpia. ' +
        'Hojas faltantes=' +
        construido.hojasFaltantes.length +
        ', hojas no canónicas=' +
        construido.hojasNoCanonicas.length +
        ', cabezales críticos vacíos=' +
        construido.columnasSinCabezalCriticas.length +
        '.'
      );
    }

    const ss =
      construido.ss;

    const hoja =
      ss.getSheetByName(
        DDG20_HOJA_DICCIONARIO
      );

    if (!hoja) {
      throw new Error(
        'No existe ' +
        DDG20_HOJA_DICCIONARIO +
        '.'
      );
    }

    /*
     * ÚNICA HOJA MODIFICADA.
     * Diccionario_Datos es un artefacto generado y puede
     * reconstruirse íntegramente desde el esquema real.
     */
    hoja.clear();

    hoja
      .getRange(
        1,
        1,
        1,
        DDG20_HEADERS.length
      )
      .setValues([
        DDG20_HEADERS
      ])
      .setFontWeight(
        'bold'
      )
      .setWrap(
        true
      );

    if (
      construido.filas.length
    ) {
      hoja
        .getRange(
          2,
          1,
          construido.filas.length,
          DDG20_HEADERS.length
        )
        .setValues(
          construido.filas
        )
        .setWrap(
          true
        )
        .setVerticalAlignment(
          'top'
        );
    }

    hoja.setFrozenRows(
      1
    );

    hoja.setFrozenColumns(
      3
    );

    hoja
      .getRange(
        1,
        1,
        1,
        DDG20_HEADERS.length
      )
      .setBackground(
        '#17365D'
      )
      .setFontColor(
        '#FFFFFF'
      )
      .setFontWeight(
        'bold'
      );

    try {
      const filtroActual =
        hoja.getFilter();

      if (filtroActual) {
        filtroActual.remove();
      }

      if (construido.filas.length) {
        hoja
          .getRange(
            1,
            1,
            construido.filas.length + 1,
            DDG20_HEADERS.length
          )
          .createFilter();
      }
    } catch (errorFiltro) {}

    /*
     * Esta hoja es de CONSULTA. Se deja visible al final
     * del bloque operativo para quien necesite entender el sistema.
     */
    hoja.showSheet();

    try {
      ss.setActiveSheet(
        hoja
      );

      ss.moveActiveSheet(
        12
      );
    } catch (errorOrden) {}

    const anchos = [
      190,
      80,
      230,
      230,
      420,
      300,
      180,
      300,
      420
    ];

    anchos.forEach(
      function(ancho, i) {
        hoja.setColumnWidth(
          i + 1,
          ancho
        );
      }
    );

    const lastRow =
      Math.max(
        hoja.getLastRow(),
        1
      );

    hoja
      .getRange(
        1,
        1,
        lastRow,
        DDG20_HEADERS.length
      )
      .setVerticalAlignment(
        'top'
      );

    try {
      hoja
        .getRange(
          'A1:I1'
        )
        .setNotes([[
          'Nombre de la hoja donde vive el campo.',
          'Letra física de la columna en esa hoja.',
          'Nombre exacto del encabezado.',
          'Grupo funcional del campo dentro de la hoja.',
          'Explicación en lenguaje sencillo de qué representa.',
          'De qué proceso o fuente se obtiene.',
          'Indica si una persona debería editarlo y bajo qué condición.',
          'Tipo o conjunto de valores esperados.',
          'Explica para qué se usa y qué decisión/proceso ayuda a sostener.'
        ]]);
    } catch (errorNotas) {}

    const resumen =
      DDG20_resumir_(
        construido,
        true
      );

    resumen.rango =
      construido.filas.length
        ? (
            DDG20_HOJA_DICCIONARIO +
            '!A1:I' +
            (
              construido.filas.length +
              1
            )
          )
        : (
            DDG20_HOJA_DICCIONARIO +
            '!A1:I1'
          );

    console.log(
      '=== DICCIONARIO DATOS V2.1.3 SINCRONIZADO ==='
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


function DDG20_construir_() {
  const ss =
    SpreadsheetApp.openById(
      DDG20_DB_ID
    );

  const hojasActuales =
    ss.getSheets();

  const nombresActuales =
    hojasActuales.map(
      function(h) {
        return h.getName();
      }
    );

  const hojasFaltantes =
    DDG20_HOJAS.filter(
      function(nombre) {
        return (
          nombresActuales.indexOf(
            nombre
          ) < 0
        );
      }
    );

  const hojasNoCanonicas =
    nombresActuales.filter(
      function(nombre) {
        return (
          DDG20_HOJAS.indexOf(nombre) < 0 &&
          DDG20_HOJAS_OPCIONALES.indexOf(nombre) < 0
        );
      }
    );

  const filas =
    [];

  const filasPorHoja =
    {};

  const advertencias =
    [];

  const columnasSinCabezalCriticas =
    [];

  let totalColumnas =
    0;

  DDG20_HOJAS.forEach(
    function(nombreHoja) {
      const hoja =
        ss.getSheetByName(
          nombreHoja
        );

      if (!hoja) {
        filasPorHoja[
          nombreHoja
        ] = 0;

        return;
      }

      const columnas =
        hoja.getLastColumn();

      totalColumnas +=
        columnas;

      const headers =
        columnas > 0
          ? hoja
              .getRange(
                1,
                1,
                1,
                columnas
              )
              .getDisplayValues()[0]
          : [];

      filasPorHoja[
        nombreHoja
      ] =
        columnas;

      const vistos =
        {};

      headers.forEach(
        function(header, indice) {
          const columna =
            indice + 1;

          const cabezal =
            String(
              header || ''
            ).trim();

          if (!cabezal) {
            columnasSinCabezalCriticas.push({
              hoja:
                nombreHoja,
              columna:
                DDG20_columnaALetra_(
                  columna
                )
            });
          }

          const claveHeader =
            DDG20_norm_(
              cabezal
            );

          if (
            claveHeader
          ) {
            if (
              vistos[
                claveHeader
              ]
            ) {
              advertencias.push({
                tipo:
                  'CABEZAL_DUPLICADO_EN_HOJA',
                hoja:
                  nombreHoja,
                cabezal:
                  cabezal,
                primeraColumna:
                  vistos[
                    claveHeader
                  ],
                segundaColumna:
                  DDG20_columnaALetra_(
                    columna
                  )
              });
            } else {
              vistos[
                claveHeader
              ] =
                DDG20_columnaALetra_(
                  columna
                );
            }
          }

          const meta =
            DDG20_metadata_(
              nombreHoja,
              cabezal,
              columna
            );

          filas.push([
            nombreHoja,
            DDG20_columnaALetra_(
              columna
            ),
            cabezal,
            meta.bloque,
            meta.significado,
            meta.origen,
            meta.editar,
            meta.valores,
            meta.uso
          ]);
        }
      );
    }
  );

  return {
    ss:
      ss,
    filas:
      filas,
    filasPorHoja:
      filasPorHoja,
    totalColumnas:
      totalColumnas,
    hojasFaltantes:
      hojasFaltantes,
    hojasNoCanonicas:
      hojasNoCanonicas,
    columnasSinCabezalCriticas:
      columnasSinCabezalCriticas,
    advertencias:
      advertencias
  };
}


function DDG20_resumir_(
  construido,
  escritura
) {
  const listo =
    (
      construido.hojasFaltantes.length ===
        0 &&
      construido.hojasNoCanonicas.length ===
        0 &&
      construido.columnasSinCabezalCriticas.length ===
        0
    );

  return {
    version:
      'PUBLIC_MODEL_1.0',

    escritura:
      Boolean(
        escritura
      ),

    hojasCanonicas:
      DDG20_HOJAS.length,

    hojasFaltantes:
      construido.hojasFaltantes,

    hojasNoCanonicas:
      construido.hojasNoCanonicas,

    columnasModelo:
      construido.totalColumnas,

    filasGeneradas:
      construido.filas.length,

    columnasDiccionario:
      DDG20_HEADERS.length,

    hojasDocumentadas:
      Object.keys(
        construido.filasPorHoja
      ).filter(
        function(nombre) {
          return (
            construido
              .filasPorHoja[
                nombre
              ] >
            0
          );
        }
      ).length,

    hojasOpcionalesIgnoradas:
      DDG20_HOJAS_OPCIONALES.slice(),

    registroPlannerColumnas:
      construido
        .filasPorHoja[
          'Registro_Planner'
        ] || 0,

    progresoColumnas:
      construido
        .filasPorHoja[
          'Progreso_Pasantias'
        ] || 0,

    variablesColumnas:
      construido
        .filasPorHoja[
          'Variables_Internas'
        ] || 0,

    columnasSinCabezalCriticas:
      construido
        .columnasSinCabezalCriticas,

    advertencias:
      construido
        .advertencias.length,

    estado:
      listo
        ? (
            escritura
              ? 'OK'
              : 'LISTO_PARA_ESCRIBIR'
          )
        : 'REVISAR'
  };
}


function DDG20_metadata_(
  hoja,
  header,
  columna
) {
  return {
    bloque:
      DDG20_bloque_(
        hoja,
        columna
      ),

    significado:
      DDG20_significado_(
        hoja,
        header
      ),

    origen:
      DDG20_origen_(
        hoja,
        header,
        columna
      ),

    editar:
      DDG20_editar_(
        hoja,
        header
      ),

    valores:
      DDG20_valores_(
        header
      ),

    uso:
      DDG20_uso_(
        hoja,
        header
      )
  };
}


function DDG20_bloque_(
  hoja,
  columna
) {
  if (
    hoja ===
    'Variables_Internas'
  ) {
    if (columna <= 6) {
      return '1. Identificación y ruta de ingreso';
    }
    if (columna <= 12) {
      return '2. Entrevista, cursos e inducción';
    }
    if (columna <= 15) {
      return '3. Asignación operativa';
    }
    if (columna <= 20) {
      return '4. Pasantía';
    }
    if (columna <= 23) {
      return '5. Extensión';
    }
    if (columna <= 28) {
      return '6. Situación vigente';
    }
    if (columna <= 34) {
      return '7. Transición laboral';
    }
    if (columna <= 37) {
      return '8. Resumen documental';
    }
    if (columna <= 41) {
      return '9. Recursos internos resumidos';
    }
    if (columna <= 49) {
      return '10. Progreso';
    }

    return '11. Período vigente';
  }

  if (
    hoja ===
    'Registro_Planner'
  ) {
    if (columna <= 5) {
      return '1. Identificación y origen';
    }
    if (columna <= 18) {
      return '2. Datos de la actividad';
    }
    if (columna <= 21) {
      return '3. Evidencia';
    }
    if (columna <= 23) {
      return '4. Importación y período';
    }
    if (columna <= 28) {
      return '5. Horas y control';
    }

    return '6. Régimen y compromiso';
  }

  if (
    hoja ===
    'Progreso_Pasantias'
  ) {
    if (columna <= 3) {
      return '1. Identificación y estado';
    }
    if (columna <= 7) {
      return '2. Fechas y avance temporal';
    }
    if (columna <= 13) {
      return '3. Horas y cumplimiento';
    }

    return '4. Calidad y actualización';
  }

  if (
    hoja ===
    'Control_Periodos'
  ) {
    if (columna <= 5) {
      return '1. Identificación del período';
    }
    if (columna <= 10) {
      return '2. Fechas y estado';
    }

    return '3. Horas y cierre';
  }

  if (
    hoja ===
    'Documentacion_Pasantia'
  ) {
    if (columna <= 5) {
      return '1. Persona y documento';
    }
    if (columna <= 10) {
      return '2. Aplicabilidad y estado';
    }

    return '3. Trazabilidad';
  }

  if (
    hoja ===
    'Registro_Informes'
  ) {
    if (columna <= 9) {
      return '1. Identificación y estado del informe';
    }
    if (columna <= 15) {
      return '2. Documento y trazabilidad';
    }

    return '3. Contenido resumido';
  }

  return (
    'Estructura de ' +
    hoja
  );
}


function DDG20_significado_(
  hoja,
  header
) {
  const h =
    DDG20_norm_(
      header
    );

  const exactos = {
    'correo oficial':
      'Correo principal que identifica a la persona y permite cruzarla entre hojas. Es la llave más importante del sistema.',
    'correo alternativo cursos':
      'Correo alternativo que puede haberse usado para realizar los cursos; sirve para reconocer intentos aunque no usen el correo oficial.',
    'nombre':
      'Nombre legible de la persona para revisión humana, informes y pantalla.',
    'ci':
      'Documento de identidad. Se usa especialmente para cruces con asistencia cuando la fuente de marcaciones identifica por CI.',
    'procedencia':
      'Universidad, institución o procedencia de la persona cuando está disponible.',
    'ruta de ingreso':
      'Indica por qué flujo ingresó la persona. La pasantía estándar y los asistentes directos no deben mezclarse.',
    'resultado entrevista':
      'Decisión humana registrada después de la entrevista, por ejemplo Aceptado o Rechazado.',
    'estado de ingreso':
      'Etapa administrativa actual del proceso de ingreso: postulación, cursos, aceptado, denegado u otro estado definido por el flujo.',
    'fecha entrevista':
      'Fecha en que se realizó o quedó registrada la entrevista.',
    'entrevistador/a':
      'Persona responsable de realizar la entrevista.',
    'estado programación entrevista':
      'Indica si la entrevista está por programar, programada, realizada u otro estado equivalente.',
    'cursos aprobados':
      'Cantidad de cursos obligatorios que ya cumplen la nota mínima.',
    'cursos requeridos':
      'Cantidad de cursos obligatorios que la persona debe completar.',
    'estado inducción':
      'Resumen del avance de la inducción/cursos.',
    'fecha completado cursos':
      'Fecha en que el sistema pudo confirmar que todos los cursos requeridos estaban aprobados.',
    '¿tiene horario de postulación vinculado?':
      'Indica si la postulación tiene un horario/disponibilidad asociado en Horarios_Postulacion.',
    'estado formalización':
      'Resume si después de aprobar la entrevista y cursos todavía faltan documentos o datos administrativos para iniciar.',
    'id carpeta postulación':
      'ID de la carpeta de Drive donde se organizan automáticamente los archivos recibidos durante la postulación. Esta carpeta NO sustituye la carpeta personal operativa del pasante dentro de la carpeta oficial de pasantes.',
    'url carpeta postulación':
      'Enlace para abrir la carpeta automática de archivos de la postulación. Sirve para revisar lo recibido antes de formalizar; NO es la carpeta personal operativa del pasante.',
    'estado aviso encargados':
      'Resultado del aviso automático a los responsables/componentes sobre una nueva postulación.',
    'fecha aviso encargados':
      'Fecha y hora en que se registró el aviso a encargados.',
    'destinatarios aviso':
      'Correos de los responsables a quienes se envió el aviso de la nueva postulación.',
    'encargado':
      'Responsable principal de acompañar o supervisar al pasante.',
    'componente 1':
      'Componente principal al que queda asignada la persona.',
    'componente 2':
      'Segundo componente cuando la persona participa en más de uno.',
    'estado de pasantía':
      'Situación actual de la pasantía, por ejemplo Vigente, Finalizada o Retirada.',
    'fecha inicio pasantía':
      'Fecha oficial de inicio acordada en la formalización/compromiso.',
    'fecha fin pasantía':
      'Fecha oficial de fin acordada en la formalización/compromiso.',
    'horas objetivo':
      'Número oficial de horas que la persona debe cumplir. Debe copiarse del acuerdo; nunca se infiere desde horas semanales.',
    'link planner':
      'Enlace manual a la carpeta personal del pasante o miembro dentro de Drive. Dentro de esa carpeta se encuentra el Planner y sus evidencias. El módulo de Planner usa este enlace para abrir la carpeta y localizar el Google Sheet correspondiente.',
    'fecha inicio extensión':
      'Fecha en que comienza una extensión formal de la pasantía.',
    'fecha fin extensión':
      'Fecha en que termina una extensión formal de la pasantía.',
    'tiene extensión':
      'Indica si existe una extensión formal vigente o registrada.',
    'cualidad actual':
      'Rol actual de la persona dentro del flujo, por ejemplo PASANTE o ASISTENTE cuando corresponda.',
    'cualidad pasada':
      'Rol anterior conservado para contexto histórico; el historial completo vive en Historial_Roles.',
    'fecha retiro':
      'Fecha administrativa del retiro cuando la persona no culmina por la vía normal.',
    'estado transición laboral':
      'Estado del paso desde pasantía hacia una contratación o vínculo laboral, cuando aplica.',
    'fecha inicio transición laboral':
      'Fecha desde la cual comienza a considerarse la transición laboral.',
    'observación transición laboral':
      'Explicación de la transición, decisión o condición especial relacionada con contratación.',
    'estado periodo':
      'Situación temporal y administrativa de un período de 30 días. FUTURO: todavía no inicia. ABIERTO: está en curso. PENDIENTE CIERRE: terminó por fecha y será procesado automáticamente si es intermedio y válido; excepciones y cierre final requieren revisión. CERRADO: sus snapshots y horas finales quedaron consolidados.',
    'estado período':
      'Situación temporal y administrativa de un período de 30 días. FUTURO: todavía no inicia. ABIERTO: está en curso. PENDIENTE CIERRE: terminó por fecha y será procesado automáticamente si es intermedio y válido; excepciones y cierre final requieren revisión. CERRADO: sus snapshots y horas finales quedaron consolidados.',
    'estado período actual':
      'Resumen del estado del período vigente de la persona: FUTURO, ABIERTO, PENDIENTE CIERRE o CERRADO. La interfaz distingue procesamiento automático, revisión por excepción, revisión final y cierre consolidado.',
    'estado periodo actual':
      'Resumen del estado del período vigente de la persona: FUTURO, ABIERTO, PENDIENTE CIERRE o CERRADO. La interfaz distingue procesamiento automático, revisión por excepción, revisión final y cierre consolidado.',
    'fecha inicio plazo cursos':
      'Fecha en que la persona administradora registra el envío de los correos/enlaces de los cursos. Desde aquí comienza el plazo de 14 días calendario.',
    'fecha límite cursos':
      'Fecha límite para completar los cursos de inducción. Se calcula como 14 días calendario desde la fecha de inicio del plazo.',
    'estado vínculo laboral':
      'Situación del vínculo laboral cuando la persona ya fue contratada o tiene un contrato registrado.',
    'fecha fin vínculo laboral':
      'Fecha final del contrato o vínculo laboral cuando existe.',
    'motivo fin vínculo laboral':
      'Motivo registrado cuando termina el vínculo laboral.',
    'estado documentación física':
      'Resumen de la situación documental. El detalle real se encuentra en Documentacion_Pasantia.',
    'documentos completos':
      'Cantidad de documentos/controles aplicables que están completos o validados.',
    'documentos pendientes':
      'Cantidad de documentos/controles aplicables que todavía necesitan acción.',
    'correo asignado':
      'Correo institucional o recurso interno asignado a la persona, cuando aplica.',
    'número asociado':
      'Número telefónico u otro número vinculado al recurso interno asignado.',
    'número de chip':
      'Identificador del chip o SIM asignado cuando aplica.',
    'estado de correo':
      'Estado administrativo del correo/recurso asignado.',
    'porcentaje tiempo transcurrido':
      'Porcentaje del tiempo planificado de la pasantía que ya transcurrió.',
    'horas válidas como pasante':
      'Horas reconocidas mientras la persona tenía cualidad de pasante.',
    'horas convalidadas como asistente':
      'Horas de la etapa asistente que se aceptan para el compromiso únicamente si una política explícita lo permite.',
    'horas válidas para cumplimiento':
      'Total de horas reconocidas para cumplir la meta oficial.',
    'horas restantes':
      'Horas que todavía faltan para alcanzar las horas objetivo.',
    'porcentaje horas cumplidas':
      'Porcentaje de la meta oficial de horas ya alcanzado.',
    'estado datos progreso':
      'Alerta de calidad/completitud de los datos necesarios para calcular progreso.',
    'última actualización progreso':
      'Última fecha/hora en que se actualizó el resumen de progreso.',
    'período actual':
      'Código del período vigente que corresponde a la fecha y situación de la persona.',
    'estado período actual':
      'Estado del período vigente, por ejemplo abierto o cerrado.',
    'horas finales reconocidas acumuladas':
      'Acumulado de horas finales reconocidas de períodos ya consolidados/cerrados.',
    'código documento':
      'Código estable que identifica un documento/control del checklist.',
    'documento / control':
      'Nombre comprensible del documento o verificación que debe revisarse.',
    'aplica':
      'Indica si ese documento/control corresponde a la persona.',
    'fecha recepción':
      'Fecha en que se recibió físicamente o se registró la recepción del documento.',
    'fecha validación':
      'Fecha en que el documento fue revisado y validado.',
    'actualizado por':
      'Persona o proceso que realizó la última actualización documental.',
    'campo legado':
      'Nombre del campo antiguo del que provino este control durante la migración. Se conserva para trazabilidad histórica.',
    'curso':
      'Nombre del curso de inducción o capacitación.',
    'estado curso':
      'Resultado procesado del curso para esa persona.',
    'nota oficial':
      'Nota del intento oficial que el sistema reconoce según la regla vigente.',
    'fecha intento oficial':
      'Fecha del intento que fue seleccionado como oficial.',
    'correo usado intento oficial':
      'Correo con el que la persona realizó el intento oficial del curso.',
    'intentos detectados':
      'Cantidad de intentos encontrados para ese curso y persona.',
    'alerta':
      'Aviso para revisión cuando el procesamiento detecta una situación no estándar.',
    'fecha procesamiento':
      'Fecha/hora en que se procesó el resultado del curso.',
    'id informe':
      'Identificador único del informe dentro del sistema.',
    'id google doc':
      'ID del Google Doc generado para el informe.',
    'url google doc':
      'Enlace directo al Google Doc del informe.',
    'id carpeta persona':
      'ID de la carpeta de Drive utilizada por la infraestructura de informes para esa persona.',
    'huella datos':
      'Huella que permite detectar si los datos usados para generar un informe cambiaron.'
  };

  if (
    Object.prototype
      .hasOwnProperty.call(
        exactos,
        h
      )
  ) {
    return exactos[h];
  }

  if (!header) {
    return (
      'Columna física sin cabezal en ' +
      hoja +
      '; se conserva únicamente para representar fielmente la estructura real.'
    );
  }

  if (h.indexOf('estado') >= 0) {
    return 'Estado controlado que indica en qué situación se encuentra este registro dentro de su proceso.';
  }

  if (h.indexOf('fecha') >= 0 || h.indexOf('marca temporal') >= 0) {
    return 'Fecha o fecha-hora usada para saber cuándo ocurrió este evento o desde cuándo aplica.';
  }

  if (h.indexOf('hora') >= 0) {
    return 'Hora o cantidad temporal utilizada por este módulo.';
  }

  if (h.indexOf('id ') === 0) {
    return 'Identificador técnico que permite relacionar este registro con un archivo, carpeta, evidencia u objeto del sistema.';
  }

  if (h.indexOf('url') >= 0 || h.indexOf('link') >= 0) {
    return 'Enlace para abrir el recurso relacionado con este registro.';
  }

  if (h.indexOf('observ') >= 0 || h.indexOf('coment') >= 0) {
    return 'Texto libre para dejar contexto, aclaraciones o incidencias que no caben en un estado estructurado.';
  }

  if (h.indexOf('horas') >= 0 || h === 'duracion') {
    return 'Cantidad de tiempo usada por este módulo para control operativo, evidencia o cumplimiento.';
  }

  if (h.indexOf('nombre') >= 0) {
    return 'Nombre legible del elemento relacionado con este registro.';
  }

  return (
    'Campo "' +
    header +
    '" de ' +
    hoja +
    '. Se interpreta dentro del propósito general de esa hoja.'
  );
}


function DDG20_origen_(
  hoja,
  header,
  columna
) {
  const mapa = {
    Seguimiento_Ingreso:
      'Formulario estándar + organización de adjuntos/avisos + entrevista manual + sincronización de cursos',
    Catalogo_Documentos_Pasantia:
      'Configuración documental controlada',
    Documentacion_Pasantia:
      'Catalogo_Documentos_Pasantia + actualización manual/web autorizada',
    Accesos_Internos:
      'Registro manual autorizado de recursos internos',
    Excepciones_Regimen:
      'Decisión administrativa explícita para casos excepcionales',
    Config_Encargados_Componentes:
      'Configuración manual de responsables/componentes',
    Log_Notificaciones_Postulaciones:
      'Generado automáticamente al intentar/enviar avisos de nuevas postulaciones',
    Log_Ingreso:
      'Generado automáticamente por eventos relevantes del flujo de ingreso',
    'Respuestas de formulario 1':
      'Hoja técnica local conservada; la fuente principal del formulario estándar está en un Spreadsheet externo',
    Datos_Cursos:
      'Resultados provenientes de formularios/fuentes de cursos',
    Catalogo_Cursos:
      'Configuración manual controlada de cursos y nota mínima',
    Control_Cursos:
      'Calculado desde Datos_Cursos + Catalogo_Cursos + identidad de la persona',
    Horarios_Postulacion:
      'Flujo web/formulario de horarios durante la postulación',
    Control_horarios:
      'Procedimiento controlado de creación/actualización de H1/H2/H3',
    Asistencia_Procesada:
      'Fuente externa de marcaciones base_diaria + Control_horarios + identidad',
    Control_Periodos:
      'Variables_Internas + Registro_Planner + cierre automático de intermedios + revisión de excepciones/final + ajustes',
    Ajustes_Horas:
      'Decisión manual controlada y justificada',
    Configuracion:
      'Configuración técnica del sistema',
    Historial_Roles:
      'Cambios formales de cualidad/rol y reglas explícitas de convalidación',
    Diccionario_Datos:
      'Generado automáticamente leyendo los encabezados reales de las hojas',
    Registro_Informes:
      'Control_Periodos + generador de informes + acciones administrativas de generación',
    Progreso_Pasantias:
      'Variables_Internas + Registro_Planner + Control_Periodos + Historial_Roles'
  };

  if (hoja === 'Registro_Planner') {
    return columna <= 2
      ? 'Variables_Internas'
      : (
          columna <= 18
            ? 'Planner fuente / Google Drive'
            : 'Calculado por Planners'
        );
  }

  if (hoja === 'Variables_Internas') {
    const h =
      DDG20_norm_(
        header
      );

    if (
      h.indexOf('porcentaje') >= 0 ||
      h.indexOf('horas valid') >= 0 ||
      h.indexOf('horas convalidadas') >= 0 ||
      h.indexOf('horas restantes') >= 0 ||
      h.indexOf('estado datos progreso') >= 0 ||
      h.indexOf('ultima actualizacion progreso') >= 0 ||
      h.indexOf('última actualización progreso') >= 0 ||
      h.indexOf('periodo actual') >= 0 ||
      h.indexOf('período actual') >= 0 ||
      h.indexOf('estado periodo actual') >= 0 ||
      h.indexOf('estado período actual') >= 0 ||
      h.indexOf('horas finales reconocidas acumuladas') >= 0
    ) {
      return 'Sincronizado automáticamente desde módulos derivados';
    }

    if (
      h === 'resultado entrevista' ||
      h === 'estado de ingreso' ||
      h === 'fecha completado cursos' ||
      h === 'cursos aprobados' ||
      h === 'cursos requeridos' ||
      h === 'estado induccion' ||
      h === 'estado inducción'
    ) {
      return 'Seguimiento_Ingreso / Control_Cursos sincronizado al master';
    }

    if (
      h.indexOf('document') >= 0
    ) {
      return 'Resumen sincronizado desde Documentacion_Pasantia';
    }

    return 'Gestión administrativa autorizada + datos de ingreso aceptado';
  }

  return (
    mapa[hoja] ||
    DDG20_PROPOSITO_HOJA[hoja] ||
    'Fuente operativa correspondiente'
  );
}


function DDG20_editar_(
  hoja,
  header
) {
  const h =
    DDG20_norm_(
      header
    );

  const nunca = [
    'Log_Notificaciones_Postulaciones',
    'Log_Ingreso',
    'Control_Cursos',
    'Registro_Planner',
    'Asistencia_Procesada',
    'Progreso_Pasantias',
    'Registro_Informes',
    'Historial_Roles',
    'Diccionario_Datos',
    'Datos_Cursos'
  ];

  if (nunca.indexOf(hoja) >= 0) {
    return 'No: se genera/procesa automáticamente o mediante una función específica';
  }

  if (hoja === 'Accesos_Internos') {
    return 'Sí, solo personal autorizado; nunca exponer en la página pública/operativa';
  }

  if (
    hoja === 'Configuracion' ||
    hoja === 'Catalogo_Cursos' ||
    hoja === 'Catalogo_Documentos_Pasantia' ||
    hoja === 'Config_Encargados_Componentes' ||
    hoja === 'Excepciones_Regimen' ||
    hoja === 'Ajustes_Horas'
  ) {
    return 'Sí, únicamente de forma controlada por quien administra el sistema';
  }

  if (hoja === 'Seguimiento_Ingreso') {
    if (
      h === 'resultado entrevista' ||
      h === 'fecha entrevista' ||
      h === 'entrevistador/a' ||
      h === 'estado programacion entrevista' ||
      h === 'estado programación entrevista' ||
      h === 'estado formalizacion' ||
      h === 'estado formalización' ||
      h === 'observacion' ||
      h === 'observación'
    ) {
      return 'Sí: dato administrativo/manual; preferentemente desde la página';
    }

    return 'No directo: se actualiza automáticamente desde postulación, avisos o cursos';
  }

  if (hoja === 'Documentacion_Pasantia') {
    if (
      h === 'estado' ||
      h === 'fecha recepcion' ||
      h === 'fecha recepción' ||
      h === 'fecha validacion' ||
      h === 'fecha validación' ||
      h === 'observacion' ||
      h === 'observación'
    ) {
      return 'Sí: actualizar desde el checklist de la página';
    }

    return 'No directo: identidad y catálogo se sincronizan automáticamente';
  }

  if (hoja === 'Control_horarios') {
    return 'Solo mediante el procedimiento controlado de H1/H2/H3; no editar indiscriminadamente';
  }

  if (hoja === 'Horarios_Postulacion') {
    return 'No normalmente: proviene del flujo de horarios de postulación';
  }

  if (hoja === 'Variables_Internas') {
    const derivados = [
      'porcentaje tiempo transcurrido',
      'horas validas como pasante',
      'horas válidas como pasante',
      'horas convalidadas como asistente',
      'horas validas para cumplimiento',
      'horas válidas para cumplimiento',
      'horas restantes',
      'porcentaje horas cumplidas',
      'estado datos progreso',
      'ultima actualizacion progreso',
      'última actualización progreso',
      'periodo actual',
      'período actual',
      'estado periodo actual',
      'estado período actual',
      'horas finales reconocidas acumuladas',
      'documentos completos',
      'documentos pendientes'
    ];

    return derivados.indexOf(h) >= 0
      ? 'No: resumen automático'
      : 'Sí, pero solo para decisiones/datos administrativos autorizados; preferentemente desde la página';
  }

  return 'Según el procedimiento documentado de la hoja';
}


function DDG20_valores_(
  header
) {
  const h =
    DDG20_norm_(
      header
    );

  if (!h) {
    return 'Sin cabezal / hoja fuente vacía';
  }

  if (
    h === 'estado periodo' ||
    h === 'estado período' ||
    h === 'estado periodo actual' ||
    h === 'estado período actual'
  ) {
    return 'FUTURO | ABIERTO | PENDIENTE CIERRE | CERRADO';
  }

  if (
    h.indexOf(
      'correo'
    ) >= 0
  ) {
    return 'Correo electrónico o vacío cuando no aplica';
  }

  if (
    h.indexOf(
      'fecha'
    ) >= 0 ||
    h.indexOf(
      'ultima actualizacion'
    ) >= 0 ||
    h.indexOf(
      'última actualización'
    ) >= 0 ||
    h.indexOf(
      'marca temporal'
    ) >= 0
  ) {
    return 'Fecha o fecha-hora válida; vacío cuando no aplica';
  }

  if (
    h.indexOf(
      'hora inicio'
    ) >= 0 ||
    h.indexOf(
      'hora fin'
    ) >= 0
  ) {
    return 'Hora válida o vacío';
  }

  if (
    h.indexOf(
      'porcentaje'
    ) >= 0
  ) {
    return 'Número decimal proporcional; vacío si no puede calcularse';
  }

  if (
    h.indexOf(
      'horas'
    ) >= 0 ||
    h ===
      'duracion' ||
    h.indexOf(
      'nota'
    ) >= 0
  ) {
    return 'Número; vacío cuando no existe dato verificable';
  }

  if (
    h ===
      'activo' ||
    h.indexOf(
      'tiene '
    ) === 0 ||
    h.indexOf(
      '¿tiene '
    ) === 0
  ) {
    return 'Sí / No o equivalente definido por el proceso';
  }

  if (
    h.indexOf(
      'id '
    ) === 0 ||
    h ===
      'ci' ||
    h.indexOf(
      'numero'
    ) >= 0 ||
    h.indexOf(
      'número'
    ) >= 0
  ) {
    return 'Identificador o código; vacío cuando no aplica';
  }

  if (
    h.indexOf(
      'estado'
    ) >= 0
  ) {
    return 'Valor controlado definido por el módulo correspondiente';
  }

  return 'Texto, código o valor definido por la fuente correspondiente';
}


function DDG20_uso_(
  hoja,
  header
) {
  const h =
    DDG20_norm_(
      header
    );

  if (h === 'correo oficial') {
    return 'Relacionar a la misma persona entre postulación, cursos, documentación, Planner, períodos, progreso e informes.';
  }

  if (h === 'resultado entrevista') {
    return 'Determinar si la persona continúa al flujo de pasantía. Solo Aceptado permite crear/activar el registro operativo.';
  }

  if (
    h === 'cursos aprobados' ||
    h === 'estado induccion' ||
    h === 'estado inducción'
  ) {
    return 'Mostrar avance de inducción y avisar cuándo la persona alcanza 5/5 para pasar a formalización.';
  }

  if (h === 'url carpeta postulación') {
    return 'Permitir que la persona administradora abra rápidamente los archivos recibidos del postulante.';
  }

  if (h === 'link planner') {
    return 'Abrir el Planner de la persona y detectar desde la página si todavía falta crearlo/vincularlo.';
  }

  if (h === 'horas objetivo') {
    return 'Definir la meta oficial contra la que se calcula el cumplimiento. Debe provenir del acuerdo firmado.';
  }

  if (h.indexOf('transicion laboral') >= 0 || h.indexOf('transición laboral') >= 0 || h.indexOf('vinculo laboral') >= 0 || h.indexOf('vínculo laboral') >= 0) {
    return 'Registrar si la persona pasará o pasó de pasante a una relación laboral, manteniendo fechas y trazabilidad.';
  }

  if (hoja === 'Documentacion_Pasantia') {
    return 'Permitir que la página muestre exactamente qué documento/control falta, cuál fue recibido y cuál ya fue validado.';
  }

  if (hoja === 'Control_Cursos') {
    return 'Mostrar el detalle 0/5 a 5/5 de los cursos sin modificar manualmente las notas procesadas.';
  }

  if (hoja === 'Horarios_Postulacion') {
    return 'Conservar la disponibilidad/horario presentado al postular y facilitar su revisión/impresión durante la formalización.';
  }

  if (hoja === 'Control_horarios') {
    return 'Conservar los horarios oficiales de la relación de pasantía y permitir comparar asistencia con el horario vigente.';
  }

  if (hoja === 'Registro_Planner') {
    return 'Conservar cada actividad y su evidencia para horas, períodos, progreso e informes.';
  }

  if (hoja === 'Asistencia_Procesada') {
    return 'Mostrar sesiones de asistencia calculadas y apoyar el control operativo, sin sustituir la evidencia del Planner.';
  }

  if (hoja === 'Control_Periodos') {
    return 'Separar la pasantía en períodos trazables, cerrar automáticamente los intermedios válidos y conservar snapshots históricos, reservando revisión humana para excepciones y cierre final.';
  }

  if (hoja === 'Progreso_Pasantias') {
    return 'Dar a la página los indicadores de avance sin obligar a la persona usuaria a calcularlos.';
  }

  if (hoja === 'Registro_Informes') {
    return 'Saber qué informe existe, en qué estado está y dónde abrir su Google Doc.';
  }

  if (h.indexOf('observ') >= 0) {
    return 'Dejar contexto que ayude a la siguiente persona a entender una excepción o decisión.';
  }

  if (
    h === 'estado periodo' ||
    h === 'estado período' ||
    h === 'estado periodo actual' ||
    h === 'estado período actual'
  ) {
    return 'Indicar si el período todavía no inicia, está en curso, ya terminó y necesita revisión/cierre, o ya quedó cerrado con sus horas finales consolidadas.';
  }

  if (h.indexOf('estado') >= 0) {
    return 'Saber qué acción corresponde después y evitar que la persona administradora tenga que interpretar valores dispersos.';
  }

  if (h.indexOf('fecha') >= 0 || h.indexOf('marca temporal') >= 0) {
    return 'Mantener trazabilidad temporal y aplicar reglas que dependen de fechas.';
  }

  if (h.indexOf('horas') >= 0 || h === 'duracion') {
    return 'Cuantificar tiempo para seguimiento, cierre o cumplimiento según las reglas del módulo.';
  }

  return (
    DDG20_PROPOSITO_HOJA[hoja] ||
    ('Apoyar el proceso operativo de ' + hoja + '.')
  );
}


function DDG20_columnaALetra_(
  numero
) {
  let n =
    Number(
      numero
    );

  let salida =
    '';

  while (
    n > 0
  ) {
    const resto =
      (
        n - 1
      ) %
      26;

    salida =
      String.fromCharCode(
        65 +
        resto
      ) +
      salida;

    n =
      Math.floor(
        (
          n - 1
        ) /
        26
      );
  }

  return salida;
}


function DDG20_norm_(
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

