/**
 * ============================================================
 * PLANNER SYNCHRONIZATION — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 *
 * PRINCIPIOS:
 * - Los planners externos son SIEMPRE SOLO LECTURA.
 * - Se procesan históricos y nuevos.
 * - El régimen se deriva por fecha y, cuando corresponde, por Excepciones_Regimen.
 * - Evidencia repetida es un indicador descriptivo, no una penalización.
 * - Registro_Planner conserva toda la información disponible.
 * - "Régimen" (HISTORICO/NUEVO) y "situación actual" son conceptos distintos.
 * - Un pasante actual se identifica por K=Vigente + AL=PASANTE.
 * - Personas retiradas o en otros roles se conservan para análisis histórico.
 * - El paso PASANTE -> ASISTENTE se registra por correo en Historial_Roles.
 * - La fecha de inicio del rol ASISTENTE es una frontera dura: desde ese día
 *   las actividades se conservan históricamente, pero NO cuentan para la pasantía.
 * - BQ:BS registran el proceso de contratación sin cambiar prematuramente el rol.
 * - Históricos sin fechas y sin transición ASISTENTE conocida pueden conservar sus actividades como candidatas descriptivas sin inventar fechas.
 * - Los períodos P continúan hasta la fecha formal de fin de pasantía, aunque exista P4/P5...;
 *   el inicio ASISTENTE corta el cómputo desde ese mismo día; actividad posterior al fin formal y anterior
 *   a una frontera dura se conserva como EXTRA_HISTORICO (X1, X2...).
 * - Localiza los campos de Variables_Internas por encabezado en lugar de depender de posiciones fijas;
 *   localiza campos por encabezado y conserva compatibilidad con la estructura
 *   productiva actual y con el Modelo V2.
 */

const ID_BASE_PASANTES =
  'YOUR_DB_SPREADSHEET_ID';


const HOJA_VARIABLES = 'Variables_Internas';
const HOJA_CONFIG = 'Configuracion';
const HOJA_REGISTRO_PLANNER = 'Registro_Planner';
const HOJA_HISTORIAL_ROLES = 'Historial_Roles';
const HOJA_DICCIONARIO_DATOS = 'Diccionario_Datos';
const HOJA_EXCEPCIONES_REGIMEN = 'Excepciones_Regimen';

/**
 * V8.7 — Variables_Internas por encabezado.
 *
 * Se aceptan tanto los nombres históricos como los del Modelo V2.
 * Esto permite reemplazar la hoja productiva por la estructura V2
 * sin cambiar nuevamente este módulo.
 */
const CAMPOS_VARIABLES_V87 = {
  correo: ['Correo oficial'],
  nombre: ['Nombre', 'Nombre del Pasante'],
  estadoPasantia: ['Estado de pasantía'],
  linkPlanner: ['Link Planner', 'Link de Planner'],
  inicioPas: ['Fecha inicio pasantía', 'Fecha inicio (Pasantía)'],
  finPas: ['Fecha fin pasantía', 'Fecha salida (Pasantía)'],
  inicioExt: ['Fecha inicio extensión', 'Fecha inicio (Extensión)'],
  finExt: ['Fecha fin extensión', 'Fecha salida (Extensión)'],
  cualidadActual: ['Cualidad actual', 'CUALIDAD ACTUAL'],
  cualidadPasada: ['Cualidad pasada', 'CUALIDAD PASADA'],
  retiro: ['Fecha retiro'],
  estadoTransicion: ['Estado transición laboral'],
  fechaTransicion: ['Fecha inicio transición laboral'],
  observacionTransicion: ['Observación transición laboral'],
  estadoVinculo: ['Estado vínculo laboral'],
  fechaFinVinculo: ['Fecha fin vínculo laboral'],
  motivoFinVinculo: ['Motivo fin vínculo laboral']
};

const ENCABEZADOS_PLANNER = [
  'tipo',
  'compo',
  'sub_comp',
  'descripcion',
  'encargado',
  'fecha',
  'hora inicio',
  'hora fin',
  'duracion',
  'estado',
  'respaldo-link',
  'comentario',
  'usuario'
];

// Variante histórica detectada en algunos planners heredados.
// NO se modifica el planner: el lector adapta E=fecha y F=día
// a la estructura canónica interna.
const ENCABEZADOS_PLANNER_HISTORICO = [
  'tipo',
  'compo',
  'sub_comp',
  'descripcion',
  'fecha',
  'dia',
  'hora inicio',
  'hora fin',
  'duracion',
  'estado',
  'respaldo-link',
  'comentario',
  'usuario'
];

/**
 * Estructura interna de cálculo (47 campos).
 * NO corresponde a columnas físicas de Registro_Planner.
 * Se conserva internamente para no alterar reglas de negocio ya validadas;
 * antes de escribir, cada fila se proyecta a las 33 columnas productivas.
 */
const ENCABEZADOS_REGISTRO_PLANNER_INTERNO = [
  'Correo oficial',
  'Nombre',
  'Link Planner',
  'ID Planner',
  'Fila origen',
  'tipo',
  'compo',
  'sub_comp',
  'descripcion',
  'Encargado',
  'fecha',
  'Hora inicio',
  'Hora fin',
  'duracion',
  'estado',
  'Respaldo-Link',
  'Comentario',
  'usuario',
  'Tipo evidencia',
  'ID evidencia',
  'Evidencia duplicada',
  'Fecha importación',
  'Período',
  'Período cerrado',
  'Horas planner',
  'Horas con evidencia',
  'Dentro de horario',
  'Fuera de horario',
  'Observación control',
  'Régimen',
  'Estado de pasantía',
  'Cualidad actual',
  'Cualidad pasada',
  'Pasante actual',
  'Situación seguimiento',
  'Fecha inicio como asistente',
  'Fecha fin como asistente',
  'Política asistente cuenta compromiso',
  'Etapa actividad',
  'Cuenta actividad para compromiso',
  'Horas candidatas compromiso',
  'Observación transición',
  'Estado transición laboral',
  'Fecha inicio transición laboral',
  'Estado vínculo laboral',
  'Fecha fin vínculo laboral',
  'Motivo fin vínculo laboral'
];

/**
 * Única estructura física permitida en Registro_Planner.
 */
const ENCABEZADOS_REGISTRO_PLANNER = [
  'Correo oficial',
  'Nombre',
  'Link Planner',
  'ID Planner',
  'Fila origen',
  'tipo',
  'compo',
  'sub_comp',
  'descripcion',
  'Encargado',
  'fecha',
  'Hora inicio',
  'Hora fin',
  'duracion',
  'estado',
  'Respaldo-Link',
  'Comentario',
  'usuario',
  'Tipo evidencia',
  'ID evidencia',
  'Evidencia duplicada',
  'Fecha importación',
  'Período',
  'Horas planner',
  'Horas con evidencia',
  'Dentro de horario',
  'Fuera de horario',
  'Observación control',
  'Régimen',
  'Etapa actividad',
  'Cuenta actividad para compromiso',
  'Horas candidatas compromiso',
  'Observación transición'
];



/**
 * ============================================================
 * PLANNER SYNCHRONIZATION — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 *
 * Metadata histórica de la estructura interna de 47 campos.
 * No define la estructura física productiva de Registro_Planner.
 * Se conserva temporalmente hasta regenerar Diccionario_Datos.
 * Se usa para:
 * - poner notas explicativas en cada encabezado;
 * - dibujar separadores visuales entre bloques;
 * - generar Diccionario_Datos automáticamente.
 *
 * No se crean celdas combinadas.
 */
const DICCIONARIO_REGISTRO_PLANNER = [
  // A:E — Identificación y origen
  {
    bloque: '1. Identificación y origen',
    significado: 'Correo oficial de la persona. Es la llave principal usada para relacionar los registros con Variables_Internas.',
    origen: 'Variables_Internas!A',
    editar: 'No',
    valores: 'Correo oficial normalizado',
    uso: 'Identificar de forma estable a la persona y cruzar información entre hojas.'
  },
  {
    bloque: '1. Identificación y origen',
    significado: 'Nombre de la persona asociado al correo oficial.',
    origen: 'Variables_Internas!D',
    editar: 'No',
    valores: 'Texto',
    uso: 'Lectura humana y reportes.'
  },
  {
    bloque: '1. Identificación y origen',
    significado: 'Enlace del archivo de Planner específico del que salió la actividad. Si una persona tiene varios planners, cada actividad conserva su fuente.',
    origen: 'Planner localizado desde Variables_Internas!Z',
    editar: 'No',
    valores: 'URL de Google Sheets',
    uso: 'Rastrear la actividad hasta el planner original.'
  },
  {
    bloque: '1. Identificación y origen',
    significado: 'ID único del archivo de Google Sheets que contiene el Planner fuente.',
    origen: 'Google Drive / Google Sheets',
    editar: 'No',
    valores: 'ID de archivo',
    uso: 'Distinguir planners diferentes de una misma persona y evitar perder trazabilidad.'
  },
  {
    bloque: '1. Identificación y origen',
    significado: 'Número de fila del Planner fuente donde estaba la actividad al momento de importar.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Número entero',
    uso: 'Ubicar rápidamente la fila original para revisión.'
  },

  // F:R — Actividad original
  {
    bloque: '2. Datos de la actividad',
    significado: 'Tipo de actividad registrado en el Planner.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Texto del Planner',
    uso: 'Clasificar la naturaleza de la actividad.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Componente al que pertenece la actividad.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Texto del Planner',
    uso: 'Agrupar actividades por componente.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Subcomponente al que pertenece la actividad.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Texto del Planner',
    uso: 'Dar mayor detalle a la clasificación por componente.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Descripción de la tarea o actividad.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Texto',
    uso: 'Saber qué hizo la persona durante su pasantía.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Persona responsable o encargada registrada en el Planner. En planners históricos puede quedar vacío porque esa columna no existía.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Texto o vacío',
    uso: 'Contextualizar quién encargó o supervisó la actividad cuando ese dato existe.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Fecha de la actividad.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Fecha',
    uso: 'Asignar período, etapa PASANTE/ASISTENTE y realizar análisis cronológico.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Hora de inicio registrada para la actividad.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Hora o vacío',
    uso: 'Calcular duración cuando existe hora de inicio y fin.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Hora de finalización registrada para la actividad.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Hora o vacío',
    uso: 'Calcular duración cuando existe hora de inicio y fin.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Duración registrada en el Planner. El lector también puede calcular horas usando inicio y fin según la información disponible.',
    origen: 'Planner externo / cálculo del lector',
    editar: 'No',
    valores: 'Duración, hora o número según el formato fuente',
    uso: 'Base para calcular Horas planner.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Estado de la actividad tal como aparece en el Planner.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Texto del Planner',
    uso: 'Conservar el estado original de la tarea.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Enlace o texto de respaldo/evidencia registrado para la actividad.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'URL, texto o vacío',
    uso: 'Verificar si la actividad tiene evidencia asociada.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Comentario registrado en el Planner.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Texto o vacío',
    uso: 'Conservar observaciones originales de la actividad.'
  },
  {
    bloque: '2. Datos de la actividad',
    significado: 'Usuario registrado en el Planner fuente.',
    origen: 'Planner externo',
    editar: 'No',
    valores: 'Texto o vacío',
    uso: 'Conservar trazabilidad disponible del registro original.'
  },

  // S:U — Evidencia
  {
    bloque: '3. Evidencia',
    significado: 'Clasificación automática del respaldo de la actividad.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'SIN_EVIDENCIA, REUNION u otros tipos detectados por el lector',
    uso: 'Analizar presencia y tipo de evidencia sin modificar las horas.'
  },
  {
    bloque: '3. Evidencia',
    significado: 'Identificador normalizado de la evidencia cuando puede extraerse del respaldo.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'ID normalizado o vacío',
    uso: 'Detectar reutilización de una misma evidencia.'
  },
  {
    bloque: '3. Evidencia',
    significado: 'Indica si la misma evidencia aparece más de una vez. Es informativo: una evidencia repetida no elimina horas.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'No, Sí, Reunión recurrente, Repetida permitida',
    uso: 'Señalar duplicados o reuniones recurrentes para revisión.'
  },

  // V:Z — Período y horas
  {
    bloque: '4. Período y horas',
    significado: 'Fecha y hora en que esta fila fue generada por la sincronización.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'Fecha y hora',
    uso: 'Saber de qué ejecución proviene el registro.'
  },
  {
    bloque: '4. Período y horas',
    significado: 'Bloque de 30 días de pasantía o extensión al que pertenece la actividad según su fecha.',
    origen: 'Calculado desde fechas de Variables_Internas y Configuracion',
    editar: 'No',
    valores: 'P1, P2, P3, P4... hasta fin formal; E1, E2... para extensión; X1, X2... para actividad adicional posterior; ASISTENTE, SIN_FECHA, SIN_CLASIFICAR, POSTERIOR_RETIRO, FUERA_RANGO',
    uso: 'Analizar horas por períodos reales hasta la fecha formal registrada. El número P no define por sí solo si es formal o extra; ASISTENTE nunca cuenta para la pasantía.'
  },
  {
    bloque: '4. Período y horas',
    significado: 'Campo reservado para indicar si el período ya fue cerrado y congelado. En V8.1 todavía no se calcula en este módulo.',
    origen: 'Reservado para Control_Periodos',
    editar: 'No',
    valores: 'Actualmente vacío',
    uso: 'En una fase posterior permitirá distinguir períodos abiertos de snapshots cerrados.'
  },
  {
    bloque: '4. Período y horas',
    significado: 'Horas calculadas para la actividad a partir de la información disponible del Planner. Si faltan datos suficientes, queda en 0 y se conserva la fila.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'Número de horas >= 0',
    uso: 'Medir las horas registradas en el Planner.'
  },
  {
    bloque: '4. Período y horas',
    significado: 'Horas de la actividad que tienen algún respaldo/evidencia. Una evidencia duplicada no anula estas horas.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'Número de horas >= 0',
    uso: 'Comparar horas registradas versus horas respaldadas.'
  },

  // AA:AC — Horario y control
  {
    bloque: '5. Horario y control',
    significado: 'Campo reservado para indicar horas de la actividad dentro del horario acordado. Todavía no se calcula porque Control_horarios no está integrado a este módulo.',
    origen: 'Futura integración con Control_horarios',
    editar: 'No',
    valores: 'Actualmente vacío',
    uso: 'Más adelante permitirá analizar actividad dentro del horario de pasantía.'
  },
  {
    bloque: '5. Horario y control',
    significado: 'Campo reservado para indicar horas de la actividad fuera del horario acordado. Estar fuera de horario no significa automáticamente horas extra aprobadas.',
    origen: 'Futura integración con Control_horarios',
    editar: 'No',
    valores: 'Actualmente vacío',
    uso: 'Más adelante permitirá separar actividad fuera del horario acordado.'
  },
  {
    bloque: '5. Horario y control',
    significado: 'Observaciones automáticas sobre formato del Planner, horas faltantes, período, fechas o clasificación de la actividad.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'Texto o vacío',
    uso: 'Explicar por qué una fila requiere revisión o cómo fue interpretada.'
  },

  // AD:AI — Situación de pasantía
  {
    bloque: '6. Situación de pasantía',
    significado: 'Clasifica si la persona pertenece al sistema NUEVO o HISTORICO según Excepciones_Regimen o la fecha de inicio y la fecha de corte configurada.',
    origen: 'Excepciones_Regimen / Fecha inicio pasantía + Configuracion',
    editar: 'No',
    valores: 'NUEVO, HISTORICO, SIN_CLASIFICAR',
    uso: 'Aplicar reglas distintas a registros nuevos e históricos sin excluir información.'
  },
  {
    bloque: '6. Situación de pasantía',
    significado: 'Resultado o estado administrativo de la pasantía guardado en Variables_Internas. No representa por sí solo el rol actual de la persona.',
    origen: 'Variables_Internas!K',
    editar: 'No en Registro_Planner',
    valores: 'Vigente, Retirado, Contratado, Terminada u otros valores de la base',
    uso: 'Conservar el estado de la pasantía. Para saber si hoy sigue siendo PASANTE se debe mirar también Cualidad actual y Pasante actual.'
  },
  {
    bloque: '6. Situación de pasantía',
    significado: 'Rol o cualidad actual de la persona. Permite distinguir PASANTE de ASISTENTE aunque el estado administrativo de la pasantía conserve otro valor.',
    origen: 'Variables_Internas!AL',
    editar: 'No en Registro_Planner',
    valores: 'PASANTE, ASISTENTE u otro valor de la base',
    uso: 'Distinguir el rol actual de la persona.'
  },
  {
    bloque: '6. Situación de pasantía',
    significado: 'Rol o cualidad inmediatamente anterior registrada para la persona.',
    origen: 'Variables_Internas!AM',
    editar: 'No en Registro_Planner',
    valores: 'PASANTE, NO CORRESPONDE u otro valor de la base',
    uso: 'Detectar transiciones como PASANTE → ASISTENTE.'
  },
  {
    bloque: '6. Situación de pasantía',
    significado: 'Indicador automático de si la persona es pasante actual. La regla vigente es Estado de pasantía = Vigente y Cualidad actual = PASANTE.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'Sí, No',
    uso: 'Filtrar seguimiento operativo de pasantes actuales.'
  },
  {
    bloque: '6. Situación de pasantía',
    significado: 'Etiqueta automática que resume la situación relevante para seguimiento, combinando estado de pasantía, rol y transición laboral.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'PASANTE_ACTUAL, ASISTENTE_EX_PASANTE, PASANTIA_TERMINADA, PASANTIA_RETIRADA, CONTRATADO, etc.',
    uso: 'Simplificar filtros, informes y futuros dashboards.'
  },

  // AJ:AP — Transición PASANTE -> ASISTENTE
  {
    bloque: '7. Transición PASANTE → ASISTENTE',
    significado: 'Fecha real en que comenzó el rol ASISTENTE según Historial_Roles.',
    origen: 'Historial_Roles!D',
    editar: 'No en Registro_Planner',
    valores: 'Fecha o vacío',
    uso: 'Separar actividades realizadas antes y después de la transición de rol.'
  },
  {
    bloque: '7. Transición PASANTE → ASISTENTE',
    significado: 'Fecha fin del rol ASISTENTE registrada en Historial_Roles.',
    origen: 'Historial_Roles!E',
    editar: 'No en Registro_Planner',
    valores: 'Fecha o vacío',
    uso: 'Delimitar temporalmente el rol ASISTENTE cuando sea necesario para interpretar actividades.'
  },
  {
    bloque: '7. Transición PASANTE → ASISTENTE',
    significado: 'Política histórica/administrativa registrada al momento de la transición. Desde V8.5 no habilita horas posteriores al inicio del contrato para la pasantía.',
    origen: 'Historial_Roles!G',
    editar: 'No en Registro_Planner',
    valores: 'Sí, No, Por revisar',
    uso: 'Conservar trazabilidad de la decisión histórica. La fecha de inicio ASISTENTE prevalece como frontera dura y las horas desde ese día no son candidatas.'
  },
  {
    bloque: '7. Transición PASANTE → ASISTENTE',
    significado: 'Etapa en la que se realizó esta actividad según su fecha y la transición de rol. PASANTE_HISTORICO_SIN_FECHAS se usa únicamente para registros históricos sin fechas de pasantía/extensión y sin una transición conocida a ASISTENTE que requiera separar actividades; no inventa fechas.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'PASANTE, EXTRA_HISTORICO, PASANTE_HISTORICO_SIN_FECHAS, ASISTENTE, PRE_PASANTIA, POSTERIOR_RETIRO, POSTERIOR_ASISTENTE, TRANSICION_SIN_FECHA, SIN_FECHA',
    uso: 'Separar pasantía formal, actividad adicional posterior a la base, y actividad laboral como ASISTENTE. Desde la fecha de inicio ASISTENTE nunca se contabiliza para pasantía.'
  },
  {
    bloque: '7. Transición PASANTE → ASISTENTE',
    significado: 'Indica si esta actividad específica puede considerarse candidata para el compromiso de pasantía según etapa, fechas y política registrada.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'Sí, No, Por revisar',
    uso: 'Evitar contar automáticamente actividad de ASISTENTE fuera del período de pasantía/extensión.'
  },
  {
    bloque: '7. Transición PASANTE → ASISTENTE',
    significado: 'Horas de esta actividad que son candidatas al compromiso de pasantía. No representan horas laborales de asistente ni horas finales reconocidas.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'Número de horas >= 0',
    uso: 'Acumular únicamente actividad potencialmente computable para la pasantía.'
  },
  {
    bloque: '7. Transición PASANTE → ASISTENTE',
    significado: 'Explicación automática de cómo se clasificó la actividad respecto a la transición PASANTE → ASISTENTE.',
    origen: 'Calculado por Planners.gs',
    editar: 'No',
    valores: 'Texto o vacío',
    uso: 'Hacer auditable la decisión de Cuenta actividad para compromiso.'
  },

  // AQ:AU — Contexto laboral posterior
  {
    bloque: '8. Contexto laboral posterior',
    significado: 'Estado del proceso de transición laboral registrado mientras la persona todavía era pasante.',
    origen: 'Variables_Internas!BQ',
    editar: 'No en Registro_Planner',
    valores: 'Sin proceso, En proceso de contratación, Contratación aprobada, Proceso cerrado sin contratación',
    uso: 'Conservar contexto del cierre de la pasantía y eventual contratación.'
  },
  {
    bloque: '8. Contexto laboral posterior',
    significado: 'Fecha de inicio del proceso de transición laboral.',
    origen: 'Variables_Internas!BR',
    editar: 'No en Registro_Planner',
    valores: 'Fecha o vacío',
    uso: 'Ubicar cronológicamente el proceso de contratación.'
  },
  {
    bloque: '8. Contexto laboral posterior',
    significado: 'Estado del vínculo laboral posterior. Se conserva solo como contexto de la trayectoria posterior a la pasantía.',
    origen: 'Variables_Internas!BT',
    editar: 'No en Registro_Planner',
    valores: 'Sin vínculo laboral, Vínculo vigente, Vínculo finalizado',
    uso: 'Distinguir una contratación posterior sin convertir Registro_Planner en un sistema de control laboral.'
  },
  {
    bloque: '8. Contexto laboral posterior',
    significado: 'Fecha fin del vínculo laboral posterior, cuando existe.',
    origen: 'Variables_Internas!BU',
    editar: 'No en Registro_Planner',
    valores: 'Fecha o vacío',
    uso: 'Contexto histórico posterior a la pasantía.'
  },
  {
    bloque: '8. Contexto laboral posterior',
    significado: 'Motivo registrado para el fin del vínculo laboral posterior.',
    origen: 'Variables_Internas!BV',
    editar: 'No en Registro_Planner',
    valores: 'Texto o vacío',
    uso: 'Contexto histórico posterior a la pasantía; no modifica las horas de pasantía.'
  }
];

