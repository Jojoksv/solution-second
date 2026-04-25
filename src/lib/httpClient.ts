// ─── HTTP Client ──────────────────────────────────────────────────────────
// Thin axios wrapper.  All interceptors / auth / error handling live here.
// Never call axios directly from the rest of the app.

import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import { API_CONFIG } from '@/config'

function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: { 'Content-Type': 'application/json' },
  })

  // ── Request interceptor ────────────────────────────────────────────────
  client.interceptors.request.use(
    (config) => {
      // Attach auth token here if ever needed
      return config
    },
    (error) => Promise.reject(error),
  )

  // ── Response interceptor ───────────────────────────────────────────────
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
      const status: number | undefined = error.response?.status

      if (status === 401) console.warn('[HTTP] Unauthorized – 401')
      if (status === 503) console.warn('[HTTP] Service unavailable – 503')

      return Promise.reject(error)
    },
  )

  return client
}

export const httpClient = createHttpClient()
