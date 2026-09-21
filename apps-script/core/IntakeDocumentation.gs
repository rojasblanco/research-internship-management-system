/**
 * ============================================================
 * INTAKE, DOCUMENTATION AND INTERNAL NOTIFICATIONS — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * Este módulo prepara tres piezas del modelo operativo:
 *
 * A) DOCUMENTACIÓN DE PASANTÍA
 *    - Catalogo_Documentos_Pasantia: define el checklist.
 *    - Documentacion_Pasantia: una fila por persona/documento.
 *    - Siempre existe una fila por cada ítem activo del catálogo.
 *    - El portal administrativo puede editar esta tabla mediante
 *      actualizarEstadoDocumentoPasantiaV1().
 *
 * B) SEGUIMIENTO DE INGRESO
 *    - Una fila por postulante.
 *    - Columna M = ¿Tiene horario de postulación vinculado?
 *      Se calcula automáticamente leyendo Horarios_Postulacion.
 *
 * C) AVISO AUTOMÁTICO DE NUEVAS POSTULACIONES
 *    - Se invoca desde el trigger existente de Ingreso_Cursos.
 *    - Envía a responsables configurados un resumen del perfil.
 *    - No incluye sexo, edad, CI ni pasaporte en el correo.
 *    - En el adaptador Google Forms de referencia, los adjuntos se organizan en una carpeta Drive
 *      por postulación, conservando los mismos IDs de archivo.
 *
 * IMPORTANTE
 * - Trabaja junto con IntakeCourses.gs.
 * - NO crea H1.
 * - NO cierra períodos.
 * - Una postulación recibida NO crea todavía una persona en Variables_Internas.
 * - Variables_Internas se crea/actualiza recién cuando la entrevista se marca ACEPTADA.
 * - NO inserta asistentes directos en Variables_Internas.
 * - NO borra hojas ni archivos.
 * ============================================================
 */


/* ============================================================
 * CONFIGURACIÓN
 * ============================================================ */

const RIM_IDN_DB_ID =
  'YOUR_DB_SPREADSHEET_ID';

const RIM_IDN_FORM_ESTANDAR_ID =
  'YOUR_APPLICATION_RESPONSE_SPREADSHEET_ID';

const RIM_IDN_FORM_ESTANDAR_HOJA =
  'Respuestas de formulario 1';

const RIM_IDN_HOJA_VARIABLES =
  'Variables_Internas';

const RIM_IDN_HOJA_SEGUIMIENTO =
  'Seguimiento_Ingreso';

const RIM_IDN_HOJA_CATALOGO_DOCS =
  'Catalogo_Documentos_Pasantia';

const RIM_IDN_HOJA_DOCUMENTOS =
  'Documentacion_Pasantia';

const RIM_IDN_HOJA_CONFIG_ENCARGADOS =
  'Config_Encargados_Componentes';

const RIM_IDN_HOJA_LOG_AVISOS =
  'Log_Notificaciones_Postulaciones';

const RIM_IDN_HOJA_CONFIG =
  'Configuracion';

const RIM_IDN_CONFIG_CARPETA =
  'CARPETA_RAIZ_POSTULACIONES_ID';

const RIM_IDN_CONFIG_DOCS_INICIALIZADA =
  'DOCUMENTATION_CATALOG_INITIALIZED';

const RIM_IDN_ESTADOS_DOCUMENTO = [
  'PENDIENTE',
  'RECIBIDO',
  'VALIDADO',
  'INCOMPLETO',
  'NO_APLICA',
  'SIN_REGISTRO_HISTORICO'
];

/**
 * ============================================================
 * RECIPIENT ROUTING
 * ============================================================
 * Config_Encargados_Componentes is the authoritative routing table.
 * Add, disable or redirect internal recipients in that sheet; do not
 * hard-code names or email addresses in this module.
 * ============================================================
 */

/* ============================================================
 * CATÁLOGO DOCUMENTAL DE REFERENCIA
 * Se usa solo para inicializar una hoja vacía. Una vez creada,
 * Catalogo_Documentos_Pasantia es la fuente administrativa y puede
 * ampliarse sin agregar columnas ni modificar la lógica del checklist.
 * ============================================================ */

function catalogoDocumentosPasantiaV1_() {
  return [
    [
      'DOC01',
      'IDENTIDAD',
      'Copia de documento de identidad',
      'SIEMPRE',
      '',
      'SI'
    ],
    [
      'DOC02',
      'AUTORIZACION',
      'Autorización institucional o académica',
      'SIEMPRE',
      '',
      'SI'
    ],
    [
      'DOC03',
      'PASANTIA',
      'Acuerdo de pasantía firmado',
      'SIEMPRE',
      '',
      'SI'
    ],
    [
      'DOC04',
      'CONFIDENCIALIDAD',
      'Acuerdo de confidencialidad firmado',
      'SIEMPRE',
      '',
      'SI'
    ],
    [
      'DOC05',
      'HORARIO',
      'Horario oficial inicial',
      'SIEMPRE',
      '',
      'SI'
    ],
    [
      'DOC06',
      'EXTENSION',
      'Acuerdo de extensión',
      'EXTENSION',
      '',
      'SI'
    ],
    [
      'DOC07',
      'CIERRE',
      'Carta de culminación entregada',
      'OPCIONAL',
      '',
      'SI'
    ]
  ];
}

/* ============================================================
 * PREPARACIÓN DE INFRAESTRUCTURA
 * ============================================================ */

function prepararInfraestructuraIngresoDocumentacionV1() {
  const ss =
    SpreadsheetApp.openById(
      RIM_IDN_DB_ID
    );

  const seguimiento =
    asegurarHojaConHeadersIDNV1_(
      ss,
      RIM_IDN_HOJA_SEGUIMIENTO,
      headersSeguimientoIngresoIDNV1_()
    );

  const catalogo =
    asegurarHojaConHeadersIDNV1_(
      ss,
      RIM_IDN_HOJA_CATALOGO_DOCS,
      [
        'Código',
        'Grupo',
        'Documento / control',
        'Aplicabilidad',
        'Campo legado',
        'Activo'
      ]
    );

  if (
    catalogo.getLastRow() <= 1
  ) {
    catalogo
      .getRange(
        2,
        1,
        catalogoDocumentosPasantiaV1_().length,
        6
      )
      .setValues(
        catalogoDocumentosPasantiaV1_()
      );
  }

  const documentos =
    asegurarHojaConHeadersIDNV1_(
      ss,
      RIM_IDN_HOJA_DOCUMENTOS,
      headersDocumentacionIDNV1_()
    );

  const configEncargados =
    asegurarHojaConHeadersIDNV1_(
      ss,
      RIM_IDN_HOJA_CONFIG_ENCARGADOS,
      [
        'Componente',
        'Encargado/a',
        'Correo',
        'Activo',
        'Recibe todas las postulaciones',
        'Observación'
      ]
    );

  /*
   * Config_Encargados_Componentes is maintained as configuration data.
   * Infrastructure setup must never clear or rebuild its contents.
   */

  const log =
    asegurarHojaConHeadersIDNV1_(
      ss,
      RIM_IDN_HOJA_LOG_AVISOS,
      [
        'ID notificación',
        'Fecha',
        'Fila formulario',
        'Correo postulante',
        'Nombre postulante',
        'Destinatario',
        'Componente destinatario',
        'Estado',
        'Asunto',
        'Observación'
      ]
    );

  documentos.setFrozenRows(1);
  seguimiento.setFrozenRows(1);
  configEncargados.setFrozenRows(1);
  log.setFrozenRows(1);

  SpreadsheetApp.flush();

  const salida = {
    seguimientoIngreso:
      seguimiento.getName(),
    catalogoDocumentos:
      catalogo.getName(),
    documentos:
      documentos.getName(),
    configEncargados:
      configEncargados.getName(),
    logAvisos:
      log.getName(),
    catalogoItems:
      Math.max(
        catalogo.getLastRow() - 1,
        0
      ),
    escritura:
      true
  };

  console.log(
    '=== INFRAESTRUCTURA INGRESO/DOCUMENTACIÓN V1 ==='
  );
  console.log(
    salida
  );

  return salida;
}


/* ============================================================
 * CARPETA RAÍZ DE POSTULACIONES
 * ============================================================ */

function prepararCarpetaPostulacionesV1() {
  const ss =
    SpreadsheetApp.openById(
      RIM_IDN_DB_ID
    );

  const config =
    asegurarConfiguracionIDNV1_(
      ss
    );

  const existente =
    leerConfigIDNV1_(
      config,
      RIM_IDN_CONFIG_CARPETA
    );

  if (existente) {
    const folder =
      DriveApp.getFolderById(
        existente
      );

    const salidaExistente = {
      creado:
        false,
      id:
        folder.getId(),
      nombre:
        folder.getName(),
      url:
        folder.getUrl()
    };

    console.log(
      salidaExistente
    );

    return salidaExistente;
  }

  const folder =
    DriveApp
      .getRootFolder()
      .createFolder(
        'Internship Applications'
      );

  escribirConfigIDNV1_(
    config,
    RIM_IDN_CONFIG_CARPETA,
    folder.getId()
  );

  const salida = {
    creado:
      true,
    id:
      folder.getId(),
    nombre:
      folder.getName(),
    url:
      folder.getUrl()
  };

  console.log(
    salida
  );

  return salida;
}


