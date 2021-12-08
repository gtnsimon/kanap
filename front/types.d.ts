type Products = Product[]
type Cart = CartItem[]

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
