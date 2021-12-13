import { BASE_URL, getCartFromStorage, computeQuantity, computePriceByQuantity, fetchData, localePrice, createElementFactory, saveToCart, writeCartToStorage } from './utils.js'

const PRODUCTS_URL = BASE_URL + 'products'
const ORDER_URL = PRODUCTS_URL + '/order'

/**
 * Map cart item with product data.
 *
 * @param {CartItem} item
 * @param {Products} products
 *
 * @returns {CartProduct}
 */
function mapCartItem (products, { productId, ...item }) {
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
 * @returns {{ target: HTMLElement, items: CartProducts }}
 */
function renderCartItems (el, products) {
  const target = el.cloneNode()
  const items = getCartProducts(products)
  const elements = items.map(item => createCartElement(item))

  // append each product to list
  elements.forEach(element => target.appendChild(element))

  // replace content with the list of products
  el.parentElement.replaceChild(target, el)

  return target
}

/**
 * Update cart item.
 *
 * @param {HTMLElement} el Parent of all cart elements
 * @param {HTMLElement} triggerEl Cart item element or one of its child
 * @param {number} quantity Quantity to set in cart
 * @param {Products} products
 * @param {UpdateItemHandlers} handlers
 */
function updateItem (el, triggerEl, quantity, products, handlers) {
  /** @type {HTMLElement} */
  const productEl = Array.from(el.children).find(child => child.contains(triggerEl) || child === triggerEl)

  if (productEl) {
    const { id: productId, color } = productEl.dataset
    const product = (productId && products.find(product => product._id === productId)) || null

    /** @type {SaveHandlers} */
    const wrappedHandlers = Object.fromEntries(Object.entries(handlers).map(([ k, fn ]) => ([ k, item => fn(productEl, item) ])))

    if (product && productId && color) {
      if (saveToCart(product, color, quantity, wrappedHandlers)) {
        updateCartState(products)
      }
    }
  }
}

/**
 * Registers event to listen for change on items.
 *
 * @param {HTMLElement} el Parent of all cart elements
 * @param {Products} products
 */
function handleItemsChange (el, products) {
  /** @type {NodeListOf<HTMLInputElement>} */
  const itemQuantityList = el.querySelectorAll('.itemQuantity')
  /** @type {NodeListOf<HTMLInputElement>} */
  const deleteItemList = el.querySelectorAll('.deleteItem')

  /** @type {UpdateItemHandlers} */
  const handlers = {
    remove (productEl) {
      el.removeChild(productEl)
    },
  }

  /**
   * @this {HTMLInputElement}
   * @param {InputEvent} event
   */
  function onQuantityChange (event) {
    const quantity = this.valueAsNumber

    // prevent removing element on empty quantity when typing
    return quantity && updateItem(el, event.currentTarget, quantity, products, handlers)
  }

  /**
   * @this {HTMLInputElement}
   * @param {InputEvent} event
   */
  function onDelete (event) {
    return updateItem(el, event.currentTarget, 0, products, handlers)
  }

  itemQuantityList.forEach(inputQuantity => inputQuantity.addEventListener('change', onQuantityChange))
  deleteItemList.forEach(deleteItem => deleteItem.addEventListener('click', onDelete))
}

/**
 * Fetch products and render cart to DOM.
 * If it fails to fetch it handles error nicely.
 *
 * @param {HTMLElement} el Element where to render cart
 * @param {Products} products
 */
async function renderCart (el, products) {
  const target = renderCartItems(el, products)

  updateCartState(products)
  handleItemsChange(target, products)
}

/**
 * @this {HTMLFormElement}
 * @param {Event} event
 */
async function onFormSubmit (event) {
  event.preventDefault()

  const contact = Object.fromEntries((new FormData(this)).entries())
  const products = getCartFromStorage().map(({ productId }) => productId)

  const headers = { 'Content-Type': 'application/json; charset=UTF-8' }
  const body = JSON.stringify({ contact, products })

  try {
    const req = new Request(ORDER_URL, { method: 'POST', headers, body })
    const { orderId } = await fetchData(req)

    const confirmationURL = new URL(window.location.href)

    confirmationURL.pathname = confirmationURL.pathname.replace(/cart.html$/, 'confirmation.html')
    confirmationURL.searchParams.set('orderId', orderId)

    writeCartToStorage([])
    window.location.href = confirmationURL.toString()
  } catch (err) {
    console.error(err)
  }
}

/**
 * @param {HTMLFormElement} formEl
 * @param {CartProducts} items
 */
function handleForm (formEl, items) {
  if (items.length) {
    formEl.setAttribute('disabled', false)
    formEl.style.display = ''

    formEl.removeEventListener('submit', onFormSubmit)
    formEl.addEventListener('submit', onFormSubmit)
  } else {
    formEl.setAttribute('disabled', true)
    formEl.style.display = 'none'
  }
}

const getItemsEl = () => document.querySelector('#cart__items')

const getCartProducts = products => {
  const cart = getCartFromStorage()

  return cart.map(item => mapCartItem(products, item)).filter(Boolean)
}

const updateCartState = products => {
  const items = getCartProducts(products)

  computeQuantity(document.querySelector('#totalQuantity'), items)
  computePriceByQuantity(document.querySelector('#totalPrice'), items)
  handleForm(document.querySelector('.cart__order__form'), items)
}

document.addEventListener('DOMContentLoaded', async function () {
  /** @type {Products} */
  const products = await fetchData(PRODUCTS_URL)

  /** Cart container where to render */
  renderCart(getItemsEl(), products)
})
