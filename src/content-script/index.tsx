import { render } from 'preact'
import Browser from 'webextension-polyfill'
import '../base.css'
import { config } from './site-configs'
import './styles.scss'
import { removeElementsByClass } from './utils'
import YoozCard from './YoozCard'
import { getUserConfig } from '../config'

async function run() {

  Browser.runtime.sendMessage({ status: "contentScriptLoaded" });

  const userConfig = await getUserConfig()

  const siteRegex = new RegExp(Object.keys(config).join('|'))
  const siteMatches = location.hostname.match(siteRegex)
  const siteName = siteMatches ? siteMatches[0] : null
  const siteConfig = siteName ? config[siteName] : null

  const body = document.body;

  const renderYoozButton = (target, insertHook = null, selection: boolean, containerStyle = '', size = 25) => {
    const button = document.createElement('div');
    button.className = 'yooz-button'
    button.classList.add(selection ? 'yooz-button-selection' : 'yooz-button-tool')
    button.setAttribute('style', `width:${size}px;height:${size}px;${containerStyle}`)
    button.innerHTML = `<svg
      style='display: block'
      width="${size}"
      height="${size}"
      viewBox="0 0 33.866664 33.866664"
      version="1.1"
      id="svg5"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:svg="http://www.w3.org/2000/svg">
      <defs
        id="defs2" />
      <g
        id="layer1">
        <circle
          style="fill:#405cf5;fill-opacity:1;stroke:none;stroke-width:1.85829;stroke-dasharray:none;stroke-opacity:1"
          id="path4849"
          cx="16.933332"
          cy="16.933332"
          r="16.933332" />
        <path
          id="path5650"
          style="fill:#ffffff;stroke-width:0.0925188"
          d="M 6.0388454,7.5930341 13.385135,16.438557 17.232382,13.236438 12.545495,7.5930341 Z" />
        <rect
          style="fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:0.763207;stroke-dasharray:none;stroke-opacity:1"
          id="rect5709"
          width="23.197762"
          height="7.1266232"
          x="13.648841"
          y="30.983917"
          transform="matrix(0.77061411,-0.63730204,0,1,0,0)" />
      </g>
    </svg>`;
    if (insertHook) {
      insertHook(button, target)
    } else {
      target.appendChild(button);
    }
    return button
  }

  const renderPlaceholder = (container = body) => {
    removeElementsByClass('yooz-button-selection')
    const currentPlaceholder = document.querySelector('.yooz-placeholder')
    if (currentPlaceholder) {
      render(null, document.querySelector('.yooz-placeholder'))
      removeElementsByClass('yooz-placeholder')
    }
    const yoozPlaceholder = document.createElement('div')
    yoozPlaceholder.className = 'yooz-placeholder'
    yoozPlaceholder.id = 'yooz-placeholder-' + Date.now()
    container.appendChild(yoozPlaceholder)
    return yoozPlaceholder
  }


  function checkAddedNode(addedNode: HTMLElement) {
    siteConfig.anchors.forEach(anchor => {
      if (anchor.condition(addedNode as HTMLElement)) {

        // Render Yooz button
        const button = renderYoozButton(
          addedNode,
          anchor.insertButtonHook,
          false,
          anchor.buttonStyle || '',
          anchor.buttonSize || 25
        )

        button.addEventListener('click', function (event) {
          event.stopPropagation()
          event.preventDefault()

          // Remove previous placeholder and add new
          const placeholder = renderPlaceholder(anchor.cardContainer(addedNode))

          /* WIP: select a message */
          const context = anchor.context ? anchor.context(addedNode) : null

          // Button pos
          const boundingRect = button.getBoundingClientRect()

          // Render Yooz card
          render(
            <YoozCard
              targetInput={anchor.targetInput(addedNode as HTMLElement)}
              isMessage={!!context}
              context={context}
              position={{ x: boundingRect.left + 40, y: boundingRect.top }}
              prompt={context ? anchor.contextPrompt : anchor.prompt || ''}
              beforeGenerateHook={() => anchor.beforeGenerateHook?.(addedNode)}
              afterGenerateHook={() => anchor.afterGenerateHook?.(addedNode)}
              draggable
            />,
            placeholder,
          )
        });
      }
    })
  }

  if (userConfig.SRButton) {
    const checkedElements = new Set()

    if (siteConfig?.anchors?.length) {
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            for (const addedNode of mutation.addedNodes) {
              if (checkedElements.has(addedNode)) continue
              checkAddedNode(addedNode as HTMLElement)

              // Check all descendant elements of the added node
              const descendantElements = (addedNode as HTMLElement)?.querySelectorAll ? (addedNode as HTMLElement).querySelectorAll("*") : []

              for (const descendantElement of descendantElements) {
                if (checkedElements.has(descendantElement)) continue
                checkAddedNode(descendantElement as HTMLElement)
                checkedElements.add(descendantElement)
              }
              checkedElements.add(addedNode)
            }
          }
        }
      })

      // Start observing the target node for mutations
      observer.observe(body, {
        attributes: false,
        childList: true,
        subtree: true
      });
    }
  }

  // Render components after text selection
  if (userConfig.selectionButton) {
    document.addEventListener('mouseup', (e) => {
      const selectedText = window.getSelection().toString();
      const selectionNoSpace = selectedText.replace(/(\r\n|\n|\r|\s)/gm, "")
      if (selectedText && selectionNoSpace !== '') {

        const selectionRange = window.getSelection().getRangeAt(0);
        const boundingRect = selectionRange.getBoundingClientRect();

        const button = renderYoozButton(body, null, true, `
      position: absolute;
      opacity: 0.8;
      top: ${boundingRect.top > 50 ?
            boundingRect.top + window.scrollY - 27 + 'px' :
            boundingRect.top + boundingRect.height + window.scrollY + 5 + 'px'};
      left: ${(boundingRect.left + boundingRect.width / 2 + window.scrollX + 5) + 'px'}
    `, 22)

        let hideButtonTimeout = setTimeout(() => {
          button.remove()
        }, 3000)

        button.addEventListener('mouseenter', () => {
          button.style.opacity = '1';
          clearTimeout(hideButtonTimeout)
        })

        button.addEventListener('mouseleave', () => {
          button.style.opacity = '0.8';
          hideButtonTimeout = setTimeout(() => {
            button.remove()
          }, 3000)
        })

        button.addEventListener('click', function (event) {
          event.preventDefault();

          const placeholder = renderPlaceholder(body)

          const currentSelection = window.getSelection()
          const selectionText = currentSelection.toString()
          const selectionRange = currentSelection.getRangeAt(0)

          // const editableSelection = selectionRange.closest()

          let selectionParent = null
          selectionParent = selectionRange.commonAncestorContainer;
          if (selectionParent.nodeType != 1) {
            selectionParent = selectionParent.parentNode;
          }

          render(
            <YoozCard
              position={{
                x: (boundingRect.left + boundingRect.width + 10),
                y: boundingRect.top + boundingRect.height + 10
              }}
              context={selectionText}
              selectionRange={selectionRange} key={Date.now()}
              isSelection
              draggable
              editableSelection={
                selectionParent?.isContentEditable ||
                selectionParent?.tagName?.toLowerCase() === 'input' ||
                selectionParent?.tagName?.toLowerCase() === 'textarea'
              }
            />,
            placeholder,
          )
        });
      }
    });
  }

  // Hide buttons when click outside
  document.addEventListener('mousedown', (event) => {
    const button = document.querySelector('.yooz-button-selection')
    if (button &&
      !(event.target as HTMLElement)?.classList.contains('yooz-button-selection') &&
      !(event.target as HTMLElement)?.closest('.yooz-button-selection')) {
      removeElementsByClass('yooz-button-selection')
    }
  });

  let lastMouseX = 0
  let lastMouseY = 0

  document.addEventListener('mousedown', (event) => {
    lastMouseX = event.clientX
    lastMouseY = event.clientY
  });

  Browser.runtime.onMessage.addListener(async (request) => {
    if (request.action == 'openYooz') {
      const selectedText = window.getSelection().toString();
      const selectionNoSpace = selectedText.replace(/(\r\n|\n|\r|\s)/gm, "")
      const isSelection = selectedText && selectionNoSpace !== ''

      let position = { x: window.innerWidth / 2 - 230, y: window.innerHeight / 2 }
      if (lastMouseX && lastMouseY) {
        position = {
          x: lastMouseX,
          y: lastMouseY
        }
      }

      const selectionRange = window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0) : null;
      const boundingRect = selectionRange ? selectionRange.getBoundingClientRect() : undefined;
      if (boundingRect?.left || boundingRect?.top) {
        position = {
          x: (boundingRect.left + boundingRect.width + 10),
          y: boundingRect.top + boundingRect.height + 10
        }
      }

      const editableElement = (document.activeElement as HTMLElement)?.isContentEditable ||
        document.activeElement?.tagName?.toLowerCase() === 'input' ||
        document.activeElement?.tagName?.toLowerCase() === 'textarea' ||
        !!document.activeElement?.closest('[contenteditable=true]')

      let context, contextPrompt, prompt, cardContainer, targetInput, beforeGenerateHook, afterGenerateHook = null
      if (siteConfig?.anchors) {
        siteConfig.anchors.forEach(anchor => {
          if (anchor.openCondition && anchor.openCondition(document.activeElement as HTMLElement)) {
            if (anchor?.context) context = anchor?.context(document.activeElement as HTMLElement)
            if (anchor.cardContainer) cardContainer = anchor.cardContainer(document.activeElement as HTMLElement)
            if (anchor.targetInput) targetInput = anchor.targetInput(document.activeElement as HTMLElement)
            if (anchor.beforeGenerateHook) beforeGenerateHook = () => anchor.beforeGenerateHook?.(document.activeElement as HTMLElement)
            if (anchor.afterGenerateHook) afterGenerateHook = () => anchor.afterGenerateHook?.(document.activeElement as HTMLElement)
            // if (anchor.beforeGenerateHook) console.log('AE', beforeGenerateHook())
            contextPrompt = anchor?.contextPrompt
            prompt = anchor?.prompt
          }
        })
      }

      if (!targetInput) {
        targetInput = editableElement ? document.activeElement : null
      }

      const isFormInput = targetInput?.tagName?.toLowerCase() === 'input' || targetInput?.tagName?.toLowerCase() === 'textarea'
      let inputSelectionStart = undefined
      let inputSelectionEnd = undefined
      if (isSelection && isFormInput) {
        inputSelectionStart = targetInput?.selectionStart
        inputSelectionEnd = targetInput?.selectionEnd
      }

      const placeholder = renderPlaceholder(cardContainer || body)

      render(
        <YoozCard
          position={position}
          prompt={prompt}
          context={isSelection ? selectedText : context}
          contextPrompt={contextPrompt}
          selectionRange={selectionRange || undefined}
          key={Date.now()}
          isMessage={context}
          isSelection={isSelection}
          draggable
          targetInput={targetInput}
          editableSelection={editableElement}
          isFormInput={isFormInput}
          inputSelectionStart={inputSelectionStart}
          inputSelectionEnd={inputSelectionEnd}
          beforeGenerateHook={beforeGenerateHook}
          afterGenerateHook={afterGenerateHook}
        />,
        placeholder,
      )
    }
  });
}

run()