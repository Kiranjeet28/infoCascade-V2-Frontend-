import type { AnyRouter } from "@tanstack/react-router";

let routerRef: AnyRouter | null = null;

export function setAppRouter(router: AnyRouter) {
    routerRef = router;
}

export function getAppRouter() {
    return routerRef;
}