const BLOQUES_REGISTRO_PLANNER = [
  {inicio: 1, fin: 5, nombre: '1. Identificación y origen'},          // A:E
  {inicio: 6, fin: 18, nombre: '2. Datos de la actividad'},           // F:R
  {inicio: 19, fin: 21, nombre: '3. Evidencia'},                      // S:U
  {inicio: 22, fin: 26, nombre: '4. Período y horas'},                // V:Z
  {inicio: 27, fin: 29, nombre: '5. Horario y control'},              // AA:AC
  {inicio: 30, fin: 35, nombre: '6. Situación de pasantía'},          // AD:AI
  {inicio: 36, fin: 42, nombre: '7. Transición PASANTE → ASISTENTE'}, // AJ:AP
  {inicio: 43, fin: 47, nombre: '8. Contexto laboral posterior'}      // AQ:AU
];


const ENCABEZADOS_HISTORIAL_ROLES = [
  'Correo oficial',
  'Nombre',
  'Rol',
  'Fecha inicio',
  'Fecha fin',
  'Fuente',
  'Cuenta para compromiso pasantía',
  'Observación',
  'Fecha registro'
];

/* ============================================================
 * BASE Y MENÚ
 * ============================================================
 */

function obtenerBasePasantes() {
  return SpreadsheetApp.openById(ID_BASE_PASANTES);
}

function onOpen() {
  try {
    SpreadsheetApp
      .getUi()
      .createMenu('Control Pasantías')
      .addItem('Diagnosticar conexión planners', 'probarConexionPlanners')
      .addItem('Diagnosticar sincronización general', 'probarSincronizacionTodos')
      .addItem('Diagnosticar problemas planners', 'diagnosticarProblemasPlanners')
      .addItem('Diagnosticar transiciones de rol', 'diagnosticarTransicionesRoles')
      .addItem('Diagnosticar transición laboral', 'diagnosticarTransicionLaboral')
      .addSeparator()
      .addItem('Preparar estructura planners y roles', 'prepararEstructuraSistemaPlanners')
      .addItem('Actualizar documentación Registro_Planner', 'actualizarDocumentacionRegistroPlanner')
      .addItem('Sincronizar planners', 'sincronizarPlanners')
      .addToUi();
  } catch (error) {
    // En un proyecto standalone puede no existir UI activa.
  }
}

/* ============================================================
 * CONFIGURACIÓN Y NORMALIZACIÓN
 * ============================================================
 */

function obtenerConfiguracion() {
  const ss = obtenerBasePasantes();
  const hoja = ss.getSheetByName(HOJA_CONFIG);

  if (!hoja) {
    throw new Error('No se encontró la hoja "' + HOJA_CONFIG + '".');
  }

  const datos = hoja.getDataRange().getValues();
  const config = {};

  for (let i = 1; i < datos.length; i++) {
    const clave = datos[i][0];
    if (clave === '' || clave === null || clave === undefined) continue;
    config[clave.toString().trim()] = datos[i][1];
  }

  return config;
}

function normalizarTexto(valor) {
  if (valor === '' || valor === null || valor === undefined) return '';
  return valor.toString().trim().toLowerCase();
}

function normalizarSinAcentos_(valor) {
  return normalizarTexto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function esSi_(valor) {
  return normalizarSinAcentos_(valor) === 'si';
}

function normalizarEncabezado(valor) {
  if (valor === null || valor === undefined) return '';
  return valor
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-');
}


/* ============================================================
 * HISTORIAL DE ROLES / PASANTE -> ASISTENTE
 * ============================================================
 *
 * Historial_Roles es una tabla independiente y ligada por
 * Correo oficial. No depende del número de fila de Variables_Internas.
 *
 * Para una transición PASANTE -> ASISTENTE se registra:
 *   Rol = ASISTENTE
 *   Fecha inicio = fecha indicada en el contrato
 *   Fuente = Contrato
 *   Cuenta para compromiso pasantía = Sí/No
 *
 * "Cuenta para compromiso" se conserva por trazabilidad histórica.
 * Desde V8.5 NO puede habilitar horas realizadas desde la fecha de inicio
 * del contrato ASISTENTE: esa fecha es una frontera dura.
 */

function obtenerHojaHistorialRoles_(ss) {
  return ss.getSheetByName(HOJA_HISTORIAL_ROLES);
}

function asegurarEncabezadosHistorialRoles_(hoja) {
  hoja
    .getRange(
      1,
      1,
      1,
      ENCABEZADOS_HISTORIAL_ROLES.length
    )
    .setValues([
      ENCABEZADOS_HISTORIAL_ROLES
    ]);
}

function obtenerHistorialRolesPorCorreo_(ss) {
  const hoja = obtenerHojaHistorialRoles_(ss);
  const mapa = {};

  if (!hoja || hoja.getLastRow() <= 1) {
    return mapa;
  }

  const datos = hoja
    .getRange(
      2,
      1,
      hoja.getLastRow() - 1,
      ENCABEZADOS_HISTORIAL_ROLES.length
    )
    .getValues();

  datos.forEach(function(row, index) {
    const correo = normalizarTexto(row[0]);
    const rol = normalizarSinAcentos_(row[2]);

    if (!correo || !rol) return;

    if (!mapa[correo]) {
      mapa[correo] = [];
    }

    mapa[correo].push({
      filaHistorial: index + 2,
      correo: correo,
      nombre: row[1],
      rol: row[2],
      fechaInicio: fechaSoloDia(row[3]),
      fechaFin: fechaSoloDia(row[4]),
      fuente: row[5],
      cuentaCompromiso: row[6],
      observacion: row[7],
      fechaRegistro: convertirAFecha(row[8])
    });
  });

  Object.keys(mapa).forEach(function(correo) {
    mapa[correo].sort(function(a, b) {
      const ta = a.fechaInicio
        ? a.fechaInicio.getTime()
        : Number.MAX_SAFE_INTEGER;

      const tb = b.fechaInicio
        ? b.fechaInicio.getTime()
        : Number.MAX_SAFE_INTEGER;

      return ta - tb;
    });
  });

  return mapa;
}

function obtenerTransicionAsistente_(pasante, historialPorCorreo) {
  const registros =
    historialPorCorreo[pasante.correo] || [];

  const asistentes =
    registros.filter(function(registro) {
      return (
        normalizarSinAcentos_(registro.rol) ===
        'asistente'
      );
    });

  if (asistentes.length === 0) {
    return {
      existeRegistro: false,
      fechaInicio: null,
      fechaFin: null,
      cuentaCompromiso: '',
      fuente: '',
      observacion: ''
    };
  }

  const conFecha =
    asistentes.filter(function(registro) {
      return !!registro.fechaInicio;
    });

  // El primer inicio válido de ASISTENTE representa
  // el paso inicial desde PASANTE.
  const elegido =
    conFecha.length > 0
      ? conFecha[0]
      : asistentes[0];

  return {
    existeRegistro: true,
    fechaInicio: elegido.fechaInicio,
    fechaFin: elegido.fechaFin,
    cuentaCompromiso: elegido.cuentaCompromiso,
    fuente: elegido.fuente,
    observacion: elegido.observacion
  };
}

function esAsistenteExPasante_(pasante) {
  return (
    normalizarSinAcentos_(
      pasante.cualidadActual
    ) === 'asistente' &&
    normalizarSinAcentos_(
      pasante.cualidadPasada
    ) === 'pasante'
  );
}

/**
 * Prepara únicamente la BASE CENTRAL.
 *
 * SÍ puede:
 * - crear Historial_Roles;
 * - actualizar sus encabezados y validaciones;
 * - ampliar los encabezados de Registro_Planner;
 * - crear filas pendientes para ASISTENTE actual / PASANTE pasado.
 *
 * NO modifica planners externos.
 */
function prepararEstructuraSistemaPlanners() {
  const ss =
    obtenerBasePasantes();

  const hojaRoles =
    obtenerHojaHistorialRoles_(
      ss,
      true
    );

  asegurarEncabezadosHistorialRoles_(
    hojaRoles
  );

  const hojaRegistro =
    ss.getSheetByName(
      HOJA_REGISTRO_PLANNER
    );

  if (!hojaRegistro) {
    throw new Error(
      'No se encontró ' +
      HOJA_REGISTRO_PLANNER +
      '.'
    );
  }

  asegurarEncabezadosRegistroPlanner_(
    hojaRegistro
  );

  actualizarDocumentacionRegistroPlanner_(
    ss,
    hojaRegistro
  );

  const hojaVariables =
    ss.getSheetByName(
      HOJA_VARIABLES
    );

  if (!hojaVariables) {
    throw new Error(
      'No se encontró ' +
      HOJA_VARIABLES +
      '.'
    );
  }

  const mapa =
    obtenerMapaVariablesV87_(
      hojaVariables
    );

  const datos =
    hojaVariables
      .getDataRange()
      .getValues();

  const historial =
    obtenerHistorialRolesPorCorreo_(
      ss
    );

  const pendientes = [];

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    const row =
      datos[i];

    const correo =
      normalizarTexto(
        row[
          mapa.correo
        ]
      );

    if (!correo) {
      continue;
    }

    const actual =
      normalizarSinAcentos_(
        row[
          mapa.cualidadActual
        ]
      );

    const pasada =
      normalizarSinAcentos_(
        row[
          mapa.cualidadPasada
        ]
      );

    if (
      actual !== 'asistente' ||
      pasada !== 'pasante'
    ) {
      continue;
    }

    const yaExiste =
      (historial[
        correo
      ] || [])
        .some(
          function(registro) {
            return (
              normalizarSinAcentos_(
                registro.rol
              ) ===
              'asistente'
            );
          }
        );

    if (yaExiste) {
      continue;
    }

    pendientes.push([
      correo,
      row[
        mapa.nombre
      ],
      'ASISTENTE',
      '',
      '',
      '',
      'Sí',
      'Completar Fecha inicio del rol ASISTENTE usando una fuente verificable. No inferir la fecha.',
      new Date()
    ]);
  }

  if (
    pendientes.length > 0
  ) {
    hojaRoles
      .getRange(
        hojaRoles.getLastRow() + 1,
        1,
        pendientes.length,
        ENCABEZADOS_HISTORIAL_ROLES.length
      )
      .setValues(
        pendientes
      );
  }

  const resultado = {
    hojaHistorialRoles:
      HOJA_HISTORIAL_ROLES,

    filasPendientesCreadas:
      pendientes.length,

    columnasRegistroPlanner:
      ENCABEZADOS_REGISTRO_PLANNER.length,

    accesoVariables:
      'POR_ENCABEZADO_V8_7'
  };

  console.log(
    'ESTRUCTURA PREPARADA:',
    resultado
  );

  Logger.log(
    JSON.stringify(
      resultado
    )
  );

  return resultado;
}

