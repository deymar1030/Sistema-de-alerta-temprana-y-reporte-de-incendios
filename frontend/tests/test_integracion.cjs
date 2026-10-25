/* Comprobaciones offline: contratos, mapeos, seguridad y sintaxis de componentes.
 * No confirman que el VPS esté disponible ni reemplazan pruebas de navegador.
 */
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const ts = require('typescript')
const { parse } = require('@vue/compiler-sfc')
const root = path.resolve(__dirname, '..')
let passes = 0
function pass(label) { passes++; console.log('OK', label) }
function load(file, mockDeps = {}, mockedFetch) {
  let source = fs.readFileSync(path.join(root, file), 'utf8')
  source = source.replaceAll('import.meta.env', '({ VITE_API_URL: undefined, VITE_USE_MOCKS: "false" })')
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  const exp = {}; const mod = { exports: exp }
  const requireFake = (id) => { if (!(id in mockDeps)) throw new Error('Unmocked dependency '+id+' of '+file); return mockDeps[id] }
  const evaluate = new Function('require', 'exports', 'module', 'fetch', 'Headers', 'FormData', code)
  evaluate(requireFake, exp, mod, mockedFetch ?? (() => { throw new Error('Fetch inesperado') }), Headers, FormData)
  return mod.exports
}
async function run() {
  const called = []
  const reply = {id_institucion:'4',nombre:'Bomberos',categoria:'BOMBEROS',direccion:'Centro',telefono_ins:'1234',latitud:-16.5,longitud:-68.15,estado:true}
  const backend = async (url, init={}) => {
    called.push({url, init})
    if (url === '/instituciones' && !init.method) return [reply]
    if (url === '/instituciones' && init.method === 'POST') return {...reply}
    if (url === '/instituciones/4' && init.method === 'PUT') return {...reply}
    throw Error('Ruta desconocida '+url)
  }
  const institutions = load('src/services/institution.service.ts', {'./http':{apiFetch:backend}}).institutionService
  const data = await institutions.getInstitutions()
  assert.equal(data[0].id,'4')
  assert.equal(data[0].latitud,-16.5)
  pass('instituciones: GET preserva el ID y la ubicación del backend')
  const input={nombre:'Bomberos',categoria:'BOMBEROS',direccion:'Av. Principal',telefono_ins:'1234',latitud:-16.5,longitud:-68.15,razon_social:'Bomberos',detalle:'Emergencias'}
  await institutions.createInstitution(input)
  assert.equal(called.at(-1).url,'/instituciones'); assert.equal(called.at(-1).init.method,'POST')
  assert.deepEqual(JSON.parse(called.at(-1).init.body),input)
  pass('crear institución: POST real con datos, incluida la geolocalización')
  await institutions.updateInstitution('4',input)
  assert.equal(called.at(-1).url,'/instituciones/4'); assert.equal(called.at(-1).init.method,'PUT')
  pass('editar institución: PUT real por ID')
  const failed = load('src/services/institution.service.ts', {'./http':{apiFetch:async () => {throw Error('HTTP 403')}}}).institutionService
  await assert.rejects(()=>failed.createInstitution(input),/HTTP 403/)
  pass('instituciones: los errores del backend no se confirman como éxito')

  const readings = load('src/services/reading.service.ts', { './http': {apiFetch:async (p) => {
    assert.equal(p,'/lecturas?page=2&pageSize=100');
    return {items:[{id_lectura:'501',id_sensor:'31',id_alerta:null,valor:650,fecha_hora:'2026-10-22T14:00:00.000Z',estado_lectura:'ANOMALA',tipo_variable:'CO2'}],total:101,page:2,pageSize:100}
  }} }).readingService
  const page = await readings.getReadingsPage(2,100)
  assert.equal(page.total,101); assert.equal(page.items[0].unidad,'ppm'); assert.equal(page.items[0].estado,'ANOMALA')
  pass('lecturas: paginación data.items, estado ANOMALA y CO2')
  const bySensor=load('src/services/reading.service.ts', { './http':{apiFetch:async p => {
    assert.equal(p,'/sensores/31/lecturas'); return [{id_lectura:'10',id_sensor:'31',id_alerta:null,valor:4,fecha_hora:'2026-10-22T14:00:00Z',tipo_variable:'GAS_LEL',estado_lectura:'INVALIDA'}]
  } }}).readingService
  const sensorItems=await bySensor.getReadingsBySensor('31')
  assert.equal(sensorItems[0].unidad,'%LEL'); assert.equal(sensorItems[0].estado,'INVALIDA')
  pass('lecturas por sensor: array y GAS_LEL inválido, sin normalizarlo')

  const alerts=load('src/services/backend-alerts.service.ts', {'./http':{apiFetch:async p => {
    if (p.includes('?id_institucion=')) return [{id_alerta:'3',estado:'CONFIRMADA'}]
    if (p === '/alertas') return [{id_alerta:'1',estado:'EN_EVALUACION'}]
    if (p === '/alertas/3') return {id_alerta:'3',instituciones_notificadas:[{id_institucion:'4',nombre:'Bomberos',estado:'RECIBIDA'}]}
    if (p === '/alertas/activas') return []
    throw Error('Endpoint desconocido '+p)
  }}}).backendAlertsService
  assert.equal((await alerts.list())[0].id_alerta,'1')
  assert.equal((await alerts.byInstitution('4'))[0].id_alerta,'3')
  assert.equal((await alerts.detail('3')).instituciones_notificadas[0].estado,'RECIBIDA')
  pass('alertas: GET lista, institución y detalle con estado persistido')

  for (const httpPath of ['src/services/http.ts','ALERTA_Movil/src/services/http.ts']) {
    let received = null
    const http=load(httpPath,{},async (url,init)=> {
      received={url,init}; return {status:200,ok:true,text:async () => JSON.stringify({success:true,data:{id:'7'}})}
    })
    assert.deepEqual(await http.apiFetch('/auth/me'),{id:'7'})
    assert.equal(received.url,'/api/auth/me'); assert.equal(received.init.credentials,'include')
    pass(httpPath+': /auth/me usa cookie sid y desenvuelve data')
    const httpFailure=load(httpPath,{}, async()=>({status:200,ok:true,text:async()=>JSON.stringify({success:false,error:'Denegado'})}))
    await assert.rejects(()=>httpFailure.apiFetch('/instituciones'),/Denegado/)
    pass(httpPath+': success:false es rechazo, no éxito')
    const invalidJSON=load(httpPath,{}, async()=>({status:502,ok:false,text:async()=>'<html>error gateway</html>'}))
    await assert.rejects(()=>invalidJSON.apiFetch('/instituciones'),/no JSON.*502/)
    pass(httpPath+': errores HTML reportan el HTTP original')
  }

  const citizenService=load('src/services/citizen-report.service.ts',{},async()=>({status:200,ok:true,json:async()=>({success:true,data:{id_usuario:'17',descripcion:'Fuego',tipo:'CERCANA',nivel_prioridad:'ALTA',estado:'EN_REVISION',fecha_envio:'2026-10-22',latitud:-16.5,longitud:-68.1,foto_url:null,indicador:null}})})).citizenReportService
  await assert.rejects(()=>citizenService.createReport({description:'Fuego',latitude:-16.5,longitude:-68.1}),/no confirmó el identificador/)
  pass('reportes: no se muestra éxito sin ID real del backend')

  const view = fs.readFileSync(path.join(root,'src/views/SuperAdminInstitutionsView.vue'),'utf8')
  assert.match(view,/@click="create"/); assert.match(view,/@submit.prevent="save"/)
  assert.match(view, /<LocationPicker /); assert.match(view, /POST|store.saveInstitution/)
  pass('formulario de institución: botón, formulario, mapa y guardado enlazados')
  const legacy = fs.readFileSync(path.join(root,'src/views/CentralAlertsView.vue'),'utf8')
  assert.doesNotMatch(legacy,/dispatchStore|createDispatch/)
  pass('rutas Central no contienen despachos falsos')
  const mobileMap = fs.readFileSync(path.join(root,'ALERTA_Movil/src/views/CitizenHomeView.vue'),'utf8')
  assert.match(mobileMap, /hasCoordinates/); assert.match(mobileMap,/textContent/)
  assert.doesNotMatch(mobileMap,/bindPopup\(`\<strong/)
  pass('mapa móvil: no inventa marcadores ni inyecta descripción como HTML')
  const oldCSS = fs.readFileSync(path.join(root,'src/style.css'),'utf8')
  assert.doesNotMatch(oldCSS, /\[class\*='text-white'\]/)
  pass('CSS: los botones blancos sobre naranja conservan el contraste')

  let vueCount=0
  const discover=(directory)=>{
    for(const ent of fs.readdirSync(directory,{withFileTypes:true})) {
      if(['node_modules','dist','.git'].includes(ent.name)) continue
      const full=path.join(directory,ent.name)
      if(ent.isDirectory()) discover(full)
      else if(ent.name.endsWith('.vue')) {
        const result=parse(fs.readFileSync(full,'utf8'),{filename:full})
        assert.equal(result.errors.length,0,full+' '+JSON.stringify(result.errors))
        vueCount++
      }
    }
  }
  discover(path.join(root,'src')); discover(path.join(root,'ALERTA_Movil/src'))
  pass('Sintaxis Vue válida en '+vueCount+' componentes web y móvil')
  console.log(`TOTAL: ${passes} comprobaciones aprobadas. No reemplaza pruebas en VPS o navegador.`)
}
run().catch(e=>{console.error('FAIL:',e.stack);process.exitCode=1})
