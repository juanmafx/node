export function createRouter(routes) {
  const table = new Map(routes.map((route) => [route.path, route]));
  return { resolve: (path) => table.get(path) };
}
