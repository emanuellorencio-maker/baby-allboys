const SHEET_NAMES = {
  PARTICIPANTES: 'Participantes',
  PRONOSTICOS: 'Pronosticos',
  ETAPAS: 'Etapas',
  LOG: 'Log'
};

const HEADERS = {
  Participantes: [
    'participant_code',
    'participant_code_normalized',
    'submission_id_inicial',
    'created_at',
    'updated_at',
    'estado_participante',
    'nombre',
    'apellido',
    'nombre_hijo',
    'apellido_hijo',
    'numero_socio',
    'categoria',
    'tira',
    'whatsapp',
    'user_agent_inicial',
    'tipo_participante',
    'vinculo_baby',
    'jugador_vinculado_nombre',
    'jugador_vinculado_apellido',
    'categoria_vinculada',
    'tira_vinculada',
    'access_code_validated'
  ],
  Pronosticos: [
    'participant_code',
    'submission_id',
    'stage_id',
    'partido_id',
    'equipo_local',
    'equipo_visitante',
    'sign',
    'created_at',
    'updated_at'
  ],
  Etapas: [
    'stage_id',
    'stage_label',
    'status',
    'editable_from',
    'editable_until',
    'visible',
    'notas'
  ],
  Log: [
    'timestamp',
    'tipo',
    'mensaje',
    'raw'
  ]
};

const ACTIONS = {
  CREATE: 'create_participant_submission',
  GET_BY_CODE: 'get_participant_by_code',
  UPDATE_STAGE: 'update_stage_predictions',
  GET_OPEN_STAGE: 'get_open_stage'
};

const PRODE_CIERRE_ISO = '';
const DUPLICADO_CON_CODIGO_ERROR = 'Ya existe un Prode para este jugador/a. Ingresa tu codigo para verlo o editarlo.';
const CODIGO_NO_ENCONTRADO_ERROR = 'No encontramos un Prode asociado a ese codigo.';
const ETAPA_CERRADA_ERROR = 'Esta etapa ya esta cerrada. Si necesitas corregir algo, habla con la organizacion.';
const SIN_ETAPA_ABIERTA_ERROR = 'No hay una etapa abierta en este momento.';
const CODIGO_REQUERIDO_ERROR = 'Ingresa un codigo valido para consultar tu Prode.';
const CERRADO_ERROR = 'El Prode cerro. Ya no se reciben pronosticos.';
const HEADERS_ERROR = 'La planilla no tiene los encabezados esperados para Prode v2.';
const PARTICIPANT_CODE_WARNING = 'Guarda este codigo y no lo compartas. Lo vas a necesitar para editar tu Prode o cargar proximas etapas.';
const MISMO_WHATSAPP_MSG = 'Mismo WhatsApp usado para mas de un jugador/a';
const PARTICIPANT_CODE_PREFIX = 'BABY-';
const PARTICIPANT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PARTICIPANT_CODE_LENGTH = 5;
const PARTICIPANT_CODE_MAX_ATTEMPTS = 10;
const GENERAL_ACCESS_CODE = 'ALBO2026';
const MATCH_CUTOFF_MINUTES = 15;
const PRODE_MATCHES_SOURCE_URL = 'https://baby-allboys.vercel.app/data/prode/partidos.json';
const MATCHES_SOURCE_CACHE_SECONDS = 21600;
const INVALID_ACCESS_CODE_ERROR = 'El codigo de acceso no es valido. Pediselo a la organizacion del Baby All Boys.';
const PARTIDO_GUARDADO_ERROR = 'Este pronostico ya fue guardado y no puede modificarse.';
const PARTIDO_CERRADO_ERROR = 'La carga para este partido ya cerro.';
const PARTIDO_SIN_HORARIO_ERROR = 'No se pudo validar el horario real de este partido.';
const PARTICIPANT_TYPES = {
  JUGADOR: 'JUGADOR',
  FAMILIAR: 'FAMILIAR',
  PROFESOR: 'PROFESOR',
  DELEGADO: 'DELEGADO'
};

function doPost(e) {
  const now = new Date();
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    ensureSheetHeaders_(ss);
    const payload = parsePayload_(raw);
    const action = resolveAction_(payload);

    if (action === ACTIONS.GET_BY_CODE || action === ACTIONS.GET_OPEN_STAGE) {
      return routeAction_(ss, action, payload, now, raw);
    }

    const lock = LockService.getDocumentLock();
    lock.waitLock(20000);
    try {
      return routeAction_(ss, action, payload, now, raw);
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    const message = error && error.message ? String(error.message) : 'Error desconocido';
    appendLog_(ss, [
      now.toISOString(),
      'ERROR',
      truncateCell_(message, 1000),
      truncateCell_(raw, 50000)
    ]);
    return jsonResponse_({
      ok: false,
      error_code: mapErrorCode_(message),
      error: publicError_(message)
    });
  }
}

