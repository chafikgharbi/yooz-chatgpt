import { _t } from "../utils"

export interface siteConfig {
  anchors: {
    // TODO maybe rename to buttonCOndition
    condition: (node: HTMLElement) => boolean
    openCondition?: (node: HTMLElement) => boolean
    prompt?: string,
    contextPrompt?: string
    context?: (anchor: HTMLElement) => string
    targetInput?: (anchor: HTMLElement) => HTMLElement
    insertButtonHook?: (button: HTMLElement, target: HTMLElement) => void
    cardContainer?: (anchor: HTMLElement) => HTMLElement
    buttonSize?: number,
    buttonStyle?: string
  }[]
}

export const config: Record<string, siteConfig> = {
  google: {
    anchors: [
      // Gmail
      {
        condition: (node) => node?.classList?.contains('btC'),
        openCondition: (node) => !!node.closest('.editable'),
        buttonSize: 20,
        buttonStyle: 'width: 40px;height: 20px;display: flex;align-items: center;justify-content: center;',
        insertButtonHook: (button, target) => target.insertBefore(button, target.children[1]),
        cardContainer: () => document.body,
        prompt: _t('emailPrompt'),
        context: (anchor) => {
          const parent = anchor.closest('.G3.G2')
          if (!parent) return ''
          const context = `Email:\n${(parent.querySelector('.a3s.aiL') as HTMLElement).innerText}\n\nReply:`
          return context
        },
        contextPrompt: _t('replyPrompt'),
        targetInput: (anchor) => anchor.closest('.iN').querySelector('.editable')
      }
    ]
  },
  linkedin: {
    anchors: [
      // Linkedin post
      {
        condition: (node) => node?.classList?.contains('share-creation-state__additional-toolbar') ||
          node?.classList?.contains('share-creation-state__additional-toolbar-with-redesigned-detours'),
        openCondition: (node) => !!node.closest('.share-creation-state__text-editor'),
        insertButtonHook: (button, target) => target.appendChild(button),
        prompt: _t('linkedinPostPrompt'),
        cardContainer: (anchor = null) => anchor.closest('.share-box'),
        targetInput: (anchor) => anchor.closest('.artdeco-modal').querySelector('.ql-editor')
      },
      // Linkedin message
      {
        condition: (node) => node?.classList?.contains('msg-form__left-actions'),
        openCondition: (node) => !!node.closest('.msg-form__contenteditable'),
        buttonStyle: 'margin-top: 6px;margin-left: 6px;',
        cardContainer: () => document.body,
        buttonSize: 20,
        prompt: _t('messagePrompt'),
        contextPrompt: _t('replyPrompt'),
        targetInput: (anchor) => anchor.closest('.msg-convo-wrapper').querySelector('.msg-form__contenteditable'),
        context: (anchor) => {
          function getMessages(anchor, lastChecked = null, i = 0, chat = '') {
            const parent = anchor.closest('.msg-convo-wrapper')
            const lastElement = lastChecked ? lastChecked.previousElementSibling : parent.querySelector(".msg-s-message-list-content")?.lastElementChild
            const currentUserName = document.querySelector('.msg-overlay-list-bubble').querySelector('.presence-entity__image').getAttribute('alt')
            if (!lastElement) return chat ? `${chat}\n\n${currentUserName}:` : ''
            const msgUserName = lastElement.querySelector('.msg-s-message-group__name')?.innerText
            const msgText = lastElement.querySelector('.msg-s-event-listitem__body')?.innerText
            if (msgUserName) {
              if (msgText) {
                if (i > 5) return `${msgUserName}:\n${msgText}\n\n` + (chat ? `${chat}\n${currentUserName}:` : '') // return last 5 messages
                return getMessages(anchor, lastElement, ++i, `${msgUserName}:\n${msgText}\n\n${chat}`)
              } else {
                if (i > 5) return `${msgUserName}:\n\n` + (chat ? `${chat}\n${currentUserName}:` : '') // return last 5 messages
                return getMessages(anchor, lastElement, ++i, `${msgUserName}:\n\n${chat}`)
              }
            } else {
              if (i > 50) return chat ? `${chat}\n\n${currentUserName}:` : '' // It might not reach it without username, but to avoid long message problem
              if (msgText) {
                return getMessages(anchor, lastElement, ++i, `${msgText}\n\n${chat}`)
              } else {
                return getMessages(anchor, lastElement, ++i, chat)
              }
            }
          }
          return getMessages(anchor)
        }
      },
      // Linkedin comment
      {
        condition: (node) => node?.classList?.contains('comments-comment-box'),
        openCondition: (node) => !!node.closest('.comments-comment-box-comment__text-editor'),
        insertButtonHook: (button, target) => target.querySelector('.mlA').appendChild(button),
        buttonSize: 20,
        buttonStyle: 'width: 40px;height: 40px;display: flex;align-items: center;justify-content: center;',
        prompt: _t('commentPrompt'),
        contextPrompt: _t('replyPrompt'),
        cardContainer: () => document.body,
        targetInput: (anchor) => {
          const parent = anchor.closest('.feed-shared-update-v2')
          const parentComment = anchor.closest('.comments-comment-item')
          return (parentComment || parent).querySelector('.ql-editor')
        },
        context: (anchor) => {
          const parent = anchor.closest('.feed-shared-update-v2')
          const context = `Post:\n${(parent.querySelector('.update-components-text') as HTMLElement).innerText}`
          const parentComment = anchor.closest('.comments-comment-item')
          return parentComment ? `${context}\n\nComment:\n${(parentComment.querySelector('.update-components-text') as HTMLElement).innerText}\n\nReply:` : `${context}\n\nReply:`
        }
      }
    ]
  },
  slack: {
    anchors: [
      // Slack message
      {
        condition: (node) => node?.classList?.contains('c-texty_buttons'),
        buttonSize: 20,
        buttonStyle: 'width: 28px;height: 28px;margin: 2px;display: flex;align-items: center;justify-content: center;',
        prompt: _t('messagePrompt'),
        contextPrompt: _t('replyPrompt'),
        cardContainer: () => document.body,
        targetInput: (anchor) => anchor.closest('.c-basic_container__body').querySelector('.ql-editor'),
        context: (anchor) => {
          const parent = anchor.closest('.p-workspace__primary_view_contents')
          const context = `Message:\n${(parent?.querySelector('.c-message_kit__gutter') as HTMLElement)?.innerText}\n\nReply:`
          return context
        }
      }
    ]
  },
  live: {
    anchors: [
      // Outlook
      {
        condition: (node) => node?.classList?.contains('OTADH') || node?.classList?.contains('vBoqL'),
        openCondition: (node) => !!node.closest('.dFCbN'),
        buttonSize: 25,
        buttonStyle: 'width: 40px;height: 20px;display: flex;align-items: center;justify-content: center;',
        // insertButtonHook: (button, target) => target.insertBefore(button, target.children[1]),
        cardContainer: () => document.body,
        prompt: _t('emailPrompt'),
        context: (anchor) => {
          const parent = anchor.closest('.aVla3')
          if (!parent) return ''
          const context = `Email:\n${(parent.querySelector('.XbIp4') as HTMLElement).innerText}\n\nReply:`
          return context
        },
        contextPrompt: _t('replyPrompt'),
        targetInput: (anchor) => anchor.closest('.dMm6A').querySelector('.dFCbN')
      }
    ]
  },
  github: {
    anchors: [
      // Github review
      {
        condition: (node) => node?.classList?.contains('toolbar-commenting'),
        openCondition: (node) => !!node.closest('.comment-form-textarea'),
        buttonSize: 25,
        buttonStyle: 'width: 40px;height: 20px;display: flex;align-items: center;justify-content: center;',
        // insertButtonHook: (button, target) => target.insertBefore(button, target.children[1]),
        cardContainer: () => document.body,
        context: (anchor) => {
          const parent = anchor.closest('.js-file')
          const table = parent.querySelector('tbody')
          const rows = table.querySelectorAll('tr')
          let context = 'Code changes:\n\n'

          for (const row of rows) {
            // if (row.classList.contains('js-expandable-line') || row.querySelector('.non-expandable')) continue
            if (row.classList.contains('inline-comments')) break
            const code = (row.querySelector('.blob-code-inner') as HTMLElement)?.innerText
            if (row.querySelector('.blob-code-addition')) context += `+ ${code}\n`
            else if (row.querySelector('.blob-code-deletion')) context += `- ${code}\n`
            else context += `${code}\n`
          }

          return context
        },
        contextPrompt: _t('reviewCodePrompt'),
        targetInput: (anchor) => anchor.closest('.previewable-comment-form').querySelector('.comment-form-textarea')
      }
    ]
  },
}
