import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupWorker } from 'msw/browser'
import { test as base } from 'vitest'

const worker = setupWorker()

export const test = base.extend<{ api: typeof worker }>({
  api: [
    async ({}, use) => {
      await worker.start({ quiet: true, onUnhandledFrame: 'error' })
      await use(worker)
      worker.resetHandlers()
      worker.stop()
    },
    { auto: true },
  ],
})

export const respondWith = (path: string, body: (url: URL) => JsonBodyType, init?: ResponseInit) =>
  http.get(path, ({ request }) => HttpResponse.json(body(new URL(request.url)), init))
