<script setup lang="ts">
import { IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue'
import { homeOutline, alertCircleOutline, timeOutline } from 'ionicons/icons'
</script>

<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="inicio" href="/institucion/inicio">
          <ion-icon :icon="homeOutline" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="alertas" href="/institucion/alertas">
          <ion-icon :icon="alertCircleOutline" />
          <ion-label>Alertas</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="historial" href="/institucion/historial">
          <ion-icon :icon="timeOutline" />
          <ion-label>Historial</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>
