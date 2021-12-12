type Products = Product[]
type Cart = CartItem[]
type CartProducts = CartProduct[]
type CartProduct = Product & Omit<CartItem, 'productId'>

type RecordsType = 'insert' | 'update' | 'remove'

type SaveHandlers = {
  [key in RecordsType]: (item: CartProduct) => void
}

type UpdateItemHandlers = {
  [key in RecordsType]: (productEl: HTMLElement, item: CartProduct) => void
}

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
