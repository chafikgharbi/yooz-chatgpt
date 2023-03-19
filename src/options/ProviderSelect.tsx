import { Button, Input, Select, Spinner, Tabs, useInput, useToasts } from '@geist-ui/core'
import { FC, useCallback, useState } from 'react'
import useSWR from 'swr'
// import { fetchExtensionConfigs } from '../api'
import { getProviderConfigs, ProviderConfigs, ProviderType, saveProviderConfigs } from '../config'
import { _t } from '../utils'

interface ConfigProps {
  config: ProviderConfigs
  models: string[]
}

async function loadModels(): Promise<string[]> {
  // const configs = await fetchExtensionConfigs()
  return [
    "gpt-3.5-turbo",
    // "gpt-4-0314",
    // "gpt-4-32k-0314",
    "text-davinci-003",
  ]
}

const ConfigPanel: FC<ConfigProps> = ({ config, models }) => {
  const [tab, setTab] = useState<ProviderType>(config.provider)
  const { bindings: apiKeyBindings } = useInput(config.configs[ProviderType.GPT3]?.apiKey ?? '')
  const [model, setModel] = useState(config.configs[ProviderType.GPT3]?.model ?? models[0])
  const { setToast } = useToasts()

  const save = useCallback(async () => {
    if (tab === ProviderType.GPT3) {
      if (!apiKeyBindings.value) {
        alert('Please enter your OpenAI API key')
        return
      }
      if (!model || !models.includes(model)) {
        alert('Please select a valid model')
        return
      }
    }
    await saveProviderConfigs(tab, {
      [ProviderType.GPT3]: {
        model,
        apiKey: apiKeyBindings.value,
      },
    })
    setToast({ text: 'Changes saved', type: 'success' })
  }, [apiKeyBindings.value, model, models, setToast, tab])

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={tab} onChange={(v) => setTab(v as ProviderType)}>
        <Tabs.Item label={_t('optProviderChatGPT')} value={ProviderType.ChatGPT}>
          {_t('optProviderChatGPTDesc')}
        </Tabs.Item>
        <Tabs.Item label={_t('optProviderOpenAI')} value={ProviderType.GPT3}>
          <div className="flex flex-col gap-2">
            <span dangerouslySetInnerHTML={{ __html: _t('optProviderOpenAIDesc') }} />
            <div className="flex flex-row gap-2">
              <Select
                scale={2 / 3}
                value={model}
                onChange={(v) => setModel(v as string)}
                placeholder="model"
                dropdownStyle={{ marginTop: "-20px" }}
              >
                {models.map((m) => (
                  <Select.Option key={m} value={m}>
                    {m}
                  </Select.Option>
                ))}
              </Select>
              <Input htmlType="password" label="API key" scale={2 / 3} {...apiKeyBindings} />
            </div>
            <span className="italic text-xs" dangerouslySetInnerHTML={{ __html: _t('optProviderOpenAIKeyTip') }} />
          </div>
        </Tabs.Item>
      </Tabs>
      <Button scale={2 / 3} ghost style={{ width: 20 }} type="success" onClick={save}>
        {_t('optProviderSave')}
      </Button>
    </div>
  )
}

function ProviderSelect() {
  const query = useSWR('provider-configs', async () => {
    const [config, models] = await Promise.all([getProviderConfigs(), loadModels()])
    return { config, models }
  })
  if (query.isLoading) {
    return <Spinner />
  }
  return <ConfigPanel config={query.data!.config} models={query.data!.models} />
}

export default ProviderSelect
