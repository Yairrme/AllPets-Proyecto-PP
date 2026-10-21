// Nombres de los mensajes TCP entre el API Gateway y el market-service.
// Un solo lugar para que ambos lados nunca se desincronicen.
export const MARKET_SERVICE = 'MARKET_SERVICE';

export const MARKET_PATTERNS = {
  PRODUCTS_LIST: { cmd: 'products_list' },
  PRODUCTS_CREATE: { cmd: 'products_create' },
  CART_GET: { cmd: 'cart_get' },
  CART_ADD_ITEM: { cmd: 'cart_add_item' },
  CART_UPDATE_ITEM: { cmd: 'cart_update_item' },
  CART_REMOVE_ITEM: { cmd: 'cart_remove_item' },
  CART_CLEAR: { cmd: 'cart_clear' },
} as const;
