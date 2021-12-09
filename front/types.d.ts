type Products = Product[]
type Cart = CartItem[]
type CartProducts = CartProduct[]
type CartProduct = Product & Omit<CartItem, 'productId'>

interface Product {
  colors: string[]
  _id: string
  name: string
  price: number
  imageUrl: string
  description: string
  altTxt: string
}

interface CartItem {
  productId: Product['_id']
  quantity: number
  color: string
}

interface CartElement {
  item: HTMLElement
  imgParent: HTMLDivElement
  img: HTMLImageElement
  content: HTMLDivElement
  description: HTMLDivElement
  title: HTMLHeadingElement
  color: HTMLParagraphElement
  price: HTMLParagraphElement
  settings: HTMLDivElement
  settingsQuantity: HTMLDivElement
  quantityLabel: HTMLParagraphElement
  quantityInput: HTMLInputElement
  settingsDelete: HTMLDivElement
  deleteItem: HTMLParagraphElement
}
