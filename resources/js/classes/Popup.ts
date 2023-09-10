export class Popup extends google.maps.OverlayView {
  position?: google.maps.LatLng
  containerDiv: HTMLDivElement

  /** タイム・アウトしてポップアップを消去させるタイマー 画面から外れると消去 */
  timeoutTimer?: number

  /** タイムアウト時間 ms */
  timeout?: number | undefined
  maxTimeout: number
  edgeLimit: number

  /** 画面内にあると判定するポップアップチップの位置 と ポップアップのサイズ
   *  pane サイズの変更には追随しない
   */
  range?: {
    bottom?: number,
    top?: number,
    left?: number,
    right?: number,
    width?: number,
    height?: number,
  }

  /**
   * ポップアップ内から submit して抜けるためのコールバック
   * CustomPopup.vue の メソッドを設定
   * 
   * payload の書式は
   * { status: 'timeout'|'success'|'error'
   *   result: {}
   * }
   * とする
   */
  onSubmit?: (payload: any) => void

  /**
   * チップの位置のオフセット
   */
  offset: {
    x: number, y: number
  }

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

    // 表示に関する初期設定
    this.timeout = undefined  // undefined で auto-close しない
    this.maxTimeout = 60_000  // どんなポップアップもクローズ
    this.edgeLimit = 10

    this.offset = { x: 0, y: 0 }
  }

  setPosition(position: google.maps.LatLng) {
    this.position = position
  }

  setContent(content: HTMLElement) {
    content.classList.add("popup-bubble")
    this.containerDiv.querySelector(".popup-bubble-anchor")?.appendChild(content)
  }

  setSubmitCallback(callback: (payload: any) => void) {
    this.onSubmit = callback
  }

  setOffset(x: number, y: number) {
    this.offset.x = x
    this.offset.y = y
  }

  setTimeoutMs(ms?:number){
    this.timeout = ms
  }

  /**
   * オートクローズをセット
   * @param ms 
   */
  setDisplayTimeout(ms?: number) {
    window.clearTimeout(this.timeoutTimer)
    this.timeoutTimer = window.setTimeout(() => {

      this.onSubmit!({ status: 'timeout' })

      this.setMap(null)
    }, ms ?? this.timeout ?? this.maxTimeout)
  }

  /**
   * ポップアップが画面に収まる範囲を計算して設定
   */
  setRange() {
    const contentDim = this.containerDiv.querySelector('.popup-bubble')?.getBoundingClientRect()
    const contentHeight = contentDim?.height
    const contentWidth = contentDim?.width

    const map = this.getMap() as google.maps.Map
    const mapDim = map.getDiv().getBoundingClientRect()

    this.range = {
      top: mapDim.top + this.edgeLimit - 10,
      bottom: mapDim.bottom + contentHeight! - this.edgeLimit - 10,
      left: mapDim.left - contentWidth! / 2 + this.edgeLimit,
      right: mapDim.right + contentWidth! / 2 - this.edgeLimit,
      width: mapDim.width,
      height: mapDim.height
    }
  }

  /** Called when the popup is added to the map. */
  onAdd() {
    this.getPanes()!.floatPane.appendChild(this.containerDiv)
    // ポップアップが置かれたタイミングで画面のはみ出しの範囲を計算する
    // div サイズが変わっても onAdd() は呼ばれないので、途中でマップサイズを resize をしても
    // 追従はしない
    this.setRange()
  }

  /** Called when the popup is removed from the map. */
  onRemove() {
    if (this.containerDiv.parentElement) {
      this.containerDiv.parentElement.removeChild(this.containerDiv)
    }
  }

  /** Called each frame when the popup needs to draw itself. */
  draw() {
    this.setDisplayTimeout()

    // fromLatLngToDivPixel() によって地図の中央を(0,0)px とした位置を返すよう
    // 地図の左上が (0,0) ではないみたい
    const divPosition = this.getProjection().fromLatLngToDivPixel(
      this.position!
    )!

    const _x = divPosition.x + this.range?.width! / 2
    const _y = divPosition.y + this.range?.height! / 2

    const r = this.range
    if (r?.left! < _x && _x < r?.right! && r?.top! < _y && _y < r?.bottom!) {
      // within range
    } else {
      // out of range すぐには消さない
      this.setDisplayTimeout(50)
    }

    // Hide the popup when it is far out of view.
    const display =
      Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000
        ? "block"
        : "none"

    if (display === "block") {
      this.containerDiv.style.left = divPosition.x + this.offset.x + "px"
      this.containerDiv.style.top = divPosition.y + this.offset.y - 10 + "px"
    }

    if (this.containerDiv.style.display !== display) {
      this.containerDiv.style.display = display
    }
  }
}