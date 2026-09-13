import { postJson } from './http'

const rawApiBase = import.meta.env.VITE_SENSITIVE_APPEALS_API_BASE || '/api/v1/sensitive-appeals'
const API_BASE = rawApiBase.replace(/\/$/, '')
const DEFAULT_TIMEOUT = 60000

const postSensitiveAppeal = (path, params = {}) =>
  postJson(`${API_BASE}${path}`, params, {
    timeout: DEFAULT_TIMEOUT,
  })

export const querySensitiveAppealTypeTop5 = (params) =>
  postSensitiveAppeal('/appeal-type-count/top5', params)

export const querySensitiveAppealUserTypeCount = (params) =>
  postSensitiveAppeal('/user-type-count', params)

export const querySensitiveAppealUserAppeals = (params) =>
  postSensitiveAppeal('/user-appeals', params)

export const querySensitiveAppealKeyUserTypeCount = (params) =>
  postSensitiveAppeal('/key-users/type-count', params)

export const querySensitiveAppealKeyUsers = (params) =>
  postSensitiveAppeal('/key-users', params)

export const querySensitiveAppealKeyUserDetail = (params) =>
  postSensitiveAppeal('/key-users/detail', params)

export const querySensitiveAppealSensitiveUserTypeCount = (params) =>
  postSensitiveAppeal('/sensitive-users/type-count', params)

export const querySensitiveAppealSensitiveUsers = (params) =>
  postSensitiveAppeal('/sensitive-users', params)

export const querySensitiveAppealSensitiveUserDetail = (params) =>
  postSensitiveAppeal('/sensitive-users/detail', params)

export const querySensitiveAppealSpecialUserTypeCount = (params) =>
  postSensitiveAppeal('/special-users/type-count', params)

export const querySensitiveAppealSpecialUsers = (params) =>
  postSensitiveAppeal('/special-users', params)

export const querySensitiveAppealSpecialUserDetail = (params) =>
  postSensitiveAppeal('/special-users/detail', params)

export const querySensitiveAppealEmotionEvolution = (params) =>
  postSensitiveAppeal('/ai/emotion-evolution', params)

export const querySensitiveAppealIntelligentWarning = (params) =>
  postSensitiveAppeal('/ai/intelligent-warning', params)

export const querySensitiveAppealIntelligentReceipt = (params) =>
  postSensitiveAppeal('/ai/intelligent-receipt', params)
