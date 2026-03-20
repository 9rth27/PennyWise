const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

function parseOrigin(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function isLocalOrigin(origin: string): boolean {
  try {
    return LOCAL_HOSTNAMES.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export function resolveAppOrigin(currentOrigin?: string): string | undefined {
  const configuredOrigin = parseOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const runtimeOrigin = parseOrigin(currentOrigin);

  if (configuredOrigin) {
    if (!runtimeOrigin) {
      return configuredOrigin;
    }

    if (!isLocalOrigin(configuredOrigin) || isLocalOrigin(runtimeOrigin)) {
      return configuredOrigin;
    }
  }

  return runtimeOrigin || configuredOrigin;
}

export function normalizeNextPath(nextParam?: string | null, origin?: string): string {
  if (!nextParam) {
    return '/';
  }

  if (nextParam.startsWith('/')) {
    return nextParam.startsWith('//') ? '/' : nextParam;
  }

  if (origin) {
    try {
      const parsedUrl = new URL(nextParam, origin);
      if (parsedUrl.origin === origin) {
        const safePath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
        return safePath.startsWith('/') ? safePath : '/';
      }
    } catch {
      return '/';
    }
  }

  return '/';
}

type BuildAuthCallbackOptions = {
  currentOrigin?: string;
  next?: string | null;
};

export function buildAuthCallbackUrl({ currentOrigin, next }: BuildAuthCallbackOptions): string | undefined {
  const origin = resolveAppOrigin(currentOrigin);
  if (!origin) {
    return undefined;
  }

  const callbackUrl = new URL('/auth/callback', origin);
  callbackUrl.searchParams.set('next', normalizeNextPath(next, origin));
  return callbackUrl.toString();
}