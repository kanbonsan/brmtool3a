/**
 * markup.js
 *  文字列をマークアップで分割
 *  先頭からtagを見ていって閉じタグを検索。
 *  タグの部分とその前後の3つのパートに分けてタグがなくなるまで再帰処理して断片化する
 */

/**
 *  ** BOLD **,
 *  ^^ FONT-RED ^^
 */

const rules: Map<string, { escaped: string, tagName: string, className: string }> = new Map([
    ['**', { escaped: '\\*\\*', tagName: 'bold', className: 'font-weight-bold' }],
    ['^^', { escaped: '\\^\\^', tagName: 'colorRed', className: 'text-danger' }]
])

export const Markup = class {

    re: RegExp
    str: string
    tag: Array<any>
    tagName: any


    constructor(str: string, tags = []) {

        const escapedTags = Array.from(rules.values()).map(item => item.escaped)
        // $1: pre, $2: tag, $3: body, $4: post
        this.re = new RegExp(`${escapedTags.join('|')}`, 'g')
        this.str = str
        this.tag = Array.from(new Set([...tags]))  // uniq 処理
        this.tagName = this.tag.map(t => rules.get(t)!.tagName)
    }

    // markup objectの配列を返す
    parse():Array<any> {
        // タグが一切なくなったら終了
        if (!this.re.test(this.str)) {
            return [this].flat()
        }
        this.re.lastIndex = 0    // 上記テストで検索開始点が進んでしまっているのでリセット

        const matches = this.str.matchAll(this.re)
        let tagStack:Array<{tag:string, start:number,end:number}> = []
        let found = false
        for (const match of matches) {
            const len: number = tagStack.length
            if (len === 0) {
                tagStack.push({ tag: match[0], start: match.index!, end: match.index! + match[0].length })
                continue
            }
            if (len === 1 && tagStack[0].tag === match[0]) {    // 閉じた
                tagStack.push({ tag: match[0], start: match.index!, end: match.index! + match[0].length })
                found = true
                break
            }
            if (tagStack[len - 1].tag === match[0]) {   // 内側の閉じ
                tagStack.pop()
                continue
            }
            tagStack.push({ tag: match[0], start: match.index!, end: match.index! + match[0].length })
        }

        if (!found) { // 多分構文ミス.そのまま返す
            return [this].flat()
        }

        const pre = tagStack[0].start > 0 ? new Markup(this.str.slice(0, tagStack[0].start), this.tag) : null
        const post = tagStack[1].end < this.str.length ? new Markup(this.str.slice(tagStack[1].end - this.str.length), this.tag) : null
        const tagRE = new RegExp(rules.get(tagStack[0].tag)!.escaped, 'g')
        const body = new Markup(this.str.slice(tagStack[0].start, tagStack[1].end).replace(tagRE, ''), [...this.tag, tagStack[0].tag])

        const data = []
        if (pre !== null) {
            data.push(pre.parse())
        }
        data.push(body.parse())
        if (post !== null) {
            data.push(post.parse())
        }

        return data.flat()
    }

    detag() {
        return this.str.replace(this.re, '')
    }

    classNames() {
        return this.tag.map(t => rules.get(t)!.className)
    }

    // タグにそれぞれ cssクラスを当てて html を作成
    html() {
        const parsed = this.parse()
        let html = ''
        parsed.forEach(chunk => {
            const cls = chunk.tag.length === 0 ? '' : ` class="${chunk.classNames().join(' ')}"`
            html += `<span${cls}>${chunk.str}</span>`
        })
        return html
    }
}