/**
   * A menu that lets a user delete a selected vertex of a path.
   */
export class DeleteMenu extends google.maps.OverlayView {
    private div_: HTMLDivElement
    private mapDiv_: HTMLElement | null
    private divListener_: EventListener | null

    constructor() {
        super()
        this.div_ = document.createElement("div")
        this.div_.className = "delete-menu"
        this.div_.innerHTML = "削除"

        this.mapDiv_ = null
        this.divListener_ = null

        const menu = this

        this.div_.addEventListener("click", () => {
            menu.removeVertex()
        })
    }

    onAdd() {
        const deleteMenu = this
        const map = this.getMap() as google.maps.Map

        this.getPanes()!.floatPane.appendChild(this.div_)
        this.mapDiv_ = map.getDiv()

        // mousedown anywhere on the map except on the menu div will close the
        // menu.
        this.divListener_ = this.mapDiv_.addEventListener(
            "mousedown",
            (e: Event) => {
                if (e.target != deleteMenu.div_) {
                    deleteMenu.close()
                }
            },
            true
        )!
    }

    onRemove() {
        if (this.divListener_) {
            this.mapDiv_!.removeEventListener('mousedown', this.divListener_, true)
        }

        (this.div_.parentNode as HTMLElement).removeChild(this.div_)

        // clean up
        this.set("position", null)
        this.set("path", null)
        this.set("vertex", null)
    }

    close() {
        this.setMap(null)
    }

    draw() {
        const position = this.get("position")
        const projection = this.getProjection()

        if (!position || !projection) {
            return
        }

        const point = projection.fromLatLngToDivPixel(position)!

        this.div_.style.top = point.y + "px"
        this.div_.style.left = point.x + "px"
    }

    /**
     * Opens the menu at a vertex of a given path.
     */
    open(
        map: google.maps.Map,
        path: google.maps.MVCArray<google.maps.LatLng>,
        vertex: number
    ) {
        this.set("position", path.getAt(vertex))
        this.set("path", path)
        this.set("vertex", vertex)
        this.setMap(map)
        this.draw()
    }

    /**
     * Deletes the vertex from the path.
     */
    removeVertex() {
        const path = this.get("path")
        const vertex = this.get("vertex")

        if (!path || vertex == undefined) {
            this.close()
            return
        }

        path.removeAt(vertex)
        this.close()
    }
}

const deleteMenu = new DeleteMenu()

// google.maps.event.addListener(flightPath, "contextmenu", (e: any) => {
//     // Check if click was on a vertex control point
//     if (e.vertex == undefined) {
//         return
//     }

//     deleteMenu.open(map, flightPath.getPath(), e.vertex)
// });
