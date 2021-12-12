export const BASE_URL = 'https://kanapi.gtnsimon.dev/api/'

export class ValidationError extends Error {
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

export class ValidationEntryError extends Error {
  constructor (message, el) {
    super(message)

    this.el = el
  }
}

/**
 * Sum all values.
 *
 * @param  {...number} values
 * @returns {number}
 */
export function sum (...values) {
  return values.reduce((acc, n) => acc + n, 0)
}

/**
 * Format price to fixed 2 digits according to locale.
 *
 * @param {number} value
 * @returns {string}
 */
export function localePrice (value) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Fetch data from API.
 *
 * @param {RequestInfo} input
 * @returns {Promise} Response data
 */
export function fetchData (input) {
  return fetch(input)
    .then((response) => {
      // is response status is valid to return to json?
      if (response.status === 200) {
        return response.json()
      }

      // throw otherwise
      return Promise.reject(new Error(response))
    })
}

/**
 * Returns cart from localStorage.
 *
 * @returns {Cart}
 */
export function getCartFromStorage () {
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
export function writeCartToStorage (cart) {
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
export function createCartItem (data, color, quantity) {
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
 * @param {number | (quantity: number) => number} quantity
 *
 * @returns {[ type: RecordsType, item?: CartItem, index?: number ]} Indicate what kind of action to do with this item
 */
export function createCartRecord (cart, data, color, quantity) {
  /** @type {RecordsType} */
  let type
  /** @type {CartItem} */
  let item

  // get item from cart if exists or null
  const itemIdx = cart.findIndex(item => item.productId === data._id && item.color === color)
  item = cart[itemIdx] || null

  // allow increment cart value on existing item
  const quantityValue = typeof quantity === 'function' ? quantity((item && item.quantity) || 0) : quantity

  if (item && (!quantityValue || quantityValue <= 0)) {
    type = 'remove'
  } else if (item) {
    // it is an update of quantity if an item already exsists with the color
    type = 'update'
    item = createCartItem(data, item.color, quantityValue)
  } else {
    // it is an insert otherwise
    type = 'insert'
    item = createCartItem(data, color, quantityValue)
  }

  return [ type, item, itemIdx ]
}

/**
 * Save a product to cart.
 *
 * @param {Product} data
 * @param {string} color
 * @param {number | (quantity: number) => number} quantity
 * @param {SaveHandlers} handlers Callback to run after wirtting to storage
 */
export function saveToCart (data, color, quantity, handlers = {}) {
  const cart = getCartFromStorage()
  const [ type, item, index ] = createCartRecord(cart, data, color, quantity)

  switch (type) {
    case 'remove':
      cart.splice(index, 1)
      break
    case 'insert':
      cart.push(item)
      break
    case 'update':
      cart.splice(index, 1, item)
      break
  }

  if (writeCartToStorage(cart)) {
    if (handlers && handlers[type] && typeof handlers[type] === 'function') {
      handlers[type](item)
    }

    return true
  }

  return false
}

/**
 * Sum all items' quantity.
 *
 * @param {HTMLElement} el Element where to write total articles
 * @param {CartProducts} cart
 */
export function computeQuantity (el, cart) {
  const total = sum(...cart.map(item => item.quantity))

  el.innerText = total

  return total
}

/**
 * Sum all items's price by quantity.
 *
 * @param {HTMLElement} el Element where to write total cart price
 * @param {CartProducts} cart
 */
export function computePriceByQuantity (el, cart) {
  const total = sum(...cart.map(item => item.price * item.quantity))

  el.innerText = localePrice(total)

  return total
}


/**
 * Create an object with tags' name as key and element as value.
 *
 * @param {...string} elements Tags' name to create
 * @returns {{ [key: string]: Element }}
 */
export function createElementFactory (...elements) {
  return elements.reduce((acc, element) => {
    const [ tag, key = tag ] = element.split(':').reverse()

    return {
      ...acc,
      [key]: document.createElement(tag)
    }
  }, {})
}

/**
 * Set page title (visible in browser tab).
 *
 * @param {string} title
 */
export function setDocumentTitle (title) {
  const titleEl = document.head.querySelector('title')

  titleEl.innerText = title
}
