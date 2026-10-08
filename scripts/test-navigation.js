const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const names = ['fechaNum', 'parseFecha', 'fechaArgentina', 'fechaPartidoISO', 'proximoPartido', 'fuenteTablasFEFI', 'renderMiniProxima'];
const code = names.map(name => html.split(/\r?\n/).find(line => line.startsWith(`function ${name}(`))).join('\n');
const ctx = vm.createContext({ Intl, Date });
vm.runInContext(code, ctx);
for (const zone of ['c', 'i', 'mat1', 'mat4']) {
  // Calendar regression: pin match states independently of live FEFI updates.
  // Otherwise verifying F9 later makes this historical Oct 3 scenario obsolete.
  const fixture = JSON.parse(fs.readFileSync(path.join(root, 'data', zone, 'fixture.json')))
    .map(match => ({ ...match, estado: match.condicion === 'Libre' ? 'libre' : 'pendiente' }));
  const before = JSON.stringify(fixture);
  for (const date of ['2026-10-03T00:01:00Z', '2026-10-03T13:49:00Z', '2026-10-04T02:59:59Z']) {
    assert.equal(ctx.proximoPartido(fixture, new Date(date)).fecha_id, 'F9', `${zone}: hoy argentino y pendientes viejos`);
  }
  assert.equal(ctx.proximoPartido(fixture, new Date('2026-10-04T03:00:00Z')).fecha_id, 'F10');
  assert.equal(ctx.proximoPartido(fixture, new Date('2027-01-01T12:00:00Z')), null);
  assert.equal(JSON.stringify(fixture), before, 'No altera pendientes ni resultados');
  // Resultados debe usar el mismo criterio incluso al consultar una fecha histórica.
  Object.assign(ctx, { fixtureData: fixture, esPropio: () => true, esc: String, direccionEquipo: () => '', mapsUrl: String });
  const Original = ctx.proximoPartido;
  ctx.proximoPartido = data => Original(data, new Date('2026-10-03T13:49:00Z'));
  for (const selected of ['F1', 'F5', 'F8', 'F9']) assert.match(ctx.renderMiniProxima(selected), /Fecha 9 - 03 de Octubre/);
  ctx.proximoPartido = Original;
  for (const tournament of ['apertura', 'clausura']) {
    const url = new URL(ctx.fuenteTablasFEFI(zone, tournament));
    assert.equal(url.origin, 'https://fefi.com.ar');
    assert.equal(url.pathname, '/2026-torneo-anual-baby-futbol/');
    assert.equal(url.searchParams.get('zona'), ({ c: tournament === 'apertura' ? 'c' : 'd', i: 'i', mat1: '1', mat4: '4' })[zone]);
    assert.equal(url.searchParams.get('vista'), 'tablas-' + tournament);
  }
}
const match = { fecha_iso: '2026-10-03', estado: 'pendiente', condicion: 'Local' };
const now = new Date('2026-10-03T13:00:00Z');
assert.equal(ctx.proximoPartido([{ ...match, condicion: 'Libre' }, { ...match, estado: 'verificado' }, { ...match, estado: 'suspendido' }], now), null);
assert.equal(ctx.proximoPartido([{ ...match, fecha_iso: '2026-99-99', fecha: 'A confirmar' }], now), null);
assert.equal(ctx.fechaArgentina(new Date('2026-10-03T02:59:59Z')), '2026-10-02');
assert.equal(ctx.fechaArgentina(new Date('2026-10-03T03:00:00Z')), '2026-10-03');
console.log('OK: cuatro tiras, pendientes históricos, fecha Argentina, límites de día y ocho enlaces FEFI.');
