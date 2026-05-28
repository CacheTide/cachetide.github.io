<script setup lang="ts">
import { useSiteConfig } from 'valaxy'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const siteConfig = useSiteConfig()
const isFuse = computed(() => siteConfig.value.search.provider === 'fuse')
const open = ref(false)

function togglePopup() {
  if (isFuse.value)
    open.value = !open.value
}

function openSearch() {
  if (isFuse.value)
    open.value = true
}

function closeSearch() {
  open.value = false
}

function isEditingContent(event: KeyboardEvent) {
  const element = event.target as HTMLElement | null
  const tagName = element?.tagName

  return Boolean(
    element?.isContentEditable
    || tagName === 'INPUT'
    || tagName === 'SELECT'
    || tagName === 'TEXTAREA',
  )
}

function handleSearchHotKey(event: KeyboardEvent) {
  if (!isFuse.value || isEditingContent(event))
    return

  if (event.key?.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    togglePopup()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleSearchHotKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleSearchHotKey)
})
</script>

<template>
  <YunSearchBtn :open="open" @open="openSearch" @close="closeSearch" />
  <YunFuseSearch v-if="isFuse" :open="open" @close="closeSearch" />
</template>
