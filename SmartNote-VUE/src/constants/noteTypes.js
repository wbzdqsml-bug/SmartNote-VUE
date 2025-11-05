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