function routeAction_(ss, action, payload, now, raw) {
  if (estaCerradoGlobalmente_() && (action === ACTIONS.CREATE || action === ACTIONS.UPDATE_STAGE)) {
    appendLog_(ss, [
      now.toISOString(),
      'CERRADO_GLOBAL',
      CERRADO_ERROR,
      truncateCell_(raw, 50000)
    ]);
    return jsonResponse_({ ok: false, error_code: 'GLOBAL_CLOSED', error: CERRADO_ERROR });
  }

  switch (action) {
    case ACTIONS.CREATE:
      return handleCreateParticipantSubmission_(ss, payload, now);
    case ACTIONS.GET_BY_CODE:
      return handleGetParticipantByCode_(ss, payload);
    case ACTIONS.UPDATE_STAGE:
      return handleUpdateStagePredictions_(ss, payload, now);
    case ACTIONS.GET_OPEN_STAGE:
      return handleGetOpenStage_(ss);
    default:
      throw new Error('Accion no soportada');
  }
}

function handleCreateParticipantSubmission_(ss, payload, now) {
  const participante = normalizeParticipante_(payload && payload.participante);
  const pronosticos = normalizePronosticos_(payload && payload.pronosticos);
  const metadata = payload && payload.metadata ? payload.metadata : {};
  const stage = resolveEditableStage_(ss, payload && payload.stage_id, metadata && metadata.stage_id);
  const timestamp = now.toISOString();
  const submissionId = safeString_(metadata.submission_id) || generateSubmissionId_();
  const userAgent = safeString_(metadata.user_agent);

  validateAccessCode_(payload);
  validateParticipante_(participante);
  validatePronosticos_(pronosticos);

  if (existsStrongDuplicate_(ss, participante)) {
    appendLog_(ss, [
      timestamp,
      'DUPLICATE_WITHOUT_CODE',
      DUPLICADO_CON_CODIGO_ERROR,
      safeJson_({ participante: participante, submission_id: submissionId, stage_id: stage.stage_id })
    ]);
    return jsonResponse_({
      ok: false,
      error_code: 'DUPLICATE_WITHOUT_CODE',
      error: DUPLICADO_CON_CODIGO_ERROR
    });
  }

  if (existsSameWhatsappDifferentPlayer_(ss, participante)) {
    appendLog_(ss, [
      timestamp,
      'MISMO_WHATSAPP',
      MISMO_WHATSAPP_MSG,
      safeJson_({
        whatsapp: participante.whatsapp,
        nombre_hijo: participante.nombre_hijo,
        apellido_hijo: participante.apellido_hijo,
        numero_socio: participante.numero_socio,
        categoria: participante.categoria,
        tira: participante.tira
      })
    ]);
  }

  const generatedCode = generateUniqueParticipantCode_(ss);
  const normalizedCode = normalizeParticipantCodeForCompare_(generatedCode);
  const batchResult = buildPredictionBatchResult_(ss, generatedCode, stage.stage_id, submissionId, pronosticos, now);

  appendParticipante_(ss, [
    generatedCode,
    normalizedCode,
    submissionId,
    timestamp,
    timestamp,
    'ACTIVO',
    participante.nombre,
    participante.apellido,
    participante.nombre_hijo,
    participante.apellido_hijo,
    participante.numero_socio,
    participante.categoria,
    participante.tira,
    participante.whatsapp,
    userAgent,
    participante.tipo_participante,
    participante.vinculo_baby,
    participante.jugador_vinculado_nombre,
    participante.jugador_vinculado_apellido,
    participante.categoria_vinculada,
    participante.tira_vinculada,
    participante.access_code_validated
  ]);

  appendPronosticos_(ss, batchResult.rowsToAppend);

  appendLog_(ss, [
    timestamp,
    'CREATE_OK',
    'Participante creado con codigo unico',
    safeJson_({
      participant_code: generatedCode,
      submission_id: submissionId,
      stage_id: stage.stage_id,
      cantidad_pronosticos: pronosticos.length,
      saved_count: batchResult.saved_count,
      blocked_count: batchResult.blocked_count
    })
  ]);

  return jsonResponse_({
    ok: true,
    mode: 'created',
    participant_code: generatedCode,
    submission_id: submissionId,
    stage_id: stage.stage_id,
    warning: PARTICIPANT_CODE_WARNING,
    saved_count: batchResult.saved_count,
    blocked_count: batchResult.blocked_count,
    saved_predictions: batchResult.saved_predictions.map(sanitizePronosticoResponse_),
    blocked_predictions: batchResult.blocked_predictions
  });
}

function handleGetParticipantByCode_(ss, payload) {
  const code = safeString_(payload && payload.participant_code);
  const normalizedCode = normalizeParticipantCodeForCompare_(code);
  if (!normalizedCode) {
    appendLog_(ss, [
      new Date().toISOString(),
      'CODE_REQUIRED',
      CODIGO_REQUERIDO_ERROR,
      safeJson_({ action: ACTIONS.GET_BY_CODE })
    ]);
    return jsonResponse_({
      ok: false,
      error_code: 'CODE_REQUIRED',
      error: CODIGO_REQUERIDO_ERROR
    });
  }

  const participant = findParticipantByCode_(ss, normalizedCode);
  if (!participant) {
    appendLog_(ss, [
      new Date().toISOString(),
      'CODE_NOT_FOUND',
      CODIGO_NO_ENCONTRADO_ERROR,
      safeJson_({ action: ACTIONS.GET_BY_CODE, participant_code: code, participant_code_normalized: normalizedCode })
    ]);
    return jsonResponse_({
      ok: false,
      error_code: 'CODE_NOT_FOUND',
      error: CODIGO_NO_ENCONTRADO_ERROR
    });
  }

  const requestedStageId = safeString_(payload && payload.stage_id);
  const stage = requestedStageId
    ? getStageById_(ss, requestedStageId)
    : getOpenStageRecord_(ss, true);
  const predictions = stage ? getPronosticosForParticipantStage_(ss, participant.participant_code, stage.stage_id) : [];

  return jsonResponse_({
    ok: true,
    participant: sanitizeParticipantResponse_(participant),
    stage: stage ? sanitizeStageResponse_(stage) : null,
    predictions: predictions.map(sanitizePronosticoResponse_),
    readonly_message: stage && isStageEditableNow_(stage) ? '' : ETAPA_CERRADA_ERROR
  });
}

