<template>
    <div class="language-selector">
      <label for="app-language" class="language-label">
        <ion-icon name="language-outline" />
        {{ t('language.label') }}
      </label>
  
      <select
        id="app-language"
        v-model="locale"
        class="language-select"
        aria-label="Select application language"
      >
        <option value="en">
          English
        </option>
        <option value="fil">
          Filipino
        </option>
      </select>
    </div>
  </template>
  
  <script setup lang="ts">
  import { watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { IonIcon } from '@ionic/vue'
  
  const { locale, t } = useI18n({ useScope: 'global' })
  
  watch(locale, (newLocale) => {
    try {
      localStorage.setItem('trabaholokal-language', newLocale)
    } catch (error) {
      console.warn('Could not save language preference:', error)
    }
  })
  </script>
  
  <style scoped>
  .language-selector {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--tl-border, #e5e7eb);
    border-radius: 10px;
    background: var(--tl-card, #ffffff);
  }
  
  .language-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--tl-text, #1f2937);
  }
  
  .language-label ion-icon {
    font-size: 20px;
  }
  
  .language-select {
    min-width: 120px;
    padding: 9px 12px;
    border: 1px solid var(--tl-border, #d1d5db);
    border-radius: 8px;
    background: var(--tl-bg, #ffffff);
    color: var(--tl-text, #1f2937);
    font-size: 14px;
  }
  </style>