/* ============================================================
 * DOCUMENTACIÓN DE PASANTÍA
 * ============================================================ */

function sincronizarDocumentacionPasantiaV1() {
  const ss =
    SpreadsheetApp.openById(
      RIM_IDN_DB_ID
    );

  const variables =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_VARIABLES
    );

  const catalogo =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_CATALOGO_DOCS
    );

  const documentos =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_DOCUMENTOS
    );

  const config =
    asegurarConfiguracionIDNV1_(
      ss
    );

  const inicializacionCompleta =
    normalizarIDNV1_(
      leerConfigIDNV1_(
        config,
        RIM_IDN_CONFIG_DOCS_INICIALIZADA
      )
    ) ===
      'si';

  const personas =
    leerTablaIDNV1_(
      variables
    );

  const items =
    leerCatalogoDocsIDNV1_(
      catalogo
    );

  const existentes =
    indiceDocumentosIDNV1_(
      documentos
    );

  const filasAgregar =
    [];

  let personasProcesadas =
    0;

  let filasExistentes =
    0;

  let filasNuevas =
    0;

  let cambiosAplicabilidad =
    0;

  personas.forEach(
    function(persona) {
      const correo =
        correoIDNV1_(
          valorTablaIDNV1_(
            persona,
            [
              'Correo oficial'
            ]
          )
        );

      if (!correo) {
        return;
      }

      const ruta =
        normalizarIDNV1_(
          valorTablaIDNV1_(
            persona,
            [
              'Ruta de ingreso'
            ]
          )
        );

      if (
        ruta.indexOf(
          'asistente directo'
        ) >= 0
      ) {
        return;
      }

      /*
       * El checklist existe para PASANTES, no para una persona
       * que apenas envió la postulación.
       *
       * Se inicializa cuando:
       * - ya fue ACEPTADA para formalización; o
       * - ya existe una etapa/fecha de pasantía (casos históricos).
       *
       * Así evitamos generar 15 falsos pendientes para postulantes
       * que todavía están en entrevista/cursos.
       */
      const estadoIngreso =
        normalizarIDNV1_(
          valorTablaIDNV1_(
            persona,
            ['Estado de Ingreso']
          )
        );

      const estadoPasantia =
        normalizarIDNV1_(
          valorTablaIDNV1_(
            persona,
            ['Estado de pasantía']
          )
        );

      const fechaInicioPasantia =
        valorTablaIDNV1_(
          persona,
          ['Fecha inicio (Pasantía)']
        );

      const aplicaChecklist =
        (
          estadoIngreso ===
            'aceptado' ||
          !!estadoPasantia ||
          tieneValorIDNV1_(
            fechaInicioPasantia
          )
        );

      if (!aplicaChecklist) {
        return;
      }

      personasProcesadas++;

      const nombre =
        textoIDNV1_(
          valorTablaIDNV1_(
            persona,
            [
              'Nombre del Pasante',
              'Nombre'
            ]
          )
        );

      const tieneExtension =
        tieneValorIDNV1_(
          valorTablaIDNV1_(
            persona,
            [
              'Fecha inicio (Extensión)'
            ]
          )
        );

      const cantidadHorarios =
        contarHorariosOficialesIDNV1_(
          ss,
          correo
        );

      items.forEach(
        function(item) {
          const key =
            correo +
            '|' +
            item.codigo;

          const aplica =
            evaluarAplicabilidadDocIDNV1_(
              item.aplicabilidad,
              tieneExtension,
              cantidadHorarios
            );

          const encontrado =
            existentes[
              key
            ];

          if (encontrado) {
            filasExistentes++;

            if (
              aplica &&
              normalizarIDNV1_(
                encontrado.estado
              ) ===
                'no_aplica'
            ) {
              documentos
                .getRange(
                  encontrado.fila,
                  encontrado.colEstado
                )
                .setValue(
                  'PENDIENTE'
                );

              documentos
                .getRange(
                  encontrado.fila,
                  encontrado.colAplica
                )
                .setValue(
                  'SI'
                );

              documentos
                .getRange(
                  encontrado.fila,
                  encontrado.colActualizacion
                )
                .setValue(
                  new Date()
                );

              cambiosAplicabilidad++;
            }

            return;
          }

          const estadoLegado =
            item.campoLegado
              ? textoIDNV1_(
                  valorTablaIDNV1_(
                    persona,
                    [
                      item.campoLegado
                    ]
                  )
                )
              : '';

          let estado =
            mapearEstadoDocumentoLegadoIDNV1_(
              estadoLegado
            );

          if (!aplica) {
            estado =
              'NO_APLICA';

          } else if (!estado) {
            /*
             * Durante la migración inicial, un vacío antiguo NO
             * significa que el documento faltaba: significa que
             * no existe registro histórico confiable.
             *
             * Una vez inicializado el sistema V2, los nuevos
             * checklist sí nacen como PENDIENTE.
             */
            estado =
              inicializacionCompleta
                ? 'PENDIENTE'
                : 'SIN_REGISTRO_HISTORICO';
          }

          filasAgregar.push([
            correo,
            nombre,
            item.codigo,
            item.grupo,
            item.documento,
            aplica
              ? 'SI'
              : 'NO',
            estado,
            '',
            '',
            '',
            '',
            item.campoLegado,
            estadoLegado
              ? (
                  'Estado inicial migrado desde el campo legado "' +
                  item.campoLegado +
                  '".'
                )
              : (
                  inicializacionCompleta
                    ? 'Fila creada automáticamente para nuevo ingreso.'
                    : 'Sin registro histórico confiable en la base anterior.'
                )
          ]);

          filasNuevas++;
        }
      );
    }
  );

  if (
    filasAgregar.length
  ) {
    documentos
      .getRange(
        documentos.getLastRow() + 1,
        1,
        filasAgregar.length,
        headersDocumentacionIDNV1_().length
      )
      .setValues(
        filasAgregar
      );
  }

  SpreadsheetApp.flush();

  const salida = {
    personasProcesadas:
      personasProcesadas,
    itemsCatalogo:
      items.length,
    filasNuevas:
      filasNuevas,
    filasExistentes:
      filasExistentes,
    cambiosAplicabilidad:
      cambiosAplicabilidad,
    escritura:
      true
  };

  console.log(
    '=== SINCRONIZACIÓN DOCUMENTACIÓN PASANTÍA V1 ==='
  );
  console.log(
    salida
  );

  return salida;
}



/**
 * NORMALIZACIÓN ÚNICA DESPUÉS DE LA PRIMERA MIGRACIÓN.
 *
 * El primer V1 ya creó los checklist existentes. En los casos
 * donde el campo legado estaba vacío, "PENDIENTE" no es una
 * conclusión histórica válida. Esta función los convierte a
 * SIN_REGISTRO_HISTORICO y luego marca la inicialización V2
 * como completada. A partir de entonces, nuevos ingresos sí
 * nacen como PENDIENTE.
 */
/**
 * Función prevista para la página web.
 *
 * Ejemplo:
 * actualizarEstadoDocumentoPasantiaV1(
 *   'person@example.org',
 *   'DOC05',
 *   'RECIBIDO',
 *   'Entregado en oficina',
 *   'user@example.org'
 * )
 */
function actualizarEstadoDocumentoPasantiaV1(
  correo,
  codigoDocumento,
  estado,
  observacion,
  usuario
) {
  const estadoNormalizado =
    normalizarEstadoDocumentoIDNV1_(
      estado
    );

  if (
    RIM_IDN_ESTADOS_DOCUMENTO.indexOf(
      estadoNormalizado
    ) < 0
  ) {
    throw new Error(
      'Estado de documento no permitido: ' +
      estado
    );
  }

  const ss =
    SpreadsheetApp.openById(
      RIM_IDN_DB_ID
    );

  const hoja =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_DOCUMENTOS
    );

  const tabla =
    leerTablaIDNV1_(
      hoja
    );

  const correoN =
    correoIDNV1_(
      correo
    );

  const codigoN =
    textoIDNV1_(
      codigoDocumento
    ).toUpperCase();

  const fila =
    tabla.find(
      function(item) {
        return (
          correoIDNV1_(
            valorTablaIDNV1_(
              item,
              ['Correo oficial']
            )
          ) ===
            correoN &&
          textoIDNV1_(
            valorTablaIDNV1_(
              item,
              ['Código documento']
            )
          ).toUpperCase() ===
            codigoN
        );
      }
    );

  if (!fila) {
    throw new Error(
      'No existe el documento ' +
      codigoN +
      ' para ' +
      correoN +
      '. Ejecuta sincronizarDocumentacionPasantiaV1().'
    );
  }

  const headers =
    fila.headers;

  const rowNumber =
    fila.fila;

  escribirPorHeaderIDNV1_(
    hoja,
    rowNumber,
    headers,
    'Estado',
    estadoNormalizado
  );

  escribirPorHeaderIDNV1_(
    hoja,
    rowNumber,
    headers,
    'Observación',
    observacion || ''
  );

  escribirPorHeaderIDNV1_(
    hoja,
    rowNumber,
    headers,
    'Actualizado por',
    usuario || Session.getActiveUser().getEmail() || ''
  );

  escribirPorHeaderIDNV1_(
    hoja,
    rowNumber,
    headers,
    'Última actualización',
    new Date()
  );

  if (
    estadoNormalizado ===
      'RECIBIDO' ||
    estadoNormalizado ===
      'VALIDADO'
  ) {
    const actual =
      valorTablaIDNV1_(
        fila,
        ['Fecha recepción']
      );

    if (!tieneValorIDNV1_(actual)) {
      escribirPorHeaderIDNV1_(
        hoja,
        rowNumber,
        headers,
        'Fecha recepción',
        new Date()
      );
    }
  }

  if (
    estadoNormalizado ===
      'VALIDADO'
  ) {
    escribirPorHeaderIDNV1_(
      hoja,
      rowNumber,
      headers,
      'Fecha validación',
      new Date()
    );
  }

  SpreadsheetApp.flush();

  return {
    correo:
      correoN,
    codigoDocumento:
      codigoN,
    estado:
      estadoNormalizado,
    escritura:
      true
  };
}