function handleUpdateStagePredictions_(ss, payload, now) {
  const metadata = payload && payload.metadata ? payload.metadata : {};
  const code = safeString_(payload && payload.participant_code);
  const normalizedCode = normalizeParticipantCodeForCompare_(code);
  if (!normalizedCode) {
    return jsonResponse_({
      ok: false,
      error_code: 'CODE_REQUIRED',
      error: CODIGO_REQUERIDO_ERROR
    });
  }

  const participant = findParticipantByCode_(ss, normalizedCode);
  if (!participant) {
    return jsonResponse_({
      ok: false,
      error_code: 'CODE_NOT_FOUND',
      error: CODIGO_NO_ENCONTRADO_ERROR
    });
  }

  const stage = resolveEditableStage_(ss, payload && payload.stage_id, metadata && metadata.stage_id);
  const pronosticos = normalizePronosticos_(payload && payload.pronosticos);
  const timestamp = now.toISOString();
  const submissionId = safeString_(metadata.submission_id) || generateSubmissionId_();

  validateAccessCode_(payload);
  validatePronosticos_(pronosticos);
  const batchResult = buildPredictionBatchResult_(ss, participant.participant_code, stage.stage_id, submissionId, pronosticos, now);
  appendPronosticos_(ss, batchResult.rowsToAppend);
  if (batchResult.saved_count > 0) {
    updateParticipantTimestamp_(ss, participant.__rowNumber, timestamp);
  }

  appendLog_(ss, [
    timestamp,
    'UPDATE_OK',
    'Pronosticos de etapa actualizados',
    safeJson_({
      participant_code: participant.participant_code,
      submission_id: submissionId,
      stage_id: stage.stage_id,
      cantidad_pronosticos: pronosticos.length,
      saved_count: batchResult.saved_count,
      blocked_count: batchResult.blocked_count
    })
  ]);

  return jsonResponse_({
    ok: true,
    mode: 'updated',
    participant_code: participant.participant_code,
    submission_id: submissionId,
    stage_id: stage.stage_id,
    saved_count: batchResult.saved_count,
    blocked_count: batchResult.blocked_count,
    saved_predictions: batchResult.saved_predictions.map(sanitizePronosticoResponse_),
    blocked_predictions: batchResult.blocked_predictions
  });
}

