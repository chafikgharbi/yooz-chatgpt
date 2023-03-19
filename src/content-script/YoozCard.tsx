import { useEffect, useRef, useState } from "react"
import Browser from "webextension-polyfill"
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import Draggable from 'react-draggable';
import { Answer } from "../messaging";
import { render } from "preact"
import { isBraveBrowser, _t } from "../utils"

interface Props {
  context?: string,
  isSelection?: boolean
  selectionRange?: Range
  editableSelection?: boolean
  inputSelectionStart?: number
  inputSelectionEnd?: number
  targetInput?: HTMLElement | HTMLFormElement
  isFormInput?: boolean
  isMessage?: boolean
  position?: { x: number, y: number }
  prompt?: string
  contextPrompt?: string
  draggable?: boolean
}

// Add useMeme useCallBack useLayoutEffect... for performance
function YoozCard({
  isSelection: __isSelection,
  isMessage: __isMessage,
  context: __context,
  prompt: __prompt,
  selectionRange,
  position,
  targetInput,
  editableSelection,
  isFormInput,
  inputSelectionStart,
  inputSelectionEnd,
  draggable
}: Props) {

  const [loading, setLoading] = useState<boolean>(false)
  const [isSelection, setIsSelection] = useState<boolean>(__isSelection)
  const [isMessage, setIsMessage] = useState<boolean>(__isMessage)
  const [context, setContext] = useState<string>(__context)
  const [prompt, setPrompt] = useState(__prompt || '')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [done, setDone] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [width, setWidth] = useState(0)
  const [hegiht, setHeight] = useState(0)
  const ref = useRef(null)
  const bottomRef = useRef(null)
  const topMargin = isSelection ? 30 : 0
  useEffect(() => {
    setWidth(ref?.current?.clientWidth || 0)
    setHeight(ref?.current?.clientHeight || 0)
  }, [])

  const replaceSelection = (text) => {
    if (isSelection && isFormInput) {
      const allText = (targetInput as HTMLFormElement).value;
      (targetInput as HTMLFormElement).value = allText.substring(0, inputSelectionStart) + text + allText.substring(inputSelectionEnd, allText.length);
    } else {
      selectionRange.deleteContents();
      selectionRange.insertNode(document.createTextNode(text));
    }
  }

  const write = () => {
    const _context = context || (document.getElementById("yooz-context") as HTMLInputElement)?.value
    const _prompt = prompt || (document.getElementById("yooz-prompt") as HTMLInputElement)?.value
    if (!_prompt || _prompt === '') return
    setLoading(true)
    let newPrompt = _prompt
    // TODO get context from the input
    if (isSelection && _context) newPrompt = `${newPrompt}: "${_context}"`
    else if (isMessage && _context) newPrompt = `${newPrompt}:\n"${_context}"`
    console.log("prompt", newPrompt)
    const port = Browser.runtime.connect()
    let response = ''
    // TODO make it dependent
    if (isMessage) document.querySelector('.msg-form__placeholder')?.classList?.remove("msg-form__placeholder");
    const listener = (msg: any) => {
      if (msg.text) {
        response = msg.text
        setAnswer(msg)
        if (targetInput && !isSelection) {
          targetInput[targetInput.isContentEditable ? 'innerText' : 'value'] = msg.text
        }
        setLoading(false)
      } else if (msg.error) {
        // TODO maybe make error logger
        setError(msg.error)
        setLoading(false)
      } else if (msg.event === 'DONE') {
        if (response && isSelection && editableSelection) replaceSelection(response)
        // TODO make it dependent
        if (isMessage) document.querySelector('.msg-form__send-button')?.removeAttribute('disabled')
        setDone(true)
        setLoading(false)
      }
      setLoading(false)
      bottomRef.current?.scrollIntoView()
    }
    port.onMessage.addListener(listener)
    port.postMessage({ question: newPrompt })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }

  useEffect(() => {
    if (!retry) return
    write()
  }, [retry])

  // retry error on focus
  useEffect(() => {
    const onFocus = () => {
      if (error && (error == 'UNAUTHORIZED' || error === 'CLOUDFLARE')) {
        setError('')
        setRetry((r) => r + 1)
      }
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [error])

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [error, retry])

  // TODO useful to get user config
  // useEffect(() => {
  //   getUserConfig().then((config) => setConfig(config))
  // }, [])

  // TODO save last position after drag in the website
  return (
    <Draggable
      disabled={!draggable}
      handle=".yooz-card-header"
      defaultPosition={position}
    // bounds={{ left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }}
    >
      <div className="yooz-card" ref={ref} style={position ? {
        marginTop: position.y - hegiht - topMargin > 0 ? - hegiht - topMargin : - position.y + 10,
        marginLeft: position.x + width > window.innerWidth ? - (position.x + width - window.innerWidth + 10) : 0
      } : {}}>
        <div className="yooz-card-header">
          <div>
            <svg
              width="28"
              height="28"
              style={{ display: 'block' }}
              viewBox="0 0 33.866664 33.866664"
              version="1.1"
              id="svg5"
              xmlns="http://www.w3.org/2000/svg">
              <defs
                id="defs2" />
              <g
                id="layer1">
                <circle
                  style={{ fill: '#ffffff', fillOpacity: 1, stroke: 'none', strokeWidth: 1.85829, strokeDasharray: 'none', strokeOpacity: 1 }}
                  id="path4849"
                  cx="16.933332"
                  cy="16.933332"
                  r="16.933332" />
                <path
                  id="path5650"
                  style={{ fill: '#405cf5', fillOpacity: 1, strokeWidth: 0 }}
                  d="M 6.0388454,7.5930341 13.385135,16.438557 17.232382,13.236438 12.545495,7.5930341 Z" />
                <rect
                  style={{ fill: '#405cf5', fillOpacity: 1, stroke: 'none', strokeWidth: 0.763207, strokeDasharray: 'none', strokeOpacity: 1 }}
                  id="rect5709"
                  width="23.197762"
                  height="7.1266232"
                  x="13.648841"
                  y="30.983917"
                  transform="matrix(0.77061411,-0.63730204,0,1,0,0)" />
              </g>
            </svg>
          </div>
          <div style={{ display: 'flex' }}>
            <div className="yooz-card-close" onClick={() => {
              render(null, document.querySelector('.yooz-placeholder'))
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "20px", height: "20px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
          </div>
        </div>
        <div className="yooz-card-content">
          {/* TODO: make types clickable */}
          <div className="yooz-types">
            <div
              className={`yooz-type ${!(isSelection || isMessage) && "yooz-type-active"}`}
              onClick={() => {
                setIsSelection(false)
                setIsMessage(false)
              }}>
              {_t('tabNew')}
            </div>
            <div
              className={`yooz-type ${isMessage && "yooz-type-active"}`}
              onClick={() => {
                setIsSelection(false)
                setIsMessage(true)
              }}>
              {_t('tabReply')}
            </div>
            <div
              className={`yooz-type ${isSelection && "yooz-type-active"}`}
              onClick={() => {
                setIsSelection(true)
                setIsMessage(false)
              }}>
              {_t('tabContext')}
            </div>
          </div>
          {(isSelection || isMessage) &&
            // <div className="my-3">
            //   <div className="text-md">The selected text</div>
            //   <div className="text-md font-bold">{isSelection && selectionText && selectionText !== '' ? selectionText : ''}</div>
            // </div>
            <div className="yooz-card-row">
              <label className="yooz-card-label">{_t(isSelection ? "selectionLabel" : "messageLabel")}</label>
              <textarea
                rows={10}
                id="yooz-context"
                className="yooz-card-textarea"
                placeholder={_t('contextPlaceholder')}
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
          }
          <div className="yooz-card-row">
            <label className="yooz-card-label">{_t(isSelection ? "selectionPromptLabel" : "writingPromptLabel")}</label>
            <textarea
              rows={2}
              id="yooz-prompt"
              className="yooz-card-textarea"
              placeholder={_t('promptPlaceholder')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          {(error === 'UNAUTHORIZED' || error === 'CLOUDFLARE') ?
            <div className="yooz-notif yooz-error">
              {/* // TODO translate */}
              Please login and pass Cloudflare check at{' '}
              <a href="https://chat.openai.com" target="_blank" rel="noreferrer">
                chat.openai.com
              </a>
              {retry > 0 &&
                (() => {
                  if (isBraveBrowser()) {
                    return (
                      null
                      // TODO
                      // <span className="block mt-2">
                      //   Still not working? Follow{' '}
                      //   <a href="https://github.com/wong2/chat-gpt-google-extension#troubleshooting">
                      //     Brave Troubleshooting
                      //   </a>
                      // </span>
                    )
                  } else {
                    return (
                      <span className="italic block mt-2 text-xs">
                        OpenAI requires passing a security check every once in a while. If this keeps
                        happening, change AI provider to OpenAI API in the extension options.
                      </span>
                    )
                  }
                })()}
            </div>
            : answer?.text ?
              <div
                // TODO remove all tailwind
                className="my-3">
                <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true }]]}>
                  {answer.text}
                </ReactMarkdown>
                {done && showTip && (
                  <p className="italic mt-2">
                    Enjoy this extension? Give us a 5-star rating at{' '}
                    <a
                      // TODO: link to our page that redirect chrome extension (remove the current link)
                      href="https://chatgpt4google.com/chrome?utm_source=rating_tip"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Chrome Web Store
                    </a>
                  </p>
                )}
              </div>
              : null}
          <div ref={bottomRef} />
        </div>
        <div className="yooz-card-footer">
          <button className="yooz-generate-button" onClick={write}>{loading ? 'Loading...' : _t('submitButtonText')}</button>
        </div>
      </div>
    </Draggable>
  )
}

export default YoozCard
