/* global beforeEach, cy, describe, expect, it, Cypress */

describe('ALERTA mobile demos', () => {
  const confirmIonicAlert = () => {
    cy.get('ion-alert').should('be.visible').then(($alert) => {
      const buttons = $alert[0].buttons
      expect(buttons).to.have.length.greaterThan(0)
      buttons[buttons.length - 1].handler()
    })
  }

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/demo')
  })

  it('creates and persists a citizen report using web fallbacks', () => {
    cy.get('ion-button').eq(1).click()
    cy.location('pathname').should('eq', '/ciudadano/inicio')
    cy.get('ion-button.primary-button').click()

    cy.get('ion-textarea').then(($textarea) => {
      const textarea = $textarea[0]
      const value = 'Humo visible en una vivienda'
      textarea.value = value
      textarea.dispatchEvent(new CustomEvent('ionInput', { detail: { value }, bubbles: true, composed: true }))
    })
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p2sAAAAASUVORK5CYII=', 'base64'),
      fileName: 'evidencia.png',
      mimeType: 'image/png',
    }, { force: true })
    cy.get('ion-button.location-button').click()
    cy.contains('.location-hint', 'Ubicación de demostración')
    cy.get('ion-button.send-button').click()
    confirmIonicAlert()

    cy.location('pathname').should('eq', '/ciudadano/mis-reportes')
    cy.contains('.report-card', 'Humo visible en una vivienda').should('be.visible')
    cy.reload()
    cy.location('pathname').should('eq', '/ciudadano/mis-reportes')
    cy.contains('.report-card', 'Humo visible en una vivienda').should('be.visible')
    cy.window().then((window) => {
      const savedReports = JSON.parse(window.localStorage.getItem('alerta-mobile-citizen-reports') || '[]')
      expect(savedReports[0].photo).to.contain('data:image/png;base64,')
    })
  })

  it('advances institutional incidents one state at a time and persists the timeline', () => {
    cy.get('ion-button').eq(0).click()
    cy.location('pathname').should('eq', '/institucion/inicio')
    cy.get('ion-button.primary-button').click()
    cy.location('pathname').should('eq', '/institucion/emergencia/INC-001')
    cy.get('.timeline-item').should('have.length', 1)
    cy.contains('.title', 'Recepción confirmada').should('not.exist')

    cy.get('.action-block ion-button').click()
    cy.get('.action-block ion-button').should('contain.text', 'EN CAMINO')
    cy.get('.timeline-item').should('have.length', 2)
    cy.get('.action-block ion-button').should('not.contain.text', 'LLEGAMOS AL LUGAR')

    cy.get('.action-block ion-button').click()
    cy.get('.action-block ion-button').should('contain.text', 'LLEGAMOS AL LUGAR')
    cy.get('.timeline-item').should('have.length', 3)
    cy.get('.action-block ion-button').click()
    cy.get('.action-block ion-button').should('contain.text', 'INCENDIO CONTROLADO')
    cy.get('.timeline-item').should('have.length', 4)
    cy.get('.action-block ion-button').click()
    cy.get('.action-block ion-button').should('contain.text', 'FINALIZAR INTERVENCIÓN')
    cy.get('.timeline-item').should('have.length', 5)

    cy.get('.action-block ion-button').click()
    confirmIonicAlert()
    cy.get('.timeline-item').should('have.length', 6)
    cy.contains('.title', 'Intervención finalizada').should('be.visible')
    cy.get('.action-block ion-button').should('not.exist')

    cy.reload()
    cy.get('.timeline-item').should('have.length', 6)
    cy.contains('.current-status', 'FINALIZADA').should('be.visible')
    cy.get('ion-tab-button').eq(2).click()
    cy.location('pathname').should('eq', '/institucion/historial')
    cy.contains('INC-001').should('be.visible')
  })

  it('keeps mobile layouts within common phone and tablet widths', () => {
    const widths = [360, 375, 390, 412, 768]
    const routes = [
      { role: 'CITIZEN', path: '/ciudadano/inicio' },
      { role: 'CITIZEN', path: '/ciudadano/reportar' },
      { role: 'CITIZEN', path: '/ciudadano/mis-reportes' },
      { role: 'CITIZEN', path: '/ciudadano/notificaciones' },
      { role: 'CITIZEN', path: '/ciudadano/instrucciones' },
      { role: 'INSTITUTION_USER', path: '/institucion/inicio' },
      { role: 'INSTITUTION_USER', path: '/institucion/alertas' },
      { role: 'INSTITUTION_USER', path: '/institucion/emergencia/INC-001' },
      { role: 'INSTITUTION_USER', path: '/institucion/historial' },
    ]
    widths.forEach((width) => {
      cy.viewport(width, 844)
      routes.forEach(({ role, path }) => {
        cy.window().then((window) => window.localStorage.setItem('alerta-mobile-role', role))
        cy.visit(path)
        cy.get('ion-content').should('exist')
        cy.document().then((document) => {
          expect(document.documentElement.scrollWidth).to.be.at.most(width)
        })
      })
    })
  })
})