function diagnosticarTransicionesRoles() {
  const ss =
    obtenerBasePasantes();

  const hojaVariables =
    ss.getSheetByName(
      HOJA_VARIABLES
    );

  if (!hojaVariables) {
    throw new Error(
      'No se encontró ' +
      HOJA_VARIABLES +
      '.'
    );
  }

  const mapa =
    obtenerMapaVariablesV87_(
      hojaVariables
    );

  const datos =
    hojaVariables
      .getDataRange()
      .getValues();

  const historial =
    obtenerHistorialRolesPorCorreo_(
      ss
    );

  const resumen = {
    asistentesExPasantes:
      0,

    conRegistroAsistente:
      0,

    conFechaTransicion:
      0,

    sinFechaTransicion:
      0,

    cuentanCompromiso:
      0,

    noCuentanCompromiso:
      0,

    porRevisarCompromiso:
      0
  };

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    const row =
      datos[i];

    const correo =
      normalizarTexto(
        row[
          mapa.correo
        ]
      );

    if (!correo) {
      continue;
    }

    const persona = {
      correo:
        correo,

      nombre:
        row[
          mapa.nombre
        ],

      cualidadActual:
        row[
          mapa.cualidadActual
        ],

      cualidadPasada:
        row[
          mapa.cualidadPasada
        ]
    };

    if (
      !esAsistenteExPasante_(
        persona
      )
    ) {
      continue;
    }

    resumen.asistentesExPasantes++;

    const transicion =
      obtenerTransicionAsistente_(
        persona,
        historial
      );

    if (
      transicion.existeRegistro
    ) {
      resumen.conRegistroAsistente++;
    }

    if (
      transicion.fechaInicio
    ) {
      resumen.conFechaTransicion++;
    } else {
      resumen.sinFechaTransicion++;
    }

    const cuenta =
      normalizarSinAcentos_(
        transicion.cuentaCompromiso
      );

    if (
      cuenta === 'si'
    ) {
      resumen.cuentanCompromiso++;
    } else if (
      cuenta === 'no'
    ) {
      resumen.noCuentanCompromiso++;
    } else {
      resumen.porRevisarCompromiso++;
    }

    console.log(
      '[ROL] ' +
      correo +
      ' | nombre=' +
      (persona.nombre || '') +
      ' | inicio asistente=' +
      (
        transicion.fechaInicio ||
        'PENDIENTE'
      ) +
      ' | fin asistente=' +
      (
        transicion.fechaFin ||
        ''
      ) +
      ' | política histórica cuenta compromiso=' +
      (
        transicion.cuentaCompromiso ||
        'POR REVISAR'
      ) +
      ' | fuente=' +
      (
        transicion.fuente ||
        ''
      )
    );
  }

  console.log(
    '=== RESUMEN TRANSICIONES DE ROL ==='
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


/**
 * Diagnóstico SOLO LECTURA de BQ:BS.
 * Ayuda a detectar pasantes en proceso de contratación,
 * aprobados y registros incompletos.
 */
function diagnosticarTransicionLaboral() {
  const ss =
    obtenerBasePasantes();

  const hoja =
    ss.getSheetByName(
      HOJA_VARIABLES
    );

  if (!hoja) {
    throw new Error(
      'No se encontró ' +
      HOJA_VARIABLES +
      '.'
    );
  }

  const mapa =
    obtenerMapaVariablesV87_(
      hoja
    );

  const datos =
    hoja
      .getDataRange()
      .getValues();

  const resumen = {
    conEstadoTransicion:
      0,

    sinProceso:
      0,

    enProcesoContratacion:
      0,

    contratacionAprobada:
      0,

    procesoCerradoSinContratacion:
      0,

    otrosValores:
      0,

    conFechaInicioTransicion:
      0,

    sinFechaInicioTransicion:
      0,

    aprobadosQueSiguenComoPasante:
      0
  };

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    const row =
      datos[i];

    const correo =
      normalizarTexto(
        row[
          mapa.correo
        ]
      );

    if (!correo) {
      continue;
    }

    const estadoTransicion =
      normalizarSinAcentos_(
        row[
          mapa.estadoTransicion
        ]
      );

    const fechaTransicion =
      fechaSoloDia(
        row[
          mapa.fechaTransicion
        ]
      );

    const persona = {
      correo:
        correo,

      nombre:
        row[
          mapa.nombre
        ],

      estadoPasantia:
        row[
          mapa.estadoPasantia
        ],

      cualidadActual:
        row[
          mapa.cualidadActual
        ],

      cualidadPasada:
        row[
          mapa.cualidadPasada
        ],

      estadoTransicionLaboral:
        row[
          mapa.estadoTransicion
        ],

      fechaInicioTransicionLaboral:
        fechaTransicion
    };

    if (
      !estadoTransicion
    ) {
      continue;
    }

    resumen.conEstadoTransicion++;

    if (
      estadoTransicion ===
      'sin proceso'
    ) {
      resumen.sinProceso++;
    } else if (
      estadoTransicion ===
      'en proceso de contratacion'
    ) {
      resumen.enProcesoContratacion++;
    } else if (
      estadoTransicion ===
      'contratacion aprobada'
    ) {
      resumen.contratacionAprobada++;

      if (
        esPasanteActual_(
          persona
        )
      ) {
        resumen
          .aprobadosQueSiguenComoPasante++;
      }
    } else if (
      estadoTransicion ===
      'proceso cerrado sin contratacion'
    ) {
      resumen
        .procesoCerradoSinContratacion++;
    } else {
      resumen.otrosValores++;
    }

    if (
      fechaTransicion
    ) {
      resumen
        .conFechaInicioTransicion++;
    } else if (
      estadoTransicion !==
      'sin proceso'
    ) {
      resumen
        .sinFechaInicioTransicion++;
    }

    console.log(
      '[PUBLIC RELEASE LABORAL] ' +
      correo +
      ' | nombre=' +
      (
        persona.nombre ||
        ''
      ) +
      ' | estado=' +
      (
        row[
          mapa.estadoTransicion
        ] || ''
      ) +
      ' | fecha inicio=' +
      (
        fechaTransicion ||
        'PENDIENTE'
      ) +
      ' | cualidad actual=' +
      (
        persona.cualidadActual ||
        ''
      ) +
      ' | situación=' +
      clasificarSituacionSeguimiento_(
        persona
      )
    );
  }

  console.log(
    '=== RESUMEN PUBLIC RELEASE LABORAL ==='
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
 * FECHAS Y FILAS
 * ============================================================
 */

function convertirAFecha(valor) {
  if (valor === '' || valor === null || valor === undefined) return null;

  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return new Date(valor.getTime());
  }

  const fecha = new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
}

function fechaSoloDia(valor) {
  const fecha = convertirAFecha(valor);
  if (!fecha) return null;

  return new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate()
  );
}

function diferenciaDias(fechaA, fechaB) {
  const a = fechaSoloDia(fechaA);
  const b = fechaSoloDia(fechaB);

  if (!a || !b) return null;
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function filaPlannerEstaVacia(row) {
  return row.slice(0, 13).every(function(valor) {
    return valor === '' || valor === null || valor === undefined;
  });
}

/* ============================================================
 * PASANTES Y RÉGIMEN
 * ============================================================
 */


/**
 * Intenta recuperar el URL real de Variables_Internas!Z aunque la celda
 * muestre solamente un texto enlazado.
 *
 * Prioridad:
 * 1) link de RichText;
 * 2) URL de fórmula HYPERLINK;
 * 3) valor visible / ID directo.
 *
 * SOLO LECTURA.
 */
function extraerUrlHyperlinkFormula_(formula) {
  if (!formula) return '';

  const texto = formula.toString().trim();

  // Funciona con separador coma o punto y coma.
  const match = texto.match(
    /^=HYPERLINK\(\s*"([^"]+)"/i
  );

  return match ? match[1] : '';
}

function extraerLinkRichText_(richText) {
  if (!richText) return '';

  try {
    const linkDirecto = richText.getLinkUrl();
    if (linkDirecto) return linkDirecto;
  } catch (error) {
    // Continuar con runs.
  }

  try {
    const runs = richText.getRuns();

    for (let i = 0; i < runs.length; i++) {
      const link = runs[i].getLinkUrl();
      if (link) return link;
    }
  } catch (errorRuns) {
    // Sin links.
  }

  return '';
}

function resolverLinkPlannerCelda_(
  valorVisible,
  formula,
  richText
) {
  const linkRich =
    extraerLinkRichText_(richText);

  if (linkRich) {
    return {
      link: linkRich.toString().trim(),
      fuente: 'RICH_TEXT'
    };
  }

  const linkFormula =
    extraerUrlHyperlinkFormula_(formula);

  if (linkFormula) {
    return {
      link: linkFormula.toString().trim(),
      fuente: 'FORMULA_HYPERLINK'
    };
  }

  const visible =
    valorVisible === null ||
    valorVisible === undefined
      ? ''
      : valorVisible.toString().trim();

  return {
    link: visible,
    fuente: visible ? 'VALOR_CELDA' : 'VACIO'
  };
}

function normalizarEncabezadoVariablesV87_(valor) {
  return normalizarSinAcentos_(
    valor === null ||
    valor === undefined
      ? ''
      : valor.toString()
  )
    .replace(/\s+/g, ' ')
    .trim();
}


function indiceCampoVariablesV87_(
  headers,
  aliases
) {
  const normalizados =
    headers.map(
      normalizarEncabezadoVariablesV87_
    );

  for (
    let i = 0;
    i < aliases.length;
    i++
  ) {
    const objetivo =
      normalizarEncabezadoVariablesV87_(
        aliases[i]
      );

    const pos =
      normalizados.indexOf(
        objetivo
      );

    if (pos >= 0) {
      return pos;
    }
  }

  return -1;
}


function obtenerMapaVariablesV87_(
  hojaVariables
) {
  const lastCol =
    hojaVariables.getLastColumn();

  const headers =
    hojaVariables
      .getRange(
        1,
        1,
        1,
        lastCol
      )
      .getDisplayValues()[0];

  const mapa = {};

  Object.keys(
    CAMPOS_VARIABLES_V87
  ).forEach(
    function(campo) {
      mapa[campo] =
        indiceCampoVariablesV87_(
          headers,
          CAMPOS_VARIABLES_V87[
            campo
          ]
        );
    }
  );

  const obligatorios = [
    'correo',
    'nombre',
    'estadoPasantia',
    'linkPlanner',
    'inicioPas',
    'finPas',
    'inicioExt',
    'finExt',
    'cualidadActual',
    'cualidadPasada',
    'retiro',
    'estadoTransicion',
    'fechaTransicion',
    'observacionTransicion',
    'estadoVinculo',
    'fechaFinVinculo',
    'motivoFinVinculo'
  ];

  const faltantes =
    obligatorios.filter(
      function(campo) {
        return mapa[campo] < 0;
      }
    );

  if (faltantes.length > 0) {
    throw new Error(
      'Variables_Internas no contiene campos requeridos por el módulo Planner: ' +
      faltantes.join(', ')
    );
  }

  return mapa;
}


function obtenerExcepcionesRegimenPorCorreo_(
  ss
) {
  const hoja =
    ss.getSheetByName(
      HOJA_EXCEPCIONES_REGIMEN
    );

  if (!hoja || hoja.getLastRow() <= 1) {
    return {};
  }

  const datos =
    hoja.getDataRange()
      .getValues();

  const headers =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0];

  const idxCorreo =
    indiceCampoVariablesV87_(
      headers,
      ['Correo oficial']
    );

  const idxRegimen =
    indiceCampoVariablesV87_(
      headers,
      ['Régimen']
    );

  const idxActivo =
    indiceCampoVariablesV87_(
      headers,
      ['Activo']
    );

  if (
    idxCorreo < 0 ||
    idxRegimen < 0 ||
    idxActivo < 0
  ) {
    throw new Error(
      'Excepciones_Regimen no tiene la estructura esperada.'
    );
  }

  const mapa = {};

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    const correo =
      normalizarTexto(
        datos[i][idxCorreo]
      );

    const activo =
      normalizarSinAcentos_(
        datos[i][idxActivo]
      );

    const regimen =
      normalizarSinAcentos_(
        datos[i][idxRegimen]
      );

    if (
      correo &&
      activo === 'si' &&
      (
        regimen === 'historico' ||
        regimen === 'nuevo'
      )
    ) {
      mapa[correo] =
        regimen === 'historico'
          ? 'HISTORICO'
          : 'NUEVO';
    }
  }

  return mapa;
}


function obtenerLinksPlannerPorFila_(
  hojaVariables,
  mapaVariables
) {
  const lastRow =
    hojaVariables.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const mapa =
    mapaVariables ||
    obtenerMapaVariablesV87_(
      hojaVariables
    );

  const cantidad =
    lastRow - 1;

  const rango =
    hojaVariables.getRange(
      2,
      mapa.linkPlanner + 1,
      cantidad,
      1
    );

  const visibles =
    rango.getDisplayValues();

  const formulas =
    rango.getFormulas();

  const richTexts =
    rango.getRichTextValues();

  const resultado = [];

  for (
    let i = 0;
    i < cantidad;
    i++
  ) {
    resultado.push(
      resolverLinkPlannerCelda_(
        visibles[i][0],
        formulas[i][0],
        richTexts[i][0]
      )
    );
  }

  return resultado;
}

function obtenerPasantesConPlanner_(
  hojaVariables
) {
  const ss =
    hojaVariables.getParent();

  const mapa =
    obtenerMapaVariablesV87_(
      hojaVariables
    );

  const datos =
    hojaVariables
      .getDataRange()
      .getValues();

  const linksPorFila =
    obtenerLinksPlannerPorFila_(
      hojaVariables,
      mapa
    );

  const historialRoles =
    obtenerHistorialRolesPorCorreo_(
      ss
    );

  const excepcionesRegimen =
    obtenerExcepcionesRegimenPorCorreo_(
      ss
    );

  const pasantes = [];

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    const row =
      datos[i];

    const correo =
      normalizarTexto(
        row[
          mapa.correo
        ]
      );

    const linkInfo =
      linksPorFila[
        i - 1
      ] || {
        link: '',
        fuente: 'VACIO'
      };

    const linkPlanner =
      linkInfo.link
        ? linkInfo.link
            .toString()
            .trim()
        : '';

    if (
      !correo ||
      !linkPlanner
    ) {
      continue;
    }

    const base = {
      filaVariables:
        i + 1,

      correo:
        correo,

      nombre:
        row[
          mapa.nombre
        ],

      estadoPasantia:
        row[
          mapa.estadoPasantia
        ],

      cualidadActual:
        row[
          mapa.cualidadActual
        ],

      cualidadPasada:
        row[
          mapa.cualidadPasada
        ],

      linkPlanner:
        linkPlanner,

      fuenteLinkPlanner:
        linkInfo.fuente,

      inicioPas:
        fechaSoloDia(
          row[
            mapa.inicioPas
          ]
        ),

      finPas:
        fechaSoloDia(
          row[
            mapa.finPas
          ]
        ),

      inicioExt:
        fechaSoloDia(
          row[
            mapa.inicioExt
          ]
        ),

      finExt:
        fechaSoloDia(
          row[
            mapa.finExt
          ]
        ),

      regimenExcepcion:
        excepcionesRegimen[
          correo
        ] || '',

      retiro:
        fechaSoloDia(
          row[
            mapa.retiro
          ]
        ),

      estadoTransicionLaboral:
        row[
          mapa.estadoTransicion
        ],

      fechaInicioTransicionLaboral:
        fechaSoloDia(
          row[
            mapa.fechaTransicion
          ]
        ),

      observacionTransicionLaboral:
        row[
          mapa.observacionTransicion
        ],

      estadoVinculoLaboral:
        row[
          mapa.estadoVinculo
        ],

      fechaFinVinculoLaboral:
        fechaSoloDia(
          row[
            mapa.fechaFinVinculo
          ]
        ),

      motivoFinVinculoLaboral:
        row[
          mapa.motivoFinVinculo
        ]
    };

    base.transicionAsistente =
      obtenerTransicionAsistente_(
        base,
        historialRoles
      );

    pasantes.push(
      base
    );
  }

  return pasantes;
}

function clasificarRegimen_(
  pasante,
  config
) {
  const excepcion =
    normalizarSinAcentos_(
      pasante.regimenExcepcion
    );

  if (
    excepcion === 'historico'
  ) {
    return 'HISTORICO';
  }

  if (
    excepcion === 'nuevo'
  ) {
    return 'NUEVO';
  }

  if (!pasante.inicioPas) {
    return 'SIN_CLASIFICAR';
  }

  const fechaInicioSistema =
    fechaSoloDia(
      config[
        'FECHA_INICIO_NUEVO_SISTEMA'
      ]
    );

  if (!fechaInicioSistema) {
    throw new Error(
      'FECHA_INICIO_NUEVO_SISTEMA no es válida.'
    );
  }

  return (
    pasante.inicioPas >=
    fechaInicioSistema
  )
    ? 'NUEVO'
    : 'HISTORICO';
}

function esPasanteActual_(pasante) {
  const estado =
    normalizarSinAcentos_(pasante.estadoPasantia);

  const cualidad =
    normalizarSinAcentos_(pasante.cualidadActual);

  return (
    estado === 'vigente' &&
    cualidad === 'pasante'
  );
}

/**
 * Etiqueta descriptiva pensada para reportes/dashboards.
 * No penaliza ni excluye información.
 */
function clasificarSituacionSeguimiento_(pasante) {
  const estado =
    normalizarSinAcentos_(
      pasante.estadoPasantia
    );

  const cualidad =
    normalizarSinAcentos_(
      pasante.cualidadActual
    );

  const cualidadPasada =
    normalizarSinAcentos_(
      pasante.cualidadPasada
    );

  const transicionLaboral =
    normalizarSinAcentos_(
      pasante.estadoTransicionLaboral
    );

  const estadoVinculo =
    normalizarSinAcentos_(
      pasante.estadoVinculoLaboral
    );

  if (
    estado === 'vigente' &&
    cualidad === 'pasante'
  ) {
    if (
      transicionLaboral ===
      'en proceso de contratacion'
    ) {
      return 'PASANTE_EN_PROCESO_CONTRATACION';
    }

    if (
      transicionLaboral ===
      'contratacion aprobada'
    ) {
      return 'PASANTE_CONTRATACION_APROBADA';
    }

    if (
      transicionLaboral ===
      'proceso cerrado sin contratacion'
    ) {
      return 'PASANTE_PROCESO_CERRADO_SIN_CONTRATACION';
    }

    return 'PASANTE_ACTUAL';
  }

  /*
   * PASANTE -> ASISTENTE se identifica por las cualidades,
   * aunque el resultado de la pasantía en K sea "Contratado".
   */
  if (
    cualidad === 'asistente' &&
    cualidadPasada === 'pasante'
  ) {
    if (
      estadoVinculo ===
      'vinculo finalizado'
    ) {
      return 'ASISTENTE_EX_PASANTE_VINCULO_FINALIZADO';
    }

    return 'ASISTENTE_EX_PASANTE';
  }

  if (
    estado === 'retirado' ||
    estado === 'retirada' ||
    estado === 'retiro'
  ) {
    return 'PASANTIA_RETIRADA';
  }

  if (
    estado === 'terminada' ||
    estado === 'terminado' ||
    estado === 'finalizada' ||
    estado === 'finalizado'
  ) {
    return 'PASANTIA_TERMINADA';
  }

  if (
    estado === 'contratado' ||
    estado === 'contratada'
  ) {
    return 'CONTRATADO';
  }

  if (
    estado === 'vigente' &&
    cualidad &&
    cualidad !== 'pasante'
  ) {
    return 'VIGENTE_OTRO_ROL';
  }

  if (
    estado === 'vigente' &&
    !cualidad
  ) {
    return 'VIGENTE_SIN_CUALIDAD';
  }

  if (!estado) {
    return 'SIN_ESTADO_PASANTIA';
  }

  return 'OTRO_ESTADO';
}