function obtenerDocumentacionPasantiaV1(
  correo
) {
  const ss =
    SpreadsheetApp.openById(
      RIM_IDN_DB_ID
    );

  const hoja =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_DOCUMENTOS
    );

  const correoN =
    correoIDNV1_(
      correo
    );

  return leerTablaIDNV1_(
    hoja
  )
    .filter(
      function(item) {
        return (
          correoIDNV1_(
            valorTablaIDNV1_(
              item,
              ['Correo oficial']
            )
          ) ===
          correoN
        );
      }
    )
    .map(
      function(item) {
        return {
          codigo:
            valorTablaIDNV1_(
              item,
              ['Código documento']
            ),
          grupo:
            valorTablaIDNV1_(
              item,
              ['Grupo']
            ),
          documento:
            valorTablaIDNV1_(
              item,
              ['Documento / control']
            ),
          aplica:
            valorTablaIDNV1_(
              item,
              ['Aplica']
            ),
          estado:
            valorTablaIDNV1_(
              item,
              ['Estado']
            ),
          fechaRecepcion:
            valorTablaIDNV1_(
              item,
              ['Fecha recepción']
            ),
          fechaValidacion:
            valorTablaIDNV1_(
              item,
              ['Fecha validación']
            ),
          actualizadoPor:
            valorTablaIDNV1_(
              item,
              ['Actualizado por']
            ),
          observacion:
            valorTablaIDNV1_(
              item,
              ['Observación']
            )
        };
      }
    );
}


/* ============================================================
 * SEGUIMIENTO DE INGRESO
 * ============================================================ */

function sincronizarSeguimientoIngresoV1() {
  const ss =
    SpreadsheetApp.openById(
      RIM_IDN_DB_ID
    );

  const variables =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_VARIABLES
    );

  const seguimiento =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_SEGUIMIENTO
    );

  const personas =
    leerTablaIDNV1_(
      variables
    );

  const existentes =
    indiceUnaFilaPorCorreoTablaIDNV1_(
      seguimiento
    );

  let creados =
    0;

  let actualizados =
    0;

  personas.forEach(
    function(persona) {
      const correo =
        correoIDNV1_(
          valorTablaIDNV1_(
            persona,
            ['Correo oficial']
          )
        );

      if (!correo) {
        return;
      }

      const ruta =
        normalizarIDNV1_(
          valorTablaIDNV1_(
            persona,
            ['Ruta de ingreso']
          )
        );

      if (
        ruta.indexOf(
          'asistente directo'
        ) >= 0
      ) {
        return;
      }

      const nombre =
        valorTablaIDNV1_(
          persona,
          [
            'Nombre del Pasante',
            'Nombre'
          ]
        );

      const cursos =
        resumenCursosDesdeControlIDNV1_(
          ss,
          correo
        );

      const estadoHorario =
        estadoHorarioPostulacionIDNV1_(
          ss,
          correo
        );

      const valoresBase = {
        'Correo oficial':
          correo,
        'Nombre':
          nombre,
        'Ruta de ingreso':
          valorTablaIDNV1_(
            persona,
            ['Ruta de ingreso']
          ),
        'Resultado entrevista':
          valorTablaIDNV1_(
            persona,
            ['Estado']
          ),
        'Estado de ingreso':
          valorTablaIDNV1_(
            persona,
            ['Estado de Ingreso']
          ),
        'Cursos aprobados':
          cursos.aprobados,
        'Cursos requeridos':
          cursos.requeridos,
        'Estado inducción':
          cursos.estado,
        'Fecha completado cursos':
          valorTablaIDNV1_(
            persona,
            ['Fecha completado cursos']
          ),
        '¿Tiene horario de postulación vinculado?':
          estadoHorario,
        'Estado formalización':
          tieneValorIDNV1_(
            valorTablaIDNV1_(
              persona,
              ['Fecha inicio (Pasantía)']
            )
          )
            ? 'FORMALIZADA'
            : 'PENDIENTE'
      };

      const existente =
        existentes[
          correo
        ];

      if (!existente) {
        const row =
          headersSeguimientoIngresoIDNV1_().map(
            function(header) {
              return Object.prototype.hasOwnProperty.call(
                valoresBase,
                header
              )
                ? valoresBase[
                    header
                  ]
                : '';
            }
          );

        seguimiento
          .appendRow(
            row
          );

        creados++;

        return;
      }

      Object.keys(
        valoresBase
      ).forEach(
        function(header) {
          escribirPorHeaderIDNV1_(
            seguimiento,
            existente.fila,
            existente.headers,
            header,
            valoresBase[
              header
            ]
          );
        }
      );

      actualizados++;
    }
  );

  SpreadsheetApp.flush();

  const salida = {
    creados:
      creados,
    actualizados:
      actualizados,
    escritura:
      true
  };

  console.log(
    '=== SINCRONIZACIÓN SEGUIMIENTO INGRESO V1 ==='
  );
  console.log(
    salida
  );

  return salida;
}


/* ============================================================
 * DIAGNÓSTICO DE DESTINATARIOS — SOLO LECTURA
 * ============================================================ */

