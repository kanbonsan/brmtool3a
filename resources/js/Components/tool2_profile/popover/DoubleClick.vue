<template>
    <ul class="menu">
        <li @click="onClick('cmd1')">cmd 1</li>
        <li @click="onClick('cmd2')">cmd 2</li>
    </ul>
</template>

<script>
import Mixin from "@/components/profile/popover/PopoverMixin"
export default {

    mixins: [Mixin],
    
}
</script>

<style scoped>
ul.menu {
    margin: 0px;
    padding: 0px;
}

ul.menu li {
    list-style-type: none;
    display: block;
    position: relative;
}

ul.menu li:hover {
    background: rgb(216, 255, 223);
}
</style>