<template>
{{ store.footerMessage }}
</template>

<script setup lang="ts">
import { useMessage } from '@/stores/MessageStore';
const store=useMessage()




</script>