function handleGetOpenStage_(ss) {
  const stage = getOpenStageRecord_(ss, false);
  return jsonResponse_({
    ok: true,
    stage: sanitizeStageResponse_(stage)
  });
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePayload_(raw) {
  return JSON.parse(raw || '{}');
}

function resolveAction_(payload) {
  const rawAction = safeString_(payload && (payload.action || (payload.metadata && payload.metadata.action)));
  return rawAction || ACTIONS.CREATE;
}

function ensureSheetHeaders_(ss) {
  ensureExactHeaderRow_(getOrCreateSheet_(ss, SHEET_NAMES.PARTICIPANTES), HEADERS.Participantes, SHEET_NAMES.PARTICIPANTES);
  ensureExactHeaderRow_(getOrCreateSheet_(ss, SHEET_NAMES.PRONOSTICOS), HEADERS.Pronosticos, SHEET_NAMES.PRONOSTICOS);
  ensureExactHeaderRow_(getOrCreateSheet_(ss, SHEET_NAMES.ETAPAS), HEADERS.Etapas, SHEET_NAMES.ETAPAS);
  ensureExactHeaderRow_(getOrCreateSheet_(ss, SHEET_NAMES.LOG), HEADERS.Log, SHEET_NAMES.LOG);
}

function ensureExactHeaderRow_(sheet, expectedHeaders, sheetName) {
  const currentLastColumn = sheet.getLastColumn();
  const currentLastRow = sheet.getLastRow();

  if (!currentLastRow || !currentLastColumn) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    return;
  }

  const currentHeaders = sheet
    .getRange(1, 1, 1, Math.max(currentLastColumn, expectedHeaders.length))
    .getValues()[0]
    .slice(0, expectedHeaders.length)
    .map(function(cell) { return String(cell || '').trim(); });

  if (sheetName === SHEET_NAMES.PARTICIPANTES) {
    const currentPrefix = currentHeaders.slice(0, 15);
    const expectedPrefix = expectedHeaders.slice(0, 15);
    const missingTail = expectedHeaders.slice(15);
    const currentTail = currentHeaders.slice(15, 15 + missingTail.length);
    const hasLegacyPrefix = currentPrefix.join('|') === expectedPrefix.join('|');
    const tailIsEmpty = currentTail.every(function(cell) { return !String(cell || '').trim(); });
    if (hasLegacyPrefix && tailIsEmpty) {
      sheet.getRange(1, 16, 1, missingTail.length).setValues([missingTail]);
      return;
    }
  }

  if (currentHeaders.join('|') !== expectedHeaders.join('|')) {
    throw new Error(buildHeadersError_(sheetName, expectedHeaders, currentHeaders));
  }
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function normalizeParticipante_(participante) {
  const tipo = normalizeParticipantType_(participante && participante.tipo_participante);
  const nombreHijo = safeString_(participante && participante.nombre_hijo);
  const apellidoHijo = safeString_(participante && participante.apellido_hijo);
  const categoria = safeString_(participante && participante.categoria);
  const tira = safeString_(participante && participante.tira);
  return {
    tipo_participante: tipo,
    nombre: safeString_(participante && participante.nombre),
    apellido: safeString_(participante && participante.apellido),
    nombre_hijo: nombreHijo,
    apellido_hijo: apellidoHijo,
    numero_socio: normalizeMemberNumber_(participante && participante.numero_socio),
    categoria: categoria,
    tira: tira,
    whatsapp: safeString_(participante && participante.whatsapp),
    vinculo_baby: safeString_(participante && participante.vinculo_baby),
    jugador_vinculado_nombre: safeString_(participante && participante.jugador_vinculado_nombre) || nombreHijo,
    jugador_vinculado_apellido: safeString_(participante && participante.jugador_vinculado_apellido) || apellidoHijo,
    categoria_vinculada: safeString_(participante && participante.categoria_vinculada) || categoria,
    tira_vinculada: safeString_(participante && participante.tira_vinculada) || tira,
    access_code_validated: normalizeApprovedFlag_(participante && participante.access_code_validated)
  };
}

function normalizePronosticos_(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map(function(item) {
      return {
        partido_id: safeString_(item && item.partido_id),
        equipo_local: safeString_(item && item.equipo_local),
        equipo_visitante: safeString_(item && item.equipo_visitante),
        sign: normalizeSign_(item && item.sign)
      };
    })
    .filter(function(item) {
      return item.partido_id && item.equipo_local && item.equipo_visitante && item.sign;
    });
}

function validateParticipante_(participante) {
  if (!participante.tipo_participante) throw new Error('Falta participante.tipo_participante');
  if (!participante.nombre) throw new Error('Falta participante.nombre');
  if (!participante.apellido) throw new Error('Falta participante.apellido');
  if (!participante.numero_socio) throw new Error('Falta participante.numero_socio');
  switch (participante.tipo_participante) {
    case PARTICIPANT_TYPES.JUGADOR:
      if (!participante.nombre_hijo) throw new Error('Falta participante.nombre_hijo');
      if (!participante.apellido_hijo) throw new Error('Falta participante.apellido_hijo');
      if (!participante.categoria) throw new Error('Falta participante.categoria');
      if (!participante.tira) throw new Error('Falta participante.tira');
      break;
    case PARTICIPANT_TYPES.FAMILIAR:
      if (!participante.vinculo_baby) throw new Error('Falta participante.vinculo_baby');
      if (!participante.jugador_vinculado_nombre) throw new Error('Falta participante.jugador_vinculado_nombre');
      if (!participante.jugador_vinculado_apellido) throw new Error('Falta participante.jugador_vinculado_apellido');
      if (!participante.categoria_vinculada) throw new Error('Falta participante.categoria_vinculada');
      if (!participante.tira_vinculada) throw new Error('Falta participante.tira_vinculada');
      if (!participante.whatsapp) throw new Error('Falta participante.whatsapp');
      break;
    case PARTICIPANT_TYPES.PROFESOR:
    case PARTICIPANT_TYPES.DELEGADO:
      if (!participante.whatsapp) throw new Error('Falta participante.whatsapp');
      break;
    default:
      throw new Error('Tipo de participante no soportado');
  }
}

function validatePronosticos_(pronosticos) {
  if (!Array.isArray(pronosticos) || !pronosticos.length) {
    throw new Error('Falta al menos un pronostico completo');
  }
  pronosticos.forEach(function(pronostico) {
    if (!pronostico.sign) {
      throw new Error('Falta pronostico.sign valido');
    }
  });
}

function validateAccessCode_(payload) {
  const metadata = payload && payload.metadata ? payload.metadata : {};
  const accessCode = safeString_(metadata.access_code);
  if (compareKey_(accessCode) !== compareKey_(GENERAL_ACCESS_CODE)) {
    throw new Error(INVALID_ACCESS_CODE_ERROR);
  }
}

function normalizeSign_(value) {
  const raw = safeString_(value).toUpperCase();
  if (raw === 'LOCAL' || raw === 'EMPATE' || raw === 'VISITANTE') return raw;
  return '';
}

function normalizeParticipantType_(value) {
  const raw = safeString_(value)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '');
  if (raw === 'JUGADOR' || raw === 'JUGADORA') return PARTICIPANT_TYPES.JUGADOR;
  if (raw === 'FAMILIAR' || raw === 'ADULTORESPONSABLE' || raw === 'FAMILIARADULTORESPONSABLE') return PARTICIPANT_TYPES.FAMILIAR;
  if (raw === 'PROFESOR') return PARTICIPANT_TYPES.PROFESOR;
  if (raw === 'DELEGADO') return PARTICIPANT_TYPES.DELEGADO;
  return '';
}

function normalizeApprovedFlag_(value) {
  return compareKey_(value) === 'si' || String(value || '').trim() === 'true' ? 'SI' : '';
}

