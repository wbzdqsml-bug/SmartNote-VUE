export const extractData = payload => {
  if (payload == null) return payload
  if (Array.isArray(payload)) return payload
  if (typeof payload === 'object') {
    if (Object.prototype.hasOwnProperty.call(payload, 'data')) {
      return extractData(payload.data)
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'items')) {
      return extractData(payload.items)
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'records')) {
      return extractData(payload.records)
    }
  }
  return payload
}

export const ensureArray = payload => {
  const data = extractData(payload)
  return Array.isArray(data) ? data : []
}

export const extractId = payload => {
  const data = extractData(payload)
  if (data && typeof data === 'object') {
    if (Object.prototype.hasOwnProperty.call(data, 'id')) return data.id
    if (Object.prototype.hasOwnProperty.call(data, 'noteId')) return data.noteId
    if (Object.prototype.hasOwnProperty.call(data, 'workspaceId')) return data.workspaceId
  }
  return data
}
