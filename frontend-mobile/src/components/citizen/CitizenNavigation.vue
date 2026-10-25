
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import {
  addCircleOutline,
  documentTextOutline,
  homeOutline,
  personOutline,
} from 'ionicons/icons'

const route = useRoute()

const tabs = [
  { to: '/ciudadano/inicio', title: 'Inicio', icon: homeOutline },
  { to: '/ciudadano/reportar', title: 'Reportar', icon: addCircleOutline },
  { to: '/ciudadano/reportes', title: 'Reportes', icon: documentTextOutline },
  { to: '/ciudadano/perfil', title: 'Perfil', icon: personOutline },
]

const currentPath = computed(() => route.path)

function isActive(path: string): boolean {
  if (path === '/ciudadano/inicio') {
    return currentPath.value === path || currentPath.value === '/citizen/home'
  }

  if (path === '/ciudadano/reportar') {
    return currentPath.value === path || currentPath.value === '/citizen/report'
  }

  if (path === '/ciudadano/reportes') {
    return (
      currentPath.value.startsWith(path) ||
      currentPath.value.startsWith('/citizen/reports')
    )
  }

  return (
    currentPath.value === path ||
    currentPath.value === '/citizen/profile'
  )
}
</script>

<template>
  <nav
    class="citizen-nav"
    aria-label="Navegación principal ciudadana"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="citizen-nav__link"
      :class="{
        'citizen-nav__link--active': isActive(tab.to)
      }"
      :aria-current="isActive(tab.to) ? 'page' : undefined"
    >
      <IonIcon
        :icon="tab.icon"
        aria-hidden="true"
        class="citizen-nav__icon"
      />

      <span>{{ tab.title }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.citizen-nav {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  width: 100%;
  max-width: 700px;
  margin-inline: auto;
  padding: 7px 10px max(8px, env(safe-area-inset-bottom));
  background: #fff;
}

.citizen-nav__link {
  min-width: 0;
  min-height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 13px;
  text-decoration: none;
  font-size: 12px;
  line-height: 1.25;
  font-weight: 600;
  color: #55657a;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.citizen-nav__icon {
  font-size: 21px;
}

.citizen-nav__link--active {
  color: #d94319;
  background-color: #fff1e7;
}

.citizen-nav__link:focus-visible {
  outline: 3px solid #e65d2b;
  outline-offset: -2px;
}

@media (hover: hover) {
  .citizen-nav__link:hover {
    background: #fff6f0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .citizen-nav__link {
    transition: none;
  }
}
</style>
