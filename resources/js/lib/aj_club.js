export const AJCLUB = [
    { code: "600008", clubJa: "オダックスランドヌール中部", clubShort: "AR中部", abbr: "中部", clubEn: "Audax Randonneurs Chubu" },
    { code: "600012", clubJa: "AJ 静岡", clubShort: "AJ静岡", abbr: "静岡", clubEn: "Audax Randonneurs Shizuoka" },
    { code: "600014", clubJa: "AJ 神奈川", clubShort: "AJ神奈川", abbr: "神奈川", clubEn: "Audax Randonneurs Kanagawa" },
    { code: "600017", clubJa: "AJ 宇都宮", clubShort: "AJ宇都宮", abbr: "宇都宮", clubEn: "Audax Randonneurs Utsunomiya" },
    { code: "600018", clubJa: "(一社）オダックス・ジャパン北海道", clubShort: "AJ北海道", abbr: "北海道", clubEn: "Audax Randonneurs Hokkaido" },
    { code: "600019", clubJa: "AJ 千葉", clubShort: "AJ千葉", abbr: "千葉", clubEn: "Audax Randonneurs Chiba" },
    { code: "600020", clubJa: "オダックス埼玉", clubShort: "A 埼玉", abbr: "埼玉", clubEn: "Audax Randonneurs Saitama" },
    { code: "600021", clubJa: "オダックス近畿", clubShort: "A 近畿", abbr: "近畿", clubEn: "Audax Randonneurs Kinki" },
    { code: "600022", clubJa: "AJ岡山", clubShort: "AJ岡山", abbr: "岡山", clubEn: "Audax Randonneurs Okayama" },
    { code: "600024", clubJa: "ランドヌール宮城", clubShort: "R 宮城", abbr: "宮城", clubEn: "Randonneurs Miyagi" },
    { code: "600025", clubJa: "ランドヌールクラブ名古屋", clubShort: "RC名古屋", abbr: "名古屋", clubEn: "Randonneurs Club Nagoya" },
    { code: "600026", clubJa: "AJ 福岡", clubShort: "AJ福岡", abbr: "福岡", clubEn: "Audax Randonneurs Fukuoka" },
    { code: "600028", clubJa: "VCR横浜あおば", clubShort: "VCR横浜あおば", abbr: "あおば", clubEn: "Velo Club Randonneurs Aoba" },
    { code: "600029", clubJa: "AJ西東京", clubShort: "AJ西東京", abbr: "西東京", clubEn: "Audax Randonneurs Nishi Tokyo" },
    { code: "600030", clubJa: "AJ群馬", clubShort: "AJ群馬", abbr: "群馬", clubEn: "Audax Randonneurs Gunma" },
    { code: "600031", clubJa: "AJ広島", clubShort: "AJ広島", abbr: "広島", clubEn: "Audax Randonneurs Hiroshima" },
    { code: "600032", clubJa: "ランドヌ東京", clubShort: "R 東京", abbr: "東京", clubEn: "Randonneurs Tokyo" },
    { code: "600033", clubJa: "ランドヌール熊本", clubShort: "R 熊本", abbr: "熊本", clubEn: "Randonneurs Kumamoto" },
    { code: "600034", clubJa: "AJ長崎", clubShort: "AJ長崎", abbr: "長崎", clubEn: "Audax Randonneurs Nagasaki" },
    { code: "600035", clubJa: "AJたまがわ", clubShort: "AJたまがわ", abbr: "たまがわ", clubEn: "Randonneurs Tamagawa" },
    { code: "600036", clubJa: "AR日本橋", clubShort: "AR日本橋", abbr: "日本橋", clubEn: "Audax Randonneurs Nihonbashi" },
    { code: "600037", clubJa: "ランドヌール札幌", clubShort: "R 札幌", abbr: "札幌", clubEn: "Randonneurs Sapporo" },
    { code: "600038", clubJa: "AR四国", clubShort: "AR四国", abbr: "四国", clubEn: "Audax Randonneurs Shikoku" },
    { code: "600039", clubJa: "AR鹿児島", clubShort: "AR鹿児島", abbr: "鹿児島", clubEn: "Audax Randonneurs Kagoshima" },
]

export function getClub(code){
    // find() メソッドは、提供されたテスト関数を満たす配列内の 最初の要素 の 値 を返します。
    return AJCLUB.find((club)=>club.code.toString() === code.toString() )
}