function diagnosticarConfigEncargadosComponentesV1() {
  const ss =
    SpreadsheetApp.openById(
      RIM_IDN_DB_ID
    );

  const hoja =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_CONFIG_ENCARGADOS
    );

  const tabla =
    leerTablaIDNV1_(
      hoja
    );

  const activos =
    [];

  const inactivos =
    [];

  const invalidos =
    [];

  tabla.forEach(
    function(item) {
      const componente =
        textoIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Componente']
          )
        );

      const encargado =
        textoIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Encargado/a']
          )
        );

      const correo =
        correoIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Correo']
          )
        );

      const activo =
        normalizarIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Activo']
          )
        );

      const todas =
        normalizarIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Recibe todas las postulaciones']
          )
        );

      if (
        !componente &&
        !encargado &&
        !correo
      ) {
        return;
      }

      const obj = {
        fila:
          item.fila,
        componente:
          componente,
        encargado:
          encargado,
        correo:
          correo,
        activo:
          activo,
        recibeTodas:
          todas
      };

      const correoValido =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          correo
        );

      if (!correoValido) {
        invalidos.push(
          obj
        );
        return;
      }

      if (
        activo ===
          'si' ||
        activo ===
          'sí' ||
        activo ===
          'true'
      ) {
        activos.push(
          obj
        );
      } else {
        inactivos.push(
          obj
        );
      }
    }
  );

  const salida = {
    activos:
      activos,
    inactivos:
      inactivos,
    invalidos:
      invalidos,
    cantidadActivos:
      activos.length,
    escritura:
      false
  };

  console.log(
    '=== DIAGNÓSTICO CONFIG ENCARGADOS V1 ==='
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


/* ============================================================
 * NOTIFICACIONES DE NUEVA POSTULACIÓN
 * ============================================================ */

/**
 * Permite probar una fila sin enviar correos.
 */
function diagnosticarUltimaPostulacionV1() {
  const ssFuente =
    SpreadsheetApp.openById(
      RIM_IDN_FORM_ESTANDAR_ID
    );

  const hoja =
    ssFuente.getSheetByName(
      RIM_IDN_FORM_ESTANDAR_HOJA
    );

  if (
    !hoja ||
    hoja.getLastRow() < 2
  ) {
    throw new Error(
      'No existen postulaciones para diagnosticar.'
    );
  }

  return diagnosticarAvisoPostulacionV1(
    hoja.getLastRow()
  );
}


function diagnosticarPostulacionPorCorreoV1(
  correo
) {
  const ssFuente =
    SpreadsheetApp.openById(
      RIM_IDN_FORM_ESTANDAR_ID
    );

  const hoja =
    ssFuente.getSheetByName(
      RIM_IDN_FORM_ESTANDAR_HOJA
    );

  if (
    !hoja ||
    hoja.getLastRow() < 2
  ) {
    throw new Error(
      'No existen postulaciones para diagnosticar.'
    );
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
    mapaFlexibleHeadersIDNV1_(
      headers
    );

  const datos =
    hoja
      .getRange(
        2,
        1,
        hoja.getLastRow() - 1,
        lastCol
      )
      .getValues();

  const correoN =
    correoIDNV1_(
      correo
    );

  for (
    let i = datos.length - 1;
    i >= 0;
    i--
  ) {
    const perfil =
      construirPerfilPostulanteIDNV1_(
        datos[i],
        mapa
      );

    if (
      perfil.correo ===
        correoN
    ) {
      return diagnosticarAvisoPostulacionV1(
        i + 2
      );
    }
  }

  throw new Error(
    'No se encontró una respuesta del formulario para ' +
    correoN +
    '.'
  );
}


function diagnosticarAvisoPostulacionV1(
  fila
) {
  const ssFuente =
    SpreadsheetApp.openById(
      RIM_IDN_FORM_ESTANDAR_ID
    );

  const fuente =
    ssFuente.getSheetByName(
      RIM_IDN_FORM_ESTANDAR_HOJA
    );

  if (
    !fuente ||
    fila < 2 ||
    fila > fuente.getLastRow()
  ) {
    throw new Error(
      'Fila de postulación no válida.'
    );
  }

  const lastCol =
    fuente.getLastColumn();

  const headers =
    fuente
      .getRange(
        1,
        1,
        1,
        lastCol
      )
      .getDisplayValues()[0];

  const mapa =
    mapaFlexibleHeadersIDNV1_(
      headers
    );

  const row =
    fuente
      .getRange(
        fila,
        1,
        1,
        lastCol
      )
      .getValues()[0];

  const perfil =
    construirPerfilPostulanteIDNV1_(
      row,
      mapa
    );

  const componentes =
    obtenerComponentesInteresIDNV1_(
      row,
      mapa
    );

  const ss =
    SpreadsheetApp.openById(
      RIM_IDN_DB_ID
    );

  const destinatarios =
    obtenerDestinatariosPostulacionIDNV1_(
      ss,
      componentes
    );

  const adjuntos =
    inspeccionarAdjuntosPostulacionIDNV1_(
      perfil
    );

  const salida = {
    fila:
      fila,
    correoPostulante:
      perfil.correo,
    nombre:
      perfil.nombre,
    universidad:
      perfil.universidad,
    carrera:
      perfil.carrera,
    semestre:
      perfil.semestre,
    horasSemana:
      perfil.horasSemana,
    componentesDetectados:
      componentes,
    destinatarios:
      destinatarios,
    adjuntos:
      adjuntos,
    enviariaCorreo:
      false,
    escritura:
      false
  };

  console.log(
    '=== DIAGNÓSTICO AVISO POSTULACIÓN V1 — SOLO LECTURA ==='
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


function notificarFilaPostulacionV1_(
  fila,
  enviar
) {
  const ssFuente =
    SpreadsheetApp.openById(
      RIM_IDN_FORM_ESTANDAR_ID
    );

  const fuente =
    ssFuente.getSheetByName(
      RIM_IDN_FORM_ESTANDAR_HOJA
    );

  if (
    !fuente ||
    fila < 2 ||
    fila > fuente.getLastRow()
  ) {
    throw new Error(
      'Fila de postulación no válida.'
    );
  }

  const lastCol =
    fuente.getLastColumn();

  const headers =
    fuente
      .getRange(
        1,
        1,
        1,
        lastCol
      )
      .getDisplayValues()[0];

  const mapa =
    mapaFlexibleHeadersIDNV1_(
      headers
    );

  const row =
    fuente
      .getRange(
        fila,
        1,
        1,
        lastCol
      )
      .getValues()[0];

  const perfil =
    construirPerfilPostulanteIDNV1_(
      row,
      mapa
    );

  if (!perfil.correo) {
    throw new Error(
      'La postulación no contiene un correo identificable.'
    );
  }

  const ss =
    SpreadsheetApp.openById(
      RIM_IDN_DB_ID
    );

  const seguimiento =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_SEGUIMIENTO
    );

  const organizacion =
    organizarAdjuntosPostulacionIDNV1_(
      ss,
      fila,
      perfil
    );

  const componentes =
    obtenerComponentesInteresIDNV1_(
      row,
      mapa
    );

  const destinatarios =
    obtenerDestinatariosPostulacionIDNV1_(
      ss,
      componentes
    );

  const timestamp =
    perfil.timestamp
      ? perfil.timestamp
      : new Date();

  const idBase =
    [
      'POST',
      fila,
      perfil.correo,
      Utilities.formatDate(
        new Date(timestamp),
        Session.getScriptTimeZone() ||
          'America/La_Paz',
        'yyyyMMddHHmmss'
      )
    ].join(
      '|'
    );

  const asunto =
    '[Nueva postulación] ' +
    perfil.nombre +
    ' - revisar perfil y coordinar entrevista';

  const html =
    construirCorreoPostulacionHTMLIDNV1_(
      perfil,
      organizacion,
      componentes
    );

  const log =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_LOG_AVISOS
    );

  const yaEnviados =
    indiceNotificacionesEnviadasIDNV1_(
      log,
      idBase
    );

  const resultados =
    [];

  destinatarios.forEach(
    function(dest) {
      const correoDestino =
        correoIDNV1_(
          dest.correo
        );

      if (!correoDestino) {
        return;
      }

      if (
        yaEnviados[
          correoDestino
        ]
      ) {
        resultados.push({
          correo:
            correoDestino,
          estado:
            'YA_ENVIADO'
        });

        return;
      }

      let estado =
        'DIAGNOSTICO';

      let observacion =
        '';

      if (enviar) {
        try {
          MailApp.sendEmail({
            to:
              correoDestino,
            subject:
              asunto,
            htmlBody:
              html,
            name:
              'Centro Research Internship Management System'
          });

          estado =
            'ENVIADO';

        } catch (error) {
          estado =
            'ERROR';

          observacion =
            error &&
            error.message
              ? error.message
              : String(error);
        }
      }

      if (enviar) {
        log.appendRow([
          idBase,
          new Date(),
          fila,
          perfil.correo,
          perfil.nombre,
          correoDestino,
          dest.componente,
          estado,
          asunto,
          observacion
        ]);
      }

      resultados.push({
        correo:
          correoDestino,
        componente:
          dest.componente,
        estado:
          estado,
        observacion:
          observacion
      });
    }
  );

  const estadoAviso =
    !destinatarios.length
      ? 'PENDIENTE_CONFIGURACION_DESTINATARIOS'
      : (
          enviar
            ? (
                resultados.some(
                  function(x) {
                    return x.estado ===
                      'ERROR';
                  }
                )
                  ? 'ENVIADO_CON_ERRORES'
                  : 'ENVIADO'
              )
            : 'DIAGNOSTICO'
        );

  actualizarSeguimientoDesdePostulacionIDNV1_(
    seguimiento,
    fila,
    idBase,
    perfil,
    organizacion,
    estadoAviso,
    destinatarios
  );

  const salida = {
    fila:
      fila,
    correoPostulante:
      perfil.correo,
    nombre:
      perfil.nombre,
    componentesDetectados:
      componentes,
    destinatarios:
      destinatarios,
    carpeta:
      organizacion.carpetaUrl,
    archivos:
      organizacion.archivos,
    estadoAviso:
      estadoAviso,
    enviar:
      enviar
  };

  console.log(
    '=== AVISO NUEVA POSTULACIÓN V1 ==='
  );
  console.log(
    salida
  );

  return salida;
}


/* ============================================================
 * DESTINATARIOS
 * ============================================================ */

function obtenerDestinatariosPostulacionIDNV1_(
  ss,
  componentes
) {
  const hoja =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_CONFIG_ENCARGADOS
    );

  const tabla =
    leerTablaIDNV1_(
      hoja
    );

  const comps =
    componentes.map(
      normalizarIDNV1_
    );

  const salida =
    [];

  tabla.forEach(
    function(item) {
      const activo =
        normalizarIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Activo']
          )
        );

      if (
        activo !==
          'si' &&
        activo !==
          'sí' &&
        activo !==
          'true'
      ) {
        return;
      }

      const correo =
        correoIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Correo']
          )
        );

      if (!correo) {
        return;
      }

      const componente =
        textoIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Componente']
          )
        );

      const recibeTodas =
        normalizarIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Recibe todas las postulaciones']
          )
        );

      const recibeTodo =
        (
          recibeTodas ===
            'si' ||
          recibeTodas ===
            'sí' ||
          recibeTodas ===
            'true'
        );

      const coincide =
        comps.length
          ? comps.some(
              function(c) {
                return (
                  c &&
                  normalizarIDNV1_(
                    componente
                  ).indexOf(
                    c
                  ) >= 0
                );
              }
            )
          : false;

      if (
        recibeTodo ||
        coincide
      ) {
        salida.push({
          componente:
            componente || 'GENERAL',
          encargado:
            valorTablaIDNV1_(
              item,
              ['Encargado/a']
            ),
          correo:
            correo
        });
      }
    }
  );

  /*
   * Si el formulario actual no pregunta componente,
   * únicamente se usan filas marcadas "Recibe todas".
   */
  return deduplicarDestinatariosIDNV1_(
    salida
  );
}


/* ============================================================
 * INSPECCIÓN DE ADJUNTOS — SOLO LECTURA
 * ============================================================ */