function clasificarEtapaActividad_(
  fechaActividad,
  pasante,
  periodo,
  regimen
) {
  const fecha =
    fechaSoloDia(
      fechaActividad
    );

  const transicion =
    pasante.transicionAsistente || {
      existeRegistro: false,
      fechaInicio: null,
      fechaFin: null,
      cuentaCompromiso: ''
    };

  if (!fecha) {
    return {
      etapa: 'SIN_FECHA',
      cuentaCompromiso: 'Por revisar',
      horasElegibles: false,
      observacion:
        'No se puede clasificar etapa sin fecha de actividad'
    };
  }

  /*
   * FRONTERA DURA 1: RETIRO.
   * BP es último día incluido. Todo lo posterior queda fuera.
   */
  if (
    pasante.retiro &&
    fecha > pasante.retiro
  ) {
    return {
      etapa: 'POSTERIOR_RETIRO',
      cuentaCompromiso: 'No',
      horasElegibles: false,
      observacion:
        'Actividad posterior a fecha de retiro'
    };
  }

  if (
    esAsistenteExPasante_(pasante) &&
    !transicion.fechaInicio
  ) {
    return {
      etapa: 'TRANSICION_SIN_FECHA',
      cuentaCompromiso: 'Por revisar',
      horasElegibles: false,
      observacion:
        'Existe paso PASANTE -> ASISTENTE pero falta Fecha inicio del rol ASISTENTE en Historial_Roles'
    };
  }

  /*
   * FRONTERA DURA 2: INICIO DEL CONTRATO / ROL ASISTENTE.
   * Desde ese mismo día la actividad se conserva, pero nunca cuenta
   * para la pasantía, aunque Historial_Roles conserve una política antigua.
   */
  if (
    transicion.fechaInicio &&
    fecha >= transicion.fechaInicio
  ) {
    const dentroRolAsistente =
      !transicion.fechaFin ||
      fecha <= transicion.fechaFin;

    if (!dentroRolAsistente) {
      return {
        etapa: 'POSTERIOR_ASISTENTE',
        cuentaCompromiso: 'No',
        horasElegibles: false,
        observacion:
          'Actividad posterior a la fecha fin registrada del rol ASISTENTE'
      };
    }

    return {
      etapa: 'ASISTENTE',
      cuentaCompromiso: 'No',
      horasElegibles: false,
      observacion:
        'Actividad realizada desde la fecha de inicio del contrato ASISTENTE; se conserva como historial laboral y no se contabiliza para la pasantía'
    };
  }

  /*
   * Histórico sin fechas de pasantía:
   * conserva actividades descriptivas sin inventar fechas/períodos.
   */
  const historicoSinFechasPasantia =
    regimen === 'HISTORICO' &&
    !pasante.inicioPas &&
    !pasante.inicioExt &&
    !transicion.fechaInicio &&
    !esAsistenteExPasante_(pasante);

  if (historicoSinFechasPasantia) {
    return {
      etapa: 'PASANTE_HISTORICO_SIN_FECHAS',
      cuentaCompromiso: 'Sí',
      horasElegibles: true,
      observacion:
        'Histórico sin fechas de pasantía/extensión: actividad conservada como candidata descriptiva de pasantía; no se infieren fechas ni períodos'
    };
  }

  const codigoPeriodo =
    periodo && periodo.periodo
      ? String(periodo.periodo).trim().toUpperCase()
      : '';

  const periodoBaseFormal =
    /^P\d+$/.test(
      codigoPeriodo
    );

  const periodoExtensionFormal =
    /^E\d+$/.test(
      codigoPeriodo
    );

  const periodoExtraHistorico =
    /^X\d+$/.test(
      codigoPeriodo
    );

  /*
   * EXTRA_HISTORICO se define por FECHA: ocurre después del último
   * fin formal registrado (AB o AG) y antes de retiro/contrato.
   * No depende de que el código sea P4, P5, etc.
   */
  if (periodoExtraHistorico) {
    return {
      etapa: 'EXTRA_HISTORICO',
      cuentaCompromiso: 'No',
      horasElegibles: false,
      observacion:
        'Actividad adicional posterior al fin formal de la pasantía/extensión y anterior a retiro o inicio de contrato; se conserva históricamente y no incrementa el compromiso formal'
    };
  }

  const periodoFormal =
    periodoBaseFormal ||
    periodoExtensionFormal;

  if (
    pasante.inicioPas &&
    fecha >= pasante.inicioPas
  ) {
    return {
      etapa: 'PASANTE',
      cuentaCompromiso:
        periodoFormal
          ? 'Sí'
          : 'Por revisar',
      horasElegibles:
        periodoFormal,
      observacion:
        periodoFormal
          ? ''
          : 'Actividad de etapa PASANTE fuera del rango formal declarado; conservar para revisión'
    };
  }

  return {
    etapa: 'PRE_PASANTIA',
    cuentaCompromiso: 'No',
    horasElegibles: false,
    observacion:
      'Actividad anterior a la fecha registrada de inicio de pasantía'
  };
}

