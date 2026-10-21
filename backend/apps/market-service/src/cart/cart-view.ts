export interface CartItemView {
  productId: string;
  title: string;
  imageUrl: string;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
  hasStock: boolean;
}

export interface CartView {
  items: CartItemView[];
  totalItems: number;
  total: number;
}
