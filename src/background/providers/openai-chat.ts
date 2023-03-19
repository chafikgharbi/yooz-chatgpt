import { fetchSSE } from '../fetch-sse'
import { GenerateAnswerParams, Provider } from '../types'

export class OpenAIProviderChat implements Provider {
  constructor(private token: string, private model: string) {
    this.token = token
    this.model = model
  }

  private buildPrompt(prompt: string): string {
    return prompt
  }

  async generateAnswer(params: GenerateAnswerParams) {
    let result = ''
    await fetchSSE('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          // {"role": "system", "content": "You are a helpful assistant."},
          { "role": "user", "content": this.buildPrompt(params.prompt) },
        ],
        stream: true,
        max_tokens: 2048,
      }),
      onMessage(message) {
        try {
          const choice = JSON.parse(message).choices[0]
        } catch (err) {
          console.error(err)
          return
        }
        if (message === '[DONE]') {
          params.onEvent({ type: 'done' })
          return
        }
        let data
        try {
          data = JSON.parse(message)
          const text = data.choices[0]?.delta?.content
          if (text === '<|im_end|>' || text === '<|im_sep|>' || !text) {
            return
          }
          result += text
          params.onEvent({
            type: 'answer',
            data: {
              text: result,
              messageId: /*data.id*/ '123',
              conversationId: /*data.id*/ '123',
            },
          })
        } catch (err) {
          console.error(err)
          return
        }
      },
    })
    return {}
  }
}
