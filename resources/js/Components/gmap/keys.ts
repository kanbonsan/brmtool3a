
import { type InjectionKey, Ref } from "vue"
import type { menuComponentOptions, Activator , PopUp} from "@/Components/MapPane.vue"

export const googleMapsKey = Symbol() as InjectionKey<{
    popup: PopUp,
    menuComp: Ref<string>,
    popupParams: Ref<{
        activated?: boolean,
        activator?: Activator,
        position?: google.maps.LatLng,
        options?: menuComponentOptions,
        resolve?: (payload: any) => void,
        reject?: (payload: any) => void
    }>,
    menuParams: any
}>