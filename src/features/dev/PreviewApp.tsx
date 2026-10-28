import { Provider } from 'react-redux'
import AppReal from '../../AppReal'
import { store } from '../../app/store'

export default function PreviewApp() {
  return (
    <Provider store={store}>
      <AppReal previewMode />
    </Provider>
  )
}