function inspeccionarAdjuntosPostulacionIDNV1_(
  perfil
) {
  const salida =
    [];

  perfil.adjuntos.forEach(
    function(adjunto) {
      extraerIdsDriveIDNV1_(
        adjunto.valor
      ).forEach(
        function(id) {
          try {
            const file =
              DriveApp.getFileById(
                id
              );

            salida.push({
              tipo:
                adjunto.tipo,
              id:
                id,
              nombre:
                file.getName(),
              url:
                file.getUrl(),
              accesible:
                true
            });

          } catch (error) {
            salida.push({
              tipo:
                adjunto.tipo,
              id:
                id,
              nombre:
                '',
              url:
                '',
              accesible:
                false,
              error:
                error &&
                error.message
                  ? error.message
                  : String(error)
            });
          }
        }
      );
    }
  );

  return salida;
}


/* ============================================================
 * ORGANIZACIÓN DE ADJUNTOS — ADAPTADOR GOOGLE FORMS DE REFERENCIA
 * ============================================================ */

function organizarAdjuntosPostulacionIDNV1_(
  ss,
  fila,
  perfil
) {
  const config =
    asegurarConfiguracionIDNV1_(
      ss
    );

  let rootId =
    leerConfigIDNV1_(
      config,
      RIM_IDN_CONFIG_CARPETA
    );

  if (!rootId) {
    const creado =
      prepararCarpetaPostulacionesV1();

    rootId =
      creado.id;
  }

  const root =
    DriveApp.getFolderById(
      rootId
    );

  const nombreCarpeta =
    [
      'POST',
      fila,
      limpiarNombreArchivoIDNV1_(
        perfil.nombre ||
        perfil.correo
      )
    ].join(
      ' - '
    );

  let carpeta =
    null;

  const existentes =
    root.getFoldersByName(
      nombreCarpeta
    );

  if (
    existentes.hasNext()
  ) {
    carpeta =
      existentes.next();

  } else {
    carpeta =
      root.createFolder(
        nombreCarpeta
      );
  }

  const archivos =
    [];

  perfil.adjuntos.forEach(
    function(adjunto) {
      extraerIdsDriveIDNV1_(
        adjunto.valor
      ).forEach(
        function(id) {
          try {
            const file =
              DriveApp.getFileById(
                id
              );

            /*
             * El ID NO cambia al mover el archivo.
             * Por eso Ingreso_Cursos puede seguir vinculando el PDF
             * aunque el archivo se organice en esta carpeta.
             */
            try {
              file.moveTo(
                carpeta
              );
            } catch (moveError) {
              /*
               * Si Drive no permite mover por permisos/Shared Drive,
               * no se borra ni se rompe el archivo; solo queda en
               * su carpeta original.
               */
            }

            archivos.push({
              tipo:
                adjunto.tipo,
              id:
                id,
              nombre:
                file.getName(),
              url:
                file.getUrl()
            });

          } catch (error) {
            archivos.push({
              tipo:
                adjunto.tipo,
              id:
                id,
              nombre:
                '',
              url:
                '',
              error:
                error &&
                error.message
                  ? error.message
                  : String(error)
            });
          }
        }
      );
    }
  );

  return {
    carpetaId:
      carpeta.getId(),
    carpetaUrl:
      carpeta.getUrl(),
    carpetaNombre:
      carpeta.getName(),
    archivos:
      archivos
  };
}


/* ============================================================
 * PERFIL DEL POSTULANTE
 * ============================================================ */

function construirPerfilPostulanteIDNV1_(
  row,
  mapa
) {
  const primerNombre =
    valorFlexibleIDNV1_(
      row,
      mapa,
      [
        'Primer nombre'
      ]
    );

  const segundoNombre =
    valorFlexibleIDNV1_(
      row,
      mapa,
      [
        'Segundo nombre'
      ]
    );

  const primerApellido =
    valorFlexibleIDNV1_(
      row,
      mapa,
      [
        'Primer Apellido'
      ]
    );

  const segundoApellido =
    valorFlexibleIDNV1_(
      row,
      mapa,
      [
        'Segundo Apellido'
      ]
    );

  const nombre =
    [
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido
    ]
      .map(
        textoIDNV1_
      )
      .filter(
        Boolean
      )
      .join(
        ' '
      );

  return {
    timestamp:
      valorFlexibleIDNV1_(
        row,
        mapa,
        [
          'Marca temporal'
        ]
      ),

    correo:
      correoIDNV1_(
        valorFlexibleIDNV1_(
          row,
          mapa,
          [
            'Correo (institucional de preferencia)',
            'Correo electrónico',
            'Correo'
          ]
        )
      ),

    nombre:
      nombre,

    orcid:
      valorFlexibleIDNV1_(
        row,
        mapa,
        ['ORCID']
      ),

    celular:
      valorFlexibleIDNV1_(
        row,
        mapa,
        [
          'N° de celular',
          'Nº de celular',
          'Número de celular'
        ]
      ),

    ciudad:
      valorFlexibleIDNV1_(
        row,
        mapa,
        ['Ciudad de origen']
      ),

    universidad:
      valorFlexibleIDNV1_(
        row,
        mapa,
        ['Universidad']
      ),

    carrera:
      valorFlexibleIDNV1_(
        row,
        mapa,
        ['Carrera']
      ),

    semestre:
      valorFlexibleIDNV1_(
        row,
        mapa,
        ['Semestre']
      ),

    horasSemana:
      valorFlexibleIDNV1_(
        row,
        mapa,
        [
          'Horas a la semana disponible (mayor a 12hrs semanales, solo en número)',
          'Horas a la semana disponible'
        ]
      ),

    adjuntos: [
      {
        tipo:
          'CV',
        valor:
          valorFlexibleIDNV1_(
            row,
            mapa,
            [
              'CV en formato PDF o Documento'
            ]
          )
      },
      {
        tipo:
          'CI',
        valor:
          valorFlexibleIDNV1_(
            row,
            mapa,
            [
              'Fotocopia de carnet de identidad En formato PDF',
              'Fotocopia de carnet de identidad'
            ]
          )
      },
      {
        tipo:
          'HORARIO',
        valor:
          valorFlexibleIDNV1_(
            row,
            mapa,
            [
              'Para generar tu horario, ingresa al siguiente enlace, selecciona tus horas, descarga el PDF y súbelo aquí (debes cumplir mínimo 12hrs semanales):'
            ]
          )
      }
    ].filter(
      function(x) {
        return tieneValorIDNV1_(
          x.valor
        );
      }
    )
  };
}


function obtenerComponentesInteresIDNV1_(
  row,
  mapa
) {
  const valor =
    valorFlexibleIDNV1_(
      row,
      mapa,
      [
        'Componente de interés',
        'Componentes de interés',
        'Componente(s) de interés',
        'Área de interés',
        'Área/componente de interés'
      ]
    );

  if (!valor) {
    return [];
  }

  return String(
    valor
  )
    .split(
      /[,;\n]+/
    )
    .map(
      textoIDNV1_
    )
    .filter(
      Boolean
    );
}


/* ============================================================
 * CORREO
 * ============================================================ */

function construirCorreoPostulacionHTMLIDNV1_(
  perfil,
  organizacion,
  componentes
) {
  const archivos =
    organizacion.archivos
      .filter(
        function(x) {
          return x.url;
        }
      )
      .map(
        function(x) {
          return (
            '<li><a href="' +
            escaparHtmlIDNV1_(
              x.url
            ) +
            '" target="_blank">' +
            escaparHtmlIDNV1_(
              x.tipo +
              ' - ' +
              x.nombre
            ) +
            '</a></li>'
          );
        }
      )
      .join(
        ''
      );

  const comps =
    componentes.length
      ? componentes.join(
          ', '
        )
      : 'No especificado en el formulario actual';

  return [
    '<div style="font-family:Arial,sans-serif;max-width:760px;color:#1f2937">',
    '<h2 style="color:#174777;margin-bottom:8px">Nueva postulación de pasantía</h2>',

    '<p>Se recibió una nueva postulación. Por favor revisa el perfil y coordina la entrevista directamente con la persona postulante.</p>',

    '<table style="border-collapse:collapse;width:100%;font-size:14px">',
    filaHtmlIDNV1_(
      'Nombre',
      perfil.nombre
    ),
    filaHtmlIDNV1_(
      'Correo',
      perfil.correo
    ),
    filaHtmlIDNV1_(
      'Celular',
      perfil.celular
    ),
    filaHtmlIDNV1_(
      'Ciudad de origen',
      perfil.ciudad
    ),
    filaHtmlIDNV1_(
      'Universidad',
      perfil.universidad
    ),
    filaHtmlIDNV1_(
      'Carrera',
      perfil.carrera
    ),
    filaHtmlIDNV1_(
      'Semestre',
      perfil.semestre
    ),
    filaHtmlIDNV1_(
      'ORCID',
      perfil.orcid
    ),
    filaHtmlIDNV1_(
      'Disponibilidad semanal declarada',
      perfil.horasSemana
        ? perfil.horasSemana +
          ' h/semana'
        : ''
    ),
    filaHtmlIDNV1_(
      'Componente(s) de interés',
      comps
    ),
    '</table>',

    '<h3 style="color:#174777">Documentos de postulación</h3>',

    archivos
      ? '<ul>' +
        archivos +
        '</ul>'
      : '<p>No se identificaron links de archivos en esta ejecución.</p>',

    '<p><strong>Carpeta de la postulación:</strong> ' +
      '<a href="' +
      escaparHtmlIDNV1_(
        organizacion.carpetaUrl
      ) +
      '" target="_blank">Abrir carpeta</a></p>',

    '<p><a href="mailto:' +
      escaparHtmlIDNV1_(
        perfil.correo
      ) +
      '?subject=' +
      encodeURIComponent(
        'Coordinación de entrevista de pasantía - Centro Research Internship Management System'
      ) +
      '">Escribir a la persona postulante</a></p>',

    '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">',

    '<p style="font-size:12px;color:#6b7280">' +
      'Este correo es un aviso interno de coordinación. ' +
      'No se incluyen sexo, edad, CI ni pasaporte para la revisión inicial del perfil.' +
      '</p>',

    '</div>'
  ].join(
    ''
  );
}


