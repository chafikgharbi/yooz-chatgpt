import { render } from 'preact'
import App from './App'

// Globalize styles
import '../base.css'
import '../content-script/styles.scss'

render(<App />, document.getElementById('app')!)
