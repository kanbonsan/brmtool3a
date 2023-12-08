<template>
    <Transition>
        <div ref="el" v-if="modelValue > 0" class="drawer" :style="styles">
            <el-card style="height:100%;">
                <template #header>{{ title }}
                    <div style="position:absolute;top:5px;right:5px">
                        <el-icon :size="32" @click="() => emit('update:modelValue', 0)">
                            <circle-close @click="onCancelClose"></circle-close>
                        </el-icon>
                    </div>
                </template>
                <slot :reset="resetTimeout" :submit="submitFunc"></slot>
            </el-card>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useToolStore } from '@/stores/ToolStore'
import { debounce } from 'lodash'

interface Props {
    title: string | undefined
    timeout: number
    modelValue: number
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'timeout', 'submit'])
const toolStore = useToolStore()

const el = ref<HTMLElement | null>(null)
const paneWidth = ref<number>()
const paneHeight = ref<number>()
const profilePaneHeight = ref<number>()
const drawerHeight = ref(200)

const styles = computed(() => ({
    zIndex: 2000,
    '--panel-width': `${paneWidth.value}px`,
    '--drawer-height': `${drawerHeight.value}px`,
    '--drawer-bottom': `${Math.max(profilePaneHeight.value! - drawerHeight.value - 16, 0)}px`,
}))

watch(() => [toolStore.panes.vertical, toolStore.panes.left], () => {
    const dim = document.querySelector(".left-pane")?.getBoundingClientRect()
    if (!dim) return
    paneWidth.value = dim.width
    paneHeight.value = dim.height
    profilePaneHeight.value = paneHeight.value * (100 - toolStore.panes.left) / 100

}, { immediate: true })

const activateCount = computed(() => props.modelValue)

let timer: number | null = null

onMounted(() => resetTimeout())

watch(activateCount, () => {
    resetTimeout()
})

const onCancelClose = () => {
    emit('update:modelValue', 0)    // クローズ
    emit('timeout') // タイムアウトを emit して設定をリセットしてもらう
}

const resetTimeout = debounce(() => {
    if (timer !== null) {
        clearTimeout(timer)
    }
    // timeout 時間 0 でタイムアウト消去解除
    if (props.timeout === 0) {
        return
    }

    timer = window.setTimeout(() => {
        emit('update:modelValue', 0)
        emit('timeout')

    }, props.timeout)
}, 250)

/**
 * 親コンポーネントに submit 内容を送って drawer は消去
 * @param payload 
 */
const submitFunc = (payload: any, options?:any) => {
    // timeout 処理が残っていると次に timeout=0 がきたときにも残りの timeout を食らう
    if (timer !== null) {
        clearTimeout(timer)
    }
    emit('update:modelValue', 0)
    emit('submit', payload, options)

}


</script>

<style scoped>
.drawer {
    --drawer-margin: 10px;
    position: absolute;
    bottom: var(--drawer-bottom);
    left: calc(var(--panel-width)/2);
    width: calc(var(--panel-width) - var(--drawer-margin) * 2);
    height: var(--drawer-height);
    margin: var(--drawer-margin);
    transform: translate(-50%, 0);
    max-width: 500px;

}

:deep(.el-card__header) {
    --el-card-padding: 10px;
    background: var(--el-color-primary-light-7);
    color: var(--el-color-primary-dark-2);
    font-weight: bold;
}

.v-enter-active,
.v-leave-active {
    transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}
</style>