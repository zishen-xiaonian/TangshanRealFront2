const TOKEN_API = '/api/esb/request-token'
const USE_FRONTEND_TOKEN = String(import.meta.env.VITE_USE_FRONTEND_TOKEN || 'false')
  .trim()
  .toLowerCase() === 'true'

let tokenCache = null // { token, expiresAt }

export const fetchToken = async () => {
  if (!USE_FRONTEND_TOKEN) {
    return { token: '', expiresIn: 7200 }
  }

  const response = await fetch(TOKEN_API, { method: 'POST' })
  if (!response.ok) {
    throw new Error(`Token request failed: HTTP ${response.status}`)
  }
  const data = await response.json()
  if (!data?.success || !data?.access_token) {
    throw new Error(data?.error || 'Token request returned no access_token')
  }
  return { token: data.access_token, expiresIn: data.expires_in || 7200 }
}

let refreshPromise = null

export const getToken = async () => {
  if (!USE_FRONTEND_TOKEN) {
    return ''
  }

  // Return cached token if still valid (with 30s buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 30000) {
    return tokenCache.token
  }

  // Deduplicate concurrent refreshes
  if (!refreshPromise) {
    refreshPromise = fetchToken()
      .then(({ token, expiresIn }) => {
        tokenCache = {
          token,
          expiresAt: Date.now() + expiresIn * 1000,
        }
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const forceRefreshToken = async () => {
  tokenCache = null

  if (!USE_FRONTEND_TOKEN) {
    return ''
  }

  return getToken()
}