function normalizeVisibleFlag_(value) {
  const raw = safeString_(value).toUpperCase();
  if (raw === 'SI' || raw === 'TRUE' || raw === '1') return 'SI';
  if (raw === 'NO' || raw === 'FALSE' || raw === '0') return 'NO';
  return '';
}

function getParticipantesRecords_(ss) {
  const sheet = getOrCreateSheet_(ss, SHEET_NAMES.PARTICIPANTES);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, HEADERS.Participantes.length).getValues().map(function(row, index) {
    return {
      __rowNumber: index + 2,
      participant_code: safeString_(row[0]),
      participant_code_normalized: safeString_(row[1]),
      submission_id_inicial: safeString_(row[2]),
      created_at: safeString_(row[3]),
      updated_at: safeString_(row[4]),
      estado_participante: safeString_(row[5]),
      nombre: safeString_(row[6]),
      apellido: safeString_(row[7]),
      nombre_hijo: safeString_(row[8]),
      apellido_hijo: safeString_(row[9]),
      numero_socio: normalizeMemberNumber_(row[10]),
      categoria: safeString_(row[11]),
      tira: safeString_(row[12]),
      whatsapp: safeString_(row[13]),
      user_agent_inicial: safeString_(row[14]),
      tipo_participante: normalizeParticipantType_(row[15]) || PARTICIPANT_TYPES.JUGADOR,
      vinculo_baby: safeString_(row[16]),
      jugador_vinculado_nombre: safeString_(row[17]),
      jugador_vinculado_apellido: safeString_(row[18]),
      categoria_vinculada: safeString_(row[19]),
      tira_vinculada: safeString_(row[20]),
      access_code_validated: normalizeApprovedFlag_(row[21])
    };
  });
}

function getPronosticosRecords_(ss) {
  const sheet = getOrCreateSheet_(ss, SHEET_NAMES.PRONOSTICOS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, HEADERS.Pronosticos.length).getValues().map(function(row, index) {
    return {
      __rowNumber: index + 2,
      participant_code: safeString_(row[0]),
      submission_id: safeString_(row[1]),
      stage_id: safeString_(row[2]),
      partido_id: safeString_(row[3]),
      equipo_local: safeString_(row[4]),
      equipo_visitante: safeString_(row[5]),
      sign: normalizeSign_(row[6]),
      created_at: safeString_(row[7]),
      updated_at: safeString_(row[8])
    };
  });
}

function getEtapasRecords_(ss) {
  const sheet = getOrCreateSheet_(ss, SHEET_NAMES.ETAPAS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, HEADERS.Etapas.length).getValues().map(function(row) {
    return {
      stage_id: safeString_(row[0]),
      stage_label: safeString_(row[1]),
      status: safeString_(row[2]).toUpperCase(),
      editable_from: safeString_(row[3]),
      editable_until: safeString_(row[4]),
      visible: normalizeVisibleFlag_(row[5]),
      notas: safeString_(row[6])
    };
  }).filter(function(row) {
    return row.stage_id;
  });
}

function buildStrongKey_(participante) {
  const type = normalizeParticipantType_(participante && participante.tipo_participante) || PARTICIPANT_TYPES.JUGADOR;
  if (type === PARTICIPANT_TYPES.FAMILIAR) {
    if (participante.whatsapp) {
      return [
        type,
        compareKey_(participante.nombre),
        compareKey_(participante.apellido),
        compareKey_(participante.whatsapp)
      ].join('|');
    }
    return [
      type,
      compareKey_(participante.nombre),
      compareKey_(participante.apellido),
      compareKey_(participante.jugador_vinculado_nombre || participante.nombre_hijo),
      compareKey_(participante.jugador_vinculado_apellido || participante.apellido_hijo),
      compareKey_(participante.tira_vinculada || participante.tira)
    ].join('|');
  }

  if (type === PARTICIPANT_TYPES.PROFESOR || type === PARTICIPANT_TYPES.DELEGADO) {
    return [
      type,
      compareKey_(participante.nombre),
      compareKey_(participante.apellido),
      compareKey_(participante.whatsapp || participante.tira_vinculada || participante.tira)
    ].join('|');
  }

  if (participante.numero_socio) {
    return [
      type,
      'SOCIO',
      compareKey_(participante.numero_socio),
      compareKey_(participante.categoria),
      compareKey_(participante.tira)
    ].join('|');
  }

  return [
    type,
    'JUGADOR',
    compareKey_(participante.nombre_hijo),
    compareKey_(participante.apellido_hijo),
    compareKey_(participante.categoria),
    compareKey_(participante.tira)
  ].join('|');
}

function existsStrongDuplicate_(ss, participante) {
  const target = buildStrongKey_(participante);
  return getParticipantesRecords_(ss).some(function(row) {
    return buildStrongKey_(row) === target;
  });
}

function existsSameWhatsappDifferentPlayer_(ss, participante) {
  if (!participante.whatsapp) return false;
  const whatsapp = compareKey_(participante.whatsapp);
  const strongKey = buildStrongKey_(participante);

  return getParticipantesRecords_(ss).some(function(row) {
    return compareKey_(row.whatsapp) === whatsapp && buildStrongKey_(row) !== strongKey;
  });
}

function appendParticipante_(ss, row) {
  getOrCreateSheet_(ss, SHEET_NAMES.PARTICIPANTES).appendRow(row);
}