function normalizarNombreDiagnostico_(valor) {
  return normalizarSinAcentos_(valor)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokensNombreDiagnostico_(nombre) {
  const texto =
    normalizarNombreDiagnostico_(nombre);

  if (!texto) return [];

  return texto
    .split(' ')
    .filter(function(token) {
      return token.length >= 3;
    });
}

/**
 * Indicador preventivo, no modifica nada.
 * Devuelve true solamente si hay nombre de pasante y también nombres
 * de carpeta/archivo, pero ninguno comparte un token del nombre.
 */
function posibleCrucePlanner_(
  nombrePasante,
  nombreCarpeta,
  nombreArchivo
) {
  const tokens =
    tokensNombreDiagnostico_(nombrePasante);

  if (tokens.length === 0) return false;

  const destino =
    normalizarNombreDiagnostico_(
      (nombreCarpeta || '') +
      ' ' +
      (nombreArchivo || '')
    );

  if (!destino) return false;

  return !tokens.some(function(token) {
    return destino.includes(token);
  });
}

/* ============================================================
 * LOCALIZACIÓN DEL PLANNER EN DRIVE
 * ============================================================
 */

function extraerIdDrive(valor) {
  if (!valor) return null;

  const match = valor
    .toString()
    .trim()
    .match(/[-\w]{25,}/);

  return match ? match[0] : null;
}

/**
 * Normalización especial para comparar encabezados.
 * Además de espacios/guiones, elimina acentos para que
 * "Día", "DIA" y "dia" sean equivalentes.
 */
function normalizarEncabezadoClave_(valor) {
  return normalizarSinAcentos_(
    normalizarEncabezado(valor)
  );
}

/**
 * Normalización más tolerante para detectar columnas de planners.
 *
 * Esta capa NO modifica el planner. Solo permite leer variantes futuras
 * cuando cambian espacios, guiones, guiones bajos, acentos o nombres
 * equivalentes de encabezado.
 */
function normalizarEncabezadoPlannerFlexible_(valor) {
  return normalizarEncabezadoClave_(valor)
    .replace(/[_\-–—]+/g, ' ')
    .replace(/[.:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ALIASES_COLUMNAS_PLANNER = {
  tipo: [
    'tipo',
    'tipo actividad',
    'tipo de actividad'
  ],
  compo: [
    'compo',
    'componente'
  ],
  subComp: [
    'sub comp',
    'subcomponente',
    'sub componente'
  ],
  descripcion: [
    'descripcion',
    'descripcion actividad',
    'descripcion de actividad',
    'detalle'
  ],
  encargado: [
    'encargado',
    'responsable'
  ],
  fecha: [
    'fecha',
    'fecha actividad',
    'fecha de actividad'
  ],
  dia: [
    'dia'
  ],
  horaInicio: [
    'hora inicio',
    'hora de inicio',
    'inicio'
  ],
  horaFin: [
    'hora fin',
    'hora de fin',
    'fin'
  ],
  duracion: [
    'duracion',
    'duracion total',
    'tiempo',
    'horas'
  ],
  estado: [
    'estado',
    'status'
  ],
  evidencia: [
    'respaldo link',
    'respaldo',
    'evidencia',
    'link evidencia',
    'evidencia link'
  ],
  comentario: [
    'comentario',
    'comentarios',
    'observacion',
    'observaciones'
  ],
  usuario: [
    'usuario',
    'user'
  ]
};

function mapaColumnasPlannerVacio_() {
  return {
    tipo: -1,
    compo: -1,
    subComp: -1,
    descripcion: -1,
    encargado: -1,
    fecha: -1,
    dia: -1,
    horaInicio: -1,
    horaFin: -1,
    duracion: -1,
    estado: -1,
    evidencia: -1,
    comentario: -1,
    usuario: -1
  };
}

function mapearEncabezadosPlanner_(headersOriginales) {
  const mapa = mapaColumnasPlannerVacio_();
  const campos =
    Object.keys(ALIASES_COLUMNAS_PLANNER);

  headersOriginales.forEach(function(header, indice) {
    const normalizado =
      normalizarEncabezadoPlannerFlexible_(
        header
      );

    if (!normalizado) return;

    for (let i = 0; i < campos.length; i++) {
      const campo = campos[i];

      if (mapa[campo] >= 0) {
        continue;
      }

      if (
        ALIASES_COLUMNAS_PLANNER[
          campo
        ].indexOf(normalizado) >= 0
      ) {
        mapa[campo] = indice;
        break;
      }
    }
  });

  return mapa;
}

function contarColumnasMapeadasPlanner_(mapa) {
  return Object.keys(mapa)
    .filter(function(campo) {
      return mapa[campo] >= 0;
    })
    .length;
}

function indicePlannerEstaUsado_(
  mapa,
  indice,
  campoIgnorado
) {
  return Object.keys(mapa)
    .some(function(campo) {
      if (campo === campoIgnorado) {
        return false;
      }

      return mapa[campo] === indice;
    });
}

function mapaPlannerEsActual_(mapa) {
  return (
    mapa.tipo === 0 &&
    mapa.compo === 1 &&
    mapa.subComp === 2 &&
    mapa.descripcion === 3 &&
    mapa.encargado === 4 &&
    mapa.fecha === 5 &&
    mapa.horaInicio === 6 &&
    mapa.horaFin === 7 &&
    mapa.duracion === 8 &&
    mapa.estado === 9 &&
    mapa.evidencia === 10 &&
    mapa.comentario === 11 &&
    mapa.usuario === 12
  );
}

function mapaPlannerEsHistoricoDia_(mapa) {
  return (
    mapa.tipo === 0 &&
    mapa.compo === 1 &&
    mapa.subComp === 2 &&
    mapa.descripcion === 3 &&
    mapa.encargado < 0 &&
    mapa.fecha === 4 &&
    mapa.dia === 5 &&
    mapa.horaInicio === 6 &&
    mapa.horaFin === 7 &&
    mapa.duracion === 8 &&
    mapa.estado === 9 &&
    mapa.evidencia === 10 &&
    mapa.comentario === 11 &&
    mapa.usuario === 12
  );
}

/**
 * Detecta un planner por SIGNIFICADO de columnas, no por una única
 * posición rígida.
 *
 * Requisitos mínimos:
 * - descripción;
 * - fecha;
 * - duración, o bien Hora inicio + Hora fin;
 * - al menos dos columnas auxiliares de control.
 *
 * Esto permite soportar planners futuros con columnas opcionales faltantes
 * o con posiciones distintas sin cambiar los archivos externos.
 */
function detectarFormatoPlanner_(headersOriginales) {
  const mapa =
    mapearEncabezadosPlanner_(
      headersOriginales
    );

  let tipoInferido = false;

  const tieneTiempo =
    mapa.duracion >= 0 ||
    (
      mapa.horaInicio >= 0 &&
      mapa.horaFin >= 0
    );

  /*
   * Caso histórico: A1 fue sobrescrito, pero el resto de la estructura
   * identifica claramente el planner. Solo inferimos A=tipo cuando:
   * - descripción, fecha y tiempo existen;
   * - estado y evidencia existen;
   * - ninguna otra columna reconocida usa A.
   *
   * Así evitamos aceptar hojas ajenas por accidente.
   */
  if (
    mapa.tipo < 0 &&
    mapa.descripcion >= 0 &&
    mapa.fecha >= 0 &&
    tieneTiempo &&
    mapa.estado >= 0 &&
    mapa.evidencia >= 0 &&
    !indicePlannerEstaUsado_(
      mapa,
      0,
      'tipo'
    )
  ) {
    mapa.tipo = 0;
    tipoInferido = true;
  }

  const auxiliares = [
    'tipo',
    'compo',
    'subComp',
    'encargado',
    'estado',
    'evidencia',
    'comentario',
    'usuario'
  ].filter(function(campo) {
    return mapa[campo] >= 0;
  }).length;

  const valido =
    mapa.descripcion >= 0 &&
    mapa.fecha >= 0 &&
    (
      mapa.duracion >= 0 ||
      (
        mapa.horaInicio >= 0 &&
        mapa.horaFin >= 0
      )
    ) &&
    auxiliares >= 2;

  if (!valido) {
    return {
      valido: false,
      formato: '',
      observacion: '',
      mapaColumnas: mapa,
      puntuacion:
        contarColumnasMapeadasPlanner_(
          mapa
        )
    };
  }

  let formato = 'FLEXIBLE';

  if (
    mapaPlannerEsActual_(mapa) &&
    !tipoInferido
  ) {
    formato = 'ACTUAL';
  } else if (
    mapaPlannerEsHistoricoDia_(mapa) &&
    !tipoInferido
  ) {
    formato = 'HISTORICO';
  } else if (
    tipoInferido &&
    mapa.horaInicio < 0 &&
    mapa.horaFin < 0 &&
    mapa.duracion >= 0
  ) {
    formato =
      'HISTORICO_DURACION_A1_DANADO';
  } else if (tipoInferido) {
    formato =
      'FLEXIBLE_A1_DANADO';
  } else if (
    mapa.horaInicio < 0 &&
    mapa.horaFin < 0 &&
    mapa.duracion >= 0
  ) {
    formato =
      'FLEXIBLE_DURACION';
  }

  const observaciones = [];

  if (tipoInferido) {
    observaciones.push(
      'Encabezado de tipo ausente/dañado; columna A inferida como tipo'
    );
  }

  if (
    mapa.horaInicio < 0 ||
    mapa.horaFin < 0
  ) {
    observaciones.push(
      'Planner sin horario completo; se usa duración cuando está disponible'
    );
  }

  if (mapa.encargado < 0) {
    observaciones.push(
      'Planner sin columna Encargado'
    );
  }

  if (mapa.comentario < 0) {
    observaciones.push(
      'Planner sin columna Comentario'
    );
  }

  if (
    formato.indexOf('FLEXIBLE') === 0 ||
    formato.indexOf('HISTORICO_DURACION') === 0
  ) {
    observaciones.push(
      'Columnas reconocidas por encabezado; no se exige posición fija'
    );
  }

  return {
    valido: true,
    formato: formato,
    observacion:
      observaciones.join(' | '),
    mapaColumnas: mapa,
    puntuacion:
      contarColumnasMapeadasPlanner_(
        mapa
      )
  };
}

/**
 * Busca el encabezado del planner en las primeras filas.
 * Normalmente está en la fila 1, pero aceptar hasta 5 filas hace el lector
 * más resistente a títulos agregados encima en versiones futuras.
 */
function detectarEstructuraPlannerEnHoja_(
  hoja
) {
  const lastRow =
    Math.max(
      hoja.getLastRow(),
      1
    );

  const lastColumn =
    Math.max(
      hoja.getLastColumn(),
      1
    );

  const maxColumns =
    Math.max(
      hoja.getMaxColumns(),
      1
    );

  const filasARevisar =
    Math.min(
      lastRow,
      5
    );

  /*
   * Los planners institucionales trabajan en A:M, pero leemos hasta 30
   * columnas para tolerar columnas auxiliares futuras sin convertir esto
   * en una lectura ilimitada.
   */
  const columnasARevisar =
    Math.min(
      maxColumns,
      Math.max(
        1,
        Math.max(
          13,
          Math.min(lastColumn, 30)
        )
      )
    );

  const candidatos =
    hoja
      .getRange(
        1,
        1,
        filasARevisar,
        columnasARevisar
      )
      .getDisplayValues();

  let mejor = null;

  for (
    let fila = 0;
    fila < candidatos.length;
    fila++
  ) {
    const deteccion =
      detectarFormatoPlanner_(
        candidatos[fila]
      );

    if (!deteccion.valido) {
      continue;
    }

    if (
      !mejor ||
      deteccion.puntuacion >
        mejor.puntuacion
    ) {
      mejor = {
        valido: true,
        formato:
          deteccion.formato,
        observacion:
          deteccion.observacion,
        mapaColumnas:
          deteccion.mapaColumnas,
        puntuacion:
          deteccion.puntuacion,
        headerRow:
          fila + 1,
        columnCount:
          columnasARevisar
      };
    }
  }

  if (!mejor) {
    return {
      valido: false,
      formato: '',
      observacion: '',
      mapaColumnas:
        mapaColumnasPlannerVacio_(),
      puntuacion: 0,
      headerRow: 1,
      columnCount:
        columnasARevisar
    };
  }

  if (
    mejor.headerRow > 1
  ) {
    mejor.observacion =
      (
        mejor.observacion
          ? mejor.observacion + ' | '
          : ''
      ) +
      'Encabezado detectado en fila ' +
      mejor.headerRow;
  }

  return mejor;
}

function valorColumnaPlanner_(
  row,
  mapa,
  campo
) {
  if (
    !mapa ||
    mapa[campo] === undefined ||
    mapa[campo] < 0
  ) {
    return '';
  }

  return row[mapa[campo]];
}

/**
 * Convierte cualquier variante reconocida a la estructura canónica
 * interna de 13 posiciones usada por Registro_Planner.
 *
 * Cuando existe mapaColumnas, manda el significado del encabezado y no
 * la posición física. Se conserva un fallback para llamadas antiguas.
 */
function canonicalizarFilaPlanner_(
  row,
  formato,
  mapaColumnas
) {
  if (mapaColumnas) {
    return [
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'tipo'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'compo'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'subComp'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'descripcion'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'encargado'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'fecha'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'horaInicio'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'horaFin'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'duracion'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'estado'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'evidencia'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'comentario'
      ),
      valorColumnaPlanner_(
        row,
        mapaColumnas,
        'usuario'
      )
    ];
  }

  if (
    formato === 'HISTORICO' ||
    formato === 'HISTORICO_A1_DANADO'
  ) {
    return [
      row[0],
      row[1],
      row[2],
      row[3],
      '',
      row[4],
      row[6],
      row[7],
      row[8],
      row[9],
      row[10],
      row[11],
      row[12]
    ];
  }

  return row.slice(0, 13);
}

/**
 * Una fila preparada para uso futuro NO es una actividad.
 *
 * Señales fuertes:
 * - descripción escrita; o
 * - evidencia con fecha/horas; o
 * - fecha + horas reales acompañadas por alguna clasificación.
 *
 * Se ignoran filas que solo contienen valores prellenados, fórmulas,
 * responsable/usuario automático, ceros técnicos o dropdowns incompletos.
 */
function filaPlannerTieneActividad_(
  rowCanonica
) {
  const texto = function(valor) {
    if (
      valor === '' ||
      valor === null ||
      valor === undefined
    ) {
      return '';
    }

    return valor
      .toString()
      .trim();
  };

  const descripcion =
    texto(rowCanonica[3]);

  if (descripcion) {
    return true;
  }

  const evidencia =
    texto(rowCanonica[10]);

  const fecha =
    fechaSoloDia(
      rowCanonica[5]
    );

  const fechaPlausible =
    !!fecha &&
    fecha.getFullYear() >= 2000;

  const horas =
    calcularHoras(
      rowCanonica[6],
      rowCanonica[7],
      rowCanonica[8]
    ).horas;

  if (
    evidencia &&
    (
      fechaPlausible ||
      horas > 0
    )
  ) {
    return true;
  }

  const tieneClasificacion =
    !!(
      texto(rowCanonica[0]) ||
      texto(rowCanonica[1]) ||
      texto(rowCanonica[2]) ||
      texto(rowCanonica[9])
    );

  if (
    fechaPlausible &&
    horas > 0 &&
    tieneClasificacion
  ) {
    return true;
  }

  return false;
}

function inspeccionarArchivoPlanner(fileId) {
  try {
    const ssPlanner =
      SpreadsheetApp.openById(fileId);

    const hojas =
      ssPlanner.getSheets();

    const validas = [];

    for (const hoja of hojas) {
      const deteccion =
        detectarEstructuraPlannerEnHoja_(
          hoja
        );

      if (!deteccion.valido) {
        continue;
      }

      validas.push({
        id: fileId,
        url:
          'https://docs.google.com/spreadsheets/d/' +
          fileId,
        sheetName: hoja.getName(),
        nombreArchivo:
          ssPlanner.getName(),
        formatoPlanner:
          deteccion.formato,
        observacionFormato:
          deteccion.observacion || '',
        mapaColumnas:
          deteccion.mapaColumnas,
        headerRow:
          deteccion.headerRow || 1,
        columnCount:
          deteccion.columnCount || 13
      });
    }

    if (validas.length === 0) {
      return {
        valido: false,
        planners: [],
        error:
          'El archivo no contiene una hoja con una estructura de planner reconocida.'
      };
    }

    /*
     * Compatibilidad: exponemos también el primer planner en la raíz,
     * pero `planners` contiene TODAS las hojas válidas. Así, si en el
     * futuro una persona tiene varios planners dentro de un mismo archivo,
     * se procesan todos y no se descarta ninguno.
     */
    return Object.assign(
      {
        valido: true,
        planners: validas,
        cantidadHojasPlanner:
          validas.length
      },
      validas[0]
    );

  } catch (error) {
    return {
      valido: false,
      planners: [],
      error: error.message
    };
  }
}


/**
 * Archivos de respaldo creados por mantenimiento NO son fuentes
 * operativas del Planner y deben ignorarse aunque su estructura
 * interna sea válida.
 */
function esArchivoPlannerRespaldo_(nombre) {
  const n =
    normalizarSinAcentos_(
      String(nombre || '')
    )
      .toUpperCase()
      .replace(/\s+/g, '_')
      .trim();

  return (
    n.indexOf(
      'BACKUP_PRE_LIMPIEZA_'
    ) === 0 ||
    n.indexOf(
      'BK_PRE_'
    ) === 0
  );
}


function buscarPlannerEnCarpeta_(folderId, silencioso) {
  try {
    const carpeta =
      DriveApp.getFolderById(folderId);

    const nombreCarpeta =
      carpeta.getName();

    if (!silencioso) {
      console.log(
        '[PLANNER] Carpeta accesible: ' +
        nombreCarpeta
      );
    }

    const archivos =
      carpeta.getFiles();

    const encontrados = [];

    let archivosRevisados = 0;
    let sheetsRevisados = 0;

    while (archivos.hasNext()) {
      const archivo =
        archivos.next();

      archivosRevisados++;

      if (
        esArchivoPlannerRespaldo_(
          archivo.getName()
        )
      ) {
        if (!silencioso) {
          console.log(
            '[PLANNER] Respaldo ignorado: ' +
            archivo.getName()
          );
        }

        continue;
      }

      if (!silencioso) {
        console.log(
          '[PLANNER] Revisando archivo: ' +
          archivo.getName()
        );

        console.log(
          '[PLANNER] MIME: ' +
          archivo.getMimeType()
        );
      }

      if (
        archivo.getMimeType() !==
        MimeType.GOOGLE_SHEETS
      ) {
        continue;
      }

      sheetsRevisados++;

      const resultado =
        inspeccionarArchivoPlanner(
          archivo.getId()
        );

      if (resultado.valido) {
        const plannersArchivo =
          (
            resultado.planners &&
            resultado.planners.length
          )
            ? resultado.planners
            : [resultado];

        plannersArchivo.forEach(
          function(plannerResultado) {
            const planner =
              Object.assign(
                {},
                plannerResultado,
                {
                  nombreCarpeta:
                    nombreCarpeta
                }
              );

            encontrados.push(planner);

            if (!silencioso) {
              console.log(
                '[PLANNER] Planner reconocido: ' +
                archivo.getName() +
                ' | hoja=' +
                planner.sheetName +
                ' | formato=' +
                planner.formatoPlanner
              );
            }
          }
        );

      } else if (!silencioso) {
        console.log(
          '[PLANNER] Google Sheet no reconocido como planner: ' +
          archivo.getName()
        );
      }
    }

    if (!silencioso) {
      console.log(
        '[PLANNER] Archivos revisados: ' +
        archivosRevisados
      );

      console.log(
        '[PLANNER] Google Sheets revisados: ' +
        sheetsRevisados
      );

      console.log(
        '[PLANNER] Planners/hojas reconocidos: ' +
        encontrados.length
      );
    }

    return {
      encontrados: encontrados,
      nombreCarpeta: nombreCarpeta,
      error: null
    };

  } catch (error) {
    return {
      encontrados: [],
      nombreCarpeta: '',
      error:
        'No se pudo acceder a la carpeta de Drive: ' +
        error.message
    };
  }
}

function deduplicarPlannersLocalizados_(
  planners
) {
  const vistos = {};
  const unicos = [];

  planners.forEach(function(planner) {
    const clave =
      planner.id +
      '::' +
      planner.sheetName;

    if (vistos[clave]) {
      return;
    }

    vistos[clave] = true;
    unicos.push(planner);
  });

  return unicos;
}

function localizarPlanners(link, silencioso) {
  if (!link) {
    return {
      planners: [],
      nombreCarpeta: '',
      error: 'Sin link'
    };
  }

  const textoLink =
    link.toString().trim();

  const id =
    extraerIdDrive(textoLink);

  if (!id) {
    return {
      planners: [],
      nombreCarpeta: '',
      error:
        'No se pudo extraer ID de Drive'
    };
  }

  const encontrados = [];
  let nombreCarpeta = '';

  const pareceCarpeta =
    textoLink.includes('/folders/') ||
    textoLink.includes(
      'drive.google.com/drive/folders'
    );

  if (pareceCarpeta) {
    const resultadoCarpeta =
      buscarPlannerEnCarpeta_(
        id,
        !!silencioso
      );

    nombreCarpeta =
      resultadoCarpeta.nombreCarpeta || '';

    if (resultadoCarpeta.error) {
      return {
        planners: [],
        nombreCarpeta:
          nombreCarpeta,
        error:
          resultadoCarpeta.error
      };
    }

    resultadoCarpeta
      .encontrados
      .forEach(function(x) {
        encontrados.push(x);
      });

  } else {
    let abiertoComoArchivo = false;

    try {
      const archivo =
        DriveApp.getFileById(id);

      abiertoComoArchivo = true;

      if (
        esArchivoPlannerRespaldo_(
          archivo.getName()
        )
      ) {
        return {
          planners: [],
          nombreCarpeta: '',
          error:
            'El vínculo apunta a un archivo de respaldo y no a un Planner operativo.'
        };
      }

      if (
        archivo.getMimeType() ===
        MimeType.GOOGLE_SHEETS
      ) {
        const resultado =
          inspeccionarArchivoPlanner(
            archivo.getId()
          );

        if (resultado.valido) {
          const plannersArchivo =
            (
              resultado.planners &&
              resultado.planners.length
            )
              ? resultado.planners
              : [resultado];

          plannersArchivo.forEach(
            function(x) {
              encontrados.push(x);
            }
          );
        }
      }
    } catch (errorArchivo) {
      // Puede ser carpeta.
    }

    if (
      encontrados.length === 0 &&
      !abiertoComoArchivo
    ) {
      const resultadoCarpeta =
        buscarPlannerEnCarpeta_(
          id,
          !!silencioso
        );

      nombreCarpeta =
        resultadoCarpeta.nombreCarpeta || '';

      if (!resultadoCarpeta.error) {
        resultadoCarpeta
          .encontrados
          .forEach(function(x) {
            encontrados.push(x);
          });
      }
    }
  }

  const unicos =
    deduplicarPlannersLocalizados_(
      encontrados
    );

  if (unicos.length === 0) {
    return {
      planners: [],
      nombreCarpeta:
        nombreCarpeta,
      error:
        'No se encontró estructura válida'
    };
  }

  unicos.forEach(function(x) {
    if (!x.nombreCarpeta) {
      x.nombreCarpeta =
        nombreCarpeta || '';
    }
  });

  return {
    planners: unicos,
    nombreCarpeta:
      nombreCarpeta,
    error: null
  };
}

/**
 * Compatibilidad con pruebas antiguas que esperan un solo planner.
 * Si hay varios, devuelve el primero y además expone `planners`.
 * Las funciones de sincronización V8 usan localizarPlanners().
 */

function localizarPlanner(link) {
  const resultado =
    localizarPlanners(link, false);

  if (resultado.error) {
    return {
      id: null,
      url: null,
      sheetName: null,
      nombreArchivo: '',
      nombreCarpeta:
        resultado.nombreCarpeta || '',
      planners: [],
      error: resultado.error
    };
  }

  const primero =
    resultado.planners[0];

  return Object.assign(
    {},
    primero,
    {
      planners:
        resultado.planners,
      cantidadPlanners:
        resultado.planners.length,
      error: null
    }
  );
}

function normalizarUrlReunion_(url) {
  return normalizarTexto(url)
    .split('?')[0]
    .split('#')[0]
    .replace(/\/+$/, '');
}

function analizarEvidencia(link) {
  if (!link || !link.toString().trim()) {
    return {
      tipo: 'SIN_EVIDENCIA',
      id: ''
    };
  }

  const url = link.toString().trim();
  const lower = url.toLowerCase();

  if (
    lower.includes('meet.google.com') ||
    lower.includes('zoom.us') ||
    lower.includes('teams.microsoft.com') ||
    lower.includes('teams.live.com')
  ) {
    return {
      tipo: 'REUNION',
      id: normalizarUrlReunion_(url)
    };
  }

  if (
    lower.includes('drive.google.com') ||
    lower.includes('docs.google.com')
  ) {
    const id = extraerIdDrive(url);

    if (id) {
      return {
        tipo: 'DRIVE_ARCHIVO',
        id: id
      };
    }
  }

  return {
    tipo: 'OTRO_LINK',
    id: lower
  };
}

/* ============================================================
 * HORAS
 * ============================================================
 */

function convertirHoraAMinutos(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return (
      valor.getHours() * 60 +
      valor.getMinutes() +
      valor.getSeconds() / 60
    );
  }

  if (valor === '' || valor === null || valor === undefined) {
    return null;
  }

  const texto = valor.toString().trim().toLowerCase();

  const match = texto.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/
  );

  if (!match) return null;

  let hora = Number(match[1]);
  const minuto = Number(match[2]);
  const segundo = match[3] ? Number(match[3]) : 0;
  const periodo = match[4] || '';

  if (minuto > 59 || segundo > 59) return null;

  // Soporta formatos redundantes como "14:00 pm".
  if (hora > 12) {
    if (hora > 23) return null;
  } else if (periodo) {
    if (periodo === 'am' && hora === 12) hora = 0;
    if (periodo === 'pm' && hora !== 12) hora += 12;
  }

  return hora * 60 + minuto + segundo / 60;
}

function convertirDuracionAHoras(valor) {
  if (valor === '' || valor === null || valor === undefined) return null;

  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return (
      valor.getHours() +
      valor.getMinutes() / 60 +
      valor.getSeconds() / 3600
    );
  }

  if (typeof valor === 'number' && !isNaN(valor)) {
    if (valor > 0 && valor <= 1) return valor * 24;
    if (valor > 1) return valor;
    return null;
  }

  const texto = valor.toString().trim().toLowerCase();

  let match = texto.match(
    /^(?:(\d+(?:[.,]\d+)?)\s*h)?\s*(?:(\d+(?:[.,]\d+)?)\s*min)?$/
  );

  if (match && (match[1] || match[2])) {
    const horas = match[1]
      ? Number(match[1].replace(',', '.'))
      : 0;

    const minutos = match[2]
      ? Number(match[2].replace(',', '.'))
      : 0;

    if (!isFinite(horas) || !isFinite(minutos)) return null;
    return horas + minutos / 60;
  }

  match = texto.match(
    /^(\d{1,3}):(\d{1,2})(?::(\d{1,2}))?$/
  );

  if (match) {
    const horas = Number(match[1]);
    const minutos = Number(match[2]);
    const segundos = match[3] ? Number(match[3]) : 0;

    if (minutos < 60 && segundos < 60) {
      return horas + minutos / 60 + segundos / 3600;
    }
  }

  return null;
}

function calcularHoras(inicio, fin, duracion) {
  let horas = null;

  const inicioMin = convertirHoraAMinutos(inicio);
  const finMin = convertirHoraAMinutos(fin);

  if (inicioMin !== null && finMin !== null) {
    let diferencia = finMin - inicioMin;

    if (diferencia < 0) {
      diferencia += 24 * 60;
    }

    if (diferencia > 0) {
      horas = diferencia / 60;
    }
  }

  if (horas === null || !isFinite(horas) || horas <= 0) {
    horas = convertirDuracionAHoras(duracion);
  }

  if (horas === null || !isFinite(horas) || horas <= 0) {
    return {
      horas: 0,
      motivo: 'No se pudo determinar duración válida'
    };
  }

  return {
    horas: Math.round(horas * 10000) / 10000,
    motivo: ''
  };
}

/* ============================================================
 * PERÍODOS
 * ============================================================
 */

