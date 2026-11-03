// Nombres de los mensajes TCP entre el API Gateway y el market-service.
// Un solo lugar para que ambos lados nunca se desincronicen.
export const MARKET_SERVICE = 'MARKET_SERVICE';

export const MARKET_PATTERNS = {
  HEALTH_CHECK: { cmd: 'health_check' },
  PRODUCTS_LIST: { cmd: 'products_list' },
  PRODUCTS_GET: { cmd: 'products_get' },
  PRODUCTS_CREATE: { cmd: 'products_create' },
  PRODUCTS_UPDATE: { cmd: 'products_update' },
  PRODUCTS_DELETE: { cmd: 'products_delete' },
  CART_GET: { cmd: 'cart_get' },
  CART_ADD_ITEM: { cmd: 'cart_add_item' },
  CART_UPDATE_ITEM: { cmd: 'cart_update_item' },
  CART_REMOVE_ITEM: { cmd: 'cart_remove_item' },
  CART_CLEAR: { cmd: 'cart_clear' },
  CART_DELETE: { cmd: 'cart_delete' },
} as const;
