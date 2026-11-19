<script setup>
import DefaultTheme from 'vitepress/theme'
import FontPicker from './components/FontPicker.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <FontPicker />
    </template>
  </Layout>
</template>
