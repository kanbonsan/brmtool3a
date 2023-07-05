<template>
    <el-card class="ex-poly">
        <template #header>
            <h3>ポイント</h3>
        </template>
        <el-row>
            <el-button @click="onClick('addCuePoint')">キューポイントを設定</el-button>
        </el-row>
        <el-row>
            <el-button @click="onClick('cancel')">キャンセル</el-button>
        </el-row>
    </el-card>
</template>

<script setup lang="ts">

const props = defineProps(['submit'])

const onClick = (result: string) => {
    switch (result) {
        case 'addCuePoint':
            break
        case 'cancel':
            break
    }
    props.submit({ status: 'success', result })
}

</script>
