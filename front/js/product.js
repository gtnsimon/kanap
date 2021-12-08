const BASE_URL = 'https://kanapi.gtnsimon.dev/api/'
const PRODUCT_URL = id => (BASE_URL + 'products/' + id)

class ValidationError extends Error {
  /**
   * @param {ValidationEntryError[]} errors
   */
  constructor (errors) {
    super(`Erreur${errors.length >= 2 ? 's' : ''} de validation`)

    this.errors = errors
    this.nbErrors = errors.length
  }

  showErrors () {
    const messages = this.errors.map(err => err.message).join('\r\n')

    window.alert(messages)
  }
}

class ValidationEntryError extends Error {
  constructor (message, el) {
    super(message)

    this.el = el
  }
}

/**
 * Fetch product from API.
 *
 * @param {RequestInfo} input
 * @returns {Promise<Product>}
 */
function fetchProduct (input) {
  return fetch(input)
    .then((response) => {
      // is response status is valid to return to json?
      if ([ 200, 201 ].includes(response.status)) {
        return response.json()
      }

      // throw otherwise
      return Promise.reject(new Error(response))
    })
}

/**
 * Returns the product id from a valid URL.
 *
 * @param {string | URL} url A valid URL
 * @returns {string} The product id found in url
 */
function getProductId (url) {
  const Url = new URL(url)
  const productId = Url.searchParams.get('id')

  return productId
}

/**
 * Set page title (visible in browser tab).
 *
 * @param {string} title
 */
function setTitle (title) {
  const titleEl = document.head.querySelector('title')

  titleEl.innerText = title
}

/**
 * Create a select option.
 *
 * @param {string} value
 * @param {string} text
 * @return {HTMLOptionElement}
 */
function createOptionElement (value, text = value) {
  const option = document.createElement('option')

  option.innerText = text
  option.value = value

  return option
}

/**
 * Hydrate element with data.
 *
 * @param {HTMLElement} el Template element
 * @param {Product} data
 */
function hydrateProduct (el, data) {
  /** @type {HTMLElement} */
  const target = el.cloneNode(true)

  const imgParent = target.querySelector('.item__img')
  const img = document.createElement('img')

  const title = target.querySelector('#title')
  const price = target.querySelector('#price')
  const description = target.querySelector('#description')

  const colorsSelect = target.querySelector('#colors')

  // image
  img.alt = data.altTxt
  img.src = data.imageUrl;
  imgParent.appendChild(img)

  // title
  title.innerText = data.name
  // price
  price.innerText = data.price
  // price
  description.innerText = data.description

  // colors
  data.colors
    .map(color => createOptionElement(color))
    .forEach(element => colorsSelect.appendChild(element))

  // replace content with product infos
  el.parentElement.replaceChild(target, el)

  return target
}

/**
 * Validate user input to add to cart.
 *
 * @param {HTMLElement} el Template element
 * @param {Product} data
 */
function validateCartInput (el, data) {
  const errors = []

  /** @type {HTMLSelectElement} */
  const colorsSelect = el.querySelector('#colors')
  /** @type {HTMLInputElement} */
  const quantityInput = el.querySelector('#quantity')
  const minQuantity = quantityInput.min || 1
  const maxQuantity = quantityInput.max || 1

  const color = colorsSelect.value || null
  const quantity = quantityInput.valueAsNumber || 0

  // validate color
  if (!color) {
    errors.push(new ValidationEntryError('Veuillez choisir une couleur'))
  } else if (!data.colors.includes(color)) {
    errors.push(new ValidationEntryError('Couleur inconnue'))
  }

  // validate quantity
  if (!Number.isInteger(quantity)) {
    errors.push(new ValidationEntryError('Quantité invalide'))
  } else if (quantity < minQuantity || quantity > maxQuantity) {
    errors.push(new ValidationEntryError(`Veuillez choisir une quantité comprise entre ${minQuantity} et ${maxQuantity}`))
  }

  if (errors.length === 0) {
    return { color, quantity }
  }

  const err = new ValidationError(errors)

  throw err
}

/**
 * Returns cart from localStorage.
 *
 * @returns {Cart}
 */
