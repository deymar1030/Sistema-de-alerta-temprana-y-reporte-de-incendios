<script setup lang="ts">
import { IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { alertCircleOutline, callOutline, checkmarkCircleOutline, closeCircleOutline, flameOutline } from 'ionicons/icons'
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-title>Instrucciones</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="container">
        <div class="section-title">Instrucciones de emergencia</div>

        <ion-card class="guide-card">
          <ion-card-content>
            <div class="guide-heading"><span class="icon-circle"><ion-icon :icon="flameOutline" /></span><h3>Qué hacer ante un incendio</h3></div>
            <p>Actúa con calma, aleja a las personas del humo y llama a los servicios de emergencia si corresponde.</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="guide-card">
          <ion-card-content>
            <div class="guide-heading"><span class="icon-circle green-circle"><ion-icon :icon="checkmarkCircleOutline" /></span><h3>Cómo evacuar</h3></div>
            <p>Usa la ruta más cercana, no tomes el ascensor y evita zonas con humo denso o calor excesivo.</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="guide-card">
          <ion-card-content>
            <div class="guide-heading"><span class="icon-circle red-circle"><ion-icon :icon="closeCircleOutline" /></span><h3>Qué no hacer</h3></div>
            <p>No intentes apagar un incendio grande sin equipo apropiado ni regreses a un lugar ya evacuado.</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="guide-card">
          <ion-card-content>
            <div class="guide-heading"><span class="icon-circle yellow-circle"><ion-icon :icon="alertCircleOutline" /></span><h3>Cómo reportar correctamente</h3></div>
            <p>Describe la ubicación, si hay humo o llamas, y si existen personas en riesgo.</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="guide-card">
          <ion-card-content>
            <div class="guide-heading"><span class="icon-circle green-circle"><ion-icon :icon="callOutline" /></span><h3>Números de emergencia</h3></div>
            <p>Bomberos: 118</p>
            <p>Policía: 110</p>
            <p>Urgencias: 911</p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.guide-card {
  margin-bottom: 12px;
}
.guide-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.guide-heading h3 {
  font-size: 16px;
}
.guide-card p {
  color: var(--alerta-muted);
  font-size: 14px;
  line-height: 1.6;
}
.red-circle { background: var(--alerta-red-soft); color: var(--alerta-red); }
.yellow-circle { background: var(--alerta-yellow-soft); color: #9a7800; }
</style>
