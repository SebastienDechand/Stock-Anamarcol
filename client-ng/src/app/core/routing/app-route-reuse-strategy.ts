import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

export class AppRouteReuseStrategy implements RouteReuseStrategy {
  private cache = new Map<string, DetachedRouteHandle>();

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return (
      route.outlet === 'primary' &&
      !!route.component &&
      !route.routeConfig?.children?.length &&
      !route.routeConfig?.loadChildren &&
      Object.keys(route.params).length === 0
    );
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const key = this.getKey(route);
    if (handle) {
      this.cache.set(key, handle);
    } else {
      this.cache.delete(key);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.cache.has(this.getKey(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.cache.get(this.getKey(route)) ?? null;
  }

  private getKey(route: ActivatedRouteSnapshot): string {
    return (
      route.pathFromRoot
        .flatMap((r) => r.url)
        .map((u) => u.toString())
        .filter(Boolean)
        .join('/') || 'root'
    );
  }
}
