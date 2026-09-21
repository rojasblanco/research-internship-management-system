/**
 * ============================================================
 * IDENTITY RESOLUTION — RESEARCH INTERNSHIP MANAGEMENT SYSTEM
 * ============================================================
 * Public repository copy: deployment identifiers and private data are externalized.
 * Utilidades compartidas para reconocer a una misma persona
 * mediante:
 * - Correo oficial
 * - Correo alternativo cursos
 * - CI
 *
 * Los campos se localizan por encabezado para evitar depender
 * de posiciones fijas dentro de Variables_Internas.
 * Nunca se unen personas automáticamente solo por nombre.
 * ============================================================
 */

function rimNormalizarTexto_(valor) {
  return String(
    valor === null || valor === undefined
      ? ''
      : valor
  )
    .trim()
    .replace(/\s+/g, ' ');
}


function rimNormalizarSinAcentos_(valor) {
  return rimNormalizarTexto_(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}


function rimExtraerCorreos_(valor) {
  const texto =
    String(
      valor === null || valor === undefined
        ? ''
        : valor
    );

  const encontrados =
    texto.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
    ) || [];

  const unicos = [];

  encontrados.forEach(function(correo) {
    const limpio =
      correo.trim().toLowerCase();

    if (
      limpio &&
      unicos.indexOf(limpio) < 0
    ) {
      unicos.push(limpio);
    }
  });

  return unicos;
}


function rimNormalizarCorreo_(valor) {
  const correos =
    rimExtraerCorreos_(valor);

  if (correos.length) {
    return correos[0];
  }

  return rimNormalizarTexto_(valor)
    .toLowerCase();
}


function rimEsCorreoValido_(valor) {
  const correo =
    rimNormalizarCorreo_(valor);

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    correo
  );
}


function rimNormalizarCI_(valor) {
  const texto =
    rimNormalizarTexto_(valor)
      .toUpperCase();

  if (
    !texto ||
    texto === 'N/A' ||
    texto === 'NA'
  ) {
    return '';
  }

  return texto.replace(
    /[^A-Z0-9]/g,
    ''
  );
}


/**
 * Busca una persona en Variables_Internas.
 *
 * Prioridad:
 * 1. CI
 * 2. cualquiera de los correos A/B
 *
 * Si CI y correo apuntan a filas distintas, devuelve conflicto
 * y NO decide automáticamente.
 */