function determinarPeriodo(fechaActividad, pasante, duracionPeriodo) {
  const fecha = fechaSoloDia(fechaActividad);

  if (!fecha) {
    return {
      periodo: 'SIN_FECHA',
      observacion: 'Actividad sin fecha válida'
    };
  }

  const transicion =
    pasante.transicionAsistente || {
      existeRegistro: false,
      fechaInicio: null,
      fechaFin: null,
      cuentaCompromiso: ''
    };

  /* BP es último día incluido. */
  if (pasante.retiro && fecha > pasante.retiro) {
    return {
      periodo: 'POSTERIOR_RETIRO',
      observacion: 'Actividad posterior a fecha de retiro'
    };
  }

  /*
   * La fecha de inicio ASISTENTE es una frontera dura.
   * Desde ese día no se asignan P/E/X aunque se siga usando el mismo Planner.
   */
  if (
    transicion.fechaInicio &&
    fecha >= transicion.fechaInicio
  ) {
    return {
      periodo: 'ASISTENTE',
      observacion:
        'Actividad desde la fecha de inicio del contrato ASISTENTE; fuera de los períodos computables de pasantía'
    };
  }

  const inicioPasantia =
    pasante.inicioPas
      ? fechaSoloDia(pasante.inicioPas)
      : null;

  const finPasantia =
    pasante.finPas
      ? fechaSoloDia(pasante.finPas)
      : null;

  let inicioExtensionEfectivo =
    pasante.inicioExt
      ? fechaSoloDia(pasante.inicioExt)
      : null;

  const finExtension =
    pasante.finExt
      ? fechaSoloDia(pasante.finExt)
      : null;

  /*
   * Igual que Periodos V2: si AF <= AB, la extensión inicia AB+1
   * para no solapar el último día de la base.
   */
  if (
    inicioExtensionEfectivo &&
    finPasantia &&
    inicioExtensionEfectivo <= finPasantia
  ) {
    inicioExtensionEfectivo =
      new Date(
        finPasantia.getTime()
      );

    inicioExtensionEfectivo.setDate(
      inicioExtensionEfectivo.getDate() + 1
    );
  }

  /* ========================================================
   * 1. EXTENSIÓN FORMAL
   * ======================================================== */
  if (inicioExtensionEfectivo) {
    const dentroExtension =
      fecha >= inicioExtensionEfectivo &&
      (!finExtension || fecha <= finExtension);

    if (dentroExtension) {
      const dias =
        diferenciaDias(
          fecha,
          inicioExtensionEfectivo
        );

      const numero =
        Math.floor(
          dias / duracionPeriodo
        ) + 1;

      return {
        periodo: 'E' + numero,
        observacion: ''
      };
    }
  }

  /* ========================================================
   * 2. PASANTÍA BASE FORMAL
   * ========================================================
   * P1, P2, P3, P4... siguen siendo formales mientras la fecha
   * esté dentro del inicio y fin formal registrados.
   * El número del período NO determina por sí solo su condición.
   * ======================================================== */
  if (inicioPasantia && fecha >= inicioPasantia) {
    let dentroBase = true;

    if (finPasantia && fecha > finPasantia) {
      dentroBase = false;
    }

    /* Si no hay AB pero sí extensión, base termina el día anterior a AF efectiva. */
    if (
      !finPasantia &&
      inicioExtensionEfectivo &&
      fecha >= inicioExtensionEfectivo
    ) {
      dentroBase = false;
    }

    if (dentroBase) {
      const dias =
        diferenciaDias(
          fecha,
          inicioPasantia
        );

      const numero =
        Math.floor(
          dias / duracionPeriodo
        ) + 1;

      return {
        periodo: 'P' + numero,
        observacion: ''
      };
    }
  }

  /* ========================================================
   * 3. EXTRA HISTÓRICO POSTERIOR A LA ETAPA FORMAL
   * ========================================================
   * Solo existe si conocemos un fin formal:
   * - AG cuando hubo extensión formal; o
   * - AB cuando no hubo extensión formal.
   *
   * La actividad debe ocurrir DESPUÉS de ese fin y ANTES de una
   * frontera dura (retiro o inicio ASISTENTE, ya filtradas arriba).
   * Se usa X1, X2... para no mezclar un P parcial formal con horas
   * posteriores dentro del mismo bloque de 30 días.
   * ======================================================== */
  let finFormalReferencia = null;

  /*
   * Si existe una extensión con inicio posterior a AB, cualquier actividad
   * en el hueco AB+1 ... AF-1 es extra histórica respecto de la base.
   */
  if (
    finPasantia &&
    inicioExtensionEfectivo &&
    fecha > finPasantia &&
    fecha < inicioExtensionEfectivo
  ) {
    finFormalReferencia = finPasantia;
  }

  /*
   * Si ya terminó una extensión formal, la actividad posterior usa AG
   * como referencia para X1, X2...
   */
  if (
    !finFormalReferencia &&
    inicioExtensionEfectivo &&
    finExtension &&
    fecha > finExtension
  ) {
    finFormalReferencia = finExtension;
  }

  /* Sin extensión formal, AB es el fin formal de referencia. */
  if (
    !finFormalReferencia &&
    !inicioExtensionEfectivo &&
    finPasantia &&
    fecha > finPasantia
  ) {
    finFormalReferencia = finPasantia;
  }

  if (finFormalReferencia) {
    const inicioExtra =
      new Date(
        finFormalReferencia.getTime()
      );

    inicioExtra.setDate(
      inicioExtra.getDate() + 1
    );

    const dias =
      diferenciaDias(
        fecha,
        inicioExtra
      );

    const numero =
      Math.floor(
        dias / duracionPeriodo
      ) + 1;

    return {
      periodo: 'X' + numero,
      observacion:
        'Actividad adicional posterior al fin formal registrado y anterior a retiro/contrato; conservar como EXTRA_HISTORICO'
    };
  }

  if (!inicioPasantia && !inicioExtensionEfectivo) {
    return {
      periodo: 'SIN_CLASIFICAR',
      observacion: 'Pasante sin fecha de inicio clasificada'
    };
  }

  return {
    periodo: 'FUERA_RANGO',
    observacion: 'Actividad fuera de las fechas registradas de pasantía/extensión'
  };
}

/* ============================================================
 * PROCESAMIENTO CENTRAL
 * ============================================================
 */

function procesarPlannerPasante_(
  pasante,
  plannerInfo,
  config,
  fechaImportacion,
  contextoCompartido
) {
  const ssPlanner =
    SpreadsheetApp.openById(
      plannerInfo.id
    );

  const hoja =
    ssPlanner.getSheetByName(
      plannerInfo.sheetName
    );

  if (!hoja) {
    throw new Error(
      'No se encontró la hoja del planner: ' +
      plannerInfo.sheetName
    );
  }

  const lastRow =
    Math.max(
      hoja.getLastRow(),
      1
    );

  const anchoLectura =
    Math.min(
      hoja.getMaxColumns(),
      Math.max(
        1,
        Math.max(
          13,
          Math.min(
            plannerInfo.columnCount ||
              hoja.getLastColumn() ||
              13,
            30
          )
        )
      )
    );

  const datos =
    hoja
      .getRange(
        1,
        1,
        lastRow,
        anchoLectura
      )
      .getValues();

  const formatoPlanner =
    plannerInfo.formatoPlanner ||
    'ACTUAL';

  const filaEncabezado =
    plannerInfo.headerRow || 1;

  const duracionPeriodo =
    parseInt(
      config['DURACION_PERIODO'],
      10
    ) || 30;

  const permitirReunionRepetida =
    esSi_(
      config[
        'PERMITIR_REUNION_REPETIDA'
      ]
    );

  const permitirArchivoRepetido =
    esSi_(
      config[
        'PERMITIR_ARCHIVO_REPETIDO'
      ]
    );

  const regimen =
    clasificarRegimen_(
      pasante,
      config
    );

  const pasanteActual =
    esPasanteActual_(pasante);

  const situacionSeguimiento =
    clasificarSituacionSeguimiento_(
      pasante
    );

  const transicion =
    pasante.transicionAsistente || {
      existeRegistro: false,
      fechaInicio: null,
      fechaFin: null,
      cuentaCompromiso: '',
      fuente: '',
      observacion: ''
    };

  const evidenciasUsadas =
    (
      contextoCompartido &&
      contextoCompartido.evidenciasUsadas
    )
      ? contextoCompartido.evidenciasUsadas
      : new Set();

  const registros = [];

  const stats = {
    actividades: 0,
    horasPlanner: 0,
    horasConEvidencia: 0,
    actividadesSinEvidencia: 0,
    evidenciasRepetidas: 0,
    reunionesRecurrentes: 0,
    actividadesSinHoras: 0,

    actividadesEtapaPasante: 0,
    actividadesEtapaAsistente: 0,
    actividadesTransicionSinFecha: 0,
    horasEtapaPasante: 0,
    horasEtapaAsistente: 0,
    horasCandidatasCompromiso: 0
  };

  for (
    let i = filaEncabezado;
    i < datos.length;
    i++
  ) {
    const rowOrigen = datos[i];

    const row =
      canonicalizarFilaPlanner_(
        rowOrigen,
        formatoPlanner,
        plannerInfo.mapaColumnas
      );

    if (
      !filaPlannerTieneActividad_(row)
    ) {
      continue;
    }

    stats.actividades++;

    // Estructura canónica interna:
    // F fecha = row[5]
    // G inicio = row[6]
    // H fin = row[7]
    // I duración = row[8]
    // K evidencia = row[10]
    const horas =
      calcularHoras(
        row[6],
        row[7],
        row[8]
      );

    const evidencia =
      analizarEvidencia(
        row[10]
      );

    const periodo =
      determinarPeriodo(
        row[5],
        pasante,
        duracionPeriodo
      );

    const etapa =
      clasificarEtapaActividad_(
        row[5],
        pasante,
        periodo,
        regimen
      );

    stats.horasPlanner +=
      horas.horas;

    if (horas.horas <= 0) {
      stats.actividadesSinHoras++;
    }

    if (
      etapa.etapa === 'PASANTE'
    ) {
      stats.actividadesEtapaPasante++;
      stats.horasEtapaPasante +=
        horas.horas;
    } else if (
      etapa.etapa === 'ASISTENTE'
    ) {
      stats.actividadesEtapaAsistente++;
      stats.horasEtapaAsistente +=
        horas.horas;
    } else if (
      etapa.etapa ===
      'TRANSICION_SIN_FECHA'
    ) {
      stats.actividadesTransicionSinFecha++;
    }

    const horasCandidatas =
      etapa.horasElegibles
        ? horas.horas
        : 0;

    stats.horasCandidatasCompromiso +=
      horasCandidatas;

    let horasConEvidencia = 0;
    let evidenciaDuplicada = 'No';

    if (
      evidencia.tipo ===
      'SIN_EVIDENCIA'
    ) {
      stats.actividadesSinEvidencia++;
    } else {
      // Evidencia repetida = indicador.
      // Nunca anula las horas por sí misma.
      horasConEvidencia =
        horas.horas;

      stats.horasConEvidencia +=
        horas.horas;

      if (evidencia.id) {
        if (
          evidenciasUsadas.has(
            evidencia.id
          )
        ) {
          if (
            evidencia.tipo ===
            'REUNION'
          ) {
            if (
              permitirReunionRepetida
            ) {
              evidenciaDuplicada =
                'Reunión recurrente';

              stats.reunionesRecurrentes++;
            } else {
              evidenciaDuplicada =
                'Sí';

              stats.evidenciasRepetidas++;
            }
          } else {
            evidenciaDuplicada =
              permitirArchivoRepetido
                ? 'Repetida permitida'
                : 'Sí';

            stats.evidenciasRepetidas++;
          }
        } else {
          evidenciasUsadas.add(
            evidencia.id
          );
        }
      }
    }

    const observaciones = [];

    if (
      plannerInfo.observacionFormato
    ) {
      observaciones.push(
        plannerInfo.observacionFormato
      );
    }

    if (horas.motivo) {
      observaciones.push(
        horas.motivo
      );
    }

    if (periodo.observacion) {
      observaciones.push(
        periodo.observacion
      );
    }

    if (
      regimen ===
        'SIN_CLASIFICAR' &&
      !periodo.observacion
    ) {
      observaciones.push(
        'Pasante sin fecha de inicio clasificada'
      );
    }

    if (etapa.observacion) {
      observaciones.push(
        etapa.observacion
      );
    }

    registros.push([
      pasante.correo,             // A
      pasante.nombre,             // B
      plannerInfo.url,            // C
      plannerInfo.id,             // D
      i + 1,                      // E
      row[0],                     // F tipo
      row[1],                     // G compo
      row[2],                     // H sub_comp
      row[3],                     // I descripcion
      row[4],                     // J Encargado
      row[5],                     // K fecha
      row[6],                     // L inicio
      row[7],                     // M fin
      row[8],                     // N duración
      row[9],                     // O estado
      row[10],                    // P evidencia
      row[11],                    // Q comentario
      row[12],                    // R usuario
      evidencia.tipo,             // S
      evidencia.id,               // T
      evidenciaDuplicada,         // U
      fechaImportacion,           // V
      periodo.periodo,            // W
      '',                         // X
      horas.horas,                // Y
      horasConEvidencia,          // Z
      '',                         // AA
      '',                         // AB
      observaciones.join(' | '),  // AC
      regimen,                    // AD
      pasante.estadoPasantia,     // AE
      pasante.cualidadActual,     // AF
      pasante.cualidadPasada,     // AG
      pasanteActual
        ? 'Sí'
        : 'No',                   // AH
      situacionSeguimiento,       // AI
      transicion.fechaInicio || '', // AJ
      transicion.fechaFin || '',    // AK
      transicion.cuentaCompromiso || '', // AL
      etapa.etapa,                // AM
      etapa.cuentaCompromiso,     // AN
      horasCandidatas,            // AO
      etapa.observacion || '',    // AP
      pasante.estadoTransicionLaboral || '', // AQ
      pasante.fechaInicioTransicionLaboral || '', // AR
      pasante.estadoVinculoLaboral || '', // AS
      pasante.fechaFinVinculoLaboral || '', // AT
      pasante.motivoFinVinculoLaboral || '' // AU
    ]);
  }

  [
    'horasPlanner',
    'horasConEvidencia',
    'horasEtapaPasante',
    'horasEtapaAsistente',
    'horasCandidatasCompromiso'
  ].forEach(function(campo) {
    stats[campo] =
      Math.round(
        stats[campo] * 100
      ) / 100;
  });

  return {
    registros: registros,
    stats: stats,
    regimen: regimen,
    pasanteActual: pasanteActual,
    situacionSeguimiento:
      situacionSeguimiento,
    transicionAsistente:
      transicion
  };
}

/**
 * Procesa todos los planners reconocidos de una misma persona.
 * Comparte el Set de evidencias para que una evidencia repetida
 * también pueda detectarse entre planners distintos del mismo pasante.
 */
function procesarPlannersPasante_(
  pasante,
  planners,
  config,
  fechaImportacion
) {
  const contextoCompartido = {
    evidenciasUsadas: new Set()
  };

  const registros = [];

  const stats = {
    plannersProcesados: 0,
    actividades: 0,
    horasPlanner: 0,
    horasConEvidencia: 0,
    actividadesSinEvidencia: 0,
    evidenciasRepetidas: 0,
    reunionesRecurrentes: 0,
    actividadesSinHoras: 0,
    actividadesEtapaPasante: 0,
    actividadesEtapaAsistente: 0,
    actividadesTransicionSinFecha: 0,
    horasEtapaPasante: 0,
    horasEtapaAsistente: 0,
    horasCandidatasCompromiso: 0
  };

  let ultimoProcesado = null;

  planners.forEach(function(plannerInfo) {
    const procesado =
      procesarPlannerPasante_(
        pasante,
        plannerInfo,
        config,
        fechaImportacion,
        contextoCompartido
      );

    ultimoProcesado = procesado;
    stats.plannersProcesados++;

    procesado.registros.forEach(
      function(registro) {
        registros.push(registro);
      }
    );

    [
      'actividades',
      'horasPlanner',
      'horasConEvidencia',
      'actividadesSinEvidencia',
      'evidenciasRepetidas',
      'reunionesRecurrentes',
      'actividadesSinHoras',
      'actividadesEtapaPasante',
      'actividadesEtapaAsistente',
      'actividadesTransicionSinFecha',
      'horasEtapaPasante',
      'horasEtapaAsistente',
      'horasCandidatasCompromiso'
    ].forEach(function(campo) {
      stats[campo] +=
        procesado.stats[campo] || 0;
    });
  });

  [
    'horasPlanner',
    'horasConEvidencia',
    'horasEtapaPasante',
    'horasEtapaAsistente',
    'horasCandidatasCompromiso'
  ].forEach(function(campo) {
    stats[campo] =
      Math.round(
        stats[campo] * 100
      ) / 100;
  });

  return {
    registros: registros,
    stats: stats,
    regimen:
      ultimoProcesado
        ? ultimoProcesado.regimen
        : clasificarRegimen_(
            pasante,
            config
          ),
    pasanteActual:
      esPasanteActual_(pasante),
    situacionSeguimiento:
      clasificarSituacionSeguimiento_(
        pasante
      ),
    transicionAsistente:
      pasante.transicionAsistente || {}
  };
}

/* ============================================================
 * DIAGNÓSTICOS SOLO LECTURA
 * ============================================================
 */

function probarConexionPlanners() {
  const ss =
    obtenerBasePasantes();

  const hojaVariables =
    ss.getSheetByName(
      HOJA_VARIABLES
    );

  if (!hojaVariables) {
    throw new Error(
      'No se encontró ' +
      HOJA_VARIABLES +
      '.'
    );
  }

  const pasantes =
    obtenerPasantesConPlanner_(
      hojaVariables
    );

  let personasConPlannerValido = 0;
  let archivosPlannerEncontrados = 0;
  let personasConMultiplesPlanners = 0;
  let errores = 0;

  pasantes.forEach(function(pasante) {
    const resultado =
      localizarPlanners(
        pasante.linkPlanner,
        true
      );

    if (resultado.error) {
      errores++;

      console.log(
        '[CONEXIÓN] ' +
        pasante.correo +
        ': ' +
        resultado.error
      );

      return;
    }

    personasConPlannerValido++;

    archivosPlannerEncontrados +=
      resultado.planners.length;

    if (
      resultado.planners.length > 1
    ) {
      personasConMultiplesPlanners++;
    }

    console.log(
      '[CONEXIÓN] ' +
      pasante.correo +
      ': ' +
      resultado.planners.length +
      ' planner(s) reconocido(s).'
    );
  });

  const resultado = {
    personasConLinkPlanner:
      pasantes.length,
    personasConPlannerValido:
      personasConPlannerValido,
    archivosPlannerEncontrados:
      archivosPlannerEncontrados,
    personasConMultiplesPlanners:
      personasConMultiplesPlanners,
    personasConError:
      errores
  };

  console.log(
    '[CONEXIÓN] Resultado:',
    resultado
  );

  Logger.log(
    JSON.stringify(resultado)
  );

  return resultado;
}

