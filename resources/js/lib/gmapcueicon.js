/**
 * Google Map上のアイコンの作成
 * 
 * BRMTOOL 時代のものを完全書き換えした
 * 
 * @returns {string} dataUrl化したイメージ
 * 
 * By default, the anchor is located along the center point of the bottom of the image.
 * 
 * https://www.oh-benri-tools.com/tools/color/rgb-to-rgba このサイトで rgba から rgb に変換
 * 
 */

const IconParams = {
    default: {
        font: '9px sans-serif bold',
        width: 32,
        height: 32,
        lineWidth: 2,
        strokeStyle: '#000000',
        fillStyle: '#FFFFFF',
        small: {
            width: 24,
            height: 24,
        },
        mini: {
            noIndex: true,
            noLabel: true,
            width: 16,
            height: 16,
            lineWidth: 1,
        }
    },
    cue: {
        labelOffset: -2,
    },
    pc: {
        width: 36,
        height: 36,
        strokeStyle: '#F6993F',
        fillStyle: '#FACC9F',
        labelTextFillStyle: 'brown',
        labelFont: '12px sans-serif bold',
        badge: 'PC',
        small: {
            width: 30,
            height: 30,
            labelFont: '10px sans-serif bold',
            labelOffset: 2,
        },
        mini: {
            badge: 'P',
            width: 18,
            height: 18,
        }
    },
    start: {
        width: 36,
        height: 36,
        strokeStyle: '#38C172',
        fillStyle: '#9BE0B8',
        textFillStyle: 'green',
        badge: 'S',
        badgeOffset: 8,
        small: {
            width: 30,
            height: 30,
            badgeOffset: 5,
        },
        mini: {
            width: 18,
            height: 18,
            badgeOffset: 0,
        }
    },
    finish: {
        width: 36,
        height: 36,
        strokeStyle: '#E3342F',
        fillStyle: '#F19997',
        badge: 'G',
        badgeOffset: 8,
        small: {
            width: 30,
            height: 30,
            badgeOffset: 5,
        },
        mini: {
            width: 18,
            height: 18,
            badgeOffset: 0,
        }
    },
    pass: {
        width: 36,
        height: 36,
        strokeStyle: '#6cb2eb',
        fillStyle: '#b5d8f5',
        labelFont: '12px sans-serif bold',
        labelTextFillStyle: 'blue',
        badge: 'CK',
        small: {
            width: 30,
            height: 30,
            labelFont: '10px sans-serif bold',
            labelOffset: 2,
        },
        mini: {
            badge: 'C',
            width: 18,
            height: 18,
        }
    },
    poi: {
        lineWidth: 1,
        strokeStyle: '#228b22', // forest green
        fillStyle: '#90ee90', // light green
        badge: 'Poi',
        small: {
            badge: 'p'
        }
    },
    inactive: {
        width: 24,
        height: 24,
        lineWidth: 1,
        strokeStyle: 'black',
        fillStyle: 'grey',
        noLabel: true,
        small: {
            width: 16,
            height: 16,
            noLabel: true,
        },
        mini: {
            width: 12,
            height: 12,
            noLabel: true
        }
    }
}

function body(ctx, opt) {
    const w = opt.width
    const h = opt.height
    ctx.save()

    ctx.strokeStyle = opt.strokeStyle
    ctx.fillStyle = opt.fillStyle
    ctx.lineWidth = opt.lineWidth
    ctx.beginPath()
    ctx.moveTo(0.5 * w, h)
    ctx.arc(0.5 * w, 0.3333333 * h + opt.lineWidth / 2, 0.33333333 * w, (Math.PI / 180) * 150, (Math.PI / 180) * 30)
    ctx.closePath()

    ctx.fill()
    ctx.stroke()
    ctx.restore()
}

function badge(ctx, opt) {
    ctx.save()
    ctx.fillStyle = opt.strokeStyle // 文字色に設定
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(opt.badge, opt.width / 2, 3 + (opt.badgeOffset || 0))
    ctx.restore()
}

function index(ctx, opt) {
    if (opt.noIndex || !opt.index) {
        return
    }
    const wd = Math.max(10, Math.ceil(ctx.measureText(opt.index).width))
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.fillRect(0, 0, -wd, -12)
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(opt.index, -wd / 2, -6)
    ctx.restore()
}

function label(ctx, opt) {
    if (opt.noLabel) {
        return
    }

    if (opt.label && opt.label === '') {
        return
    }
    ctx.save()
    ctx.fillStyle = opt.labelTextFillStyle || opt.textFillStyle || opt.strokeStyle
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = opt.labelFont || opt.font
    ctx.fillText(opt.label, opt.width / 2, opt.height / 2 + (opt.labelOffset || 0))
    ctx.restore()
}

export function markerIcon(_options = {}) {

    const options = {
        type: _options.inactive ? 'inactive' : (_options.type || 'cue'),
        size: _options.size || 'normal', // 'small', 'mini'
        label: _options.label ?? null,
        index: _options.index ?? null,
    }

    let sizedDef, sizedOp, sized

    if (options.size === 'small') {
        sizedDef = IconParams.default.small || {}
        sizedOp = IconParams[options.type].small || {}
        sized = { ...sizedDef, ...sizedOp }
    } else if (options.size === 'mini') {
        sizedDef = IconParams.default.mini || IconParams.default.small || {}
        sizedOp = IconParams[options.type].mini || IconParams[options.type].small || {}
        sized = { ...sizedDef, ...sizedOp }
    }
    const opt = { ...IconParams.default, ...IconParams[options.type], ...sized, label: options.label, index: options.index }

    const canvas = document.createElement('canvas')
    canvas.width = opt.width
    canvas.height = opt.height
    const context = canvas.getContext('2d')

    context.font = opt.font

    body(context, opt)
    if (opt.badge) {
        badge(context, opt)
    }

    if (['start', 'finish', 'pc', 'pass'].includes(options.type)) {
        context.save()
        context.translate(opt.width, opt.height)
        index(context, opt)
        context.restore()
    }

    label(context, opt)
    return canvas.toDataURL()
}
