/* eslint-disable no-console */
import { onMessage } from 'webext-bridge'
import { createApp } from 'vue'
import App from './views/App.vue'
import { getCookie, setCookie, SVG_ICONS } from '~/utils'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
;(() => {
  console.info('[vitesse-webext] Hello world from content script')

  // communication example: send previous tab title from background page
  onMessage('tab-prev', ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
  })

  const currentUrl = document.URL

  if (
    /https?:\/\/bilibili.com\/?$/.test(currentUrl)
    || /https?:\/\/www.bilibili.com\/?$/.test(currentUrl)
    || /https?:\/\/bilibili.com\/\?spm_id_from=.*/.test(currentUrl)
    || /https?:\/\/www.bilibili.com\/\?spm_id_from=(.)*/.test(currentUrl)
  ) {
    // if current homepage is old version, redirect to new version
    if (`${getCookie('i-wanna-go-back')}` === '2') {
      setCookie('i-wanna-go-back', '-1', 1)
      location.reload()
    }
    else {
      document.querySelectorAll('script').forEach(script => script.remove())
      document.body.innerHTML = ''
    }

    const container = document.createElement('div')
    const root = document.createElement('div')
    const styleEl = document.createElement('link')
    styleEl.setAttribute('rel', 'stylesheet')
    styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
    container.id = 'bewly'
    container.appendChild(styleEl)
    container.appendChild(root)
    document.body.appendChild(container)
    createApp(App).mount(root)

    // inject svg icons
    const svgDiv = document.createElement('div')
    svgDiv.innerHTML = SVG_ICONS
    document.body.appendChild(svgDiv)
  }
})()