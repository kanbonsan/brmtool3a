import { mapGetters } from 'vuex'

export default {
    data() {
        return {
            mixindata: 'hello'
        }
    },

    created() {
        this.$store.commit('profile/setProfileMenuLock', true)
    },

    computed: {
        ...mapGetters({
            property: "profile/profileProperty",
            altByPixel: "profile/profileAltByPixel"
        }),
        
        coord() {
            return this.$store.getters['profile/profileCoordinate'](this.property.mousemove.x, this.property.mousemove.y)
        }
    },

    methods: {
        onClick(cmd) {
            this.$emit('onPopover', cmd)
        }
    },

    beforeDestroy() {
        this.$store.commit('profile/setProfileMenuLock', false)
    }
}