function appendPronosticos_(ss, rows) {
  if (!rows.length) return;
  const sheet = getOrCreateSheet_(ss, SHEET_NAMES.PRONOSTICOS);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function appendLog_(ss, row) {
  getOrCreateSheet_(ss, SHEET_NAMES.LOG).appendRow(row);
}

function updateParticipantTimestamp_(ss, rowNumber, updatedAt) {
  const sheet = getOrCreateSheet_(ss, SHEET_NAMES.PARTICIPANTES);
  sheet.getRange(rowNumber, 5).setValue(updatedAt);
}

function findParticipantByCode_(ss, normalizedCode) {
  const target = normalizeParticipantCodeForCompare_(normalizedCode);
  return getParticipantesRecords_(ss).find(function(row) {
    return normalizeParticipantCodeForCompare_(row.participant_code_normalized || row.participant_code) === target;
  }) || null;
}

function getPronosticosForParticipantStage_(ss, participantCode, stageId) {
  return getPronosticosRecords_(ss).filter(function(row) {
    return row.participant_code === participantCode && row.stage_id === stageId;
  });
}

function buildPredictionBatchResult_(ss, participantCode, stageId, submissionId, pronosticos, now) {
  const timestamp = now.toISOString();
  const existingRows = getPronosticosForParticipantStage_(ss, participantCode, stageId);
  const existingByMatch = existingRows.reduce(function(acc, row) {
    if (row.partido_id) acc[row.partido_id] = row;
    return acc;
  }, {});
  const scheduleMap = getMatchScheduleMap_();
  const rowsToAppend = [];
  const savedPredictions = [];
  const blockedPredictions = [];

  pronosticos.forEach(function(pronostico) {
    const existingRow = existingByMatch[pronostico.partido_id];
    if (existingRow) {
      blockedPredictions.push(buildBlockedPredictionResponse_(pronostico, 'PREDICTION_ALREADY_LOCKED', PARTIDO_GUARDADO_ERROR, existingRow));
      return;
    }

    const timing = getMatchTimingState_(scheduleMap, pronostico.partido_id, now);
    if (timing.code !== 'OPEN') {
      blockedPredictions.push(buildBlockedPredictionResponse_(pronostico, timing.code, timing.message, null, timing));
      return;
    }

    const row = [
      participantCode,
      submissionId,
      stageId,
      pronostico.partido_id,
      pronostico.equipo_local,
      pronostico.equipo_visitante,
      pronostico.sign,
      timestamp,
      timestamp
    ];
    rowsToAppend.push(row);
    savedPredictions.push({
      participant_code: participantCode,
      submission_id: submissionId,
      stage_id: stageId,
      partido_id: pronostico.partido_id,
      equipo_local: pronostico.equipo_local,
      equipo_visitante: pronostico.equipo_visitante,
      sign: pronostico.sign,
      code: 'SAVED',
      public_status: 'Pronostico guardado',
      created_at: timestamp,
      updated_at: timestamp,
      cutoff_at: timing.cutoff_at,
      match_start_at: timing.match_start_at
    });
  });

  return {
    rowsToAppend: rowsToAppend,
    saved_predictions: savedPredictions,
    blocked_predictions: blockedPredictions,
    saved_count: savedPredictions.length,
    blocked_count: blockedPredictions.length
  };
}

function replacePronosticosForStage_(ss, participantCode, stageId, submissionId, pronosticos, timestamp) {
  appendPronosticos_(ss, buildPronosticosRows_(participantCode, submissionId, stageId, pronosticos, timestamp));
}

function buildPronosticosRows_(participantCode, submissionId, stageId, pronosticos, timestamp) {
  return pronosticos.map(function(pronostico) {
    return [
      participantCode,
      submissionId,
      stageId,
      pronostico.partido_id,
      pronostico.equipo_local,
      pronostico.equipo_visitante,
      pronostico.sign,
      timestamp,
      timestamp
    ];
  });
}

function getMatchScheduleMap_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('prode_match_schedule_map_v1');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      // sigue a fetch
    }
  }

  const response = UrlFetchApp.fetch(PRODE_MATCHES_SOURCE_URL, {
    muteHttpExceptions: true,
    headers: {
      Accept: 'application/json'
    }
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('No se pudo leer partidos.json para validar horarios');
  }

  const items = JSON.parse(response.getContentText() || '[]');
  const scheduleMap = Array.isArray(items) ? items.reduce(function(acc, item) {
    const partidoId = safeString_(item && item.id);
    const startAt = buildMatchStartIsoFromSource_(item);
    if (partidoId && startAt) {
      acc[partidoId] = startAt;
    }
    return acc;
  }, {}) : {};

  cache.put('prode_match_schedule_map_v1', JSON.stringify(scheduleMap), MATCHES_SOURCE_CACHE_SECONDS);
  return scheduleMap;
}

function buildMatchStartIsoFromSource_(item) {
  const fecha = safeString_(item && item.fecha);
  const hora = safeString_(item && item.hora);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return '';
  const match = hora.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  const hours = String(Math.max(0, Math.min(23, Number(match[1])))).padStart(2, '0');
  const minutes = String(Math.max(0, Math.min(59, Number(match[2])))).padStart(2, '0');
  return fecha + 'T' + hours + ':' + minutes + ':00-03:00';
}

