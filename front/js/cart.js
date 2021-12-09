const BASE_URL = 'https://kanapi.gtnsimon.dev/api/'
const PRODUCTS_URL = BASE_URL + 'products'

/**
 * Fetch products from API.
 *
 * @param {RequestInfo} input
 * @returns {Promise<Products>}
 */
function fetchProducts (input) {
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
 * Create an object with tags' name as key and element as value.
 *
 * @param {...string} elements Tags' name to create
 * @returns {{ [key: string]: Element }}
 */
function createElementFactory (...elements) {
  return elements.reduce((acc, element) => {
    const [ tag, key = tag ] = element.split(':').reverse()

    return {
      ...acc,
      [key]: document.createElement(tag)
    }
  }, {})
}

/**
 * Summ all values.
 *
 * @param  {...number} values
 * @returns {number}
 */
function sum (...values) {
  return values.reduce((acc, n) => acc + n, 0)
}

/**
 * Format price to fixed 2 digits according to locale.
 *
 * @param {number} value
 * @returns {string}
 */
function localePrice (value) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
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
 * Map cart item with product data.
 *
 * @param {CartItem} item
 * @param {Products} products
 *
 * @returns {CartProduct}
 */
function mapCartItem ({ productId, ...item }, products) {
  const product = products.find(({ _id }) => productId === _id)

  if (!product) {
    return null
  }

  return {
    ...product,
    ...item,
  }
}


/**
 * Create a cart element.
 *
 * @param {CartProduct} data
 */
function createCartElement (data) {
  /** @type {CartElement} */
  const {
    item, imgParent, img, content, description, title, color, price, settings, settingsQuantity, quantityLabel, quantityInput, settingsDelete, deleteItem,
  } = createElementFactory(
    'item:article',
      'imgParent:div',
        'img',
      'content:div',
        'description:div',
          'title:h2',
          'color:p',
          'price:p',
      'settings:div',
        'settingsQuantity:div',
          'quantityLabel:p',
          'quantityInput:input',
        'settingsDelete:div',
          'deleteItem:p'
    )

  // image
  img.alt = data.altTxt
  img.src = data.imageUrl

  imgParent.classList.add('cart__item__img')
  imgParent.appendChild(img)

  // description
  title.innerText = data.name
  color.innerText = data.color
  price.innerText = `${localePrice(data.price)} €`

  description.classList.add('cart__item__content__description');
  [ title, color, price ].forEach(child => description.appendChild(child))

  // settings quantity
  quantityLabel.innerText = 'Qté : '

  quantityInput.type = 'number'
  quantityInput.name = 'itemQuantity'
  quantityInput.min = '1'
  quantityInput.max = '100'
  quantityInput.valueAsNumber = data.quantity
  quantityInput.classList.add('itemQuantity')

  settingsQuantity.classList.add('cart__item__content__settings__quantity');
  [ quantityLabel, quantityInput ].forEach(child => settingsQuantity.appendChild(child))

  // settings delete
  deleteItem.innerText = 'Supprimer'
  deleteItem.classList.add('deleteItem')

  settingsDelete.classList.add('cart__item__content__settings__delete')
  settingsDelete.appendChild(deleteItem)

  // settings
  settings.classList.add('cart__item__content__settings');
  [ settingsQuantity, settingsDelete ].forEach(child => settings.appendChild(child))

  // content
  content.classList.add('cart__item__content');
  [ description, settings ].forEach(child => content.appendChild(child))

  // article
  item.dataset.id = data._id
  item.dataset.color = data.color

  item.classList.add('cart__item');
  [ imgParent, content ].forEach(child => item.appendChild(child))

  return item
}

/**
 * Render cart items to DOM.
 *
 * @param {HTMLElement} el
 * @param {Products} products
 *
 * @returns {CartProducts}
 */
function renderCartItems (el, products) {
  const cart = getCartFromStorage()

  const target = el.cloneNode()
  const items = cart.map(item => mapCartItem(item, products)).filter(Boolean)
  const elements = items.map(item => createCartElement(item))

  // append each product to list
  elements.forEach(element => target.appendChild(element))

  // replace content with the list of products
  el.parentElement.replaceChild(target, el)

  return items
}

/**
 * Sum all items' quantity.
 *
 * @param {CartProducts} items
 */
function countArticles (items) {
  const total = sum(...items.map(item => item.quantity))

  document.querySelector('#totalQuantity').innerText = total

  return total
}

/**
 * Sum all items's price by quantity.
 *
 * @param {CartProducts} items
 */
function computeTotalPrice (items) {
  const total = sum(...items.map(item => item.price * item.quantity))

  document.querySelector('#totalPrice').innerText = localePrice(total)

  return total
}

/**
 * Fetch products and render cart to DOM.
 * If it fails to fetch it handles error nicely.
 *
 * @param {HTMLElement} el Element where to render cart
 */
async function renderCart (el) {
  const products = await fetchProducts(PRODUCTS_URL)
  const items = renderCartItems(el, products)

  countArticles(items)
  computeTotalPrice(items)
}

document.addEventListener('DOMContentLoaded', function () {
  /** Cart container where to render */
  const items = document.querySelector('#cart__items')

  renderCart(items)
})
