const SHEET_NAMES = {
  PARTICIPANTES: 'Participantes',
  PRONOSTICOS: 'Pronosticos',
  RESULTADOS_PRODE: 'ResultadosProde',
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
  ResultadosProde: [
    'partido_id',
    'stage_id',
    'resultado_signo',
    'goles_local',
    'goles_visitante',
    'estado_resultado',
    'updated_at',
    'updated_by',
    'fuente'
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
  GET_OPEN_STAGE: 'get_open_stage',
  GET_MATCH_RESULTS_ADMIN: 'get_match_results_admin',
  SAVE_MATCH_RESULT: 'save_match_result',
  GET_PUBLIC_RANKING: 'get_public_ranking',
  GET_PUBLIC_MATCHES: 'get_public_matches'
};

const PRODE_STAGE_ORDER = ['grupos', '32avos', 'octavos', 'cuartos', 'semifinales', 'finales'];
const PRODE_STAGE_LABELS = {
  grupos: 'Fase de grupos',
  '32avos': '32avos',
  octavos: 'Octavos',
  cuartos: 'Cuartos',
  semifinales: 'Semifinales',
  finales: 'Finales'
};
const PRODE_STAGE_MATCH_IDS = {
  grupos: buildMatchIdRange_(1, 72),
  '32avos': buildMatchIdRange_(73, 88),
  octavos: buildMatchIdRange_(89, 96),
  cuartos: buildMatchIdRange_(97, 100),
  semifinales: buildMatchIdRange_(101, 102),
  finales: ['M103', 'M104']
};
const PRODE_KNOCKOUT_BRACKET = {
  M089: {
    source_local_match_id: 'M073',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M075',
    source_visitante_outcome: 'WINNER'
  },
  M090: {
    source_local_match_id: 'M074',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M077',
    source_visitante_outcome: 'WINNER'
  },
  M091: {
    source_local_match_id: 'M076',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M078',
    source_visitante_outcome: 'WINNER'
  },
  M092: {
    source_local_match_id: 'M079',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M080',
    source_visitante_outcome: 'WINNER'
  },
  M093: {
    source_local_match_id: 'M083',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M084',
    source_visitante_outcome: 'WINNER'
  },
  M094: {
    source_local_match_id: 'M081',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M082',
    source_visitante_outcome: 'WINNER'
  },
  M095: {
    source_local_match_id: 'M086',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M088',
    source_visitante_outcome: 'WINNER'
  },
  M096: {
    source_local_match_id: 'M085',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M087',
    source_visitante_outcome: 'WINNER'
  },
  M097: {
    source_local_match_id: 'M089',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M090',
    source_visitante_outcome: 'WINNER'
  },
  M098: {
    source_local_match_id: 'M093',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M094',
    source_visitante_outcome: 'WINNER'
  },
  M099: {
    source_local_match_id: 'M091',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M092',
    source_visitante_outcome: 'WINNER'
  },
  M100: {
    source_local_match_id: 'M095',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M096',
    source_visitante_outcome: 'WINNER'
  },
  M101: {
    source_local_match_id: 'M097',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M098',
    source_visitante_outcome: 'WINNER'
  },
  M102: {
    source_local_match_id: 'M099',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M100',
    source_visitante_outcome: 'WINNER'
  },
  M103: {
    source_local_match_id: 'M101',
    source_local_outcome: 'LOSER',
    source_visitante_match_id: 'M102',
    source_visitante_outcome: 'LOSER'
  },
  M104: {
    source_local_match_id: 'M101',
    source_local_outcome: 'WINNER',
    source_visitante_match_id: 'M102',
    source_visitante_outcome: 'WINNER'
  }
};

const PRODE_CIERRE_ISO = '';
const DUPLICADO_CON_CODIGO_ERROR = 'Ya existe un Prode para este jugador/a. Ingresa tu codigo para verlo o editarlo.';
const CODIGO_NO_ENCONTRADO_ERROR = 'No encontramos un Prode asociado a ese codigo.';
const ETAPA_CERRADA_ERROR = 'Esta etapa ya esta cerrada. Si necesitas corregir algo, habla con la organizacion.';
const ETAPA_NO_HABILITADA_ERROR = 'Ese partido pertenece a una etapa que todavia no esta habilitada.';
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
const MATCHES_LIST_CACHE_KEY = 'prode_matches_source_records_v2_32avos';
const MATCH_SCHEDULE_CACHE_KEY = 'prode_match_schedule_map_v2_32avos';
const ADMIN_RESULTS_TOKEN_PROPERTY = 'PRODE_RESULTS_ADMIN_TOKEN';
const PRODE_MATCH_SCHEDULE_FALLBACK = {
  'M001': '2026-06-11T16:00:00-03:00',
  'M002': '2026-06-11T23:00:00-03:00',
  'M003': '2026-06-12T18:00:00-03:00',
  'M004': '2026-06-12T21:00:00-03:00',
  'M005': '2026-06-14T00:00:00-03:00',
  'M006': '2026-06-14T00:00:00-03:00',
  'M007': '2026-06-13T21:00:00-03:00',
  'M008': '2026-06-13T15:00:00-03:00',
  'M009': '2026-06-14T22:00:00-03:00',
  'M010': '2026-06-14T15:00:00-03:00',
  'M011': '2026-06-14T18:00:00-03:00',
  'M012': '2026-06-14T23:00:00-03:00',
  'M013': '2026-06-15T21:00:00-03:00',
  'M014': '2026-06-15T15:00:00-03:00',
  'M015': '2026-06-15T21:00:00-03:00',
  'M016': '2026-06-15T15:00:00-03:00',
  'M017': '2026-06-16T18:00:00-03:00',
  'M018': '2026-06-16T21:00:00-03:00',
  'M019': '2026-06-16T23:00:00-03:00',
  'M020': '2026-06-17T00:00:00-03:00',
  'M021': '2026-06-17T22:00:00-03:00',
  'M022': '2026-06-17T18:00:00-03:00',
  'M023': '2026-06-17T15:00:00-03:00',
  'M024': '2026-06-17T23:00:00-03:00',
  'M025': '2026-06-18T15:00:00-03:00',
  'M026': '2026-06-18T15:00:00-03:00',
  'M027': '2026-06-18T18:00:00-03:00',
  'M028': '2026-06-18T22:00:00-03:00',
  'M029': '2026-06-19T23:30:00-03:00',
  'M030': '2026-06-19T21:00:00-03:00',
  'M031': '2026-06-19T23:00:00-03:00',
  'M032': '2026-06-19T15:00:00-03:00',
  'M033': '2026-06-20T19:00:00-03:00',
  'M034': '2026-06-20T22:00:00-03:00',
  'M035': '2026-06-20T15:00:00-03:00',
  'M036': '2026-06-21T01:00:00-03:00',
  'M037': '2026-06-21T21:00:00-03:00',
  'M038': '2026-06-21T15:00:00-03:00',
  'M039': '2026-06-21T15:00:00-03:00',
  'M040': '2026-06-21T21:00:00-03:00',
  'M041': '2026-06-22T23:00:00-03:00',
  'M042': '2026-06-22T20:00:00-03:00',
  'M043': '2026-06-22T15:00:00-03:00',
  'M044': '2026-06-22T23:00:00-03:00',
  'M045': '2026-06-23T19:00:00-03:00',
  'M046': '2026-06-23T22:00:00-03:00',
  'M047': '2026-06-23T15:00:00-03:00',
  'M048': '2026-06-23T23:00:00-03:00',
  'M049': '2026-06-24T21:00:00-03:00',
  'M050': '2026-06-24T21:00:00-03:00',
  'M051': '2026-06-24T15:00:00-03:00',
  'M052': '2026-06-24T15:00:00-03:00',
  'M053': '2026-06-24T22:00:00-03:00',
  'M054': '2026-06-24T22:00:00-03:00',
  'M055': '2026-06-25T19:00:00-03:00',
  'M056': '2026-06-25T19:00:00-03:00',
  'M057': '2026-06-25T21:00:00-03:00',
  'M058': '2026-06-25T21:00:00-03:00',
  'M059': '2026-06-25T22:00:00-03:00',
  'M060': '2026-06-25T22:00:00-03:00',
  'M061': '2026-06-26T18:00:00-03:00',
  'M062': '2026-06-26T18:00:00-03:00',
  'M063': '2026-06-26T23:00:00-03:00',
  'M064': '2026-06-26T23:00:00-03:00',
  'M065': '2026-06-26T22:00:00-03:00',
  'M066': '2026-06-26T21:00:00-03:00',
  'M067': '2026-06-27T20:00:00-03:00',
  'M068': '2026-06-27T20:00:00-03:00',
  'M069': '2026-06-28T00:00:00-03:00',
  'M070': '2026-06-28T00:00:00-03:00',
  'M071': '2026-06-27T22:30:00-03:00',
  'M072': '2026-06-27T22:30:00-03:00',
  'M073': '2026-06-28T16:00:00-03:00',
  'M074': '2026-06-29T17:30:00-03:00',
  'M075': '2026-06-29T22:00:00-03:00',
  'M076': '2026-06-29T14:00:00-03:00',
  'M077': '2026-06-30T18:00:00-03:00',
  'M078': '2026-06-30T14:00:00-03:00',
  'M079': '2026-06-30T22:00:00-03:00',
  'M080': '2026-07-01T13:00:00-03:00',
  'M081': '2026-07-01T21:00:00-03:00',
  'M082': '2026-07-01T17:00:00-03:00',
  'M083': '2026-07-02T20:00:00-03:00',
  'M084': '2026-07-02T16:00:00-03:00',
  'M085': '2026-07-03T00:00:00-03:00',
  'M086': '2026-07-03T19:00:00-03:00',
  'M087': '2026-07-03T22:30:00-03:00',
  'M088': '2026-07-03T15:00:00-03:00',
  'M089': '2026-07-04T20:00:00-03:00',
  'M090': '2026-07-04T15:00:00-03:00',
  'M091': '2026-07-05T19:00:00-03:00',
  'M092': '2026-07-05T21:00:00-03:00',
  'M093': '2026-07-06T17:00:00-03:00',
  'M094': '2026-07-06T20:00:00-03:00',
  'M095': '2026-07-07T15:00:00-03:00',
  'M096': '2026-07-07T16:00:00-03:00',
  'M097': '2026-07-09T19:00:00-03:00',
  'M098': '2026-07-10T15:00:00-03:00',
  'M099': '2026-07-11T20:00:00-03:00',
  'M100': '2026-07-11T23:00:00-03:00',
  'M101': '2026-07-14T17:00:00-03:00',
  'M102': '2026-07-15T18:00:00-03:00',
  'M103': '2026-07-18T20:00:00-03:00',
  'M104': '2026-07-19T18:00:00-03:00'
};
const PRODE_MATCHES_SOURCE_FALLBACK = [
  {
    "id": "M001",
    "fecha": "2026-06-11",
    "hora": "16:00",
    "instancia": "Grupos",
    "grupo": "Grupo A",
    "sede": "Mexico City",
    "equipo_local": "Mexico",
    "equipo_visitante": "South Africa",
    "start_iso": ""
  },
  {
    "id": "M002",
    "fecha": "2026-06-11",
    "hora": "23:00",
    "instancia": "Grupos",
    "grupo": "Grupo A",
    "sede": "Guadalajara",
    "equipo_local": "South Korea",
    "equipo_visitante": "Czechia",
    "start_iso": ""
  },
  {
    "id": "M003",
    "fecha": "2026-06-12",
    "hora": "18:00",
    "instancia": "Grupos",
    "grupo": "Grupo B",
    "sede": "Toronto",
    "equipo_local": "Canada",
    "equipo_visitante": "Bosnia and Herzegovina",
    "start_iso": ""
  },
  {
    "id": "M004",
    "fecha": "2026-06-12",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo B",
    "sede": "Los Angeles",
    "equipo_local": "United States",
    "equipo_visitante": "Paraguay",
    "start_iso": ""
  },
  {
    "id": "M005",
    "fecha": "2026-06-14",
    "hora": "00:00",
    "instancia": "Grupos",
    "grupo": "Grupo C",
    "sede": "Boston",
    "equipo_local": "Haiti",
    "equipo_visitante": "Scotland",
    "start_iso": ""
  },
  {
    "id": "M006",
    "fecha": "2026-06-14",
    "hora": "00:00",
    "instancia": "Grupos",
    "grupo": "Grupo C",
    "sede": "Vancouver",
    "equipo_local": "Australia",
    "equipo_visitante": "Turkey",
    "start_iso": ""
  },
  {
    "id": "M007",
    "fecha": "2026-06-13",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo D",
    "sede": "New York New Jersey",
    "equipo_local": "Brazil",
    "equipo_visitante": "Morocco",
    "start_iso": ""
  },
  {
    "id": "M008",
    "fecha": "2026-06-13",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo D",
    "sede": "San Francisco Bay Area",
    "equipo_local": "Qatar",
    "equipo_visitante": "Switzerland",
    "start_iso": ""
  },
  {
    "id": "M009",
    "fecha": "2026-06-14",
    "hora": "22:00",
    "instancia": "Grupos",
    "grupo": "Grupo E",
    "sede": "Philadelphia",
    "equipo_local": "Ivory Coast",
    "equipo_visitante": "Ecuador",
    "start_iso": ""
  },
  {
    "id": "M010",
    "fecha": "2026-06-14",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo E",
    "sede": "Houston",
    "equipo_local": "Germany",
    "equipo_visitante": "Curaçao",
    "start_iso": ""
  },
  {
    "id": "M011",
    "fecha": "2026-06-14",
    "hora": "18:00",
    "instancia": "Grupos",
    "grupo": "Grupo F",
    "sede": "Dallas",
    "equipo_local": "Netherlands",
    "equipo_visitante": "Japan",
    "start_iso": ""
  },
  {
    "id": "M012",
    "fecha": "2026-06-14",
    "hora": "23:00",
    "instancia": "Grupos",
    "grupo": "Grupo F",
    "sede": "Monterrey",
    "equipo_local": "Sweden",
    "equipo_visitante": "Tunisia",
    "start_iso": ""
  },
  {
    "id": "M013",
    "fecha": "2026-06-15",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo G",
    "sede": "Miami",
    "equipo_local": "Saudi Arabia",
    "equipo_visitante": "Uruguay",
    "start_iso": ""
  },
  {
    "id": "M014",
    "fecha": "2026-06-15",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo G",
    "sede": "Atlanta",
    "equipo_local": "Spain",
    "equipo_visitante": "Cape Verde",
    "start_iso": ""
  },
  {
    "id": "M015",
    "fecha": "2026-06-15",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo H",
    "sede": "Los Angeles",
    "equipo_local": "Iran",
    "equipo_visitante": "New Zealand",
    "start_iso": ""
  },
  {
    "id": "M016",
    "fecha": "2026-06-15",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo H",
    "sede": "Seattle",
    "equipo_local": "Belgium",
    "equipo_visitante": "Egypt",
    "start_iso": ""
  },
  {
    "id": "M017",
    "fecha": "2026-06-16",
    "hora": "18:00",
    "instancia": "Grupos",
    "grupo": "Grupo I",
    "sede": "New York New Jersey",
    "equipo_local": "France",
    "equipo_visitante": "Senegal",
    "start_iso": ""
  },
  {
    "id": "M018",
    "fecha": "2026-06-16",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo I",
    "sede": "Boston",
    "equipo_local": "Iraq",
    "equipo_visitante": "Norway",
    "start_iso": ""
  },
  {
    "id": "M019",
    "fecha": "2026-06-16",
    "hora": "23:00",
    "instancia": "Grupos",
    "grupo": "Grupo J",
    "sede": "Kansas City",
    "equipo_local": "Argentina",
    "equipo_visitante": "Algeria",
    "start_iso": ""
  },
  {
    "id": "M020",
    "fecha": "2026-06-17",
    "hora": "00:00",
    "instancia": "Grupos",
    "grupo": "Grupo J",
    "sede": "San Francisco Bay Area",
    "equipo_local": "Austria",
    "equipo_visitante": "Jordan",
    "start_iso": ""
  },
  {
    "id": "M021",
    "fecha": "2026-06-17",
    "hora": "22:00",
    "instancia": "Grupos",
    "grupo": "Grupo K",
    "sede": "Toronto",
    "equipo_local": "Ghana",
    "equipo_visitante": "Panama",
    "start_iso": ""
  },
  {
    "id": "M022",
    "fecha": "2026-06-17",
    "hora": "18:00",
    "instancia": "Grupos",
    "grupo": "Grupo K",
    "sede": "Dallas",
    "equipo_local": "England",
    "equipo_visitante": "Croatia",
    "start_iso": ""
  },
  {
    "id": "M023",
    "fecha": "2026-06-17",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo L",
    "sede": "Houston",
    "equipo_local": "Portugal",
    "equipo_visitante": "Congo DR",
    "start_iso": ""
  },
  {
    "id": "M024",
    "fecha": "2026-06-17",
    "hora": "23:00",
    "instancia": "Grupos",
    "grupo": "Grupo L",
    "sede": "Mexico City",
    "equipo_local": "Uzbekistan",
    "equipo_visitante": "Colombia",
    "start_iso": ""
  },
  {
    "id": "M025",
    "fecha": "2026-06-18",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo A",
    "sede": "Atlanta",
    "equipo_local": "Czechia",
    "equipo_visitante": "South Africa",
    "start_iso": ""
  },
  {
    "id": "M026",
    "fecha": "2026-06-18",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo A",
    "sede": "Los Angeles",
    "equipo_local": "Switzerland",
    "equipo_visitante": "Bosnia and Herzegovina",
    "start_iso": ""
  },
  {
    "id": "M027",
    "fecha": "2026-06-18",
    "hora": "18:00",
    "instancia": "Grupos",
    "grupo": "Grupo B",
    "sede": "Vancouver",
    "equipo_local": "Canada",
    "equipo_visitante": "Qatar",
    "start_iso": ""
  },
  {
    "id": "M028",
    "fecha": "2026-06-18",
    "hora": "22:00",
    "instancia": "Grupos",
    "grupo": "Grupo B",
    "sede": "Guadalajara",
    "equipo_local": "Mexico",
    "equipo_visitante": "South Korea",
    "start_iso": ""
  },
  {
    "id": "M029",
    "fecha": "2026-06-19",
    "hora": "23:30",
    "instancia": "Grupos",
    "grupo": "Grupo C",
    "sede": "Philadelphia",
    "equipo_local": "Brazil",
    "equipo_visitante": "Haiti",
    "start_iso": ""
  },
  {
    "id": "M030",
    "fecha": "2026-06-19",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo C",
    "sede": "Boston",
    "equipo_local": "Scotland",
    "equipo_visitante": "Morocco",
    "start_iso": ""
  },
  {
    "id": "M031",
    "fecha": "2026-06-19",
    "hora": "23:00",
    "instancia": "Grupos",
    "grupo": "Grupo D",
    "sede": "San Francisco Bay Area",
    "equipo_local": "Turkey",
    "equipo_visitante": "Paraguay",
    "start_iso": ""
  },
  {
    "id": "M032",
    "fecha": "2026-06-19",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo D",
    "sede": "Seattle",
    "equipo_local": "United States",
    "equipo_visitante": "Australia",
    "start_iso": ""
  },
  {
    "id": "M033",
    "fecha": "2026-06-20",
    "hora": "19:00",
    "instancia": "Grupos",
    "grupo": "Grupo E",
    "sede": "Toronto",
    "equipo_local": "Germany",
    "equipo_visitante": "Ivory Coast",
    "start_iso": ""
  },
  {
    "id": "M034",
    "fecha": "2026-06-20",
    "hora": "22:00",
    "instancia": "Grupos",
    "grupo": "Grupo E",
    "sede": "Kansas City",
    "equipo_local": "Ecuador",
    "equipo_visitante": "Curaçao",
    "start_iso": ""
  },
  {
    "id": "M035",
    "fecha": "2026-06-20",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo F",
    "sede": "Houston",
    "equipo_local": "Netherlands",
    "equipo_visitante": "Sweden",
    "start_iso": ""
  },
  {
    "id": "M036",
    "fecha": "2026-06-21",
    "hora": "01:00",
    "instancia": "Grupos",
    "grupo": "Grupo F",
    "sede": "Monterrey",
    "equipo_local": "Tunisia",
    "equipo_visitante": "Japan",
    "start_iso": ""
  },
  {
    "id": "M037",
    "fecha": "2026-06-21",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo G",
    "sede": "Miami",
    "equipo_local": "Uruguay",
    "equipo_visitante": "Cape Verde",
    "start_iso": ""
  },
  {
    "id": "M038",
    "fecha": "2026-06-21",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo G",
    "sede": "Atlanta",
    "equipo_local": "Spain",
    "equipo_visitante": "Saudi Arabia",
    "start_iso": ""
  },
  {
    "id": "M039",
    "fecha": "2026-06-21",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo H",
    "sede": "Los Angeles",
    "equipo_local": "Belgium",
    "equipo_visitante": "Iran",
    "start_iso": ""
  },
  {
    "id": "M040",
    "fecha": "2026-06-21",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo H",
    "sede": "Vancouver",
    "equipo_local": "New Zealand",
    "equipo_visitante": "Egypt",
    "start_iso": ""
  },
  {
    "id": "M041",
    "fecha": "2026-06-22",
    "hora": "23:00",
    "instancia": "Grupos",
    "grupo": "Grupo I",
    "sede": "New York New Jersey",
    "equipo_local": "Norway",
    "equipo_visitante": "Senegal",
    "start_iso": ""
  },
  {
    "id": "M042",
    "fecha": "2026-06-22",
    "hora": "20:00",
    "instancia": "Grupos",
    "grupo": "Grupo I",
    "sede": "Philadelphia",
    "equipo_local": "France",
    "equipo_visitante": "Iraq",
    "start_iso": ""
  },
  {
    "id": "M043",
    "fecha": "2026-06-22",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo J",
    "sede": "Dallas",
    "equipo_local": "Argentina",
    "equipo_visitante": "Austria",
    "start_iso": ""
  },
  {
    "id": "M044",
    "fecha": "2026-06-22",
    "hora": "23:00",
    "instancia": "Grupos",
    "grupo": "Grupo J",
    "sede": "San Francisco Bay Area",
    "equipo_local": "Jordan",
    "equipo_visitante": "Algeria",
    "start_iso": ""
  },
  {
    "id": "M045",
    "fecha": "2026-06-23",
    "hora": "19:00",
    "instancia": "Grupos",
    "grupo": "Grupo K",
    "sede": "Boston",
    "equipo_local": "England",
    "equipo_visitante": "Ghana",
    "start_iso": ""
  },
  {
    "id": "M046",
    "fecha": "2026-06-23",
    "hora": "22:00",
    "instancia": "Grupos",
    "grupo": "Grupo K",
    "sede": "Toronto",
    "equipo_local": "Panama",
    "equipo_visitante": "Croatia",
    "start_iso": ""
  },
  {
    "id": "M047",
    "fecha": "2026-06-23",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo L",
    "sede": "Houston",
    "equipo_local": "Portugal",
    "equipo_visitante": "Uzbekistan",
    "start_iso": ""
  },
  {
    "id": "M048",
    "fecha": "2026-06-23",
    "hora": "23:00",
    "instancia": "Grupos",
    "grupo": "Grupo L",
    "sede": "Guadalajara",
    "equipo_local": "Colombia",
    "equipo_visitante": "Congo DR",
    "start_iso": ""
  },
  {
    "id": "M049",
    "fecha": "2026-06-24",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo A",
    "sede": "Miami",
    "equipo_local": "Scotland",
    "equipo_visitante": "Brazil",
    "start_iso": ""
  },
  {
    "id": "M050",
    "fecha": "2026-06-24",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo A",
    "sede": "Atlanta",
    "equipo_local": "Morocco",
    "equipo_visitante": "Haiti",
    "start_iso": ""
  },
  {
    "id": "M051",
    "fecha": "2026-06-24",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo B",
    "sede": "Vancouver",
    "equipo_local": "Switzerland",
    "equipo_visitante": "Canada",
    "start_iso": ""
  },
  {
    "id": "M052",
    "fecha": "2026-06-24",
    "hora": "15:00",
    "instancia": "Grupos",
    "grupo": "Grupo B",
    "sede": "Seattle",
    "equipo_local": "Bosnia and Herzegovina",
    "equipo_visitante": "Qatar",
    "start_iso": ""
  },
  {
    "id": "M053",
    "fecha": "2026-06-24",
    "hora": "22:00",
    "instancia": "Grupos",
    "grupo": "Grupo C",
    "sede": "Mexico City",
    "equipo_local": "Czechia",
    "equipo_visitante": "Mexico",
    "start_iso": ""
  },
  {
    "id": "M054",
    "fecha": "2026-06-24",
    "hora": "22:00",
    "instancia": "Grupos",
    "grupo": "Grupo C",
    "sede": "Monterrey",
    "equipo_local": "South Africa",
    "equipo_visitante": "South Korea",
    "start_iso": ""
  },
  {
    "id": "M055",
    "fecha": "2026-06-25",
    "hora": "19:00",
    "instancia": "Grupos",
    "grupo": "Grupo D",
    "sede": "Philadelphia",
    "equipo_local": "Curaçao",
    "equipo_visitante": "Ivory Coast",
    "start_iso": ""
  },
  {
    "id": "M056",
    "fecha": "2026-06-25",
    "hora": "19:00",
    "instancia": "Grupos",
    "grupo": "Grupo D",
    "sede": "New York New Jersey",
    "equipo_local": "Ecuador",
    "equipo_visitante": "Germany",
    "start_iso": ""
  },
  {
    "id": "M057",
    "fecha": "2026-06-25",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo E",
    "sede": "Dallas",
    "equipo_local": "Japan",
    "equipo_visitante": "Sweden",
    "start_iso": ""
  },
  {
    "id": "M058",
    "fecha": "2026-06-25",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo E",
    "sede": "Kansas City",
    "equipo_local": "Tunisia",
    "equipo_visitante": "Netherlands",
    "start_iso": ""
  },
  {
    "id": "M059",
    "fecha": "2026-06-25",
    "hora": "22:00",
    "instancia": "Grupos",
    "grupo": "Grupo F",
    "sede": "Los Angeles",
    "equipo_local": "Turkey",
    "equipo_visitante": "United States",
    "start_iso": ""
  },
  {
    "id": "M060",
    "fecha": "2026-06-25",
    "hora": "22:00",
    "instancia": "Grupos",
    "grupo": "Grupo F",
    "sede": "San Francisco Bay Area",
    "equipo_local": "Paraguay",
    "equipo_visitante": "Australia",
    "start_iso": ""
  },
  {
    "id": "M061",
    "fecha": "2026-06-26",
    "hora": "18:00",
    "instancia": "Grupos",
    "grupo": "Grupo G",
    "sede": "Boston",
    "equipo_local": "Norway",
    "equipo_visitante": "France",
    "start_iso": ""
  },
  {
    "id": "M062",
    "fecha": "2026-06-26",
    "hora": "18:00",
    "instancia": "Grupos",
    "grupo": "Grupo G",
    "sede": "Toronto",
    "equipo_local": "Senegal",
    "equipo_visitante": "Iraq",
    "start_iso": ""
  },
  {
    "id": "M063",
    "fecha": "2026-06-26",
    "hora": "23:00",
    "instancia": "Grupos",
    "grupo": "Grupo H",
    "sede": "Seattle",
    "equipo_local": "Egypt",
    "equipo_visitante": "Iran",
    "start_iso": ""
  },
  {
    "id": "M064",
    "fecha": "2026-06-26",
    "hora": "23:00",
    "instancia": "Grupos",
    "grupo": "Grupo H",
    "sede": "Vancouver",
    "equipo_local": "New Zealand",
    "equipo_visitante": "Belgium",
    "start_iso": ""
  },
  {
    "id": "M065",
    "fecha": "2026-06-26",
    "hora": "22:00",
    "instancia": "Grupos",
    "grupo": "Grupo I",
    "sede": "Houston",
    "equipo_local": "Cape Verde",
    "equipo_visitante": "Saudi Arabia",
    "start_iso": ""
  },
  {
    "id": "M066",
    "fecha": "2026-06-26",
    "hora": "21:00",
    "instancia": "Grupos",
    "grupo": "Grupo I",
    "sede": "Guadalajara",
    "equipo_local": "Uruguay",
    "equipo_visitante": "Spain",
    "start_iso": ""
  },
  {
    "id": "M067",
    "fecha": "2026-06-27",
    "hora": "20:00",
    "instancia": "Grupos",
    "grupo": "Grupo J",
    "sede": "New York New Jersey",
    "equipo_local": "Panama",
    "equipo_visitante": "England",
    "start_iso": ""
  },
  {
    "id": "M068",
    "fecha": "2026-06-27",
    "hora": "20:00",
    "instancia": "Grupos",
    "grupo": "Grupo J",
    "sede": "Philadelphia",
    "equipo_local": "Croatia",
    "equipo_visitante": "Ghana",
    "start_iso": ""
  },
  {
    "id": "M069",
    "fecha": "2026-06-28",
    "hora": "00:00",
    "instancia": "Grupos",
    "grupo": "Grupo K",
    "sede": "Kansas City",
    "equipo_local": "Algeria",
    "equipo_visitante": "Austria",
    "start_iso": ""
  },
  {
    "id": "M070",
    "fecha": "2026-06-28",
    "hora": "00:00",
    "instancia": "Grupos",
    "grupo": "Grupo K",
    "sede": "Dallas",
    "equipo_local": "Jordan",
    "equipo_visitante": "Argentina",
    "start_iso": ""
  },
  {
    "id": "M071",
    "fecha": "2026-06-27",
    "hora": "22:30",
    "instancia": "Grupos",
    "grupo": "Grupo L",
    "sede": "Miami",
    "equipo_local": "Colombia",
    "equipo_visitante": "Portugal",
    "start_iso": ""
  },
  {
    "id": "M072",
    "fecha": "2026-06-27",
    "hora": "22:30",
    "instancia": "Grupos",
    "grupo": "Grupo L",
    "sede": "Atlanta",
    "equipo_local": "Congo DR",
    "equipo_visitante": "Uzbekistan",
    "start_iso": ""
  },
  {
    "id": "M073",
    "fecha": "2026-06-28",
    "hora": "16:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Los Angeles",
    "equipo_local": "South Africa",
    "equipo_visitante": "Canada",
    "start_iso": "2026-06-28T16:00:00-03:00"
  },
  {
    "id": "M074",
    "fecha": "2026-06-29",
    "hora": "17:30",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Boston",
    "equipo_local": "Germany",
    "equipo_visitante": "Paraguay",
    "start_iso": "2026-06-29T17:30:00-03:00"
  },
  {
    "id": "M075",
    "fecha": "2026-06-29",
    "hora": "22:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Monterrey",
    "equipo_local": "Netherlands",
    "equipo_visitante": "Morocco",
    "start_iso": "2026-06-29T22:00:00-03:00"
  },
  {
    "id": "M076",
    "fecha": "2026-06-29",
    "hora": "14:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Houston",
    "equipo_local": "Brazil",
    "equipo_visitante": "Japan",
    "start_iso": "2026-06-29T14:00:00-03:00"
  },
  {
    "id": "M077",
    "fecha": "2026-06-30",
    "hora": "18:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "New York New Jersey",
    "equipo_local": "France",
    "equipo_visitante": "Sweden",
    "start_iso": "2026-06-30T18:00:00-03:00"
  },
  {
    "id": "M078",
    "fecha": "2026-06-30",
    "hora": "14:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Dallas",
    "equipo_local": "Ivory Coast",
    "equipo_visitante": "Norway",
    "start_iso": "2026-06-30T14:00:00-03:00"
  },
  {
    "id": "M079",
    "fecha": "2026-06-30",
    "hora": "22:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Mexico City",
    "equipo_local": "Mexico",
    "equipo_visitante": "Ecuador",
    "start_iso": "2026-06-30T22:00:00-03:00"
  },
  {
    "id": "M080",
    "fecha": "2026-07-01",
    "hora": "13:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Atlanta",
    "equipo_local": "England",
    "equipo_visitante": "Congo DR",
    "start_iso": "2026-07-01T13:00:00-03:00"
  },
  {
    "id": "M081",
    "fecha": "2026-07-01",
    "hora": "21:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "San Francisco Bay Area",
    "equipo_local": "United States",
    "equipo_visitante": "Bosnia and Herzegovina",
    "start_iso": "2026-07-01T21:00:00-03:00"
  },
  {
    "id": "M082",
    "fecha": "2026-07-01",
    "hora": "17:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Seattle",
    "equipo_local": "Belgium",
    "equipo_visitante": "Senegal",
    "start_iso": "2026-07-01T17:00:00-03:00"
  },
  {
    "id": "M083",
    "fecha": "2026-07-02",
    "hora": "20:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Toronto",
    "equipo_local": "Portugal",
    "equipo_visitante": "Croatia",
    "start_iso": "2026-07-02T20:00:00-03:00"
  },
  {
    "id": "M084",
    "fecha": "2026-07-02",
    "hora": "16:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Los Angeles",
    "equipo_local": "Spain",
    "equipo_visitante": "Austria",
    "start_iso": "2026-07-02T16:00:00-03:00"
  },
  {
    "id": "M085",
    "fecha": "2026-07-03",
    "hora": "00:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Vancouver",
    "equipo_local": "Switzerland",
    "equipo_visitante": "Algeria",
    "start_iso": "2026-07-03T00:00:00-03:00"
  },
  {
    "id": "M086",
    "fecha": "2026-07-03",
    "hora": "19:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Miami",
    "equipo_local": "Argentina",
    "equipo_visitante": "Cape Verde",
    "start_iso": "2026-07-03T19:00:00-03:00"
  },
  {
    "id": "M087",
    "fecha": "2026-07-03",
    "hora": "22:30",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Kansas City",
    "equipo_local": "Colombia",
    "equipo_visitante": "Ghana",
    "start_iso": "2026-07-03T22:30:00-03:00"
  },
  {
    "id": "M088",
    "fecha": "2026-07-03",
    "hora": "15:00",
    "instancia": "32avos",
    "grupo": "",
    "sede": "Dallas",
    "equipo_local": "Australia",
    "equipo_visitante": "Egypt",
    "start_iso": "2026-07-03T15:00:00-03:00"
  },
  {
    "id": "M089",
    "fecha": "2026-07-04",
    "hora": "20:00",
    "instancia": "Octavos",
    "grupo": "",
    "sede": "Philadelphia",
    "equipo_local": "Ganador Partido 74",
    "equipo_visitante": "Ganador Partido 77",
    "start_iso": ""
  },
  {
    "id": "M090",
    "fecha": "2026-07-04",
    "hora": "15:00",
    "instancia": "Octavos",
    "grupo": "",
    "sede": "Houston",
    "equipo_local": "Ganador Partido 73",
    "equipo_visitante": "Ganador Partido 75",
    "start_iso": ""
  },
  {
    "id": "M091",
    "fecha": "2026-07-05",
    "hora": "19:00",
    "instancia": "Octavos",
    "grupo": "",
    "sede": "New York New Jersey",
    "equipo_local": "Ganador Partido 76",
    "equipo_visitante": "Ganador Partido 78",
    "start_iso": ""
  },
  {
    "id": "M092",
    "fecha": "2026-07-05",
    "hora": "21:00",
    "instancia": "Octavos",
    "grupo": "",
    "sede": "Mexico City",
    "equipo_local": "Ganador Partido 79",
    "equipo_visitante": "Ganador Partido 80",
    "start_iso": ""
  },
  {
    "id": "M093",
    "fecha": "2026-07-06",
    "hora": "17:00",
    "instancia": "Octavos",
    "grupo": "",
    "sede": "Dallas",
    "equipo_local": "Ganador Partido 83",
    "equipo_visitante": "Ganador Partido 84",
    "start_iso": ""
  },
  {
    "id": "M094",
    "fecha": "2026-07-06",
    "hora": "20:00",
    "instancia": "Octavos",
    "grupo": "",
    "sede": "Seattle",
    "equipo_local": "Ganador Partido 81",
    "equipo_visitante": "Ganador Partido 82",
    "start_iso": ""
  },
  {
    "id": "M095",
    "fecha": "2026-07-07",
    "hora": "15:00",
    "instancia": "Octavos",
    "grupo": "",
    "sede": "Atlanta",
    "equipo_local": "Ganador Partido 86",
    "equipo_visitante": "Ganador Partido 88",
    "start_iso": ""
  },
  {
    "id": "M096",
    "fecha": "2026-07-07",
    "hora": "16:00",
    "instancia": "Octavos",
    "grupo": "",
    "sede": "Vancouver",
    "equipo_local": "Ganador Partido 85",
    "equipo_visitante": "Ganador Partido 87",
    "start_iso": ""
  },
  {
    "id": "M097",
    "fecha": "2026-07-09",
    "hora": "19:00",
    "instancia": "Cuartos",
    "grupo": "",
    "sede": "Boston",
    "equipo_local": "Ganador Partido 89",
    "equipo_visitante": "Ganador Partido 90",
    "start_iso": ""
  },
  {
    "id": "M098",
    "fecha": "2026-07-10",
    "hora": "15:00",
    "instancia": "Cuartos",
    "grupo": "",
    "sede": "Los Angeles",
    "equipo_local": "Ganador Partido 93",
    "equipo_visitante": "Ganador Partido 94",
    "start_iso": ""
  },
  {
    "id": "M099",
    "fecha": "2026-07-11",
    "hora": "20:00",
    "instancia": "Cuartos",
    "grupo": "",
    "sede": "Miami",
    "equipo_local": "Ganador Partido 91",
    "equipo_visitante": "Ganador Partido 92",
    "start_iso": ""
  },
  {
    "id": "M100",
    "fecha": "2026-07-11",
    "hora": "23:00",
    "instancia": "Cuartos",
    "grupo": "",
    "sede": "Kansas City",
    "equipo_local": "Ganador Partido 95",
    "equipo_visitante": "Ganador Partido 96",
    "start_iso": ""
  },
  {
    "id": "M101",
    "fecha": "2026-07-14",
    "hora": "17:00",
    "instancia": "Semifinal",
    "grupo": "",
    "sede": "Dallas",
    "equipo_local": "Ganador Partido 97",
    "equipo_visitante": "Ganador Partido 98",
    "start_iso": ""
  },
  {
    "id": "M102",
    "fecha": "2026-07-15",
    "hora": "18:00",
    "instancia": "Semifinal",
    "grupo": "",
    "sede": "Atlanta",
    "equipo_local": "Ganador Partido 99",
    "equipo_visitante": "Ganador Partido 100",
    "start_iso": ""
  },
  {
    "id": "M103",
    "fecha": "2026-07-18",
    "hora": "20:00",
    "instancia": "Tercer puesto",
    "grupo": "",
    "sede": "Miami",
    "equipo_local": "Perdedor Partido 101",
    "equipo_visitante": "Perdedor Partido 102",
    "start_iso": ""
  },
  {
    "id": "M104",
    "fecha": "2026-07-19",
    "hora": "18:00",
    "instancia": "Final",
    "grupo": "",
    "sede": "New York New Jersey",
    "equipo_local": "Ganador Partido 101",
    "equipo_visitante": "Ganador Partido 102",
    "start_iso": ""
  }
];

const INVALID_ACCESS_CODE_ERROR = 'El codigo de acceso no es valido. Pediselo a la organizacion del Baby All Boys.';
const PARTIDO_GUARDADO_ERROR = 'Este pronostico ya fue guardado y no puede modificarse.';
const PARTIDO_CERRADO_ERROR = 'La carga para este partido ya cerro.';
const PARTIDO_SIN_HORARIO_ERROR = 'No se pudo validar el horario real de este partido.';
const PARTIDO_DISPONIBLE_ERROR = 'Disponible para cargar.';
const PARTIDO_INICIADO_ERROR = 'El partido ya comenzo.';
const RESULTADO_YA_CARGADO_ERROR = 'Este partido ya tiene un resultado cargado.';
const ADMIN_AUTH_ERROR = 'No tenes permiso para administrar resultados del Prode.';
const RESULTADO_SIGNO_INVALIDO_ERROR = 'El resultado_signo debe ser LOCAL, EMPATE o VISITANTE.';
const RESULTADO_KNOCKOUT_SIGNO_INVALIDO_ERROR = 'En eliminacion directa tenes que indicar que equipo clasifico.';
const RESULTADO_ESTADO_INVALIDO_ERROR = 'El estado_resultado debe ser FINAL o PENDIENTE.';
const RESULTADO_PARTIDO_REQUERIDO_ERROR = 'Falta resultado.partido_id.';
const MATCH_SOURCE_UNAVAILABLE_ERROR = 'No se pudo leer el fixture publico del Prode.';
const KNOCKOUT_MATCH_NOT_READY_ERROR = 'Este cruce todavia no tiene definidos sus dos equipos.';
const BRACKET_DEPENDENCY_LOCKED_ERROR = 'No se puede cambiar este clasificado porque ya existen pronosticos o resultados en la ronda siguiente.';
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

    if (
      action === ACTIONS.GET_BY_CODE ||
      action === ACTIONS.GET_OPEN_STAGE ||
      action === ACTIONS.GET_MATCH_RESULTS_ADMIN ||
      action === ACTIONS.GET_PUBLIC_RANKING ||
      action === ACTIONS.GET_PUBLIC_MATCHES
    ) {
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
    case ACTIONS.GET_MATCH_RESULTS_ADMIN:
      return handleGetMatchResultsAdmin_(ss, payload);
    case ACTIONS.SAVE_MATCH_RESULT:
      return handleSaveMatchResult_(ss, payload, now);
    case ACTIONS.GET_PUBLIC_RANKING:
      return handleGetPublicRanking_(ss, now);
    case ACTIONS.GET_PUBLIC_MATCHES:
      return handleGetPublicMatches_(ss, now);
    default:
      throw new Error('Accion no soportada');
  }
}