/* ============================================================
 * ACTUALIZAR SEGUIMIENTO DESDE LA POSTULACIÓN
 * ============================================================ */

function actualizarSeguimientoDesdePostulacionIDNV1_(
  hoja,
  filaFormulario,
  idPostulacion,
  perfil,
  organizacion,
  estadoAviso,
  destinatarios
) {
  const existentes =
    indiceUnaFilaPorCorreoTablaIDNV1_(
      hoja
    );

  const correo =
    perfil.correo;

  let item =
    existentes[
      correo
    ];

  let creado =
    false;

  if (!item) {
    const row =
      new Array(
        headersSeguimientoIngresoIDNV1_().length
      ).fill(
        ''
      );

    hoja.appendRow(
      row
    );

    item = {
      fila:
        hoja.getLastRow(),
      headers:
        mapaHeadersIDNV1_(
          headersSeguimientoIngresoIDNV1_()
        )
    };

    creado =
      true;
  }

  const estadoHorario =
    estadoHorarioPostulacionIDNV1_(
      SpreadsheetApp.openById(
        RIM_IDN_DB_ID
      ),
      correo
    );

  const resultadoEntrevistaActual =
    valorCeldaPorHeaderIDNV1_(
      hoja,
      item.fila,
      item.headers,
      'Resultado entrevista'
    );

  const estadoIngresoActual =
    valorCeldaPorHeaderIDNV1_(
      hoja,
      item.fila,
      item.headers,
      'Estado de ingreso'
    );

  const programacionActual =
    valorCeldaPorHeaderIDNV1_(
      hoja,
      item.fila,
      item.headers,
      'Estado programación entrevista'
    );

  const valores = {
    'Correo oficial':
      correo,
    'Nombre':
      perfil.nombre,
    'Ruta de ingreso':
      'PASANTÍA ESTÁNDAR',
    '¿Tiene horario de postulación vinculado?':
      estadoHorario,
    'ID carpeta postulación':
      organizacion.carpetaId,
    'URL carpeta postulación':
      organizacion.carpetaUrl,
    'Estado aviso encargados':
      estadoAviso,
    'Fecha aviso encargados':
      new Date(),
    'Destinatarios aviso':
      destinatarios
        .map(
          function(x) {
            return x.correo;
          }
        )
        .join(
          ', '
        ),
    'ID postulación':
      idPostulacion || '',
    'Fila formulario':
      filaFormulario || '',
    'Marca temporal':
      perfil.timestamp || ''
  };

  /*
   * Solo inicializamos estados de preselección.
   * Un reproceso NO debe borrar una entrevista ya registrada.
   */
  if (
    creado ||
    !tieneValorIDNV1_(
      estadoIngresoActual
    )
  ) {
    valores[
      'Estado de ingreso'
    ] =
      'Postulación recibida';
  }

  if (
    creado ||
    !tieneValorIDNV1_(
      programacionActual
    )
  ) {
    valores[
      'Estado programación entrevista'
    ] =
      'PENDIENTE';
  }

  /*
   * Si ya existe resultado de entrevista, jamás lo sobreescribimos
   * desde un reenvío/reproceso del formulario.
   */
  if (
    !tieneValorIDNV1_(
      resultadoEntrevistaActual
    )
  ) {
    valores[
      'Resultado entrevista'
    ] =
      '';
  }

  Object.keys(
    valores
  ).forEach(
    function(header) {
      escribirPorHeaderIDNV1_(
        hoja,
        item.fila,
        item.headers,
        header,
        valores[
          header
        ]
      );
    }
  );
}


/**
 * Lee una celda por nombre de header sin depender de posiciones fijas.
 */
function valorCeldaPorHeaderIDNV1_(
  hoja,
  fila,
  headers,
  header
) {
  const idx =
    indiceHeaderIDNV1_(
      headers,
      header
    );

  if (
    idx < 0
  ) {
    return '';
  }

  return hoja
    .getRange(
      fila,
      idx + 1
    )
    .getValue();
}


/* ============================================================
 * HEADERS
 * ============================================================ */

function headersSeguimientoIngresoIDNV1_() {
  return [
    'Correo oficial',                                  // A
    'Nombre',                                          // B
    'Ruta de ingreso',                                 // C
    'Resultado entrevista',                            // D
    'Estado de ingreso',                               // E
    'Fecha entrevista',                                // F
    'Entrevistador/a',                                 // G
    'Estado programación entrevista',                  // H
    'Cursos aprobados',                                // I
    'Cursos requeridos',                               // J
    'Estado inducción',                                // K
    'Fecha completado cursos',                         // L
    '¿Tiene horario de postulación vinculado?',        // M
    'Estado formalización',                            // N
    'ID carpeta postulación',                          // O
    'URL carpeta postulación',                         // P
    'Estado aviso encargados',                         // Q
    'Fecha aviso encargados',                          // R
    'Destinatarios aviso',                             // S
    'Observación',                                     // T
    'ID postulación',                                  // U
    'Fila formulario',                                 // V
    'Marca temporal'                                   // W
  ];
}


function headersDocumentacionIDNV1_() {
  return [
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
  ];
}



/* ============================================================
 * DIAGNÓSTICO ARQUITECTURA PRE-ACEPTACIÓN — SOLO LECTURA
 * ============================================================ */

function diagnosticarArquitecturaPreAceptacionV15() {
  const ss =
    SpreadsheetApp.openById(
      RIM_IDN_DB_ID
    );

  const seguimiento =
    requerirHojaIDNV1_(
      ss,
      RIM_IDN_HOJA_SEGUIMIENTO
    );

  const headers =
    seguimiento
      .getRange(
        1,
        1,
        1,
        seguimiento.getLastColumn()
      )
      .getDisplayValues()[0];

  const requeridos = [
    'Correo oficial',
    'Nombre',
    'Resultado entrevista',
    'Estado de ingreso',
    'Estado programación entrevista',
    'ID postulación',
    'Fila formulario',
    'Marca temporal'
  ];

  const faltantes =
    requeridos.filter(
      function(header) {
        return headers.indexOf(
          header
        ) < 0;
      }
    );

  const tabla =
    leerTablaIDNV1_(
      seguimiento
    );

  const postulacionesAbiertas =
    tabla.filter(
      function(item) {
        const estado =
          normalizarIDNV1_(
            valorTablaIDNV1_(
              item,
              ['Estado de ingreso']
            )
          );

        return (
          estado ===
            'postulacion recibida' ||
          estado ===
            'postulación recibida'
        );
      }
    ).length;

  const salida = {
    columnasSeguimiento:
      headers.length,
    headersFaltantes:
      faltantes,
    postulacionesAbiertas:
      postulacionesAbiertas,
    estado:
      faltantes.length
        ? 'REVISAR'
        : 'OK',
    escritura:
      false,
    enviaCorreo:
      false
  };

  console.log(
    '=== DIAGNÓSTICO ARQUITECTURA PRE-ACEPTACIÓN V1.5 ==='
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


/* ============================================================
 * HORARIO VINCULADO
 * ============================================================ */

function estadoHorarioPostulacionIDNV1_(
  ss,
  correo
) {
  const hoja =
    ss.getSheetByName(
      'Horarios_Postulacion'
    );

  if (
    !hoja ||
    hoja.getLastRow() <= 1
  ) {
    return 'NO_REGISTRADO';
  }

  const tabla =
    leerTablaIDNV1_(
      hoja
    );

  const correoN =
    correoIDNV1_(
      correo
    );

  const filas =
    tabla.filter(
      function(item) {
        const cPrincipal =
          correoIDNV1_(
            valorTablaIDNV1_(
              item,
              [
                'Correo formulario principal'
              ]
            )
          );

        const cIngresado =
          correoIDNV1_(
            valorTablaIDNV1_(
              item,
              [
                'Correo ingresado'
              ]
            )
          );

        return (
          cPrincipal ===
            correoN ||
          cIngresado ===
            correoN
        );
      }
    );

  if (!filas.length) {
    /*
     * No significa "la persona no presentó horario".
     * En históricos puede significar que el ingreso ocurrió antes
     * del sistema V4 o que no existe trazabilidad en esta tabla.
     */
    return 'NO_REGISTRADO';
  }

  const vinculado =
    filas.some(
      function(item) {
        const estado =
          normalizarIDNV1_(
            valorTablaIDNV1_(
              item,
              ['Estado']
            )
          );

        return (
          estado.indexOf(
            'vinc'
          ) >= 0 ||
          tieneValorIDNV1_(
            valorTablaIDNV1_(
              item,
              ['Fecha vinculación']
            )
          )
        );
      }
    );

  return vinculado
    ? 'SI'
    : 'PENDIENTE';
}


/*
 * Compatibilidad con código previo.
 */
function tieneHorarioPostulacionVinculadoIDNV1_(
  ss,
  correo
) {
  return (
    estadoHorarioPostulacionIDNV1_(
      ss,
      correo
    ) ===
    'SI'
  );
}


/* ============================================================
 * CURSOS
 * ============================================================ */

function resumenCursosDesdeControlIDNV1_(
  ss,
  correo
) {
  const hoja =
    ss.getSheetByName(
      'Control_Cursos'
    );

  if (
    !hoja ||
    hoja.getLastRow() <= 1
  ) {
    return {
      aprobados:
        0,
      requeridos:
        5,
      estado:
        'SIN DATOS'
    };
  }

  const correoN =
    correoIDNV1_(
      correo
    );

  const filas =
    leerTablaIDNV1_(
      hoja
    ).filter(
      function(item) {
        return (
          correoIDNV1_(
            valorTablaIDNV1_(
              item,
              [
                'Correo A',
                'Correo oficial'
              ]
            )
          ) ===
          correoN
        );
      }
    );

  let aprobados =
    0;

  let requeridos =
    0;

  filas.forEach(
    function(item) {
      const curso =
        valorTablaIDNV1_(
          item,
          ['Curso']
        );

      if (!tieneValorIDNV1_(curso)) {
        return;
      }

      requeridos++;

      const estado =
        normalizarIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Estado curso']
          )
        );

      const nota =
        numeroOpcionalIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Nota oficial']
          )
        );

      if (
        estado.indexOf(
          'aprob'
        ) >= 0 ||
        (
          nota !== null &&
          nota >= 70
        )
      ) {
        aprobados++;
      }
    }
  );

  if (
    requeridos === 0
  ) {
    requeridos =
      5;
  }

  return {
    aprobados:
      aprobados,
    requeridos:
      requeridos,
    estado:
      aprobados >= requeridos
        ? 'COMPLETADO'
        : 'EN PROGRESO'
  };
}


