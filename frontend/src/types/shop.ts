export interface Product {
  _id: string
  title: string
  description: string
  price: number
  petType: string
  category: string
  imageUrl: string
  stock: number
}

export interface CartItem {
  productId: string
  title: string
  imageUrl: string
  price: number
  quantity: number
  subtotal: number
  stock: number
  hasStock: boolean
}

export interface Cart {
  items: CartItem[]
  totalItems: number
  total: number
}
