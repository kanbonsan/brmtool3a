import { ref, onMounted } from 'vue'

const paneClasses = ['map-pane', 'side-pane', 'error-pane']

interface PaneInfo {
    el?: HTMLElement
    top?: number
    bottom?: number
    left?: number
    right?: number
    width?: number
    height?: number
}

export function useDimension() {

    const panes = ref<Map<string,PaneInfo>>(new Map())

    onMounted(() => {
        paneClasses.forEach((pane) => {
            const el = document.querySelector(`.${pane}`) as HTMLElement
            if (el) {
                panes.value.set(pane, { el })
            }
        })
        dimensionUpdate()
    })

    const dimensionUpdate = () => {
        panes.value.forEach((value, key) => {
            const el = value.el!
            const {top,bottom,left,right,width,height} = el.getBoundingClientRect()
            panes.value.set(key, { el, top, bottom,left,right,width,height })
        })
    }

    return {
        panes, dimensionUpdate
    }

}