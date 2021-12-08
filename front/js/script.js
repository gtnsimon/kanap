// @TODO: change BASE_URL for deployment
const BASE_URL = 'http://localhost:8080/api/'
const PRODUCTS_URL = BASE_URL + 'products'

/**
 * Fetch products from API.
 *
 * @param {RequestInfo} input
 * @returns {Promise<Products>}
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
 * Create an object with tags' name as key and element as value.
 *
 * @param {...string} elements Tags' name to create
 * @returns {{ [key: string]: Element }}
 */
function createElementFactory (...elements) {
  return elements.reduce((acc, element) => ({
    ...acc,
    [element]: document.createElement(element)
  }), {})
}

/**
 * Create a product element.
 *
 * @param {Product} data Date used to render element
 * @returns {HTMLLinkElement} The newly created element based on data
 */
function createProductElement (data) {
  /**
   * @type {{ a: HTMLLinkElement, article: HTMLElement, img: HTMLImageElement, h3: HTMLHeadingElement, p: HTMLParagraphElement }}
   */
  const { a, article, img, h3, p } = createElementFactory('a', 'article', 'img', 'h3', 'p')

  // description
  p.classList.add('productDescription')
  p.innerText = data.description

  // title
  h3.classList.add('productName')
  h3.innerText = data.name

  // image
  img.alt = data.altTxt
  img.src = data.imageUrl;

  // content
  [ img, h3, p ].forEach(child => article.appendChild(child))

  // link
  a.href = `./product.html?id=${data._id}`
  a.appendChild(article)

  return a
}

/**
 * Render products to DOM.
 *
 * @param {HTMLElement} el Element where to render products list
 * @param {Products} produts
 */
function renderProductsItems (el, produts) {
  // clone element to prevent updating DOM each time an element is appended
  const target = el.cloneNode()

  // create each product element from its data
  const elements = produts.map(data => createProductElement(data))

  // append each product to list
  elements.forEach(element => target.appendChild(element))

  // replace content with the list of products
  el.parentElement.replaceChild(target, el)
}

/**
 * Render an error while fetching products.
 *
 * @param {HTMLElement} el Element where to render error
 */
function renderProductsError (el) {
  // clone element to prevent updating DOM each time an element is appended
  const target = el.cloneNode()

  /** Wrapper to avoid parent flex to apply to children directly */
  const div = document.createElement('div')
  /** Error message */
  const p = document.createElement('p')
  /** Retry button */
  const button = document.createElement('button')

  p.innerText = 'Une erreur est survenue lors du chargement des produits.'
  button.innerText = 'Réessayer'

  // listen for retry
  button.addEventListener('click', (e) => {
    e.preventDefault()
    renderProducts(target)
  }, { once: true });

  // align text center using style as it is temporary
  div.style.textAlign = 'center';

  // add content to wrapper
  [ p, button ].forEach(element => div.appendChild(element))
  // set error content
  target.appendChild(div)

  // replace content with error content
  el.parentElement.replaceChild(target, el)
}

/**
 * Fetch products and render them to DOM.
 * If it fails to fetch it handles error nicely.
 *
 * @param {HTMLElement} el Element where to render products
 */
async function renderProducts (el) {
  try {
    const products = await fetchProduct(PRODUCTS_URL)

    renderProductsItems(el, products)
  } catch {
    renderProductsError(el)
  }
}

document.addEventListener('DOMContentLoaded', function () {
  /** Products container where to render */
  const items = document.querySelector('#items')

  renderProducts(items)
})
