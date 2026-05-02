<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import en from 'element-plus/dist/locale/en.mjs';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const localeMap: Record<string, any> = {
  'zh-CN': zhCn,
  'en-US': en,
};

const elementLocale = computed(() => {
  return localeMap[locale.value] || zhCn;
});
</script>
