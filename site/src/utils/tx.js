// ===== tx — bilingual content helpers for the {zh,en} JSON data model =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// tx(field) resolves a data field for the active locale, falling back to zh then en
// (plain strings pass through untouched). bySince(a, b) orders members by since-year
// ascending, sorting entries without a year last. Used by every view/component that
// reads src/data/*.json.
import i18n from '../i18n'

// 双语内容字段取值：tx({zh:'…', en:'…'}) → 按当前语言返回；缺英文时回退中文
export function tx(field) {
  if (field === null || field === undefined) return ''
  if (typeof field === 'string') return field
  const l = i18n.global.locale.value
  return field[l] ?? field.zh ?? field.en ?? ''
}

// 成员按入组年份排序（早者在前；无年份者排最后），同年保持数据文件顺序
export function bySince(a, b) {
  return (parseInt(a.since) || 1e9) - (parseInt(b.since) || 1e9)
}
