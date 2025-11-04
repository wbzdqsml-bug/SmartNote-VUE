export const NOTE_TYPE = Object.freeze({
  MARKDOWN: 0,
  RICH_TEXT: 1,
  SKETCH: 2
})

export const NOTE_TYPE_OPTIONS = [
  { label: 'Markdown 笔记', value: NOTE_TYPE.MARKDOWN },
  { label: '富文本笔记', value: NOTE_TYPE.RICH_TEXT },
  { label: '手写画板', value: NOTE_TYPE.SKETCH }
]

export const NOTE_TYPE_META = {
  [NOTE_TYPE.MARKDOWN]: { label: 'Markdown', tag: 'primary' },
  [NOTE_TYPE.RICH_TEXT]: { label: '富文本', tag: 'success' },
  [NOTE_TYPE.SKETCH]: { label: '画板', tag: 'warning' }
}

export const getNoteTypeLabel = type => NOTE_TYPE_META[type]?.label || ''
export const getNoteTypeTag = type => NOTE_TYPE_META[type]?.tag || 'info'
