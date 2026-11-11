<script setup lang="ts">
import { IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { alertCircleOutline, callOutline, checkmarkCircleOutline, closeCircleOutline, flameOutline } from 'ionicons/icons'
</script>

<template>
  <ion-page>
    <ion-header class="app-header ion-no-border">
      <ion-toolbar>
        <ion-title style="color: #333;">Instrucciones</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="container">
        <div class="section-title">Instrucciones de emergencia</div>

        <ion-card class="guide-card">
          <ion-card-content>
            <div class="guide-heading">
              <span class="icon-circle green-circle"><ion-icon :icon="callOutline" /></span>
              <h3>Números de emergencia</h3>
            </div>
            
            <p class="call-instruction">Toca cualquier botón para llamar de inmediato:</p>
            
            <div class="emergency-buttons">
              <ion-button expand="block" class="btn-bomberos" href="tel:119">
                <ion-icon slot="start" :icon="callOutline"></ion-icon>
                Bomberos (119)
              </ion-button>
              
              <ion-button expand="block" class="btn-policia" href="tel:110">
                <ion-icon slot="start" :icon="callOutline"></ion-icon>
                Policía (110)
              </ion-button>
              
              <ion-button expand="block" class="btn-ambulancia" href="tel:165">
                <ion-icon slot="start" :icon="callOutline"></ion-icon>
                Ambulancias (165)
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="guide-card">
          <ion-card-content>
            <div class="guide-heading">
              <span class="icon-circle"><ion-icon :icon="flameOutline" /></span>
              <h3>Qué hacer ante un incendio</h3>
            </div>
            <p>Actúa con calma, aleja a las personas del humo y llama a los servicios de emergencia si corresponde.</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="guide-card">
          <ion-card-content>
            <div class="guide-heading">
              <span class="icon-circle green-circle"><ion-icon :icon="checkmarkCircleOutline" /></span>
              <h3>Cómo evacuar</h3>
            </div>
            <p>Usa la ruta más cercana, no tomes el ascensor y evita zonas con humo denso o calor excesivo.</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="guide-card">
          <ion-card-content>
            <div class="guide-heading">
              <span class="icon-circle red-circle"><ion-icon :icon="closeCircleOutline" /></span>
              <h3>Qué no hacer</h3>
            </div>
            <p>No intentes apagar un incendio grande sin equipo apropiado ni regreses a un lugar ya evacuado.</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="guide-card">
          <ion-card-content>
            <div class="guide-heading">
              <span class="icon-circle yellow-circle"><ion-icon :icon="alertCircleOutline" /></span>
              <h3>Cómo reportar correctamente</h3>
            </div>
            <p>Describe la ubicación, si hay humo o llamas, y si existen personas en riesgo.</p>
          </ion-card-content>
        </ion-card>

        
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.container {
  padding: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.guide-card {
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  background: white;
}

.guide-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.guide-heading h3 {
  font-size: 16px;
  margin: 0;
  color: #333;
  font-weight: 700;
}

.guide-card p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin: 4px 0;
}

/* Estilo base para los círculos de los iconos */
.icon-circle {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--alerta-orange-soft, #fdf5f0);
  color: var(--alerta-brand, #F24A23);
  font-size: 24px;
}

/* Variantes de color */
.green-circle { background: #e8f5e9; color: #2e7d32; }
.red-circle { background: #ffebee; color: #c62828; }
.yellow-circle { background: #fff8e1; color: #f57f17; }

/* Estilo para que los números parezcan botones clicables */
.phone-link {
  color: var(--alerta-brand, #F24A23);
  font-weight: bold;
  text-decoration: none;
  margin-left: 4px;
  font-size: 15px;
}
.call-instruction {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
  text-align: center;
}

.emergency-buttons ion-button {
  margin-bottom: 10px;
  font-weight: bold;
}

.btn-bomberos {
  --background: #d27979e4; /* Rojo bomberos */
}

.btn-policia {
  --background: #5f7d9f; /* Azul policía */
}

.btn-ambulancia {
  --background: #74ad76; /* Verde ambulancias */
}
</style>