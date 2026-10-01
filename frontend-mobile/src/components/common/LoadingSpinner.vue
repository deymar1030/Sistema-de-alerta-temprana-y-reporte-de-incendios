<template>
  <div class="spinner-wrap">
    <div class="spinner" />
  </div>
</template>

<style scoped>
.spinner-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 35vh;
  padding: 24px 0;
}
.spinner {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: 3px solid rgba(244, 162, 89, 0.18);
  border-top-color: #f4a259;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
