import { getURLParam } from './utils.js'

document.addEventListener('DOMContentLoaded', async function () {
  /** @type {HTMLSpanElement} */
  const el = document.querySelector('#orderId')

  /** @type {string} */
  const orderId = getURLParam(window.location.href, 'orderId')

  el.innerText = orderId
})
