/**
 * 文件说明：常量定义模块（noteTypes）
 * - 主要职责：集中管理业务常量/枚举，确保各处引用一致。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
export const noteTypeOptions = [
  { label: 'Markdown 笔记', value: 0 },
  { label: '手写画板', value: 1 },
  { label: '思维导图', value: 2 },
  { label: '富文本笔记', value: 3 }
]

export const noteTypeMap = noteTypeOptions.reduce((acc, cur) => {
  acc[cur.value] = cur.label
  return acc
}, {})

export const defaultContentByType = {
  0: '# 新建 Markdown 笔记\n\n从这里开始记录你的思考……',
  1: '',
  2: '[\n  {\n    "id": "root",\n    "title": "中心主题",\n    "children": [\n      { "id": "child-1", "title": "分支一", "children": [] },\n      { "id": "child-2", "title": "分支二", "children": [] }\n    ]\n  }\n]',
  3: '<p>欢迎使用富文本编辑器，请在此处开始撰写内容。</p>'
}
