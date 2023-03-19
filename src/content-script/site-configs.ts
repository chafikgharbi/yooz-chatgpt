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
    buttonContainer: (anchor: HTMLElement) => HTMLElement
    cardContainer?: (anchor: HTMLElement) => HTMLElement
    buttonSize?: number,
    buttonStyle?: string
  }[]
}

export const config: Record<string, siteConfig> = {
  google: {
    anchors: [
      // Email
      {
        condition: (node) => node?.classList?.contains('btC'),
        buttonContainer: (anchor) => anchor,
        cardContainer: () => document.body,
        prompt: _t('emailPrompt'),
        context: (anchor) => {
          const parent = anchor.closest('.G3.G2')
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
        buttonContainer: (anchor) => anchor,
        prompt: _t('linkedinPostPrompt'),
        cardContainer: (anchor = null) => anchor.closest('.share-box'),
        targetInput: (anchor) => anchor.closest('.artdeco-modal').querySelector('.ql-editor')
      },
      // Linkedin message
      {
        condition: (node) => node?.classList?.contains('msg-form__left-actions'),
        openCondition: (node) => !!node.closest('.msg-form__contenteditable'),
        buttonContainer: (anchor) => anchor,
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
        buttonContainer: (anchor) => anchor,
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
        buttonContainer: (anchor) => anchor,
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
}
