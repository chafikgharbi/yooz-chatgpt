import Browser from 'webextension-polyfill'
import { getProviderConfigs, ProviderType } from '../config'
import { ChatGPTProvider, getChatGPTAccessToken, sendMessageFeedback } from './providers/chatgpt'
import { OpenAIProviderChat } from './providers/openai-chat'
import { OpenAIProviderText } from './providers/openai-text'
import { Provider } from './types'

let stopGenerating = null

async function generateAnswers(port: Browser.Runtime.Port, question: string) {
  const providerConfigs = await getProviderConfigs()

  let provider: Provider
  if (providerConfigs.provider === ProviderType.ChatGPT) {
    const token = await getChatGPTAccessToken()
    provider = new ChatGPTProvider(token)
  } else if (providerConfigs.provider === ProviderType.GPT3) {
    const { apiKey, model } = providerConfigs.configs[ProviderType.GPT3]!
    if (model.startsWith('gpt')) {
      provider = new OpenAIProviderChat(apiKey, model)
    } else {
      provider = new OpenAIProviderText(apiKey, model)
    }
  } else {
    throw new Error(`Unknown provider ${providerConfigs.provider}`)
  }

  const controller = new AbortController()

  port.onDisconnect.addListener(() => {
    controller.abort()
    cleanup?.()
  })

  const { cleanup } = await provider.generateAnswer({
    prompt: question,
    signal: controller.signal,
    onEvent(event) {
      if (event.type === 'done') {
        port.postMessage({ event: 'DONE' })
        return
      }
      port.postMessage(event.data)
    },
  })

  stopGenerating = cleanup
}

Browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (msg) => {
    console.debug('received msg', msg)
    try {
      await generateAnswers(port, msg.question)
    } catch (err: any) {
      console.error(err)
      port.postMessage({ error: err.message })
    }
  })
})

Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'STOP_GENERATING') {
    console.log('STOP_GENERATING')
    stopGenerating?.()
  }
  else if (message.type === 'FEEDBACK') {
    const token = await getChatGPTAccessToken()
    await sendMessageFeedback(token, message.data)
  } else if (message.type === 'OPEN_OPTIONS_PAGE') {
    Browser.runtime.openOptionsPage()
  } else if (message.type === 'GET_ACCESS_TOKEN') {
    return getChatGPTAccessToken()
  } else if (message.type === 'OPEN_YOOZ_CARD') {
    console.debug('OPEN_YOOZ_CARD')
    Browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      Browser.tabs.sendMessage(tabs[0]?.id, {
        action: 'openYooz',
      }).catch((error) => {
        console.debug('OPEN_YOOZ_CARD_ERROR')
      })
    })
  }
})

Browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    Browser.runtime.openOptionsPage()
  }
})

Browser.contextMenus.removeAll();
Browser.contextMenus.create({
  id: "1",
  title: "Yooz ChatGPT",
  contexts: ["all"], // ContextType,
});

Browser.contextMenus.onClicked.addListener((info, tab) => {
  Browser.tabs.sendMessage(tab.id, {
    action: 'openYooz'
  });
});

Browser.commands.onCommand.addListener((command) => {
  if (command === 'openYooz') {
    Browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      Browser.tabs.sendMessage(tabs[0].id, {
        action: 'openYooz',
      });
    });
  }
});