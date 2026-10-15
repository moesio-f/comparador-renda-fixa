export const ROUTES = ['comparador', 'taxa-equivalente', 'inflacao-implicita', 'como-calculamos'] as const;

export type Route = (typeof ROUTES)[number];

function parseHash(hash: string): { route: Route; params: URLSearchParams } {
  const [path = '', query = ''] = hash.replace(/^#\/?/, '').split('?');
  const route = (ROUTES as readonly string[]).includes(path) ? (path as Route) : 'comparador';
  return { route, params: new URLSearchParams(query) };
}

class Router {
  route = $state<Route>('comparador');
  params = $state(new URLSearchParams());

  constructor() {
    this.sync();
    window.addEventListener('hashchange', () => this.sync());
  }

  private sync() {
    const { route, params } = parseHash(location.hash);
    this.route = route;
    this.params = params;
  }

  /** Drops a query parameter without adding a history entry. */
  removeParam(name: string) {
    const params = new URLSearchParams(this.params);
    params.delete(name);
    const query = params.toString();
    history.replaceState(null, '', `#/${this.route}${query ? `?${query}` : ''}`);
    this.sync();
  }
}

export const router = new Router();

export function href(route: Route, section?: string): string {
  return `#/${route}${section ? `?secao=${section}` : ''}`;
}