function probarSincronizacionTodos() {
  const ss =
    obtenerBasePasantes();

  const hojaVariables =
    ss.getSheetByName(
      HOJA_VARIABLES
    );

  if (!hojaVariables) {
    throw new Error(
      'No se encontró ' +
      HOJA_VARIABLES +
      '.'
    );
  }

  const config =
    obtenerConfiguracion();

  const pasantes =
    obtenerPasantesConPlanner_(
      hojaVariables
    );

  const stats = {
    totalPersonasConPlanner:
      pasantes.length,

    historicos: 0,
    nuevos: 0,
    sinClasificar: 0,

    pasantesActuales: 0,
    pasantesEnProcesoContratacion: 0,
    pasantesContratacionAprobada: 0,
    pasantesProcesoCerradoSinContratacion: 0,
    asistentesExPasantes: 0,
    asistentesExPasantesVinculoFinalizado: 0,
    noPasantesActuales: 0,
    pasantiasRetiradas: 0,
    pasantiasTerminadas: 0,
    contratados: 0,
    otrosEstados: 0,

    asistentesConFechaTransicion: 0,
    asistentesSinFechaTransicion: 0,
    asistentesConPoliticaLegacySi: 0,

    personasConPlannerValido: 0,
    archivosPlannerEncontrados: 0,
    personasConMultiplesPlanners: 0,
    plannersFormatoActual: 0,
    plannersFormatoHistorico: 0,
    plannersFormatoHistoricoA1Danado: 0,
    personasConError: 0,
    vinculosSospechosos: 0,

    actividadesEncontradas: 0,
    horasPlannerTotales: 0,
    horasConEvidencia: 0,
    actividadesSinEvidencia: 0,
    evidenciasRepetidas: 0,
    reunionesRecurrentes: 0,
    actividadesSinHoras: 0,

    actividadesEtapaPasante: 0,
    actividadesEtapaAsistente: 0,
    actividadesTransicionSinFecha: 0,
    horasEtapaPasante: 0,
    horasEtapaAsistente: 0,
    horasCandidatasCompromiso: 0
  };

  const errores = [];
  const advertencias = [];

  pasantes.forEach(function(pasante) {
    const regimen =
      clasificarRegimen_(
        pasante,
        config
      );

    if (regimen === 'NUEVO') {
      stats.nuevos++;
    } else if (
      regimen === 'HISTORICO'
    ) {
      stats.historicos++;
    } else {
      stats.sinClasificar++;
    }

    if (
      esPasanteActual_(pasante)
    ) {
      stats.pasantesActuales++;
    } else {
      stats.noPasantesActuales++;
    }

    const situacion =
      clasificarSituacionSeguimiento_(
        pasante
      );

    /*
     * "Situación seguimiento" y "Estado de pasantía (K)" son dimensiones
     * distintas. Un ASISTENTE_EX_PASANTE puede tener K=Contratado.
     * Por eso el total de contratados se cuenta directamente desde K
     * y NO desde la etiqueta mutuamente excluyente de situación.
     */
    const estadoPasantiaResumen =
      normalizarSinAcentos_(
        pasante.estadoPasantia
      );

    if (
      estadoPasantiaResumen === 'contratado' ||
      estadoPasantiaResumen === 'contratada'
    ) {
      stats.contratados++;
    }

    if (
      situacion ===
      'PASANTE_EN_PROCESO_CONTRATACION'
    ) {
      stats.pasantesEnProcesoContratacion++;
    } else if (
      situacion ===
      'PASANTE_CONTRATACION_APROBADA'
    ) {
      stats.pasantesContratacionAprobada++;
    } else if (
      situacion ===
      'PASANTE_PROCESO_CERRADO_SIN_CONTRATACION'
    ) {
      stats.pasantesProcesoCerradoSinContratacion++;
    } else if (
      situacion ===
      'ASISTENTE_EX_PASANTE'
    ) {
      stats.asistentesExPasantes++;
    } else if (
      situacion ===
      'ASISTENTE_EX_PASANTE_VINCULO_FINALIZADO'
    ) {
      stats.asistentesExPasantes++;
      stats.asistentesExPasantesVinculoFinalizado++;
    } else if (
      situacion ===
      'PASANTIA_RETIRADA'
    ) {
      stats.pasantiasRetiradas++;
    } else if (
      situacion ===
      'PASANTIA_TERMINADA'
    ) {
      stats.pasantiasTerminadas++;
    } else if (
      situacion ===
      'CONTRATADO'
    ) {
      // Ya contabilizado arriba directamente desde Estado de pasantía (K).
    } else if (
      situacion !==
      'PASANTE_ACTUAL'
    ) {
      stats.otrosEstados++;
    }

    if (
      esAsistenteExPasante_(
        pasante
      )
    ) {
      const transicion =
        pasante.transicionAsistente || {};

      if (transicion.fechaInicio) {
        stats.asistentesConFechaTransicion++;
      } else {
        stats.asistentesSinFechaTransicion++;

        advertencias.push({
          correo:
            pasante.correo,
          advertencia:
            'ASISTENTE / ex PASANTE sin Fecha inicio ASISTENTE verificada en Historial_Roles'
        });
      }

      if (
        esSi_(
          transicion.cuentaCompromiso
        )
      ) {
        stats.asistentesConPoliticaLegacySi++;
      }
    }

    const localizados =
      localizarPlanners(
        pasante.linkPlanner,
        false
      );

    if (localizados.error) {
      stats.personasConError++;

      errores.push({
        correo:
          pasante.correo,
        error:
          localizados.error
      });

      console.log(
        '[DRY RUN] ' +
        pasante.correo +
        ': ' +
        localizados.error
      );

      return;
    }

    stats.personasConPlannerValido++;

    stats.archivosPlannerEncontrados +=
      localizados.planners.length;

    if (
      localizados.planners.length > 1
    ) {
      stats.personasConMultiplesPlanners++;
    }

    let vinculoSospechoso = false;

    localizados.planners.forEach(
      function(plannerInfo) {
        if (
          plannerInfo.formatoPlanner ===
          'ACTUAL'
        ) {
          stats.plannersFormatoActual++;
        } else if (
          plannerInfo.formatoPlanner ===
          'HISTORICO'
        ) {
          stats.plannersFormatoHistorico++;
        } else if (
          plannerInfo.formatoPlanner ===
          'HISTORICO_A1_DANADO'
        ) {
          stats.plannersFormatoHistoricoA1Danado++;
        }

        if (
          posibleCrucePlanner_(
            pasante.nombre,
            plannerInfo.nombreCarpeta,
            plannerInfo.nombreArchivo
          )
        ) {
          vinculoSospechoso = true;
        }
      }
    );

    if (vinculoSospechoso) {
      stats.vinculosSospechosos++;

      advertencias.push({
        correo:
          pasante.correo,
        advertencia:
          'Revisar vínculo nombre/carpeta/archivo planner'
      });
    }

    try {
      const procesado =
        procesarPlannersPasante_(
          pasante,
          localizados.planners,
          config,
          new Date()
        );

      stats.actividadesEncontradas +=
        procesado.stats.actividades;

      stats.horasPlannerTotales +=
        procesado.stats.horasPlanner;

      stats.horasConEvidencia +=
        procesado.stats.horasConEvidencia;

      stats.actividadesSinEvidencia +=
        procesado.stats.actividadesSinEvidencia;

      stats.evidenciasRepetidas +=
        procesado.stats.evidenciasRepetidas;

      stats.reunionesRecurrentes +=
        procesado.stats.reunionesRecurrentes;

      stats.actividadesSinHoras +=
        procesado.stats.actividadesSinHoras;

      stats.actividadesEtapaPasante +=
        procesado.stats.actividadesEtapaPasante;

      stats.actividadesEtapaAsistente +=
        procesado.stats.actividadesEtapaAsistente;

      stats.actividadesTransicionSinFecha +=
        procesado.stats.actividadesTransicionSinFecha;

      stats.horasEtapaPasante +=
        procesado.stats.horasEtapaPasante;

      stats.horasEtapaAsistente +=
        procesado.stats.horasEtapaAsistente;

      stats.horasCandidatasCompromiso +=
        procesado.stats.horasCandidatasCompromiso;

      console.log(
        '[DRY RUN] ' +
        pasante.correo +
        ' | régimen=' +
        regimen +
        ' | situación=' +
        situacion +
        ' | estado K=' +
        (pasante.estadoPasantia || '') +
        ' | cualidad actual=' +
        (pasante.cualidadActual || '') +
        ' | planners=' +
        localizados.planners.length +
        ' | actividades=' +
        procesado.stats.actividades +
        ' | horas planner=' +
        procesado.stats.horasPlanner +
        ' | horas con evidencia=' +
        procesado.stats.horasConEvidencia +
        ' | candidatas compromiso=' +
        procesado.stats.horasCandidatasCompromiso
      );

    } catch (error) {
      stats.personasConError++;

      errores.push({
        correo:
          pasante.correo,
        error:
          error.message
      });

      console.error(
        '[DRY RUN] Error en ' +
        pasante.correo +
        ': ' +
        error.message
      );
    }
  });

  [
    'horasPlannerTotales',
    'horasConEvidencia',
    'horasEtapaPasante',
    'horasEtapaAsistente',
    'horasCandidatasCompromiso'
  ].forEach(function(campo) {
    stats[campo] =
      Math.round(
        stats[campo] * 100
      ) / 100;
  });

  const resultado = {
    resumen: stats,
    errores: errores,
    advertencias: advertencias
  };

  console.log(
    '=== RESUMEN DIAGNÓSTICO SINCRONIZACIÓN TODOS ==='
  );

  console.log(resultado);

  Logger.log(
    JSON.stringify(resultado)
  );

  return resultado;
}

function registrarEncabezadosArchivoDiagnostico_(
  fileId,
  nombreArchivo
) {
  try {
    const ssPlanner =
      SpreadsheetApp.openById(fileId);

    const hojas =
      ssPlanner.getSheets();

    hojas.forEach(function(hoja) {
      const headers =
        hoja
          .getRange(1, 1, 1, 13)
          .getDisplayValues()[0];

      const deteccion =
        detectarFormatoPlanner_(
          headers
        );

      console.log(
        '[DIAG HEADER] Archivo=' +
        nombreArchivo +
        ' | Hoja=' +
        hoja.getName() +
        ' | A1:M1=' +
        JSON.stringify(headers)
      );

      console.log(
        '[DIAG HEADER] Reconocido=' +
        (deteccion.valido ? 'SÍ' : 'NO') +
        ' | formato=' +
        (deteccion.formato || '')
      );

      if (!deteccion.valido) {
        const normalizados =
          headers.map(
            normalizarEncabezadoClave_
          );

        console.log(
          '[DIAG HEADER] Normalizados=' +
          JSON.stringify(
            normalizados
          )
        );
      }
    });

  } catch (error) {
    console.log(
      '[DIAG HEADER] No se pudo abrir ' +
      nombreArchivo +
      ': ' +
      error.message
    );
  }
}

function diagnosticarLinkPlanner_(pasante) {
  const link =
    pasante.linkPlanner
      ? pasante.linkPlanner.toString().trim()
      : '';

  console.log(
    '--- DIAGNÓSTICO ' +
    pasante.correo +
    ' | ' +
    pasante.nombre +
    ' ---'
  );

  console.log(
    '[DIAG] Fila Variables_Internas=' +
    pasante.filaVariables
  );

  console.log(
    '[DIAG] Fuente link Z=' +
    (pasante.fuenteLinkPlanner || '')
  );

  console.log(
    '[DIAG] Valor resuelto Z=' +
    link
  );

  const id =
    extraerIdDrive(link);

  if (!id) {
    console.log(
      '[DIAG] No se pudo extraer ID de Drive.'
    );

    return;
  }

  if (
    link.includes('/folders/') ||
    link.includes('drive.google.com/drive/folders')
  ) {
    try {
      const carpeta =
        DriveApp.getFolderById(id);

      console.log(
        '[DIAG] Carpeta=' +
        carpeta.getName()
      );

      const archivos =
        carpeta.getFiles();

      while (archivos.hasNext()) {
        const archivo =
          archivos.next();

        console.log(
          '[DIAG] Archivo=' +
          archivo.getName() +
          ' | MIME=' +
          archivo.getMimeType()
        );

        if (
          archivo.getMimeType() ===
          MimeType.GOOGLE_SHEETS
        ) {
          registrarEncabezadosArchivoDiagnostico_(
            archivo.getId(),
            archivo.getName()
          );
        }
      }

    } catch (errorCarpeta) {
      console.log(
        '[DIAG] Error carpeta: ' +
        errorCarpeta.message
      );
    }

    return;
  }

  try {
    const archivo =
      DriveApp.getFileById(id);

    console.log(
      '[DIAG] Archivo directo=' +
      archivo.getName() +
      ' | MIME=' +
      archivo.getMimeType()
    );

    if (
      archivo.getMimeType() ===
      MimeType.GOOGLE_SHEETS
    ) {
      registrarEncabezadosArchivoDiagnostico_(
        archivo.getId(),
        archivo.getName()
      );
    }

  } catch (errorArchivo) {
    console.log(
      '[DIAG] No se pudo abrir como archivo directo: ' +
      errorArchivo.message
    );
  }
}

function diagnosticarActividadesSinHoras_(
  pasante,
  plannerInfo
) {
  const ssPlanner =
    SpreadsheetApp.openById(
      plannerInfo.id
    );

  const hoja =
    ssPlanner.getSheetByName(
      plannerInfo.sheetName
    );

  const lastRow =
    Math.max(
      hoja.getLastRow(),
      1
    );

  const anchoLectura =
    Math.min(
      hoja.getMaxColumns(),
      Math.max(
        1,
        Math.max(
          13,
          Math.min(
            plannerInfo.columnCount ||
              hoja.getLastColumn() ||
              13,
            30
          )
        )
      )
    );

  const datos =
    hoja
      .getRange(
        1,
        1,
        lastRow,
        anchoLectura
      )
      .getValues();

  const filaEncabezado =
    plannerInfo.headerRow || 1;

  for (
    let i = filaEncabezado;
    i < datos.length;
    i++
  ) {
    const rowOrigen =
      datos[i];

    const row =
      canonicalizarFilaPlanner_(
        rowOrigen,
        plannerInfo.formatoPlanner,
        plannerInfo.mapaColumnas
      );

    if (
      !filaPlannerTieneActividad_(row)
    ) {
      continue;
    }

    const horas =
      calcularHoras(
        row[6],
        row[7],
        row[8]
      );

    if (horas.horas > 0) {
      continue;
    }

    console.log(
      '[DIAG SIN HORAS] ' +
      pasante.correo +
      ' | archivo=' +
      plannerInfo.nombreArchivo +
      ' | hoja=' +
      plannerInfo.sheetName +
      ' | fila=' +
      (i + 1) +
      ' | descripción=' +
      (row[3] || '') +
      ' | fecha=' +
      (row[5] || '') +
      ' | inicio=' +
      (row[6] || '') +
      ' | fin=' +
      (row[7] || '') +
      ' | duración=' +
      (row[8] || '')
    );
  }
}

/**
 * Diagnóstico general sin escritura.
 *
 * Sirve para:
 * - detectar links cruzados entre pasante y carpeta;
 * - ver encabezados de planners que no coinciden;
 * - revisar celdas Z con texto enlazado;
 * - localizar actividades cuyo tiempo no puede calcularse.
 */
function diagnosticarProblemasPlanners() {
  const ss =
    obtenerBasePasantes();

  const hojaVariables =
    ss.getSheetByName(
      HOJA_VARIABLES
    );

  if (!hojaVariables) {
    throw new Error(
      'No se encontró ' +
      HOJA_VARIABLES +
      '.'
    );
  }

  const pasantes =
    obtenerPasantesConPlanner_(
      hojaVariables
    );

  const idsArchivos = {};

  const resumen = {
    personasConLinkPlanner:
      pasantes.length,
    personasConPlannerValido: 0,
    archivosPlannerEncontrados: 0,
    archivosGoogleSheetsUnicos: 0,
    personasConMultiplesPlanners: 0,
    personasConError: 0,
    vinculosSospechosos: 0,
    actividadesDetectadas: 0,
    actividadesSinHoras: 0,
    filasPlantillaIgnoradas: 0
  };

  pasantes.forEach(function(pasante) {
    const localizados =
      localizarPlanners(
        pasante.linkPlanner,
        false
      );

    if (localizados.error) {
      resumen.personasConError++;

      console.log(
        '[DIAG ERROR] ' +
        pasante.correo +
        ' | ' +
        pasante.nombre +
        ' | ' +
        localizados.error
      );

      diagnosticarLinkPlanner_(
        pasante
      );

      return;
    }

    resumen.personasConPlannerValido++;

    resumen.archivosPlannerEncontrados +=
      localizados.planners.length;

    if (
      localizados.planners.length > 1
    ) {
      resumen.personasConMultiplesPlanners++;
    }

    localizados.planners.forEach(
      function(plannerInfo) {
        idsArchivos[
          plannerInfo.id
        ] = true;

        const sospechoso =
          posibleCrucePlanner_(
            pasante.nombre,
            plannerInfo.nombreCarpeta,
            plannerInfo.nombreArchivo
          );

        if (sospechoso) {
          resumen.vinculosSospechosos++;
        }

        console.log(
          '[DIAG OK] correo=' +
          pasante.correo +
          ' | archivo=' +
          plannerInfo.nombreArchivo +
          ' | hoja=' +
          plannerInfo.sheetName +
          ' | formato=' +
          plannerInfo.formatoPlanner +
          ' | headerRow=' +
          (plannerInfo.headerRow || 1) +
          ' | vínculo sospechoso=' +
          (sospechoso ? 'SÍ' : 'NO')
        );

        const ssPlanner =
          SpreadsheetApp.openById(
            plannerInfo.id
          );

        const hoja =
          ssPlanner.getSheetByName(
            plannerInfo.sheetName
          );

        const lastRow =
          Math.max(
            hoja.getLastRow(),
            1
          );

        const anchoLectura =
          Math.min(
            hoja.getMaxColumns(),
            Math.max(
              1,
              Math.max(
                13,
                Math.min(
                  plannerInfo.columnCount ||
                    hoja.getLastColumn() ||
                    13,
                  30
                )
              )
            )
          );

        const datos =
          hoja
            .getRange(
              1,
              1,
              lastRow,
              anchoLectura
            )
            .getValues();

        const filaEncabezado =
          plannerInfo.headerRow || 1;

        for (
          let i = filaEncabezado;
          i < datos.length;
          i++
        ) {
          const rowOrigen =
            datos[i];

          const row =
            canonicalizarFilaPlanner_(
              rowOrigen,
              plannerInfo.formatoPlanner,
              plannerInfo.mapaColumnas
            );

          if (
            !filaPlannerTieneActividad_(row)
          ) {
            if (
              !filaPlannerEstaVacia(
                rowOrigen
              )
            ) {
              resumen
                .filasPlantillaIgnoradas++;
            }

            continue;
          }

          resumen.actividadesDetectadas++;

          const horas =
            calcularHoras(
              row[6],
              row[7],
              row[8]
            );

          if (horas.horas > 0) {
            continue;
          }

          resumen.actividadesSinHoras++;

          console.log(
            '[DIAG SIN HORAS] ' +
            pasante.correo +
            ' | archivo=' +
            plannerInfo.nombreArchivo +
            ' | hoja=' +
            plannerInfo.sheetName +
            ' | formato=' +
            plannerInfo.formatoPlanner +
            ' | fila=' +
            (i + 1) +
            ' | descripción=' +
            (row[3] || '') +
            ' | fecha=' +
            (row[5] || '') +
            ' | inicio=' +
            (row[6] || '') +
            ' | fin=' +
            (row[7] || '') +
            ' | duración=' +
            (row[8] || '')
          );
        }
      }
    );
  });

  resumen.archivosGoogleSheetsUnicos =
    Object.keys(idsArchivos).length;

  console.log(
    '=== RESUMEN DIAGNÓSTICO PLANNERS V8 ==='
  );

  console.log(resumen);

  Logger.log(
    JSON.stringify(resumen)
  );

  return resumen;
}


