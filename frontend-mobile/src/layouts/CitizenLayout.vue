<script setup lang="ts">
import { IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue'
import { homeOutline, documentTextOutline, notificationsOutline, bookOutline } from 'ionicons/icons'
</script>

<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="inicio" href="/ciudadano/inicio">
          <ion-icon :icon="homeOutline" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="mis-reportes" href="/ciudadano/mis-reportes">
          <ion-icon :icon="documentTextOutline" />
          <ion-label>Reportes</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="notificaciones" href="/ciudadano/notificaciones">
          <ion-icon :icon="notificationsOutline" />
          <ion-label>Notificaciones</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="instrucciones" href="/ciudadano/instrucciones">
          <ion-icon :icon="bookOutline" />
          <ion-label>Manual</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>