function getMatchTimingState_(scheduleMap, partidoId, now) {
  const matchStartAt = safeString_(scheduleMap && scheduleMap[partidoId]);
  const startDate = parseIsoDate_(matchStartAt);
  if (!startDate) {
    return {
      code: 'MATCH_TIME_MISSING',
      message: PARTIDO_SIN_HORARIO_ERROR,
      match_start_at: '',
      cutoff_at: ''
    };
  }

  const cutoffDate = new Date(startDate.getTime() - MATCH_CUTOFF_MINUTES * 60 * 1000);
  if (now.getTime() >= cutoffDate.getTime()) {
    return {
      code: 'MATCH_CLOSED',
      message: PARTIDO_CERRADO_ERROR,
      match_start_at: startDate.toISOString(),
      cutoff_at: cutoffDate.toISOString()
    };
  }

  return {
    code: 'OPEN',
    message: '',
    match_start_at: startDate.toISOString(),
    cutoff_at: cutoffDate.toISOString()
  };
}

function buildBlockedPredictionResponse_(pronostico, code, message, existingRow, timing) {
  return {
    partido_id: pronostico.partido_id,
    equipo_local: pronostico.equipo_local,
    equipo_visitante: pronostico.equipo_visitante,
    sign: pronostico.sign,
    code: code,
    public_status: message,
    saved_sign: existingRow ? existingRow.sign : '',
    match_start_at: existingRow && existingRow.match_start_at ? existingRow.match_start_at : safeString_(timing && timing.match_start_at),
    cutoff_at: existingRow && existingRow.cutoff_at ? existingRow.cutoff_at : safeString_(timing && timing.cutoff_at)
  };
}

function getStageById_(ss, stageId) {
  const target = safeString_(stageId);
  if (!target) return null;
  return getEtapasRecords_(ss).find(function(stage) {
    return stage.stage_id === target;
  }) || null;
}

function getOpenStageRecord_(ss, allowNull) {
  const now = new Date();
  const openStages = getEtapasRecords_(ss).filter(function(stage) {
    return isStageVisible_(stage) && stage.status === 'ABIERTA' && isStageWithinWindow_(stage, now);
  });

  if (!openStages.length) {
    if (allowNull) return null;
    throw new Error(SIN_ETAPA_ABIERTA_ERROR);
  }

  if (openStages.length > 1) {
    throw new Error('Hay mas de una etapa abierta en la hoja Etapas');
  }

  return openStages[0];
}

function resolveEditableStage_(ss, preferredStageId, metadataStageId) {
  const requested = safeString_(preferredStageId) || safeString_(metadataStageId);
  const stage = requested ? getStageById_(ss, requested) : getOpenStageRecord_(ss, false);
  if (!stage) {
    throw new Error(SIN_ETAPA_ABIERTA_ERROR);
  }
  if (!isStageVisible_(stage) || stage.status !== 'ABIERTA' || !isStageWithinWindow_(stage, new Date())) {
    throw new Error(ETAPA_CERRADA_ERROR);
  }
  return stage;
}

function isStageVisible_(stage) {
  return normalizeVisibleFlag_(stage && stage.visible) !== 'NO';
}

function isStageWithinWindow_(stage, now) {
  const from = parseIsoDate_(stage && stage.editable_from);
  const until = parseIsoDate_(stage && stage.editable_until);
  if (from && now.getTime() < from.getTime()) return false;
  if (until && now.getTime() > until.getTime()) return false;
  return true;
}

function isStageEditableNow_(stage) {
  if (!stage) return false;
  return isStageVisible_(stage) && safeString_(stage.status).toUpperCase() === 'ABIERTA' && isStageWithinWindow_(stage, new Date());
}

function estaCerradoGlobalmente_() {
  if (!PRODE_CIERRE_ISO) return false;
  const cierre = parseIsoDate_(PRODE_CIERRE_ISO);
  if (!cierre) return false;
  return Date.now() > cierre.getTime();
}

function generateUniqueParticipantCode_(ss) {
  const existing = getParticipantesRecords_(ss).reduce(function(acc, row) {
    const normalized = normalizeParticipantCodeForCompare_(row.participant_code_normalized || row.participant_code);
    if (normalized) acc[normalized] = true;
    return acc;
  }, {});

  for (var attempt = 0; attempt < PARTICIPANT_CODE_MAX_ATTEMPTS; attempt += 1) {
    const candidate = PARTICIPANT_CODE_PREFIX + randomCodeChunk_();
    const normalized = normalizeParticipantCodeForCompare_(candidate);
    if (!existing[normalized]) {
      return candidate;
    }
  }

  throw new Error('No se pudo generar un codigo unico de participante');
}

function randomCodeChunk_() {
  var chunk = '';
  for (var i = 0; i < PARTICIPANT_CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * PARTICIPANT_CODE_ALPHABET.length);
    chunk += PARTICIPANT_CODE_ALPHABET.charAt(index);
  }
  return chunk;
}

