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
  draggable?: boolean,
  beforeGenerateHook?: () => void,
  afterGenerateHook?: () => void
}

// Add useMemo useCallBack useLayoutEffect... for performance
function YoozCard({
  isSelection: __isSelection,
  isMessage: __isMessage,
  context: __context,
  prompt: __prompt,
  selectionRange,
  position,
  targetInput,
  beforeGenerateHook,
  afterGenerateHook,
  editableSelection,
  isFormInput,
  inputSelectionStart,
  inputSelectionEnd,
  draggable
}: Props) {

  const [loading, setLoading] = useState<boolean>(false)
  const [generating, setGenerating] = useState<boolean>(false)
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
  const contentRef = useRef(null)
  const ref = useRef(null)
  const bottomRef = useRef(null)
  const topMargin = isSelection ? 30 : 0

  const [showHistory, setShowHistory] = useState(!__prompt)
  const [promptHistory, setPromptHistory] = useState<string[]>([])

  useEffect(() => {
    Browser.storage.local.get('promptHistory').then((res) => {
      if (res.promptHistory) setPromptHistory(res.promptHistory)
    })
  }, [])

  const updatePromptHistory = (prompt: string) => {
    const newPromptHistory = [prompt, ...promptHistory].slice(0, 5)
    setPromptHistory(newPromptHistory)
    Browser.storage.local.set({ promptHistory: newPromptHistory })
  }

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

    let currentScrollTop = 0
    let isScrollingUp = false

    const onScroll = () => {
      if (contentRef.current.scrollTop > currentScrollTop) {
        isScrollingUp = false
      }
      else {
        isScrollingUp = true
      }
      currentScrollTop = contentRef.current.scrollTop
    }

    contentRef.current.addEventListener('scroll', onScroll)

    setShowHistory(false)
    const _context = context || (document.getElementById("yooz-context") as HTMLInputElement)?.value
    const _prompt = prompt || (document.getElementById("yooz-prompt") as HTMLInputElement)?.value
    if (!_prompt || _prompt === '') return
    updatePromptHistory(_prompt)
    setLoading(true)
    let newPrompt = _prompt
    if ((isSelection || isMessage) && _context) newPrompt = `${_context}\n\n${newPrompt}`
    // else if (isMessage && _context) newPrompt = `${newPrompt}:\n(${_context})`
    console.log("prompt", newPrompt)
    const port = Browser.runtime.connect()
    let response = ''
    beforeGenerateHook?.()
    const listener = (msg: any) => {
      if (msg.text) {
        response = msg.text
        setAnswer(msg)
        if (targetInput && !isSelection) {
          targetInput[targetInput.isContentEditable ? 'innerText' : 'value'] = msg.text
        }
        setGenerating(true)
      } else if (msg.error) {
        setError(msg.error)
        setGenerating(false)
      } else if (msg.event === 'DONE') {
        if (response && isSelection && editableSelection) replaceSelection(response)
        afterGenerateHook?.()
        setDone(true)
        setGenerating(false)
      } else {
        setGenerating(false)
      }
      setLoading(false)
      if (!isScrollingUp) bottomRef.current?.scrollIntoView()
    }
    port.onMessage.addListener(listener)
    port.postMessage({ question: newPrompt })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
      contentRef.current.removeEventListener('scroll', onScroll)
    }
  }

  const stopGenerating = () => {
    Browser.runtime.sendMessage({ type: 'STOP_GENERATING' })
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
        <div className="yooz-card-content" ref={contentRef}>
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
            <form autoComplete="on">
              <label className="yooz-card-label yooz-prompt-label">
                <div>{_t(isSelection ? "selectionPromptLabel" : "writingPromptLabel")}</div>
                <div className={`yooz-history-button ${showHistory ? 'yooz-active' : ''}`} onClick={() => setShowHistory(!showHistory)}>
                  {_t('history')}
                </div>
              </label>
              <textarea
                rows={2}
                autoComplete="on"
                id="yooz-prompt"
                className="yooz-card-textarea"
                placeholder={_t('promptPlaceholder')}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </form>
          </div>
          {(error === 'UNAUTHORIZED' || error === 'CLOUDFLARE') ?
            <a href="https://chat.openai.com" className="yooz-notif yooz-error">
              {_t('loginMessage')}{' '}
              <a href="https://chat.openai.com" target="_blank" rel="noreferrer">
                chat.openai.com
              </a>
              {retry > 0 &&
                (() => {
                  if (isBraveBrowser()) {
                    return (
                      null
                      // WIP Brave
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
                        {_t('loginMessageDesc')}
                      </span>
                    )
                  }
                })()}
            </a>
            : answer?.text ?
              <div style={{ marginTop: "10px" }}>
                <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true }]]}>
                  {answer.text}
                </ReactMarkdown>
                {done && showTip && (
                  <p className="italic mt-2">
                    {_t('ratingMessage')}{' '}
                    <a
                      href="https://chrome.google.com/webstore/detail/yooz-chatgpt/hhijegfgodpbaaalajoknihbgakjgdob"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Chrome Web Store
                    </a>
                  </p>
                )}
              </div>
              : (showHistory && promptHistory.length) ?
                <>
                  <div className='yooz-history-label'>{_t('history')}</div>
                  {promptHistory.map((prompt, index) => (
                    <div key={index}>
                      <div className="yooz-history-item" onClick={() => {
                        setShowHistory(false)
                        setPrompt(prompt)
                      }}>{prompt}</div>
                    </div>
                  ))}
                </>
                : null}
          <div ref={bottomRef} />
        </div>
        <div className="yooz-card-footer">
          <a
            className="yooz-issue"
            href="https://github.com/chafikgharbi/yooz-chatgpt/issues"
            target="_blank"
            rel="noreferrer"
          >
            {_t('optIssue')}
          </a>
          <button className="yooz-generate-button" onClick={(loading || generating) ? null : write}>
            {loading ? 'Loading...' : generating ? 'Generating...' : _t('submitButtonText')}
          </button>
          {/* // WIP stop generation */}
          {/* <button className="yooz-generate-button" onClick={!loading ? generating ? stopGenerating : write : null}>
            {loading ? 'Loading...' : generating ? 'Stop generating' : _t('submitButtonText')}
          </button> */}
        </div>
      </div>
    </Draggable>
  )
}

export default YoozCard
