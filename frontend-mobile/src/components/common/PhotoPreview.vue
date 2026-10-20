<script setup lang="ts">
withDefaults(
  defineProps<{
    src?: string
    alt?: string
  }>(),
  {
    src: '',
    alt: 'Vista previa',
  },
)
</script>

<template>
  <div v-if="src" class="photo-preview">
    <img :src="src" :alt="alt" />
  </div>
</template>

<style scoped>
.photo-preview {
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid #d4dad7;
  background: #f4f6f4;
  height: 240px;
  margin-top: 0.9rem;
}
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
