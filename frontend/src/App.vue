<script setup lang="ts">
import ToastContainer from './components/common/ToastContainer.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
</script>

<template>
  <div>
    <router-view />
    <ToastContainer />
    <ConfirmDialog />
  </div>
</template>
