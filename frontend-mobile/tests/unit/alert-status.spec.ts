import { describe, expect, it } from 'vitest'
import { parseEnvioEstado, resolveStatus } from '../../src/services/alert-status'
import { siguienteAccion } from '../../src/services/incident.service'

describe('estado del envío (mi_envio)', () => {
  it('lee mi_envio.estado y descarta valores desconocidos o null', () => {
    expect(parseEnvioEstado({ estado: 'RECIBIDA' })).toBe('RECIBIDA')
    expect(parseEnvioEstado({ estado: 'otro' })).toBeNull()
    expect(parseEnvioEstado(null)).toBeNull()
  })

  it('el estado global no pisa al del envío', () => {
    expect(resolveStatus('ENVIADA', 'ATENDIDA')).toBe('NUEVA')
    expect(resolveStatus('CERRADA', 'CONFIRMADA')).toBe('FINALIZADA')
    expect(resolveStatus(null, 'CERRADA')).toBe('FINALIZADA')
  })

  it('un solo botón dinámico: ENVIADA → RECIBIDA → ATENDIDA → CERRADA', () => {
    expect(siguienteAccion('ENVIADA')).toEqual({ accion: 'recibir', label: 'CONFIRMAR RECEPCIÓN' })
    expect(siguienteAccion('RECIBIDA')).toEqual({ accion: 'atender', label: 'MARCAR EN ATENCIÓN' })
    expect(siguienteAccion('ATENDIDA')).toEqual({ accion: 'cerrar', label: 'FINALIZAR INTERVENCIÓN' })
    expect(siguienteAccion('CERRADA')).toBeNull()
    expect(siguienteAccion(null)).toBeNull()
  })
})
