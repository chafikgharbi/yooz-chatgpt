import Browser from 'webextension-polyfill'

type NavigatorType = {
  brave: {
    isBrave: () => boolean
  }
}

export function getExtensionVersion() {
  return Browser.runtime.getManifest().version
}

export function _t(messageName: string, substitutions?: string[] | string) {
  return Browser.i18n?.getMessage(messageName, substitutions)
}

export function isBraveBrowser() {
  return (navigator as unknown as NavigatorType).brave?.isBrave()
}

export async function shouldShowRatingTip() {
  const { ratingTipShowTimes = 0 } = await Browser.storage.local.get('ratingTipShowTimes')
  if (ratingTipShowTimes >= 5) {
    return false
  }
  await Browser.storage.local.set({ ratingTipShowTimes: ratingTipShowTimes + 1 })
  return ratingTipShowTimes >= 2
}

