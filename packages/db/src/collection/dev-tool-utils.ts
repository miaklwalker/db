// Check for devtools registry and register collection if available
import type { CollectionImpl } from './index'
import type { OptimisticChangeMessage } from '../types'

declare global {
  interface Window {
    __TANSTACK_DB_DEVTOOLS__?: {
      registerCollection: (
        collection: CollectionImpl<any, any, any> & { store: unknown },
      ) => (() => void) | void
      unregisterCollection: (collectionId: string) => void
      store?: {
        registerTransaction?: (transaction: any, collectionId: string) => void
      }
    }
  }
}

export function registerWithDevtools(
  collection: CollectionImpl<any, any, any>,
): void {
  // Skip registration if this is a devtools internal collection
  if (collection.config.__devtoolsInternal) {
    return
  }

  // Skip if already registered
  if ((collection as any).isRegisteredWithDevtools) {
    return
  }

  if (typeof window !== `undefined`) {
    const devtools = window.__TANSTACK_DB_DEVTOOLS__ as any
    if (devtools?.registerCollection) {
      const updateCallback = devtools.registerCollection(collection)
      if (updateCallback) {
        ;(collection as any).__devtoolsUpdateCallback = updateCallback
        ;(collection as any).isRegisteredWithDevtools = true
      } else {
        ;(collection as any).isRegisteredWithDevtools = false
      }
    } else {
      ;(collection as any).isRegisteredWithDevtools = false
    }
  }
}

// Helper function to trigger devtools updates
export function triggerDevtoolsUpdate(
  collection: CollectionImpl<any, any, any>,
): void {
  if (typeof window !== `undefined`) {
    const updateCallback = (collection as any).__devtoolsUpdateCallback
    if (typeof updateCallback === `function`) {
      updateCallback()
    }
  }
}

export interface PendingSyncedTransaction<
  T extends object = Record<string, unknown>,
> {
  committed: boolean
  operations: Array<OptimisticChangeMessage<T>>
}