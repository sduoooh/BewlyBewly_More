import browser from 'webextension-polyfill'

function handleMessage(message: any) {
  // https://github.com/SocialSisterYi/bilibili-API-collect/blob/e379d904c2753fa30e9083f59016f07e89d19467/docs/user/info.md
  if (message.contentScriptQuery === 'getPeopleInfo') {
    const url = 'https://api.vc.bilibili.com/account/v1/user/cards?uids='
    return fetch(url + message.uids.join(','))
      .then(response => response.json())
      .then(data => (data))
      .catch(error => console.error(error))
  }
}

function handleConnect() {
  browser.runtime.onMessage.removeListener(handleMessage)
  browser.runtime.onMessage.addListener(handleMessage)
}

export function setupPeopleMsgLstnr() {
  browser.runtime.onConnect.removeListener(handleConnect)
  browser.runtime.onConnect.addListener(handleConnect)
}
