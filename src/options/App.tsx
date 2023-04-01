import { CssBaseline, GeistProvider, Radio, Select, Text, Toggle, useToasts } from '@geist-ui/core'
import { useCallback, useEffect, useState } from 'preact/hooks'
import '../base.css'
import {
  getUserConfig,
  updateUserConfig,
} from '../config'
import logo from '../logo.png'
import { getExtensionVersion, _t } from '../utils'
import ProviderSelect from './ProviderSelect'

function OptionsPage() {
  const [showSelectionButton, toggleSelectionButton] = useState<boolean>(true)
  const [showSRButton, toggleSRButton] = useState<boolean>(true)
  const { setToast } = useToasts()

  useEffect(() => {
    getUserConfig().then((config) => {
      toggleSelectionButton(config.selectionButton)
      toggleSRButton(config.SRButton)
    })
  }, [])

  const onToggleSelectionButtonChange = useCallback(
    (checked: boolean) => {
      updateUserConfig({ selectionButton: checked })
      setToast({ text: 'Changes saved', type: 'success' })
    },
    [setToast],
  )

  const onToggleSRButtonChange = useCallback(
    (checked: boolean) => {
      updateUserConfig({ SRButton: checked })
      setToast({ text: 'Changes saved', type: 'success' })
    },
    [setToast],
  )

  return (
    <div className="container mx-auto">
      <nav className="flex flex-row justify-between items-center mt-5 px-2">
        <div className="flex flex-row items-center gap-2">
          <img src={logo} className="w-10 h-10 rounded-lg" />
          <span className="font-semibold">{_t('appName')} (v{getExtensionVersion()})</span>
        </div>
        <div className="flex flex-row gap-3">
          <a
            href="https://github.com/wong2/chat-gpt-google-extension/issues"
            target="_blank"
            rel="noreferrer"
          >
            {_t('optFeedback')}
          </a>
        </div>
      </nav>
      <main className="w-[500px] mx-auto mt-14">
        <Text h2>{_t('options')}</Text>
        <Text h3 className="mt-5 mb-0">
          {_t('optProvider')}
        </Text>
        <ProviderSelect />
        <Text h3 className="mt-8">
          {_t('optMisc')}
        </Text>
        <div className="flex flex-row mb-5">
          <div className='mt-1'>
            <Toggle checked={showSelectionButton} onChange={({ target }) => onToggleSelectionButtonChange(target.checked)} />
          </div>
          <Text b className='ml-4'>
            {_t('optSelectionButton')}
          </Text>
        </div>
        <div className="flex flex-row mb-5">
          <div className='mt-1'>
            <Toggle checked={showSRButton} onChange={({ target }) => onToggleSRButtonChange(target.checked)} />
          </div>
          <div className='ml-4'>
            <Text b className='block'>
              {_t('optSRButton')}
            </Text>
            <Text className='block mt-1 text-sm'>
              {_t('optSRButtonDesc')}
            </Text>
          </div>
        </div>
        <div className="flex flex-row">
          <div className='mt-1'>
            <Toggle initialChecked disabled />
          </div>
          <Text b className='ml-4'>
            {_t('optAutoDelete')}
          </Text>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <GeistProvider>
      <CssBaseline />
      <OptionsPage />
    </GeistProvider>
  )
}

export default App
