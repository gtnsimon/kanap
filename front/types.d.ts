type Products = Product[]

interface Product {
  colors: string[]
  _id: string
  name: string
  price: number
  imageUrl: string
  description: string
  altTxt: string
}