function rimBuscarPersonaVariables_(
  hojaVariables,
  correos,
  ci
) {
  /*
   * POLÍTICA V1.3:
   * - Correo oficial / alternativo son las llaves operativas.
   * - CI se usa como control/alerta, NO para sobreescribir una
   *   coincidencia inequívoca por correo.
   * - Los campos se resuelven por encabezado.
   */
  const lastRow =
    hojaVariables.getLastRow();

  if (lastRow <= 1) {
    return {
      encontrada: false,
      conflicto: false,
      revisionCI: false,
      fila: 0,
      filasCoincidentes: [],
      filasCorreo: [],
      filasCI: [],
      alertaCI: ''
    };
  }

  const rango =
    hojaVariables.getDataRange();

  const datos =
    rango.getValues();

  const mapa =
    rimMapaVariablesV13_(
      datos[0]
    );

  const iCorreoA =
    rimIndiceVariablesV13_(
      mapa,
      ['Correo oficial']
    );

  const iCorreoB =
    rimIndiceVariablesV13_(
      mapa,
      [
        'Correo alternativo cursos',
        'Correo Alternativo (Cursos)'
      ],
      true
    );

  const iCI =
    rimIndiceVariablesV13_(
      mapa,
      ['CI']
    );

  const correosBuscados =
    (correos || [])
      .map(rimNormalizarCorreo_)
      .filter(function(valor, indice, arr) {
        return (
          valor &&
          rimEsCorreoValido_(valor) &&
          arr.indexOf(valor) === indice
        );
      });

  const ciBuscado =
    rimNormalizarCI_(ci);

  const filasCorreo = [];
  const filasCI = [];

  datos
    .slice(1)
    .forEach(function(row, indice) {
      const fila =
        indice + 2;

      const correoA =
        rimNormalizarCorreo_(
          row[iCorreoA]
        );

      const correoB =
        iCorreoB >= 0
          ? rimNormalizarCorreo_(
              row[iCorreoB]
            )
          : '';

      const ciFila =
        rimNormalizarCI_(
          row[iCI]
        );

      if (
        correosBuscados.some(function(correo) {
          return (
            correo === correoA ||
            (
              correoB &&
              correo === correoB
            )
          );
        })
      ) {
        filasCorreo.push(fila);
      }

      if (
        ciBuscado &&
        ciFila &&
        ciBuscado === ciFila
      ) {
        filasCI.push(fila);
      }
    });

  const correosUnicos =
    filasCorreo.filter(function(fila, indice, arr) {
      return arr.indexOf(fila) === indice;
    });

  const cisUnicos =
    filasCI.filter(function(fila, indice, arr) {
      return arr.indexOf(fila) === indice;
    });

  if (correosUnicos.length === 1) {
    const filaCorreo =
      correosUnicos[0];

    const ciEnOtraFila =
      cisUnicos.filter(function(fila) {
        return fila !== filaCorreo;
      });

    return {
      encontrada: true,
      conflicto: false,
      revisionCI: false,
      fila: filaCorreo,
      filasCoincidentes: [filaCorreo],
      filasCorreo: correosUnicos,
      filasCI: cisUnicos,
      alertaCI:
        ciEnOtraFila.length
          ? (
              'CI INCONSISTENTE: el correo identifica la fila ' +
              filaCorreo +
              ', pero el CI también aparece en la(s) fila(s) ' +
              ciEnOtraFila.join(', ') +
              '. No se modificó CI.'
            )
          : ''
    };
  }

  if (correosUnicos.length > 1) {
    return {
      encontrada: false,
      conflicto: true,
      revisionCI: false,
      fila: 0,
      filasCoincidentes: correosUnicos,
      filasCorreo: correosUnicos,
      filasCI: cisUnicos,
      alertaCI:
        'El mismo correo aparece asociado a más de una fila.'
    };
  }

  if (cisUnicos.length > 0) {
    return {
      encontrada: false,
      conflicto: false,
      revisionCI: true,
      fila: 0,
      filasCoincidentes: cisUnicos,
      filasCorreo: [],
      filasCI: cisUnicos,
      alertaCI:
        'No hubo coincidencia por correo, pero el CI aparece en Variables_Internas. Revisión manual requerida antes de crear o fusionar.'
    };
  }

  return {
    encontrada: false,
    conflicto: false,
    revisionCI: false,
    fila: 0,
    filasCoincidentes: [],
    filasCorreo: [],
    filasCI: [],
    alertaCI: ''
  };
}


function rimMapaVariablesV13_(
  headers
) {
  const mapa = {};

  headers.forEach(function(header, index) {
    const clave =
      rimNormalizarSinAcentos_(
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
        index;
    }
  });

  return mapa;
}


function rimIndiceVariablesV13_(
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
      rimNormalizarSinAcentos_(
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
    return -1;
  }

  throw new Error(
    'Variables_Internas no contiene ninguno de estos encabezados: ' +
    aliases.join(' | ')
  );
}


function rimFechaValida_(valor) {
  return (
    valor instanceof Date &&
    !isNaN(valor.getTime())
  );
}


function rimNumero_(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return null;
  }

  if (
    typeof valor === 'number' &&
    isFinite(valor)
  ) {
    return valor;
  }

  const limpio =
    String(valor)
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');

  if (!limpio) return null;

  const numero =
    Number(limpio);

  return isFinite(numero)
    ? numero
    : null;
}

