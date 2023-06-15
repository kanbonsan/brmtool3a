class Popup extends google.maps.OverlayView {
  position?: google.maps.LatLng
  containerDiv: HTMLDivElement

  constructor() {
    super()

    // This zero-height div is positioned at the bottom of the bubble.
    const bubbleAnchor = document.createElement("div")

    bubbleAnchor.classList.add("popup-bubble-anchor")

    // This zero-height div is positioned at the bottom of the tip.
    this.containerDiv = document.createElement("div")
    this.containerDiv.classList.add("popup-container")
    this.containerDiv.appendChild(bubbleAnchor)

    // Optionally stop clicks, etc., from bubbling up to the map.
    Popup.preventMapHitsAndGesturesFrom(this.containerDiv)
  }

  setPosition(position: google.maps.LatLng) {
    this.position = position
  }

  setContent(content: HTMLElement) {
    content.classList.add("popup-bubble")
    this.containerDiv.querySelector(".popup-bubble-anchor")?.appendChild(content)
  }

  /** Called when the popup is added to the map. */
  onAdd() {
    this.getPanes()!.floatPane.appendChild(this.containerDiv)
  }

  /** Called when the popup is removed from the map. */
  onRemove() {
    if (this.containerDiv.parentElement) {
      this.containerDiv.parentElement.removeChild(this.containerDiv)
    }
  }

  /** Called each frame when the popup needs to draw itself. */
  draw() {
    const divPosition = this.getProjection().fromLatLngToDivPixel(
      this.position!
    )!

    // Hide the popup when it is far out of view.
    const display =
      Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000
        ? "block"
        : "none"

    if (display === "block") {
      this.containerDiv.style.left = divPosition.x + "px"
      this.containerDiv.style.top = divPosition.y + "px"
    }

    if (this.containerDiv.style.display !== display) {
      this.containerDiv.style.display = display
    }
  }
}

export type { Popup }