function normalizeParticipantCodeForCompare_(value) {
  return safeString_(value)
    .toUpperCase()
    .replace(/[\s\-]+/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

function normalizeMemberNumber_(value) {
  const raw = safeString_(value);
  if (!raw) return '';
  return raw.replace(/\s+/g, '').replace(/[^0-9A-Za-z\-\/]/g, '');
}

function parseIsoDate_(value) {
  const raw = safeString_(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function sanitizeParticipantResponse_(participant) {
  return {
    participant_code: participant.participant_code,
    tipo_participante: participant.tipo_participante,
    nombre: participant.nombre,
    apellido: participant.apellido,
    nombre_hijo: participant.nombre_hijo,
    apellido_hijo: participant.apellido_hijo,
    numero_socio: participant.numero_socio,
    categoria: participant.categoria,
    tira: participant.tira,
    whatsapp: participant.whatsapp,
    vinculo_baby: participant.vinculo_baby,
    jugador_vinculado_nombre: participant.jugador_vinculado_nombre,
    jugador_vinculado_apellido: participant.jugador_vinculado_apellido,
    categoria_vinculada: participant.categoria_vinculada,
    tira_vinculada: participant.tira_vinculada,
    access_code_validated: participant.access_code_validated,
    estado_participante: participant.estado_participante,
    created_at: participant.created_at,
    updated_at: participant.updated_at
  };
}

function sanitizeStageResponse_(stage) {
  return {
    stage_id: stage.stage_id,
    stage_label: stage.stage_label,
    status: stage.status,
    editable_from: stage.editable_from,
    editable_until: stage.editable_until,
    visible: stage.visible,
    notas: stage.notas,
    editable_now: isStageEditableNow_(stage),
    match_cutoff_minutes: MATCH_CUTOFF_MINUTES
  };
}

function sanitizePronosticoResponse_(row) {
  return {
    participant_code: row.participant_code,
    submission_id: row.submission_id,
    stage_id: row.stage_id,
    partido_id: row.partido_id,
    equipo_local: row.equipo_local,
    equipo_visitante: row.equipo_visitante,
    sign: row.sign,
    code: safeString_(row.code) || 'SAVED',
    public_status: safeString_(row.public_status) || 'Pronostico guardado',
    created_at: row.created_at,
    updated_at: row.updated_at,
    cutoff_at: safeString_(row.cutoff_at),
    match_start_at: safeString_(row.match_start_at)
  };
}

function mapErrorCode_(message) {
  if (message === INVALID_ACCESS_CODE_ERROR) return 'INVALID_ACCESS_CODE';
  if (message === DUPLICADO_CON_CODIGO_ERROR) return 'DUPLICATE_WITHOUT_CODE';
  if (message === CODIGO_NO_ENCONTRADO_ERROR) return 'CODE_NOT_FOUND';
  if (message === CODIGO_REQUERIDO_ERROR) return 'CODE_REQUIRED';
  if (message === ETAPA_CERRADA_ERROR) return 'STAGE_CLOSED';
  if (message === SIN_ETAPA_ABIERTA_ERROR) return 'NO_OPEN_STAGE';
  if (message === CERRADO_ERROR) return 'GLOBAL_CLOSED';
  if (message === PARTIDO_GUARDADO_ERROR) return 'PREDICTION_ALREADY_LOCKED';
  if (message === PARTIDO_CERRADO_ERROR) return 'MATCH_CLOSED';
  if (message === PARTIDO_SIN_HORARIO_ERROR) return 'MATCH_TIME_MISSING';
  if (message === HEADERS_ERROR) return 'INVALID_HEADERS';
  return 'UNEXPECTED_ERROR';
}

function publicError_(message) {
  if (message === INVALID_ACCESS_CODE_ERROR) return INVALID_ACCESS_CODE_ERROR;
  if (message === DUPLICADO_CON_CODIGO_ERROR) return DUPLICADO_CON_CODIGO_ERROR;
  if (message === CODIGO_NO_ENCONTRADO_ERROR) return CODIGO_NO_ENCONTRADO_ERROR;
  if (message === CODIGO_REQUERIDO_ERROR) return CODIGO_REQUERIDO_ERROR;
  if (message === ETAPA_CERRADA_ERROR) return ETAPA_CERRADA_ERROR;
  if (message === SIN_ETAPA_ABIERTA_ERROR) return SIN_ETAPA_ABIERTA_ERROR;
  if (message === CERRADO_ERROR) return CERRADO_ERROR;
  if (message === PARTIDO_GUARDADO_ERROR) return PARTIDO_GUARDADO_ERROR;
  if (message === PARTIDO_CERRADO_ERROR) return PARTIDO_CERRADO_ERROR;
  if (message === PARTIDO_SIN_HORARIO_ERROR) return PARTIDO_SIN_HORARIO_ERROR;
  if (message.indexOf(HEADERS_ERROR) === 0) return message;
  return 'No pudimos procesar el Prode. Revisa la planilla y proba de nuevo.';
}

function safeString_(value) {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  const protectedValue = /^[=+\-@]/.test(raw) ? "'" + raw : raw;
  return truncateCell_(protectedValue, 500);
}

function compareKey_(value) {
  return safeString_(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function safeJson_(value) {
  return truncateCell_(JSON.stringify(value || {}), 50000);
}

function buildHeadersError_(sheetName, expectedHeaders, currentHeaders) {
  return [
    HEADERS_ERROR,
    'Hoja:',
    sheetName,
    '| Esperado:',
    expectedHeaders.join(' | '),
    '| Actual:',
    currentHeaders.join(' | ')
  ].join(' ');
}

function truncateCell_(value, maxLen) {
  const text = String(value || '');
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

function generateSubmissionId_() {
  return 'prode-' + Utilities.getUuid().slice(0, 12);
}
