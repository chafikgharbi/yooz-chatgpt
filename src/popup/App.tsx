import { GearIcon } from '@primer/octicons-react'
import { useState } from 'preact/hooks'
import { useCallback, useEffect } from 'react'
// import useSWR from 'swr'
import Browser from 'webextension-polyfill'
import '../base.css'
import { _t } from '../utils'

const isChrome = /chrome/i.test(navigator.userAgent)

function App() {
  const [contentScriptLoaded, setContentScriptLoaded] = useState(false)

  useEffect(() => {
    Browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      Browser.tabs
        .sendMessage(tabs[0]?.id, {
          action: 'Test',
        })
        .then(() => {
          setContentScriptLoaded(true)
        })
        .catch((error) => {
          setContentScriptLoaded(false)
        })
    })
  }, [])

  const reloadTab = () => {
    Browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      Browser.tabs.reload(tabs[0]?.id)
    })
  }

  const openOptionsPage = useCallback(() => {
    Browser.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' })
  }, [])

  const openShortcutsPage = useCallback(() => {
    // Browser.storage.local.set({ hideShortcutsTip: true })
    Browser.tabs.create({ url: 'chrome://extensions/shortcuts' })
  }, [])

  const openYoozCard = useCallback(() => {
    Browser.runtime.sendMessage({ type: 'OPEN_YOOZ_CARD' })
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex flex-row items-center px-4 py-4 text-white"
        style={{ background: 'rgb(64, 92, 245)' }}
      >
        <svg
          width="28"
          height="28"
          style={{ display: 'block' }}
          viewBox="0 0 33.866664 33.866664"
          version="1.1"
          id="svg5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs id="defs2" />
          <g id="layer1">
            <circle
              style={{
                fill: '#ffffff',
                fillOpacity: 1,
                stroke: 'none',
                strokeWidth: 1.85829,
                strokeDasharray: 'none',
                strokeOpacity: 1,
              }}
              id="path4849"
              cx="16.933332"
              cy="16.933332"
              r="16.933332"
            />
            <path
              id="path5650"
              style={{ fill: '#405cf5', fillOpacity: 1, strokeWidth: 0 }}
              d="M 6.0388454,7.5930341 13.385135,16.438557 17.232382,13.236438 12.545495,7.5930341 Z"
            />
            <rect
              style={{
                fill: '#405cf5',
                fillOpacity: 1,
                stroke: 'none',
                strokeWidth: 0.763207,
                strokeDasharray: 'none',
                strokeOpacity: 1,
              }}
              id="rect5709"
              width="23.197762"
              height="7.1266232"
              x="13.648841"
              y="30.983917"
              transform="matrix(0.77061411,-0.63730204,0,1,0,0)"
            />
          </g>
        </svg>
        <p className="text-sm font-semibold m-0 ml-2">Yooz - ChatGPT Copilot</p>
        <div className="grow"></div>
        <span className="cursor-pointer leading-[0]" onClick={openOptionsPage}>
          <GearIcon size={16} />
        </span>
      </div>
      <a
        onClick={contentScriptLoaded ? openYoozCard : reloadTab}
        className="text-sm block border-b-2 border-solid border-gray-200 px-4 py-4 hover:bg-gray-200 cursor-pointer"
      >
        {contentScriptLoaded ? (
          _t('popupOpenCard')
        ) : (
          <span>
            <strong>Please reload the website you are on and then use the extension.</strong>
            <small className="block mt-2">
              {
                "Make sure you're on a regular website, not browser settings or Chrome extensions store (chrome.google.com)"
              }
            </small>
          </span>
        )}
      </a>
      {contentScriptLoaded && (
        <>
          {isChrome && (
            <a
              onClick={openShortcutsPage}
              className="text-sm border-b-2 border-solid border-gray-200 block px-4 py-4 hover:bg-gray-200 cursor-pointer"
            >
              {_t('popupShortcut')}
            </a>
          )}
          <a
            onClick={openOptionsPage}
            className="text-sm block px-4 py-4 hover:bg-gray-200 cursor-pointer"
          >
            {_t('popupSettings')}
          </a>
        </>
      )}
    </div>
  )
}

export default App
