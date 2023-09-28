<template>
    <ul class="menu">
        <li @click="onClick('showAllRange')">全範囲を表示</li>
        <li v-if="onProfile" @click="onClick('jumpToThisPoint')">ここに移動</li>
        <li @click="onClick('editFormer')">前を編集</li>
        <li @click="onClick('editLatter')">後ろを編集</li>
        <li @click="onClick('cancel')">キャンセル</li>
    </ul>
</template>

<script>
import Mixin from "@/components/profile/popover/PopoverMixin"
export default {
    mixins: [Mixin],

    data(){
        return {
            onProfile: false
        }
    },

    created(){
        this.setOnProfile()
    },

    methods:{
        // 右クリックした位置がプロフィールマップの稜線に近いときだけジャンプのメニューを表示する
        setOnProfile(){
            const alt = this.altByPixel[this.coord.graphX]
            this.onProfile = Math.abs( this.property.y( alt ) - this.coord.offsetY ) < 50
        }
    }
}
</script>

<style scoped>
ul.menu {
    margin: 0px;
    padding: 0px;
}

ul.menu li {
    padding: 2px 0px;
    list-style-type: none;
    display: block;
    position: relative;
    font-size: 12px;
}

ul.menu li:hover {
    background: rgb(216, 255, 223);
}
</style>