function getCartFromStorage () {
  // read cart from storage
  const data = localStorage.getItem('cart') || null

  // cart doesn't exsits, return an empty cart
  if (!data) {
    return []
  }

  // try decode cart to JSON otherwise return an empty cart
  try {
    return JSON.parse(data)
  } catch (err) {
    console.error(err)

    return []
  }
}

/**
 * Write cart to storage.
 *
 * @param {Cart} cart
 * @returns {boolean} `true` if cart has been written to localStorage
 */
function writeCartToStorage (cart) {
  try {
    // save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart))

    return true
  } catch (err) {
    console.error(err)

    return false
  }
}

/**
 * Create a cart item entry.
 *
 * @param {Product} data
 * @param {CartItem['color']} color
 * @param {CartItem['quantity']} quantity
 *
 * @returns {CartItem}
 */
function createCartItem (data, color, quantity) {
  return {
    productId: data._id,
    color,
    quantity,
  }
}

/**
 * - Update quantity if an item already exists in cart matching id and color.
 * - Otherwise create an item with corresponding crietrias.
 *
 * @param {Cart} cart
 * @param {Product} data
 * @param {CartItem['color']} color
 * @param {CartItem['quantity']} quantity
 *
 * @returns {[ type: 'insert' | 'update', item: CartItem, index?: number ]} Indicate what kind of action to do with this item
 */
function upsertItemFromCart (cart, data, color, quantity) {
  /** @type {'insert' | 'update'} */
  let type
  /** @type {CartItem} */
  let item

  // get item from cart if exists or null
  const itemIdx = cart.findIndex(item => item.productId === data._id && item.color === color)
  item = cart[itemIdx] || null

  if (item) {
    // it is an update of quantity if an item already exsists with the color
    type = 'update'
    item = createCartItem(data, item.color, item.quantity + quantity)
  } else {
    // it is an insert otherwise
    type = 'insert'
    item = createCartItem(data, color, quantity)
  }

  return [ type, item, itemIdx ]
}

/**
 * Save a product to cart.
 *
 * @param {Product} data
 * @param {string} color
 * @param {number} quantity
 */
function saveToCart (data, color, quantity) {
  const cart = getCartFromStorage()
  const [ type, item, index ] = upsertItemFromCart(cart, data, color, quantity)

  switch (type) {
    case 'insert':
      cart.push(item)
      break
    case 'update':
      cart.splice(index, 1, item)
      break
  }

  return writeCartToStorage(cart)
}

/**
 * Handle add to cart click.
 *
 * @param {HTMLElement} el Element where to bind listeners
 * @param {Product} data
 */
function handleAddToCart (el, data) {
  /** @type {HTMLButtonElement} */
  const button = el.querySelector('#addToCart')

  button.addEventListener('click', (e) => {
    e.preventDefault()

    try {
      // get validated input
      const { color, quantity } = validateCartInput(el, data)

      // WIP: feedback but nothing is save
      const nexemplaires = quantity + ' exemplaire' + (quantity >= 2 ? 's' : '')

      // indicate if cart is updated
      if (saveToCart(data, color, quantity)) {
        const message = `Le canapé ${data.name} ${color} a été ajouté en ${nexemplaires} à votre panier`

        window.alert(message)
      } else {
        window.alert(`Une erreur est survenue. Le panier n'a pas été modifié.`)
      }
    } catch (err) {
      console.error(err)

      if (err instanceof ValidationError) {
        err.showErrors()
      }
    }
  })
}

/**
 * Fetch product and update DOM with its data.
 * If it fails to fetch it handles error nicely.
 *
 * @param {HTMLElement} el Element where to render product
 */
async function renderProduct (el) {
  try {
    const productId = getProductId(window.location.href)
    const product = await fetchProduct(PRODUCT_URL(productId))

    const hydratedEl = hydrateProduct(el, product)

    handleAddToCart(hydratedEl, product)
    setTitle(product.name)
  } catch (err) {
    console.error(err)
    // renderProductsError(el)
  }
}

document.addEventListener('DOMContentLoaded', function () {
  /** Product container where to render */
  const item = document.querySelector('.item')

  renderProduct(item)
})
