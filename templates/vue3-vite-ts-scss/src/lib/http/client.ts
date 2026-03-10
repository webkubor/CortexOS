import ky, { HTTPError, type KyInstance, type Options } from 'ky'

export interface ApiEnvelope<T = unknown> {
  code?: number
  msg?: string
  message?: string
  data?: T
}

function getBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || '/api/'
}

function getAuthToken() {
  return localStorage.getItem('token') || ''
}

async function normalizeResponse<T>(response: Response) {
  if (!response.ok) {
    throw new HTTPError(response, response.request, response.request.headers)
  }

  const json = await response.json() as T | ApiEnvelope<T>
  if (json && typeof json === 'object') {
    const envelope = json as ApiEnvelope<T>
    if (typeof envelope.code === 'number') {
      if (envelope.code === 200) return envelope.data as T
      throw new Error(envelope.message || envelope.msg || '请求失败')
    }
    if (envelope.msg === 'SUCCESS') return envelope.data as T
  }

  return json as T
}

export const http: KyInstance = ky.create({
  prefixUrl: getBaseUrl(),
  timeout: 15000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAuthToken()
        request.headers.set('Accept-Language', 'zh-CN')
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      }
    ],
    afterResponse: [
      async (_request, _options, response) => response
    ]
  }
})

export async function request<T>(input: string, options?: Options) {
  const response = await http(input, options)
  return normalizeResponse<T>(response)
}
