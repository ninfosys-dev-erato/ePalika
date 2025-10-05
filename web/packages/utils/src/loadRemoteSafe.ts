import React from 'react';

// Provide the minimal webpack federation globals to satisfy TypeScript when
// using Webpack Module Federation. If you're using Vite or another bundler,
// these will be unused but harmless.
declare global {
  interface Window {
    [key: string]: any;
  }

  // Webpack federation runtime helpers (optional)
  // eslint-disable-next-line @typescript-eslint/naming-convention
  var __webpack_init_sharing__: ((scope: string) => Promise<void>) | undefined;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  var __webpack_share_scopes__: { default?: any } | undefined;
}

type RemoteModule<T = any> = { default: T } | T;

/**
 * Load a remote module (Module Federation) safely with an optional fallback.
 * Returns a module with a `default` export that is a React component by default.
 */
export async function loadRemoteSafe<T = React.FC<any>>(
  scope: string,
  module: string,
  fallback?: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  try {
    // Try to initialize sharing if runtime provides it (Webpack MF)
    if (typeof __webpack_init_sharing__ === 'function') {
      // initialize the default share scope
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await __webpack_init_sharing__('default');
    }

    const container = (window as any)[scope];
    if (!container) throw new Error(`Remote scope '${scope}' not found on window`);

    // If the container has init and share scopes exist, call init
    if (typeof container.init === 'function' && __webpack_share_scopes__?.default) {
      await container.init(__webpack_share_scopes__.default);
    }

    // container.get returns a factory function which may be sync or async
    const factoryGetter = await container.get(module);

    // factoryGetter might be a function that returns the module (sync) or a promise
    const factoryResult = factoryGetter && factoryGetter();

    // If the factory returned a promise, await it
    const loaded = factoryResult instanceof Promise ? await factoryResult : factoryResult;

    // The remote might export the module directly or as { default: ... }
    const mod: RemoteModule<T> = loaded as RemoteModule<T>;

    if ((mod as any).default) return mod as { default: T };

    // If it's the component itself, wrap it
    return { default: mod as unknown as T };
  } catch (err) {
    // Keep a clear console message for debugging
    // eslint-disable-next-line no-console
    console.error('loadRemoteSafe failed:', err);

    if (fallback) return fallback();

    // Default safe fallback component (avoid JSX in .ts files)
    const Fallback: React.FC = () =>
      React.createElement(
        'div',
        {
          style: {
            padding: '2rem',
            textAlign: 'center',
            color: '#555',
            fontFamily: 'sans-serif',
          },
        },
        'Failed to load remote module'
      );

    return Promise.resolve({ default: (Fallback as unknown) as T });
  }
}
