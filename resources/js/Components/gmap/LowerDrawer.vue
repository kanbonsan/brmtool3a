<template>
    <Transition>
        <div v-if="modelValue > 0" class="drawer">
            <el-card style="height:100%;">
                <template #header>{{ title }}
                    <div style="position:absolute;top:5px;right:5px">
                        <el-icon :size="32" @click="() => emit('update:modelValue', 0)">
                            <circle-close></circle-close>
                        </el-icon>
                    </div>
                </template>
                <slot :reset="resetTimeout" :submit="submitFunc"></slot>
            </el-card>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { watch, computed, onMounted } from 'vue'
import { debounce } from 'lodash'
interface Props {
    title: string | undefined
    timeout: number
    modelValue: number
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'timeout', 'submit'])

const activateCount = computed(() => props.modelValue)

let timer: number | null = null

onMounted(()=>resetTimeout())

watch(activateCount, () => {
    resetTimeout()
})

const onCancelClose = ()=>{
    emit('update:modelValue', 0)    // クローズ
    emit('timeout') // タイムアウトを emit して設定をリセットしてもらう
}

const resetTimeout = debounce(() => {
    if (timer !== null) {
        clearTimeout(timer)
    }
    // timeout 時間 0 でタイムアウト消去解除
    if( props.timeout === 0){
        return
    }

    timer = setTimeout(() => {
        emit('update:modelValue', 0)
        emit('timeout')
    }, props.timeout)
}, 250)

/**
 * 親コンポーネントに submit 内容を送って drawer は消去
 * @param payload 
 */
const submitFunc = (payload: any)=>{
    // timeout 処理が残っていると次に timeout=0 がきたときにも残りの timeout を食らう
    if( timer !== null){
        clearTimeout(timer)
    }
    emit('update:modelValue', 0)
    emit('submit', payload)
    
}


</script>

<style scoped>
.drawer {
    --drawer-margin: 10px;
    position: absolute;
    bottom: 0;
    left: 0;
    width: calc(100% - var(--drawer-margin) * 2);
    margin: var(--drawer-margin);

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