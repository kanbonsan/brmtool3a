<template>
    <div>
        <button class="btn" :class="{ active: pc }" @click="pc = !pc">
            PC
        </button>
        <button class="btn" :class="{ active: cue }" @click="cue = !cue">
            ポイント
        </button>
    </div>
</template>

<script>
import { mapGetters, mapState } from "vuex"
export default {
    data() {
        return {}
    },
    created() {},

    computed: {
        ...mapState({
            visible: (state) => state.profile.visible, // コントロール部分のサイズ（モジュールで管理）
        }),

        pc: {
            get() {
                return this.visible.pc
            },
            set(val) {
                if( val===false){
                    this.$store.dispatch("profile/setVisible", { cue: false })
                }
                this.$store.dispatch("profile/setVisible", { pc: val })
            },
        },

        cue: {
            get() {
                return this.visible.cue
            },
            set(val) {
                if( val===true){
                    this.$store.dispatch("profile/setVisible", { pc: true })
                }
                this.$store.dispatch("profile/setVisible", { cue: val })
            },
        },
    },

    mounted() {},

    methods: {},
}
</script>

<style scoped>
.btn {
    font-size: 10px;
    font-weight: 700;
    line-height: 1.5;
    position: relative;
    display: inline-block;
    padding: 3px 5px;
    margin-left: 5px;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-transition: all 0.3s;
    transition: all 0.3s;
    text-align: center;
    vertical-align: middle;
    text-decoration: none;
    letter-spacing: 0.1em;
    color: #212529;
    border-radius: 5px;
    border-color: orange;
    border-width: 1px;
    background: none;
}
.active {
    background: orange;
}
</style>