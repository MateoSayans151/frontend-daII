import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import './index.css'
import './ui-polish.css'
import App from './App.tsx'
import './refinement.css'

const root = createRoot(document.getElementById('root')!)

if (import.meta.env.DEV && window.location.pathname === '/preview') {
  void import('./features/dev/PreviewApp').then(({ default: PreviewApp }) => {
    root.render(
      <StrictMode>
        <PreviewApp />
      </StrictMode>,
    )
  })
} else {
  root.render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  )
}