function handleCreateParticipantSubmission_(ss, payload, now) {
  const participante = normalizeParticipante_(payload && payload.participante);
  const pronosticos = normalizePronosticos_(payload && payload.pronosticos);
  const metadata = payload && payload.metadata ? payload.metadata : {};
  const timestamp = now.toISOString();
  const submissionId = safeString_(metadata.submission_id) || generateSubmissionId_();
  const userAgent = safeString_(metadata.user_agent);
  const requestStageId = derivePrimaryStageIdFromPredictions_(pronosticos) || safeString_(payload && payload.stage_id) || safeString_(metadata && metadata.stage_id);

  validateAccessCode_(payload);
  validateParticipante_(participante);
  validatePronosticos_(pronosticos);

  if (existsStrongDuplicate_(ss, participante)) {
    appendLog_(ss, [
      timestamp,
      'DUPLICATE_WITHOUT_CODE',
      DUPLICADO_CON_CODIGO_ERROR,
      safeJson_({ participante: participante, submission_id: submissionId, stage_id: requestStageId })
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
  const batchResult = buildPredictionBatchResult_(ss, generatedCode, requestStageId, submissionId, pronosticos, now);

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
      stage_id: batchResult.primary_stage_id,
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
    stage_id: batchResult.primary_stage_id,
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
  const scope = safeString_(payload && payload.scope);
  const stage = requestedStageId
    ? getStageById_(ss, requestedStageId)
    : getOpenStageRecord_(ss, true);
  const allPredictions = dedupePredictionsByParticipantMatch_(getPronosticosForParticipant_(ss, participant.participant_code));
  const predictions = (scope === 'all' || !requestedStageId)
    ? allPredictions
    : allPredictions.filter(function(row) {
      return normalizeStageIdForCompare_(row.stage_id) === normalizeStageIdForCompare_(requestedStageId);
    });
  const bundle = buildResolvedMatchesBundle_(ss);
  const scheduleMap = getMatchScheduleMap_();
  const matchesWithAvailability = bundle.matches.map(function(match) {
    return buildPublicMatchResponse_(match, bundle.resultsByMatch[match.partido_id] || null, scheduleMap, new Date());
  });

  return jsonResponse_({
    ok: true,
    participant: sanitizeParticipantResponse_(participant),
    stage: stage ? sanitizeStageResponse_(stage) : null,
    predictions: predictions.map(sanitizePronosticoResponse_),
    available_matches: matchesWithAvailability.filter(function(match) { return match.prediction_open; }),
    closed_matches: matchesWithAvailability.filter(function(match) { return !match.prediction_open && match.prediction_status_code !== 'MATCH_NOT_READY'; }),
    not_ready_matches: matchesWithAvailability.filter(function(match) { return match.prediction_status_code === 'MATCH_NOT_READY'; }),
    readonly_message: ''
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

  const pronosticos = normalizePronosticos_(payload && payload.pronosticos);
  const timestamp = now.toISOString();
  const submissionId = safeString_(metadata.submission_id) || generateSubmissionId_();
  const requestStageId = derivePrimaryStageIdFromPredictions_(pronosticos) || safeString_(payload && payload.stage_id) || safeString_(metadata && metadata.stage_id);

  validateAccessCode_(payload);
  validatePronosticos_(pronosticos);
  const batchResult = buildPredictionBatchResult_(ss, participant.participant_code, requestStageId, submissionId, pronosticos, now);
  appendPronosticos_(ss, batchResult.rowsToAppend);
  if (batchResult.saved_count > 0) {
    updateParticipantTimestamp_(ss, participant.__rowNumber, timestamp);
  }

  appendLog_(ss, [
    timestamp,
      'UPDATE_OK',
      'Pronosticos actualizados por partido',
      safeJson_({
        participant_code: participant.participant_code,
        submission_id: submissionId,
        stage_id: batchResult.primary_stage_id,
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
    stage_id: batchResult.primary_stage_id,
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

function handleGetMatchResultsAdmin_(ss, payload) {
  validateResultsAdminToken_(payload);
  const bundle = buildResolvedMatchesBundle_(ss);

  return jsonResponse_({
    ok: true,
    generated_at: new Date().toISOString(),
    matches: bundle.matches.map(function(match) {
      return sanitizeMatchResultAdminResponse_(match, bundle.resultsByMatch[match.partido_id] || null);
    })
  });
}

function handleSaveMatchResult_(ss, payload, now) {
  validateResultsAdminToken_(payload);
  const result = normalizeResultadoProde_(payload && (payload.resultado || payload));
  validateResultadoProde_(result);
  const expectedStageId = stageIdFromMatchId_(result.partido_id);
  if (!expectedStageId) {
    throw new Error(RESULTADO_PARTIDO_REQUERIDO_ERROR);
  }
  result.stage_id = expectedStageId;
  if (isKnockoutMatchId_(result.partido_id) && result.resultado_signo === 'EMPATE') {
    throw new Error(RESULTADO_KNOCKOUT_SIGNO_INVALIDO_ERROR);
  }
  const timestamp = now.toISOString();
  const updatedBy = safeString_(
    (payload && payload.metadata && payload.metadata.updated_by) ||
    payload && payload.updated_by ||
    'admin-prode-resultados'
  );
  const fuente = safeString_(payload && payload.fuente) || safeString_(payload && payload.metadata && payload.metadata.fuente) || 'carga_admin_manual';
  const existingResult = buildResultadosByMatch_(ss)[result.partido_id] || null;
  if (existingResult && existingResult.resultado_signo && existingResult.resultado_signo !== result.resultado_signo) {
    const descendants = getBracketDescendantMatchIds_(result.partido_id);
    if (descendants.length) {
      const hasDependentPredictions = getPronosticosRecords_(ss).some(function(row) {
        return descendants.indexOf(row.partido_id) >= 0;
      });
      const hasDependentResults = getResultadosProdeRecords_(ss).some(function(row) {
        return descendants.indexOf(row.partido_id) >= 0 && row.estado_resultado === 'FINAL' && row.resultado_signo;
      });
      if (hasDependentPredictions || hasDependentResults) {
        throw new Error(BRACKET_DEPENDENCY_LOCKED_ERROR);
      }
    }
  }

  const bundleBefore = buildResolvedMatchesBundle_(ss);
  const matchBefore = bundleBefore.matchesById[result.partido_id] || null;
  if (isKnockoutMatchId_(result.partido_id) && (!matchBefore || !matchBefore.match_ready)) {
    throw new Error(KNOCKOUT_MATCH_NOT_READY_ERROR);
  }
  const normalizedRow = {
    partido_id: result.partido_id,
    stage_id: result.stage_id,
    resultado_signo: result.resultado_signo,
    goles_local: result.goles_local,
    goles_visitante: result.goles_visitante,
    estado_resultado: result.estado_resultado,
    updated_at: timestamp,
    updated_by: updatedBy,
    fuente: fuente
  };
  const mode = upsertResultadoProde_(ss, normalizedRow);
  syncAutomaticStages_(ss, now);
  const bundleAfter = buildResolvedMatchesBundle_(ss);
  const immediateDependencies = getDirectBracketDependencies_(result.partido_id).map(function(item) {
    const target = bundleAfter.matchesById[item.target_match_id] || null;
    return {
      partido_id: item.target_match_id,
      outcome: item.outcome,
      equipo_local: target ? target.equipo_local : '',
      equipo_visitante: target ? target.equipo_visitante : ''
    };
  });
  const classifiedTeam = getResolvedOutcomeTeam_(matchBefore, result.resultado_signo, 'WINNER');

  appendLog_(ss, [
    timestamp,
    'RESULTADO_' + mode.toUpperCase(),
    'Resultado del Prode guardado',
    safeJson_(normalizedRow)
  ]);

  return jsonResponse_({
    ok: true,
    mode: mode,
    result: normalizedRow,
    classified_team: classifiedTeam,
    affected_matches: immediateDependencies
  });
}

function handleGetPublicRanking_(ss, now) {
  const rankingBundle = buildPublicRankingBundle_(ss, now);
  return jsonResponse_(rankingBundle);
}

function handleGetPublicMatches_(ss, now) {
  const bundle = buildResolvedMatchesBundle_(ss);
  const stage = getOpenStageRecord_(ss, true);
  const scheduleMap = getMatchScheduleMap_();
  return jsonResponse_({
    ok: true,
    generated_at: (now || new Date()).toISOString(),
    open_stage: stage ? sanitizeStageResponse_(stage) : null,
    match_cutoff_minutes: MATCH_CUTOFF_MINUTES,
    matches: bundle.matches.map(function(match) {
      return buildPublicMatchResponse_(match, bundle.resultsByMatch[match.partido_id] || null, scheduleMap, now || new Date());
    })
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
  ensureExactHeaderRow_(getOrCreateSheet_(ss, SHEET_NAMES.RESULTADOS_PRODE), HEADERS.ResultadosProde, SHEET_NAMES.RESULTADOS_PRODE);
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

function normalizeResultadoEstado_(value) {
  const raw = safeString_(value).toUpperCase();
  if (raw === 'FINAL') return 'FINAL';
  if (raw === 'PENDIENTE') return 'PENDIENTE';
  return '';
}

function normalizeResultadoProde_(item) {
  const result = item || {};
  return {
    partido_id: safeString_(result.partido_id),
    stage_id: safeString_(result.stage_id),
    resultado_signo: normalizeSign_(result.resultado_signo || result.sign),
    goles_local: safeString_(result.goles_local),
    goles_visitante: safeString_(result.goles_visitante),
    estado_resultado: normalizeResultadoEstado_(result.estado_resultado || result.estado) || 'FINAL'
  };
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

function validateResultsAdminToken_(payload) {
  const configuredToken = safeString_(PropertiesService.getScriptProperties().getProperty(ADMIN_RESULTS_TOKEN_PROPERTY));
  if (!configuredToken) {
    throw new Error(ADMIN_AUTH_ERROR + ' Configura ' + ADMIN_RESULTS_TOKEN_PROPERTY + ' en Script Properties.');
  }
  const providedToken = safeString_(
    (payload && payload.admin_token) ||
    (payload && payload.metadata && payload.metadata.admin_token)
  );
  if (compareKey_(providedToken) !== compareKey_(configuredToken)) {
    throw new Error(ADMIN_AUTH_ERROR);
  }
}

function validateResultadoProde_(result) {
  if (!result.partido_id) throw new Error(RESULTADO_PARTIDO_REQUERIDO_ERROR);
  if (!result.stage_id) throw new Error('Falta resultado.stage_id.');
  if (!result.estado_resultado) throw new Error(RESULTADO_ESTADO_INVALIDO_ERROR);
  if (result.estado_resultado === 'FINAL' && !result.resultado_signo) {
    throw new Error(RESULTADO_SIGNO_INVALIDO_ERROR);
  }
  if (result.estado_resultado !== 'FINAL' && result.estado_resultado !== 'PENDIENTE') {
    throw new Error(RESULTADO_ESTADO_INVALIDO_ERROR);
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

function getResultadosProdeRecords_(ss) {
  const sheet = getOrCreateSheet_(ss, SHEET_NAMES.RESULTADOS_PRODE);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, HEADERS.ResultadosProde.length).getValues().map(function(row, index) {
    return {
      __rowNumber: index + 2,
      partido_id: safeString_(row[0]),
      stage_id: safeString_(row[1]),
      resultado_signo: normalizeSign_(row[2]),
      goles_local: safeString_(row[3]),
      goles_visitante: safeString_(row[4]),
      estado_resultado: normalizeResultadoEstado_(row[5]) || 'PENDIENTE',
      updated_at: safeString_(row[6]),
      updated_by: safeString_(row[7]),
      fuente: safeString_(row[8])
    };
  }).filter(function(row) {
    return row.partido_id;
  });
}

function getEtapasRecords_(ss) {
  const sheet = getOrCreateSheet_(ss, SHEET_NAMES.ETAPAS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, HEADERS.Etapas.length).getValues().map(function(row, index) {
    return {
      __rowNumber: index + 2,
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

function upsertResultadoProde_(ss, result) {
  const sheet = getOrCreateSheet_(ss, SHEET_NAMES.RESULTADOS_PRODE);
  const existing = getResultadosProdeRecords_(ss).find(function(row) {
    return row.partido_id === result.partido_id;
  });
  const values = [[
    result.partido_id,
    result.stage_id,
    result.resultado_signo,
    result.goles_local,
    result.goles_visitante,
    result.estado_resultado,
    result.updated_at,
    result.updated_by,
    result.fuente
  ]];

  if (existing) {
    sheet.getRange(existing.__rowNumber, 1, 1, HEADERS.ResultadosProde.length).setValues(values);
    return 'updated';
  }

  sheet.getRange(sheet.getLastRow() + 1, 1, 1, HEADERS.ResultadosProde.length).setValues(values);
  return 'created';
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

function getPronosticosForParticipant_(ss, participantCode) {
  return getPronosticosRecords_(ss).filter(function(row) {
    return row.participant_code === participantCode;
  });
}

function parseSortableDateMs_(value) {
  const safeValue = safeString_(value);
  if (!safeValue) return null;
  const millis = new Date(safeValue).getTime();
  return isFinite(millis) ? millis : null;
}

function shouldPreferPredictionRow_(candidate, current) {
  if (!current) return true;
  const candidateMs = parseSortableDateMs_(candidate && candidate.created_at);
  const currentMs = parseSortableDateMs_(current && current.created_at);
  if (candidateMs !== null && currentMs !== null) {
    if (candidateMs !== currentMs) return candidateMs < currentMs;
  } else if (candidateMs !== null && currentMs === null) {
    return true;
  } else if (candidateMs === null && currentMs !== null) {
    return false;
  }
  return Number(candidate && candidate.__rowNumber) < Number(current && current.__rowNumber);
}

function dedupePredictionsByParticipantMatch_(rows) {
  const preferredByKey = {};
  (rows || []).forEach(function(row) {
    const participantCode = safeString_(row && row.participant_code);
    const matchId = safeString_(row && row.partido_id);
    if (!participantCode || !matchId) return;
    const key = participantCode + '::' + matchId;
    if (shouldPreferPredictionRow_(row, preferredByKey[key])) {
      preferredByKey[key] = row;
    }
  });
  return Object.keys(preferredByKey).sort(function(a, b) {
    return Number(preferredByKey[a].__rowNumber) - Number(preferredByKey[b].__rowNumber);
  }).map(function(key) {
    return preferredByKey[key];
  });
}

function derivePrimaryStageIdFromPredictions_(pronosticos) {
  var items = Array.isArray(pronosticos) ? pronosticos : [];
  for (var i = 0; i < items.length; i += 1) {
    var stageId = stageIdFromMatchId_(items[i] && items[i].partido_id);
    if (stageId) return stageId;
  }
  return '';
}

function buildResultadosByMatch_(ss) {
  return getResultadosProdeRecords_(ss).reduce(function(acc, row) {
    acc[row.partido_id] = row;
    return acc;
  }, {});
}

function buildPredictionBatchResult_(ss, participantCode, stageId, submissionId, pronosticos, now) {
  const timestamp = now.toISOString();
  const existingRows = getPronosticosForParticipant_(ss, participantCode);
  const existingByMatch = existingRows.reduce(function(acc, row) {
    if (row.partido_id && shouldPreferPredictionRow_(row, acc[row.partido_id])) {
      acc[row.partido_id] = row;
    }
    return acc;
  }, {});
  const scheduleMap = getMatchScheduleMap_();
  const resolvedBundle = buildResolvedMatchesBundle_(ss);
  const rowsToAppend = [];
  const savedPredictions = [];
  const blockedPredictions = [];
  const primaryStageId = derivePrimaryStageIdFromPredictions_(pronosticos) || stageId;

  pronosticos.forEach(function(pronostico) {
    const existingRow = existingByMatch[pronostico.partido_id];
    if (existingRow) {
      blockedPredictions.push(buildBlockedPredictionResponse_(pronostico, 'PREDICTION_ALREADY_LOCKED', PARTIDO_GUARDADO_ERROR, existingRow));
      return;
    }

    const match = resolvedBundle.matchesById[pronostico.partido_id];
    const resolvedStageId = stageIdFromMatchId_(pronostico.partido_id) || stageId;
    if (isKnockoutMatchId_(pronostico.partido_id)) {
      if (pronostico.sign === 'EMPATE') {
        blockedPredictions.push(buildBlockedPredictionResponse_(pronostico, 'INVALID_KNOCKOUT_RESULT', RESULTADO_KNOCKOUT_SIGNO_INVALIDO_ERROR, null));
        return;
      }
    }

    const availability = buildMatchPredictionAvailability_(match, resolvedBundle.resultsByMatch[pronostico.partido_id] || null, scheduleMap, now);
    if (availability.prediction_status_code === 'MATCH_NOT_READY') {
      blockedPredictions.push(buildBlockedPredictionResponse_(pronostico, 'KNOCKOUT_MATCH_NOT_READY', KNOCKOUT_MATCH_NOT_READY_ERROR, null, availability));
      return;
    }
    if (availability.prediction_status_code === 'MATCH_TIME_MISSING') {
      blockedPredictions.push(buildBlockedPredictionResponse_(pronostico, 'MATCH_TIME_MISSING', PARTIDO_SIN_HORARIO_ERROR, null, availability));
      return;
    }
    if (!availability.prediction_open) {
      blockedPredictions.push(buildBlockedPredictionResponse_(pronostico, 'MATCH_CLOSED', availability.prediction_status_text || PARTIDO_CERRADO_ERROR, null, availability));
      return;
    }

    const row = [
      participantCode,
      submissionId,
      resolvedStageId,
      pronostico.partido_id,
      pronostico.equipo_local,
      pronostico.equipo_visitante,
      pronostico.sign,
      timestamp,
      timestamp
    ];
    rowsToAppend.push(row);
    existingByMatch[pronostico.partido_id] = {
      participant_code: participantCode,
      partido_id: pronostico.partido_id,
      stage_id: resolvedStageId,
      sign: pronostico.sign,
      created_at: timestamp,
      updated_at: timestamp,
      __rowNumber: Number.MAX_SAFE_INTEGER
    };
    savedPredictions.push({
      participant_code: participantCode,
      submission_id: submissionId,
      stage_id: resolvedStageId,
      partido_id: pronostico.partido_id,
      equipo_local: pronostico.equipo_local,
      equipo_visitante: pronostico.equipo_visitante,
      sign: pronostico.sign,
      code: 'SAVED',
      public_status: 'Pronostico guardado',
      created_at: timestamp,
      updated_at: timestamp,
      cutoff_at: availability.cutoff_at,
      match_start_at: availability.match_start_at
    });
  });

  return {
    rowsToAppend: rowsToAppend,
    saved_predictions: savedPredictions,
    blocked_predictions: blockedPredictions,
    saved_count: savedPredictions.length,
    blocked_count: blockedPredictions.length,
    primary_stage_id: primaryStageId
  };
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

function buildMatchIdRange_(from, to) {
  var ids = [];
  for (var i = from; i <= to; i += 1) {
    ids.push('M' + ('000' + i).slice(-3));
  }
  return ids;
}

function stageIdFromMatchId_(matchId) {
  var id = safeString_(matchId).toUpperCase();
  if (!id) return '';
  var number = Number(id.replace(/^M/, ''));
  if (!Number.isFinite(number)) return '';
  if (number >= 1 && number <= 72) return 'grupos';
  if (number >= 73 && number <= 88) return '32avos';
  if (number >= 89 && number <= 96) return 'octavos';
  if (number >= 97 && number <= 100) return 'cuartos';
  if (number >= 101 && number <= 102) return 'semifinales';
  if (number >= 103 && number <= 104) return 'finales';
  return '';
}

function isKnockoutMatchId_(matchId) {
  var stageId = stageIdFromMatchId_(matchId);
  return !!stageId && stageId !== 'grupos';
}

function isKnockoutStageId_(stageId) {
  var normalized = normalizeStageIdForCompare_(stageId);
  return normalized && normalized !== 'grupos';
}

function buildBracketPlaceholder_(matchId, outcome) {
  var number = safeString_(matchId).replace(/^M/, '');
  var label = outcome === 'LOSER' ? 'Perdedor Partido ' : 'Ganador Partido ';
  return label + String(Number(number) || number);
}

function isResolvedKnockoutTeam_(teamName) {
  var normalized = compareKey_(teamName);
  if (!normalized) return false;
  return !(
    normalized.indexOf('ganadorpartido') === 0 ||
    normalized.indexOf('perdedorpartido') === 0 ||
    normalized.indexOf('ganadorgrupo') === 0 ||
    normalized.indexOf('segundogrupo') === 0 ||
    normalized.indexOf('mejortercero') === 0 ||
    normalized.indexOf('pendiente') >= 0 ||
    normalized === 'tbd'
  );
}

function getResolvedOutcomeTeam_(match, resultSign, outcome) {
  if (!match || !resultSign) return '';
  var winner = resultSign === 'LOCAL' ? safeString_(match.equipo_local) : safeString_(match.equipo_visitante);
  var loser = resultSign === 'LOCAL' ? safeString_(match.equipo_visitante) : safeString_(match.equipo_local);
  return outcome === 'LOSER' ? loser : winner;
}

function resolveBracketSourceTeam_(matchesById, resultsByMatch, sourceMatchId, outcome) {
  var match = matchesById[sourceMatchId];
  var result = resultsByMatch[sourceMatchId];
  if (!match || !result || result.estado_resultado !== 'FINAL' || !result.resultado_signo) {
    return buildBracketPlaceholder_(sourceMatchId, outcome);
  }
  var resolved = getResolvedOutcomeTeam_(match, result.resultado_signo, outcome);
  return resolved || buildBracketPlaceholder_(sourceMatchId, outcome);
}

function cloneMatchRecord_(match) {
  return JSON.parse(JSON.stringify(match || {}));
}

function resolveKnockoutBracket_(matches, resultsByMatch) {
  var resolvedMatches = (matches || []).map(cloneMatchRecord_);
  var matchesById = resolvedMatches.reduce(function(acc, match) {
    var matchId = safeString_(match && (match.partido_id || match.id));
    if (matchId) {
      match.partido_id = matchId;
      match.id = matchId;
      match.stage_id = stageIdFromMatchId_(matchId);
      acc[matchId] = match;
    }
    return acc;
  }, {});

  Object.keys(PRODE_KNOCKOUT_BRACKET).forEach(function(targetMatchId) {
    var target = matchesById[targetMatchId];
    var config = PRODE_KNOCKOUT_BRACKET[targetMatchId];
    if (!target || !config) return;
    target.equipo_local = resolveBracketSourceTeam_(matchesById, resultsByMatch, config.source_local_match_id, config.source_local_outcome);
    target.equipo_visitante = resolveBracketSourceTeam_(matchesById, resultsByMatch, config.source_visitante_match_id, config.source_visitante_outcome);
    target.bracket_sources = config;
    target.match_ready = isResolvedKnockoutTeam_(target.equipo_local) && isResolvedKnockoutTeam_(target.equipo_visitante);
  });

  return resolvedMatches;
}

function buildResolvedMatchesBundle_(ss) {
  var resultsByMatch = buildResultadosByMatch_(ss);
  var sourceMatches = getMatchesSourceRecords_();
  var resolvedMatches = resolveKnockoutBracket_(sourceMatches, resultsByMatch).map(function(match) {
    match.stage_id = stageIdFromMatchId_(match.partido_id || match.id);
    match.match_ready = isKnockoutMatchId_(match.partido_id || match.id)
      ? isResolvedKnockoutTeam_(match.equipo_local) && isResolvedKnockoutTeam_(match.equipo_visitante)
      : true;
    return match;
  });
  return {
    matches: resolvedMatches,
    resultsByMatch: resultsByMatch,
    matchesById: resolvedMatches.reduce(function(acc, match) {
      acc[match.partido_id] = match;
      return acc;
    }, {})
  };
}

function getDirectBracketDependencies_(matchId) {
  return Object.keys(PRODE_KNOCKOUT_BRACKET).reduce(function(acc, targetMatchId) {
    var config = PRODE_KNOCKOUT_BRACKET[targetMatchId];
    if (config.source_local_match_id === matchId) {
      acc.push({ target_match_id: targetMatchId, outcome: config.source_local_outcome });
    }
    if (config.source_visitante_match_id === matchId) {
      acc.push({ target_match_id: targetMatchId, outcome: config.source_visitante_outcome });
    }
    return acc;
  }, []);
}

function getBracketDescendantMatchIds_(matchId) {
  var seen = {};
  var queue = [safeString_(matchId)];
  while (queue.length) {
    var current = queue.shift();
    getDirectBracketDependencies_(current).forEach(function(item) {
      if (!seen[item.target_match_id]) {
        seen[item.target_match_id] = true;
        queue.push(item.target_match_id);
      }
    });
  }
  return Object.keys(seen);
}

function getMatchScheduleMap_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(MATCH_SCHEDULE_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      // sigue a fetch
    }
  }

  try {
    const response = UrlFetchApp.fetch(PRODE_MATCHES_SOURCE_URL, {
      muteHttpExceptions: true,
      headers: {
        Accept: 'application/json'
      }
    });
    if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
      throw new Error('HTTP ' + response.getResponseCode());
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

    if (Object.keys(scheduleMap).length) {
      cache.put(MATCH_SCHEDULE_CACHE_KEY, JSON.stringify(scheduleMap), MATCHES_SOURCE_CACHE_SECONDS);
      return scheduleMap;
    }
  } catch (error) {
    // cae al fallback embebido
  }
  return PRODE_MATCH_SCHEDULE_FALLBACK;
}

function getMatchesSourceRecords_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(MATCHES_LIST_CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    } catch (error) {
      // sigue a fetch
    }
  }

  try {
    const response = UrlFetchApp.fetch(PRODE_MATCHES_SOURCE_URL, {
      muteHttpExceptions: true,
      headers: {
        Accept: 'application/json'
      }
    });
    if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
      throw new Error('HTTP ' + response.getResponseCode());
    }

    const items = JSON.parse(response.getContentText() || '[]');
    const matches = Array.isArray(items) ? items.map(normalizeMatchSourceRecord_).filter(function(item) {
      return item.partido_id;
    }) : [];

    if (matches.length) {
      cache.put(MATCHES_LIST_CACHE_KEY, JSON.stringify(matches), MATCHES_SOURCE_CACHE_SECONDS);
      return matches;
    }
  } catch (error) {
    // sigue al fallback embebido
  }

  const fallbackMatches = getMatchesFallbackRecords_();
  if (fallbackMatches.length) {
    cache.put(MATCHES_LIST_CACHE_KEY, JSON.stringify(fallbackMatches), MATCHES_SOURCE_CACHE_SECONDS);
    return fallbackMatches;
  }

  throw new Error(MATCH_SOURCE_UNAVAILABLE_ERROR);
}

function getMatchesFallbackRecords_() {
  if (!Array.isArray(PRODE_MATCHES_SOURCE_FALLBACK) || !PRODE_MATCHES_SOURCE_FALLBACK.length) {
    return [];
  }
  return PRODE_MATCHES_SOURCE_FALLBACK.map(normalizeMatchSourceRecord_).filter(function(item) {
    return item.partido_id && item.fecha && item.hora && item.equipo_local && item.equipo_visitante;
  });
}

function normalizeMatchSourceRecord_(item) {
  const partidoId = safeString_(item && (item.partido_id || item.id));
  const normalized = {
    partido_id: partidoId,
    id: partidoId,
    fecha: safeString_(item && item.fecha),
    hora: safeString_(item && item.hora),
    instancia: safeString_(item && item.instancia),
    grupo: safeString_(item && item.grupo),
    sede: safeString_(item && item.sede),
    equipo_local: safeString_(item && (item.equipo_local || item.local)),
    equipo_visitante: safeString_(item && (item.equipo_visitante || item.visitante)),
    start_iso: safeString_(item && item.start_iso)
  };

  if (!normalized.start_iso) {
    normalized.start_iso = buildMatchStartIsoFromSource_(normalized);
  }

  normalized.stage_id = stageIdFromMatchId_(partidoId);
  normalized.match_ready = !isKnockoutMatchId_(partidoId) || (isResolvedKnockoutTeam_(normalized.equipo_local) && isResolvedKnockoutTeam_(normalized.equipo_visitante));

  return normalized;
}

function buildMatchStartIsoFromSource_(item) {
  const startIso = safeString_(item && item.start_iso);
  if (startIso) return startIso;
  const fecha = safeString_(item && item.fecha);
  const hora = safeString_(item && item.hora);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return '';
  const match = hora.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  const hours = String(Math.max(0, Math.min(23, Number(match[1])))).padStart(2, '0');
  const minutes = String(Math.max(0, Math.min(59, Number(match[2])))).padStart(2, '0');
  return fecha + 'T' + hours + ':' + minutes + ':00-03:00';
}

function getMatchTimingWindow_(scheduleMap, partidoId) {
  const matchStartAt = safeString_(scheduleMap && scheduleMap[partidoId]);
  const startDate = parseIsoDate_(matchStartAt);
  if (!startDate) {
    return {
      match_start_at: '',
      cutoff_at: '',
      start_date: null,
      cutoff_date: null
    };
  }
  const cutoffDate = new Date(startDate.getTime() - MATCH_CUTOFF_MINUTES * 60 * 1000);
  return {
    match_start_at: startDate.toISOString(),
    cutoff_at: cutoffDate.toISOString(),
    start_date: startDate,
    cutoff_date: cutoffDate
  };
}

function buildMatchPredictionAvailability_(match, resultRow, scheduleMap, now) {
  const referenceNow = now || new Date();
  const partidoId = safeString_(match && (match.partido_id || match.id));
  const timing = getMatchTimingWindow_(scheduleMap, partidoId);
  const resultLoaded = !!(resultRow && resultRow.estado_resultado === 'FINAL' && resultRow.resultado_signo);
  const matchReady = !!(match && match.match_ready);

  if (!matchReady) {
    return {
      match_ready: false,
      match_start_at: timing.match_start_at,
      cutoff_at: timing.cutoff_at,
      prediction_open: false,
      prediction_status_code: 'MATCH_NOT_READY',
      prediction_status_text: KNOCKOUT_MATCH_NOT_READY_ERROR,
      resultado_cargado: resultLoaded
    };
  }

  if (!timing.start_date || !timing.cutoff_date) {
    return {
      match_ready: true,
      match_start_at: '',
      cutoff_at: '',
      prediction_open: false,
      prediction_status_code: 'MATCH_TIME_MISSING',
      prediction_status_text: PARTIDO_SIN_HORARIO_ERROR,
      resultado_cargado: resultLoaded
    };
  }

  if (resultLoaded) {
    return {
      match_ready: true,
      match_start_at: timing.match_start_at,
      cutoff_at: timing.cutoff_at,
      prediction_open: false,
      prediction_status_code: 'RESULT_ALREADY_LOADED',
      prediction_status_text: RESULTADO_YA_CARGADO_ERROR,
      resultado_cargado: true
    };
  }

  if (referenceNow.getTime() >= timing.start_date.getTime()) {
    return {
      match_ready: true,
      match_start_at: timing.match_start_at,
      cutoff_at: timing.cutoff_at,
      prediction_open: false,
      prediction_status_code: 'ALREADY_STARTED',
      prediction_status_text: PARTIDO_INICIADO_ERROR,
      resultado_cargado: false
    };
  }

  if (referenceNow.getTime() >= timing.cutoff_date.getTime()) {
    return {
      match_ready: true,
      match_start_at: timing.match_start_at,
      cutoff_at: timing.cutoff_at,
      prediction_open: false,
      prediction_status_code: 'CUTOFF_REACHED',
      prediction_status_text: PARTIDO_CERRADO_ERROR,
      resultado_cargado: false
    };
  }

  return {
    match_ready: true,
    match_start_at: timing.match_start_at,
    cutoff_at: timing.cutoff_at,
    prediction_open: true,
    prediction_status_code: 'AVAILABLE',
    prediction_status_text: PARTIDO_DISPONIBLE_ERROR,
    resultado_cargado: false
  };
}

function buildPublicMatchResponse_(match, resultRow, scheduleMap, now) {
  const availability = buildMatchPredictionAvailability_(match, resultRow, scheduleMap, now);
  return {
    partido_id: match.partido_id,
    id: match.partido_id,
    stage_id: match.stage_id,
    fecha: match.fecha,
    hora: match.hora,
    instancia: match.instancia,
    grupo: match.grupo,
    sede: match.sede,
    equipo_local: match.equipo_local,
    equipo_visitante: match.equipo_visitante,
    start_iso: match.start_iso,
    match_ready: availability.match_ready,
    match_start_at: availability.match_start_at,
    cutoff_at: availability.cutoff_at,
    prediction_open: availability.prediction_open,
    prediction_status_code: availability.prediction_status_code,
    prediction_status_text: availability.prediction_status_text,
    resultado_cargado: availability.resultado_cargado,
    estado: safeString_(match.estado) || 'abierto'
  };
}

function getMatchTimingState_(scheduleMap, partidoId, now) {
  const timing = getMatchTimingWindow_(scheduleMap, partidoId);
  if (!timing.start_date || !timing.cutoff_date) {
    return {
      code: 'MATCH_TIME_MISSING',
      message: PARTIDO_SIN_HORARIO_ERROR,
      match_start_at: '',
      cutoff_at: ''
    };
  }

  if (now.getTime() >= timing.cutoff_date.getTime()) {
    return {
      code: 'MATCH_CLOSED',
      message: PARTIDO_CERRADO_ERROR,
      match_start_at: timing.match_start_at,
      cutoff_at: timing.cutoff_at
    };
  }

  return {
    code: 'OPEN',
    message: '',
    match_start_at: timing.match_start_at,
    cutoff_at: timing.cutoff_at
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

function computeStageWindow_(resolvedMatches, stageId) {
  var matches = (resolvedMatches || []).filter(function(match) {
    return normalizeStageIdForCompare_(match.stage_id || inferStageIdFromMatch_(match)) === normalizeStageIdForCompare_(stageId);
  });
  var startDates = matches.map(function(match) {
    return parseIsoDate_(buildMatchStartIsoFromSource_(match));
  }).filter(Boolean).sort(function(a, b) {
    return a.getTime() - b.getTime();
  });
  if (!startDates.length) {
    return { editable_from: '', editable_until: '' };
  }
  var latestStart = startDates[startDates.length - 1];
  var editableUntil = new Date(latestStart.getTime() - MATCH_CUTOFF_MINUTES * 60 * 1000);
  return {
    editable_from: startDates[0].toISOString(),
    editable_until: editableUntil.toISOString()
  };
}

function stageIsCompleted_(stageId, resultsByMatch) {
  return (PRODE_STAGE_MATCH_IDS[stageId] || []).every(function(matchId) {
    var row = resultsByMatch[matchId];
    return row && row.estado_resultado === 'FINAL' && !!row.resultado_signo;
  });
}

function stageIsReady_(stageId, matchesById) {
  return (PRODE_STAGE_MATCH_IDS[stageId] || []).every(function(matchId) {
    var match = matchesById[matchId];
    if (!match) return false;
    if (!isKnockoutMatchId_(matchId)) return true;
    return !!match.match_ready;
  });
}

function upsertStageRow_(ss, existing, stageId, values) {
  var sheet = getOrCreateSheet_(ss, SHEET_NAMES.ETAPAS);
  var rowValues = [[
    stageId,
    values.stage_label,
    values.status,
    values.editable_from,
    values.editable_until,
    'SI',
    values.notas
  ]];
  if (existing && existing.__rowNumber) {
    sheet.getRange(existing.__rowNumber, 1, 1, HEADERS.Etapas.length).setValues(rowValues);
    return 'updated';
  }
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, HEADERS.Etapas.length).setValues(rowValues);
  return 'created';
}

function syncAutomaticStages_(ss, now) {
  var bundle = buildResolvedMatchesBundle_(ss);
  var etapas = getEtapasRecords_(ss).reduce(function(acc, row) {
    acc[normalizeStageIdForCompare_(row.stage_id)] = row;
    return acc;
  }, {});
  var stageStates = PRODE_STAGE_ORDER.reduce(function(acc, stageId) {
    acc[stageId] = {
      completed: stageIsCompleted_(stageId, bundle.resultsByMatch),
      ready: stageIsReady_(stageId, bundle.matchesById)
    };
    return acc;
  }, {});

  var openStageId = '';
  PRODE_STAGE_ORDER.some(function(stageId) {
    if (!stageStates[stageId].completed && stageStates[stageId].ready) {
      openStageId = stageId;
      return true;
    }
    return false;
  });

  PRODE_STAGE_ORDER.forEach(function(stageId) {
    var window = computeStageWindow_(bundle.matches, stageId);
    var current = etapas[stageId] || null;
    var nextStatus = stageId === openStageId ? 'ABIERTA' : 'CERRADA';
    var nextValues = {
      stage_label: PRODE_STAGE_LABELS[stageId],
      status: nextStatus,
      editable_from: window.editable_from,
      editable_until: window.editable_until,
      notas: stageId === 'grupos'
        ? 'Carga historica'
        : 'Cierre individual 15 minutos antes de cada partido'
    };
    if (
      current &&
      current.stage_label === nextValues.stage_label &&
      current.status === nextValues.status &&
      current.editable_from === nextValues.editable_from &&
      current.editable_until === nextValues.editable_until &&
      normalizeVisibleFlag_(current.visible) === 'SI' &&
      current.notas === nextValues.notas
    ) {
      return;
    }
    upsertStageRow_(ss, current, stageId, nextValues);
    appendLog_(ss, [
      (now || new Date()).toISOString(),
      'AUTO_STAGE_SYNC',
      'Etapa ' + stageId + ' sincronizada automaticamente',
      safeJson_(nextValues)
    ]);
  });
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

function inferStageIdFromMatch_(match) {
  const matchId = safeString_(match && (match.partido_id || match.id)).toUpperCase();
  return stageIdFromMatchId_(matchId);
}

function normalizeStageIdForCompare_(value) {
  const raw = compareKey_(value);
  if (!raw) return '';
  if (raw === 'semifinal' || raw === 'semifinales') return 'semifinales';
  if (raw === 'final' || raw === 'finales' || raw === 'tercerpuesto') return 'finales';
  return raw === 'grupos' || raw === '32avos' || raw === 'octavos' || raw === 'cuartos' ? raw : raw;
}

function buildPublicDisplayName_(participant) {
  const type = normalizeParticipantType_(participant && participant.tipo_participante) || PARTICIPANT_TYPES.JUGADOR;
  const adultName = safeString_(participant && participant.nombre);
  const adultSurname = safeString_(participant && participant.apellido);
  const linkedChild = safeString_(
    participant && (
      participant.jugador_vinculado_nombre ||
      participant.nombre_hijo
    )
  );

  if (type === PARTICIPANT_TYPES.FAMILIAR && linkedChild) {
    return 'Familia de ' + linkedChild;
  }

  if (type === PARTICIPANT_TYPES.JUGADOR) {
    return linkedChild || adultName || 'Participante';
  }

  if (adultName) {
    return adultSurname ? adultName + ' ' + adultSurname.charAt(0) + '.' : adultName;
  }

  return linkedChild ? 'Familia de ' + linkedChild : 'Participante';
}

function getParticipantCategoriaDisplay_(participant) {
  const type = normalizeParticipantType_(participant && participant.tipo_participante) || PARTICIPANT_TYPES.JUGADOR;
  if (type === PARTICIPANT_TYPES.FAMILIAR || type === PARTICIPANT_TYPES.PROFESOR || type === PARTICIPANT_TYPES.DELEGADO) {
    return safeString_(participant && participant.categoria_vinculada) || safeString_(participant && participant.categoria) || 'Sin categoria';
  }
  return safeString_(participant && participant.categoria) || 'Sin categoria';
}

function getParticipantTiraDisplay_(participant) {
  const type = normalizeParticipantType_(participant && participant.tipo_participante) || PARTICIPANT_TYPES.JUGADOR;
  if (type === PARTICIPANT_TYPES.FAMILIAR || type === PARTICIPANT_TYPES.PROFESOR || type === PARTICIPANT_TYPES.DELEGADO) {
    return safeString_(participant && participant.tira_vinculada) || safeString_(participant && participant.tira) || 'Sin tira';
  }
  return safeString_(participant && participant.tira) || 'Sin tira';
}

function buildPublicRankingBundle_(ss, now) {
  const finalResultsByMatch = getResultadosProdeRecords_(ss).reduce(function(acc, row) {
    if (row.estado_resultado === 'FINAL' && row.resultado_signo) {
      acc[row.partido_id] = row;
    }
    return acc;
  }, {});
  const participants = getParticipantesRecords_(ss).filter(function(row) {
    return safeString_(row.estado_participante).toUpperCase() !== 'INACTIVO';
  });
  const totalFinalResults = Object.keys(finalResultsByMatch).length;
  const predictionsByParticipant = getPronosticosRecords_(ss).reduce(function(acc, row) {
    if (!row.participant_code) return acc;
    if (!acc[row.participant_code]) acc[row.participant_code] = [];
    acc[row.participant_code].push(row);
    return acc;
  }, {});

  const rows = participants.map(function(participant) {
    const predictions = dedupePredictionsByParticipantMatch_(predictionsByParticipant[participant.participant_code] || []);
    const computed = Math.min(totalFinalResults, predictions.reduce(function(total, prediction) {
      return finalResultsByMatch[prediction.partido_id] ? total + 1 : total;
    }, 0));
    const aciertos = Math.min(computed, predictions.reduce(function(total, prediction) {
      const result = finalResultsByMatch[prediction.partido_id];
      if (!result) return total;
      return prediction.sign === result.resultado_signo ? total + 1 : total;
    }, 0));
    return {
      participant_code: participant.participant_code,
      display_name: buildPublicDisplayName_(participant),
      categoria_display: getParticipantCategoriaDisplay_(participant),
      tira_display: getParticipantTiraDisplay_(participant),
      puntos: aciertos,
      aciertos: aciertos,
      computados: computed
    };
  }).sort(function(a, b) {
    return (
      b.puntos - a.puntos ||
      b.aciertos - a.aciertos ||
      b.computados - a.computados ||
      a.display_name.localeCompare(b.display_name, 'es')
    );
  }).map(function(row, index) {
    return {
      posicion: index + 1,
      display_name: row.display_name,
      categoria_display: row.categoria_display,
      tira_display: row.tira_display,
      puntos: row.puntos,
      aciertos: row.aciertos,
      computados: row.computados
    };
  });

  return {
    ok: true,
    generated_at: (now || new Date()).toISOString(),
    total_participantes: participants.length,
    total_resultados_finales: Object.keys(finalResultsByMatch).length,
    has_results: Object.keys(finalResultsByMatch).length > 0,
    top5: rows.slice(0, 5),
    ranking_general: rows,
    ranking_por_categoria: groupPublicRanking_(rows, 'categoria_display'),
    ranking_por_tira: groupPublicRanking_(rows, 'tira_display')
  };
}

function groupPublicRanking_(rows, field) {
  const grouped = (rows || []).reduce(function(acc, row) {
    const key = safeString_(row && row[field]) || 'Sin dato';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return Object.keys(grouped).sort(function(a, b) {
    return a.localeCompare(b, 'es');
  }).reduce(function(acc, key) {
    acc[key] = grouped[key].map(function(row, index) {
      return {
        posicion: index + 1,
        display_name: row.display_name,
        categoria_display: row.categoria_display,
        tira_display: row.tira_display,
        puntos: row.puntos,
        aciertos: row.aciertos,
        computados: row.computados
      };
    });
    return acc;
  }, {});
}

function sanitizeMatchResultAdminResponse_(match, result) {
  const normalizedResult = result || null;
  return {
    partido_id: match.partido_id,
    stage_id: inferStageIdFromMatch_(match),
    fecha: match.fecha,
    hora: match.hora,
    instancia: match.instancia,
    grupo: match.grupo,
    sede: match.sede,
    equipo_local: match.equipo_local,
    equipo_visitante: match.equipo_visitante,
    start_iso: match.start_iso,
    match_ready: !!match.match_ready,
    resultado_cargado: !!(normalizedResult && normalizedResult.estado_resultado === 'FINAL' && normalizedResult.resultado_signo),
    resultado: normalizedResult ? {
      resultado_signo: normalizedResult.resultado_signo,
      goles_local: normalizedResult.goles_local,
      goles_visitante: normalizedResult.goles_visitante,
      estado_resultado: normalizedResult.estado_resultado,
      updated_at: normalizedResult.updated_at,
      updated_by: normalizedResult.updated_by,
      fuente: normalizedResult.fuente
    } : null
  };
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
  if (message === ADMIN_AUTH_ERROR || message.indexOf(ADMIN_AUTH_ERROR) === 0) return 'ADMIN_AUTH_REQUIRED';
  if (message === RESULTADO_SIGNO_INVALIDO_ERROR) return 'INVALID_RESULT_SIGN';
  if (message === RESULTADO_KNOCKOUT_SIGNO_INVALIDO_ERROR) return 'INVALID_KNOCKOUT_RESULT';
  if (message === RESULTADO_ESTADO_INVALIDO_ERROR) return 'INVALID_RESULT_STATUS';
  if (message === RESULTADO_PARTIDO_REQUERIDO_ERROR) return 'MATCH_ID_REQUIRED';
  if (message === MATCH_SOURCE_UNAVAILABLE_ERROR) return 'MATCH_SOURCE_UNAVAILABLE';
  if (message === ETAPA_CERRADA_ERROR) return 'STAGE_CLOSED';
  if (message === ETAPA_NO_HABILITADA_ERROR) return 'STAGE_NOT_OPEN';
  if (message === KNOCKOUT_MATCH_NOT_READY_ERROR) return 'KNOCKOUT_MATCH_NOT_READY';
  if (message === BRACKET_DEPENDENCY_LOCKED_ERROR) return 'BRACKET_DEPENDENCY_LOCKED';
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
  if (message === ADMIN_AUTH_ERROR || message.indexOf(ADMIN_AUTH_ERROR) === 0) return message;
  if (message === RESULTADO_SIGNO_INVALIDO_ERROR) return RESULTADO_SIGNO_INVALIDO_ERROR;
  if (message === RESULTADO_KNOCKOUT_SIGNO_INVALIDO_ERROR) return RESULTADO_KNOCKOUT_SIGNO_INVALIDO_ERROR;
  if (message === RESULTADO_ESTADO_INVALIDO_ERROR) return RESULTADO_ESTADO_INVALIDO_ERROR;
  if (message === RESULTADO_PARTIDO_REQUERIDO_ERROR) return RESULTADO_PARTIDO_REQUERIDO_ERROR;
  if (message === MATCH_SOURCE_UNAVAILABLE_ERROR) return MATCH_SOURCE_UNAVAILABLE_ERROR;
  if (message === ETAPA_CERRADA_ERROR) return ETAPA_CERRADA_ERROR;
  if (message === ETAPA_NO_HABILITADA_ERROR) return ETAPA_NO_HABILITADA_ERROR;
  if (message === KNOCKOUT_MATCH_NOT_READY_ERROR) return KNOCKOUT_MATCH_NOT_READY_ERROR;
  if (message === BRACKET_DEPENDENCY_LOCKED_ERROR) return BRACKET_DEPENDENCY_LOCKED_ERROR;
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
