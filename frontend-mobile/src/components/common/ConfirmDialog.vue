<script setup lang="ts">
import { IonAlert } from '@ionic/vue'

const props = defineProps<{ open: boolean; message: string; confirmText?: string }>()
const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()
</script>

<template>
  <ion-alert
    :is-open="props.open"
    :header="'Confirmar acción'"
    :message="props.message"
    :buttons="[
      { text: 'Cancelar', role: 'cancel', handler: () => emit('cancel') },
      { text: props.confirmText || 'Aceptar', handler: () => emit('confirm') },
    ]"
  />
</template>