/* ============================================================
 * DOCUMENTOS — AUXILIARES
 * ============================================================ */

function leerCatalogoDocsIDNV1_(
  hoja
) {
  return leerTablaIDNV1_(
    hoja
  )
    .filter(
      function(item) {
        const activo =
          normalizarIDNV1_(
            valorTablaIDNV1_(
              item,
              ['Activo']
            )
          );

        return (
          activo ===
            'si' ||
          activo ===
            'sí' ||
          activo ===
            'true'
        );
      }
    )
    .map(
      function(item) {
        return {
          codigo:
            textoIDNV1_(
              valorTablaIDNV1_(
                item,
                ['Código']
              )
            ).toUpperCase(),
          grupo:
            valorTablaIDNV1_(
              item,
              ['Grupo']
            ),
          documento:
            valorTablaIDNV1_(
              item,
              ['Documento / control']
            ),
          aplicabilidad:
            valorTablaIDNV1_(
              item,
              ['Aplicabilidad']
            ),
          campoLegado:
            valorTablaIDNV1_(
              item,
              ['Campo legado']
            )
        };
      }
    );
}


function indiceDocumentosIDNV1_(
  hoja
) {
  const salida = {};

  leerTablaIDNV1_(
    hoja
  ).forEach(
    function(item) {
      const correo =
        correoIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Correo oficial']
          )
        );

      const codigo =
        textoIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Código documento']
          )
        ).toUpperCase();

      if (
        !correo ||
        !codigo
      ) {
        return;
      }

      salida[
        correo +
        '|' +
        codigo
      ] = {
        fila:
          item.fila,
        estado:
          valorTablaIDNV1_(
            item,
            ['Estado']
          ),
        colEstado:
          indiceHeaderIDNV1_(
            item.headers,
            'Estado'
          ) + 1,
        colAplica:
          indiceHeaderIDNV1_(
            item.headers,
            'Aplica'
          ) + 1,
        colActualizacion:
          indiceHeaderIDNV1_(
            item.headers,
            'Última actualización'
          ) + 1
      };
    }
  );

  return salida;
}


function evaluarAplicabilidadDocIDNV1_(
  regla,
  tieneExtension,
  cantidadHorarios
) {
  const r =
    normalizarIDNV1_(
      regla
    );

  if (
    r ===
      'extension'
  ) {
    return !!tieneExtension;
  }

  if (
    r ===
      'segundo_horario' ||
    r ===
      'segundo horario'
  ) {
    return (
      Number(
        cantidadHorarios || 0
      ) >= 2
    );
  }

  if (
    r ===
      'opcional'
  ) {
    return false;
  }

  return true;
}


function mapearEstadoDocumentoLegadoIDNV1_(
  valor
) {
  const v =
    normalizarIDNV1_(
      valor
    );

  if (!v) {
    return '';
  }

  if (
    v.indexOf(
      'no corresponde'
    ) >= 0 ||
    v.indexOf(
      'no aplica'
    ) >= 0
  ) {
    return 'NO_APLICA';
  }

  if (
    v.indexOf(
      'firmado'
    ) >= 0 ||
    v.indexOf(
      'completo'
    ) >= 0
  ) {
    return 'VALIDADO';
  }

  if (
    v.indexOf(
      'recibido'
    ) >= 0 ||
    v.indexOf(
      'enviado'
    ) >= 0
  ) {
    return 'RECIBIDO';
  }

  if (
    v.indexOf(
      'incompleto'
    ) >= 0 ||
    v.indexOf(
      'corroborar'
    ) >= 0 ||
    v.indexOf(
      'nuevo solicitado'
    ) >= 0
  ) {
    return 'INCOMPLETO';
  }

  return 'PENDIENTE';
}


function normalizarEstadoDocumentoIDNV1_(
  valor
) {
  const v =
    normalizarIDNV1_(
      valor
    );

  const mapa = {
    'pendiente':
      'PENDIENTE',
    'recibido':
      'RECIBIDO',
    'validado':
      'VALIDADO',
    'completo':
      'VALIDADO',
    'incompleto':
      'INCOMPLETO',
    'no_aplica':
      'NO_APLICA',
    'no aplica':
      'NO_APLICA',
    'sin_registro_historico':
      'SIN_REGISTRO_HISTORICO',
    'sin registro historico':
      'SIN_REGISTRO_HISTORICO'
  };

  return mapa[
    v
  ] ||
    textoIDNV1_(
      valor
    ).toUpperCase();
}


function contarHorariosOficialesIDNV1_(
  ss,
  correo
) {
  const hoja =
    ss.getSheetByName(
      'Control_horarios'
    );

  if (
    !hoja ||
    hoja.getLastRow() <= 1
  ) {
    return 0;
  }

  const correoN =
    correoIDNV1_(
      correo
    );

  return leerTablaIDNV1_(
    hoja
  ).filter(
    function(item) {
      return (
        correoIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Correo']
          )
        ) ===
        correoN
      );
    }
  ).length;
}


/* ============================================================
 * LOG DE AVISOS
 * ============================================================ */

function indiceNotificacionesEnviadasIDNV1_(
  hoja,
  idBase
) {
  const salida = {};

  if (
    hoja.getLastRow() <= 1
  ) {
    return salida;
  }

  leerTablaIDNV1_(
    hoja
  ).forEach(
    function(item) {
      const id =
        textoIDNV1_(
          valorTablaIDNV1_(
            item,
            ['ID notificación']
          )
        );

      const estado =
        normalizarIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Estado']
          )
        );

      if (
        id ===
          idBase &&
        estado ===
          'enviado'
      ) {
        const correo =
          correoIDNV1_(
            valorTablaIDNV1_(
              item,
              ['Destinatario']
            )
          );

        if (correo) {
          salida[
            correo
          ] =
            true;
        }
      }
    }
  );

  return salida;
}


/* ============================================================
 * HELPERS GENERALES
 * ============================================================ */

function asegurarHojaConHeadersIDNV1_(
  ss,
  nombre,
  headers
) {
  let hoja =
    ss.getSheetByName(
      nombre
    );

  if (!hoja) {
    hoja =
      ss.insertSheet(
        nombre
      );
  }

  const actuales =
    hoja
      .getRange(
        1,
        1,
        1,
        Math.max(
          hoja.getLastColumn(),
          headers.length
        )
      )
      .getDisplayValues()[0];

  let necesitaHeaders =
    hoja.getLastRow() === 0 ||
    !actuales.some(
      function(x) {
        return textoIDNV1_(x);
      }
    );

  if (necesitaHeaders) {
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
  } else {
    headers.forEach(
      function(header, i) {
        const actual =
          textoIDNV1_(
            hoja
              .getRange(
                1,
                i + 1
              )
              .getDisplayValue()
          );

        if (!actual) {
          hoja
            .getRange(
              1,
              i + 1
            )
            .setValue(
              header
            );
        }
      }
    );
  }

  hoja
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setFontWeight(
      'bold'
    )
    .setBackground(
      '#174777'
    )
    .setFontColor(
      '#FFFFFF'
    )
    .setWrap(
      true
    );

  return hoja;
}