/* ============================================================
 * DOCUMENTACIÓN Y FORMATO DE Registro_Planner
 * ============================================================
 *
 * IMPORTANTE:
 * - No agrega, elimina ni mueve columnas de Registro_Planner.
 * - No crea celdas combinadas.
 * - Solo aplica notas/formato y reconstruye Diccionario_Datos.
 */

function columnaALetra_(numeroColumna) {
  let numero = numeroColumna;
  let letra = '';

  while (numero > 0) {
    const resto = (numero - 1) % 26;
    letra =
      String.fromCharCode(65 + resto) +
      letra;
    numero =
      Math.floor((numero - 1) / 26);
  }

  return letra;
}

function validarDiccionarioRegistroPlanner_() {
  if (
    DICCIONARIO_REGISTRO_PLANNER.length !==
    ENCABEZADOS_REGISTRO_PLANNER_INTERNO.length
  ) {
    throw new Error(
      'La documentación de Registro_Planner tiene ' +
      DICCIONARIO_REGISTRO_PLANNER.length +
      ' entradas, pero existen ' +
      ENCABEZADOS_REGISTRO_PLANNER_INTERNO.length +
      ' encabezados.'
    );
  }
}

function construirNotaEncabezadoRegistroPlanner_(
  encabezado,
  meta
) {
  return (
    encabezado +
    '\n\nBloque: ' +
    meta.bloque +
    '\n\nQué significa:\n' +
    meta.significado +
    '\n\nOrigen:\n' +
    meta.origen +
    '\n\n¿Editar manualmente?: ' +
    meta.editar +
    '\n\nValores esperados:\n' +
    meta.valores +
    '\n\nPara qué sirve:\n' +
    meta.uso
  );
}

function aplicarFormatoRegistroPlanner_(
  hojaRegistro
) {
  validarDiccionarioRegistroPlanner_();

  const totalColumnas =
    ENCABEZADOS_REGISTRO_PLANNER_INTERNO.length;

  hojaRegistro.setFrozenRows(1);
  hojaRegistro.setFrozenColumns(2);

  const rangoEncabezados =
    hojaRegistro.getRange(
      1,
      1,
      1,
      totalColumnas
    );

  rangoEncabezados
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');

  hojaRegistro.setRowHeight(1, 48);

  const notas = [
    ENCABEZADOS_REGISTRO_PLANNER_INTERNO.map(
      function(encabezado, indice) {
        return construirNotaEncabezadoRegistroPlanner_(
          encabezado,
          DICCIONARIO_REGISTRO_PLANNER[indice]
        );
      }
    )
  ];

  rangoEncabezados.setNotes(notas);

  const maxFilas =
    Math.max(
      hojaRegistro.getMaxRows(),
      1
    );

  /*
   * Separadores verticales negros entre bloques.
   * No se insertan filas ni columnas y no se combinan celdas.
   */
  BLOQUES_REGISTRO_PLANNER
    .slice(0, -1)
    .forEach(function(bloque) {
      hojaRegistro
        .getRange(
          1,
          bloque.fin,
          maxFilas,
          1
        )
        .setBorder(
          null,
          null,
          null,
          true,
          null,
          null,
          '#000000',
          SpreadsheetApp.BorderStyle.SOLID_MEDIUM
        );
    });

  // Formatos de fechas/horas/números que solo afectan visualización.
  hojaRegistro
    .getRange('K:K')
    .setNumberFormat('dd/mm/yyyy');

  hojaRegistro
    .getRange('L:M')
    .setNumberFormat('hh:mm');

  hojaRegistro
    .getRange('V:V')
    .setNumberFormat('dd/mm/yyyy hh:mm');

  ['AJ:AK', 'AR:AR', 'AT:AT']
    .forEach(function(rango) {
      hojaRegistro
        .getRange(rango)
        .setNumberFormat('dd/mm/yyyy');
    });

  ['Y:Z', 'AO:AO']
    .forEach(function(rango) {
      hojaRegistro
        .getRange(rango)
        .setNumberFormat('0.00');
    });
}

function generarDiccionarioDatos_(
  ss
) {
  validarDiccionarioRegistroPlanner_();

  let hoja =
    ss.getSheetByName(
      HOJA_DICCIONARIO_DATOS
    );

  if (!hoja) {
    hoja =
      ss.insertSheet(
        HOJA_DICCIONARIO_DATOS
      );
  }

  // Esta hoja sí es generada por código y puede reconstruirse completa.
  hoja.clear();

  const encabezados = [
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

  const filas =
    ENCABEZADOS_REGISTRO_PLANNER_INTERNO.map(
      function(encabezado, indice) {
        const meta =
          DICCIONARIO_REGISTRO_PLANNER[indice];

        return [
          HOJA_REGISTRO_PLANNER,
          columnaALetra_(indice + 1),
          encabezado,
          meta.bloque,
          meta.significado,
          meta.origen,
          meta.editar,
          meta.valores,
          meta.uso
        ];
      }
    );

  hoja
    .getRange(
      1,
      1,
      1,
      encabezados.length
    )
    .setValues([encabezados])
    .setFontWeight('bold')
    .setWrap(true);

  if (filas.length > 0) {
    hoja
      .getRange(
        2,
        1,
        filas.length,
        encabezados.length
      )
      .setValues(filas)
      .setWrap(true)
      .setVerticalAlignment('top');
  }

  hoja.setFrozenRows(1);

  // Anchos pensados para lectura; no hay celdas combinadas.
  hoja.setColumnWidth(1, 130);
  hoja.setColumnWidth(2, 80);
  hoja.setColumnWidth(3, 190);
  hoja.setColumnWidth(4, 220);
  hoja.setColumnWidth(5, 420);
  hoja.setColumnWidth(6, 260);
  hoja.setColumnWidth(7, 150);
  hoja.setColumnWidth(8, 300);
  hoja.setColumnWidth(9, 420);

  hoja
    .getRange(
      1,
      1,
      Math.max(
        hoja.getLastRow(),
        1
      ),
      encabezados.length
    )
    .setVerticalAlignment('top');

  return hoja;
}

function actualizarDocumentacionRegistroPlanner_(
  ss,
  hojaRegistro
) {
  const base =
    ss ||
    obtenerBasePasantes();

  const registro =
    hojaRegistro ||
    base.getSheetByName(
      HOJA_REGISTRO_PLANNER
    );

  if (!registro) {
    throw new Error(
      'No se encontró ' +
      HOJA_REGISTRO_PLANNER +
      '.'
    );
  }

  const estructura =
    asegurarEncabezadosRegistroPlanner_(
      registro
    );

  registro.setFrozenRows(
    1
  );

  registro.setFrozenColumns(
    2
  );

  registro
    .getRange(
      1,
      1,
      1,
      estructura.headers.length
    )
    .setFontWeight(
      'bold'
    )
    .setWrap(
      true
    );

  return {
    hoja:
      HOJA_REGISTRO_PLANNER,

    estructura:
      estructura.tipo,

    columnas:
      estructura.headers.length,

    diccionario:
      'PENDIENTE_ACTUALIZACION_DICCIONARIO_GLOBAL',

    celdasCombinadasCreadas:
      0
  };
}

function actualizarDocumentacionRegistroPlanner() {
  const ss =
    obtenerBasePasantes();

  const resultado =
    actualizarDocumentacionRegistroPlanner_(
      ss,
      ss.getSheetByName(
        HOJA_REGISTRO_PLANNER
      )
    );

  console.log(
    'DOCUMENTACIÓN ACTUALIZADA:',
    resultado
  );

  Logger.log(
    JSON.stringify(resultado)
  );

  try {
    ss.toast(
      'Registro_Planner documentado y Diccionario_Datos actualizado.',
      'Control Pasantías'
    );
  } catch (errorToast) {}

  return resultado;
}



/* ============================================================
 * CONSOLIDACIÓN
 * ============================================================
 *
 * En el modelo productivo actual, Planner NO escribe resúmenes
 * directamente en Variables_Internas.
 *
 * La consolidación corresponde al módulo independiente:
 *   Consolidacion_Base_v1_2.gs
 *   función: sincronizarConsolidacionBaseV11()
 *
 * Esto evita escrituras posicionales heredadas que ya no
 * corresponden a la estructura canónica de Variables_Internas.
 * ============================================================
 */


function detectarEstructuraRegistroPlannerV89_(
  hojaRegistro
) {
  const lastColumn =
    hojaRegistro.getLastColumn();

  const vacia =
    hojaRegistro.getLastRow() === 0 ||
    (
      hojaRegistro.getLastRow() === 1 &&
      !String(
        hojaRegistro
          .getRange(
            1,
            1
          )
          .getValue() ||
        ''
      ).trim()
    );

  if (vacia) {
    return {
      tipo:
        'VACIA',

      headers:
        ENCABEZADOS_REGISTRO_PLANNER
    };
  }

  const actuales =
    hojaRegistro
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getDisplayValues()[0];

  if (
    actuales.length !==
      ENCABEZADOS_REGISTRO_PLANNER.length
  ) {
    throw new Error(
      'Registro_Planner debe tener exactamente 33 columnas productivas. ' +
      'Columnas detectadas: ' +
      lastColumn +
      '. No se modificó la hoja.'
    );
  }

  const iguales =
    ENCABEZADOS_REGISTRO_PLANNER.every(
      function(h, i) {
        return (
          normalizarSinAcentos_(
            actuales[i]
          ) ===
          normalizarSinAcentos_(
            h
          )
        );
      }
    );

  if (!iguales) {
    throw new Error(
      'Registro_Planner no coincide con la estructura productiva de 33 columnas. ' +
      'No se modificó la hoja.'
    );
  }

  return {
    tipo:
      'PRODUCTIVO_33',

    headers:
      ENCABEZADOS_REGISTRO_PLANNER
  };
}


function proyectarFilasRegistroPlannerV89_(
  filasInternas,
  headersDestino
) {
  const mapaOrigen =
    {};

  ENCABEZADOS_REGISTRO_PLANNER_INTERNO.forEach(
    function(h, i) {
      mapaOrigen[
        normalizarSinAcentos_(
          h
        )
      ] =
        i;
    }
  );

  return filasInternas.map(
    function(row) {
      return headersDestino.map(
        function(h) {
          const idx =
            mapaOrigen[
              normalizarSinAcentos_(
                h
              )
            ];

          if (
            idx ===
              undefined
          ) {
            throw new Error(
              'No se pudo proyectar Registro_Planner. Falta campo productivo: ' +
              h
            );
          }

          return row[
            idx
          ];
        }
      );
    }
  );
}


function asegurarEncabezadosRegistroPlanner_(
  hojaRegistro
) {
  const estructura =
    detectarEstructuraRegistroPlannerV89_(
      hojaRegistro
    );

  if (
    estructura.tipo ===
      'VACIA'
  ) {
    if (
      hojaRegistro.getMaxColumns() <
        ENCABEZADOS_REGISTRO_PLANNER.length
    ) {
      hojaRegistro.insertColumnsAfter(
        hojaRegistro.getMaxColumns(),
        ENCABEZADOS_REGISTRO_PLANNER.length -
          hojaRegistro.getMaxColumns()
      );
    }

    hojaRegistro
      .getRange(
        1,
        1,
        1,
        ENCABEZADOS_REGISTRO_PLANNER.length
      )
      .setValues([
        ENCABEZADOS_REGISTRO_PLANNER
      ]);

    return {
      tipo:
        'PRODUCTIVO_33',

      headers:
        ENCABEZADOS_REGISTRO_PLANNER
    };
  }

  return estructura;
}

function sincronizarPlanners() {
  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(10000)) {
    throw new Error(
      'Ya existe otra sincronización de planners en ejecución.'
    );
  }

  try {
    const ss =
      obtenerBasePasantes();

    const hojaVariables =
      ss.getSheetByName(
        HOJA_VARIABLES
      );

    const hojaRegistro =
      ss.getSheetByName(
        HOJA_REGISTRO_PLANNER
      );

    if (!hojaVariables) {
      throw new Error(
        'No se encontró ' +
        HOJA_VARIABLES +
        '.'
      );
    }

    if (!hojaRegistro) {
      throw new Error(
        'No se encontró ' +
        HOJA_REGISTRO_PLANNER +
        '.'
      );
    }

    const config =
      obtenerConfiguracion();

    const pasantes =
      obtenerPasantesConPlanner_(
        hojaVariables
      );

    if (pasantes.length === 0) {
      throw new Error(
        'No hay personas con correo + link de planner para sincronizar.'
      );
    }

    const fechaImportacion =
      new Date();

    const salida = [];
    const errores = [];
    let archivosPlannerProcesados = 0;
    let personasMultiples = 0;

    pasantes.forEach(function(pasante) {
      const regimen =
        clasificarRegimen_(
          pasante,
          config
        );
      const localizados =
        localizarPlanners(
          pasante.linkPlanner,
          true
        );

      if (localizados.error) {
        errores.push({
          correo:
            pasante.correo,
          error:
            localizados.error
        });

        return;
      }

      if (
        localizados.planners.length > 1
      ) {
        personasMultiples++;
      }

      let sospechoso = false;

      localizados.planners.forEach(
        function(plannerInfo) {
          if (
            posibleCrucePlanner_(
              pasante.nombre,
              plannerInfo.nombreCarpeta,
              plannerInfo.nombreArchivo
            )
          ) {
            sospechoso = true;
          }
        }
      );

      if (sospechoso) {
        errores.push({
          correo:
            pasante.correo,
          error:
            'Posible vínculo de planner cruzado. Revisar carpeta/archivo antes de sincronizar.'
        });

        return;
      }

      try {
        const procesado =
          procesarPlannersPasante_(
            pasante,
            localizados.planners,
            config,
            fechaImportacion
          );

        archivosPlannerProcesados +=
          localizados.planners.length;

        procesado.registros.forEach(
          function(registro) {
            salida.push(registro);
          }
        );

      } catch (error) {
        errores.push({
          correo:
            pasante.correo,
          error:
            error.message
        });
      }
    });

    /*
     * Seguridad:
     * Registro_Planner NO se reconstruye si una persona presenta error.
     */
    if (errores.length > 0) {
      console.error(
        'SINCRONIZACIÓN CANCELADA. Errores:',
        errores
      );

      Logger.log(
        JSON.stringify({
          estado: 'cancelada',
          errores: errores
        })
      );

      throw new Error(
        'Sincronización cancelada: ' +
        errores.length +
        ' persona(s) presentaron error. ' +
        'Ejecuta probarSincronizacionTodos() antes de volver a intentar.'
      );
    }

    const estructuraRegistro =
      asegurarEncabezadosRegistroPlanner_(
        hojaRegistro
      );

    const headersSalida =
      estructuraRegistro.headers;

    const salidaEscritura =
      proyectarFilasRegistroPlannerV89_(
        salida,
        headersSalida
      );

    const ultimaFila =
      hojaRegistro.getLastRow();

    if (ultimaFila > 1) {
      hojaRegistro
        .getRange(
          2,
          1,
          ultimaFila - 1,
          headersSalida.length
        )
        .clearContent();
    }

    if (salidaEscritura.length > 0) {
      hojaRegistro
        .getRange(
          2,
          1,
          salidaEscritura.length,
          headersSalida.length
        )
        .setValues(salidaEscritura);
    }

    actualizarDocumentacionRegistroPlanner_(
      ss,
      hojaRegistro
    );

    /*
     * La consolidación ya no pertenece al módulo Planner.
     * El Motor ejecuta después sincronizarConsolidacionBaseV11().
     */
    const consolidacionPlanner = {
      estado:
        'DELEGADA_CONSOLIDACION_BASE',

      escritura:
        false,

      funcion:
        'sincronizarConsolidacionBaseV11'
    };

    const resultado = {
      personasProcesadas:
        pasantes.length,
      archivosPlannerProcesados:
        archivosPlannerProcesados,
      personasConMultiplesPlanners:
        personasMultiples,
      actividadesImportadas:
        salida.length,
      estructuraRegistroPlanner:
        estructuraRegistro.tipo,
      columnasRegistroPlanner:
        headersSalida.length,
      consolidacionPlanner:
        consolidacionPlanner,
      errores: 0
    };

    console.log(
      'SINCRONIZACIÓN COMPLETADA:',
      resultado
    );

    Logger.log(
      JSON.stringify(resultado)
    );

    try {
      ss.toast(
        'Actividades importadas: ' +
        salida.length,
        'Control Pasantías'
      );
    } catch (errorToast) {}

    return resultado;

  } finally {
    lock.releaseLock();
  }
}