function asegurarConfiguracionIDNV1_(
  ss
) {
  let hoja =
    ss.getSheetByName(
      RIM_IDN_HOJA_CONFIG
    );

  if (!hoja) {
    hoja =
      ss.insertSheet(
        RIM_IDN_HOJA_CONFIG
      );

    hoja
      .getRange(
        1,
        1,
        1,
        2
      )
      .setValues([
        [
          'Variable',
          'Valor'
        ]
      ]);
  }

  return hoja;
}


function leerConfigIDNV1_(
  hoja,
  variable
) {
  if (
    hoja.getLastRow() <= 1
  ) {
    return '';
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

  const objetivo =
    normalizarIDNV1_(
      variable
    );

  for (
    let i = 0;
    i < datos.length;
    i++
  ) {
    if (
      normalizarIDNV1_(
        datos[i][0]
      ) ===
      objetivo
    ) {
      return textoIDNV1_(
        datos[i][1]
      );
    }
  }

  return '';
}


function escribirConfigIDNV1_(
  hoja,
  variable,
  valor
) {
  const lastRow =
    hoja.getLastRow();

  if (
    lastRow > 1
  ) {
    const datos =
      hoja
        .getRange(
          2,
          1,
          lastRow - 1,
          1
        )
        .getDisplayValues();

    const objetivo =
      normalizarIDNV1_(
        variable
      );

    for (
      let i = 0;
      i < datos.length;
      i++
    ) {
      if (
        normalizarIDNV1_(
          datos[i][0]
        ) ===
        objetivo
      ) {
        hoja
          .getRange(
            i + 2,
            2
          )
          .setValue(
            valor
          );

        return;
      }
    }
  }

  hoja.appendRow([
    variable,
    valor
  ]);
}


function leerTablaIDNV1_(
  hoja
) {
  const lastRow =
    hoja.getLastRow();

  const lastCol =
    hoja.getLastColumn();

  if (
    lastRow <= 1 ||
    lastCol <= 0
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
      .getDisplayValues()[0];

  const mapa =
    mapaHeadersIDNV1_(
      headers
    );

  const datos =
    hoja
      .getRange(
        2,
        1,
        lastRow - 1,
        lastCol
      )
      .getValues();

  return datos.map(
    function(row, index) {
      return {
        fila:
          index + 2,
        row:
          row,
        headers:
          mapa
      };
    }
  );
}


function indiceUnaFilaPorCorreoTablaIDNV1_(
  hoja
) {
  const salida = {};

  leerTablaIDNV1_(
    hoja
  ).forEach(
    function(item) {
      const correo =
        correoIDNV1_(
          valorTablaIDNV1_(
            item,
            ['Correo oficial']
          )
        );

      if (correo) {
        salida[
          correo
        ] =
          item;
      }
    }
  );

  return salida;
}


function valorTablaIDNV1_(
  item,
  alternativas
) {
  for (
    let i = 0;
    i < alternativas.length;
    i++
  ) {
    const key =
      normalizarIDNV1_(
        alternativas[i]
      );

    if (
      Object.prototype.hasOwnProperty.call(
        item.headers,
        key
      )
    ) {
      return item.row[
        item.headers[
          key
        ]
      ];
    }
  }

  return '';
}


function escribirPorHeaderIDNV1_(
  hoja,
  fila,
  mapa,
  header,
  valor
) {
  const i =
    indiceHeaderIDNV1_(
      mapa,
      header
    );

  if (
    i < 0
  ) {
    throw new Error(
      'No existe la cabecera "' +
      header +
      '" en ' +
      hoja.getName()
    );
  }

  hoja
    .getRange(
      fila,
      i + 1
    )
    .setValue(
      valor
    );
}


function indiceHeaderIDNV1_(
  mapa,
  header
) {
  const key =
    normalizarIDNV1_(
      header
    );

  return Object.prototype.hasOwnProperty.call(
    mapa,
    key
  )
    ? mapa[
        key
      ]
    : -1;
}


function mapaHeadersIDNV1_(
  headers
) {
  const salida = {};

  headers.forEach(
    function(header, i) {
      const key =
        normalizarIDNV1_(
          header
        );

      if (
        key &&
        !Object.prototype.hasOwnProperty.call(
          salida,
          key
        )
      ) {
        salida[
          key
        ] =
          i;
      }
    }
  );

  return salida;
}


function mapaFlexibleHeadersIDNV1_(
  headers
) {
  const salida = {};

  headers.forEach(
    function(header, i) {
      const key =
        normalizarIDNV1_(
          limpiarFormulaHeaderIDNV1_(
            header
          )
        );

      if (
        key &&
        !Object.prototype.hasOwnProperty.call(
          salida,
          key
        )
      ) {
        salida[
          key
        ] =
          i;
      }
    }
  );

  return salida;
}


function valorFlexibleIDNV1_(
  row,
  mapa,
  alternativas
) {
  for (
    let i = 0;
    i < alternativas.length;
    i++
  ) {
    const objetivo =
      normalizarIDNV1_(
        alternativas[i]
      );

    if (
      Object.prototype.hasOwnProperty.call(
        mapa,
        objetivo
      )
    ) {
      return row[
        mapa[
          objetivo
        ]
      ];
    }

    /*
     * Matching parcial seguro para headers extensos.
     */
    const keys =
      Object.keys(
        mapa
      );

    for (
      let k = 0;
      k < keys.length;
      k++
    ) {
      if (
        keys[k].indexOf(
          objetivo
        ) >= 0 ||
        objetivo.indexOf(
          keys[k]
        ) >= 0
      ) {
        return row[
          mapa[
            keys[k]
          ]
        ];
      }
    }
  }

  return '';
}


function limpiarFormulaHeaderIDNV1_(
  valor
) {
  const text =
    textoIDNV1_(
      valor
    );

  /*
   * En la hoja fuente real los headers son textos normales.
   * Esto permite además diagnosticar exports XLSX donde
   * IMPORTRANGE aparece serializado como fórmula.
   */
  const matches =
    text.match(
      /"([^"]+)"\)\s*$/
    );

  return matches
    ? matches[1]
    : text;
}


function requerirHojaIDNV1_(
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
      '". Ejecuta prepararInfraestructuraIngresoDocumentacionV1().'
    );
  }

  return hoja;
}


function deduplicarDestinatariosIDNV1_(
  arr
) {
  const seen = {};
  const salida = [];

  arr.forEach(
    function(x) {
      const correo =
        correoIDNV1_(
          x.correo
        );

      if (
        !correo ||
        seen[
          correo
        ]
      ) {
        return;
      }

      seen[
        correo
      ] =
        true;

      salida.push(
        x
      );
    }
  );

  return salida;
}


function eliminarTriggerPorHandlerIDNV1_(
  handler
) {
  ScriptApp
    .getProjectTriggers()
    .forEach(
      function(trigger) {
        if (
          trigger.getHandlerFunction() ===
          handler
        ) {
          ScriptApp.deleteTrigger(
            trigger
          );
        }
      }
    );
}


function extraerIdsDriveIDNV1_(
  texto
) {
  return (
    String(
      texto || ''
    )
      .match(
        /[-\w]{25,}/g
      ) || []
  ).filter(
    function(valor, indice, arr) {
      return (
        arr.indexOf(
          valor
        ) ===
        indice
      );
    }
  );
}


function filaHtmlIDNV1_(
  label,
  valor
) {
  if (!tieneValorIDNV1_(valor)) {
    return '';
  }

  return (
    '<tr>' +
      '<td style="padding:7px;border-bottom:1px solid #e5e7eb;color:#6b7280;width:210px">' +
        escaparHtmlIDNV1_(label) +
      '</td>' +
      '<td style="padding:7px;border-bottom:1px solid #e5e7eb">' +
        escaparHtmlIDNV1_(valor) +
      '</td>' +
    '</tr>'
  );
}


function escaparHtmlIDNV1_(
  valor
) {
  return textoIDNV1_(
    valor
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function limpiarNombreArchivoIDNV1_(
  valor
) {
  return textoIDNV1_(
    valor
  )
    .replace(
      /[\\/:*?"<>|]/g,
      '-'
    )
    .replace(
      /\s+/g,
      ' '
    )
    .slice(
      0,
      100
    );
}


function numeroOpcionalIDNV1_(
  valor
) {
  if (!tieneValorIDNV1_(valor)) {
    return null;
  }

  const n =
    Number(
      String(
        valor
      ).replace(
        ',',
        '.'
      )
    );

  return isNaN(n)
    ? null
    : n;
}


function normalizarIDNV1_(
  valor
) {
  return textoIDNV1_(
    valor
  )
    .normalize(
      'NFD'
    )
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .replace(
      /\s+/g,
      ' '
    )
    .replace(
      /_/g,
      ' '
    )
    .trim();
}


function correoIDNV1_(
  valor
) {
  return textoIDNV1_(
    valor
  ).toLowerCase();
}


function textoIDNV1_(
  valor
) {
  return String(
    valor === null ||
    valor === undefined
      ? ''
      : valor
  ).trim();
}


function tieneValorIDNV1_(
  valor
) {
  return !(
    valor === null ||
    valor === undefined ||
    (
      typeof valor ===
        'string' &&
      valor.trim() ===
        ''
    )
  );
}
