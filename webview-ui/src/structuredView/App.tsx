import { useState } from 'react'

export default function App() {
  const [text, setText] = useState('')

  window.addEventListener('message', (event: MessageEvent) => {
      const message = event.data
      if (typeof message.contents === 'string') {
        setText(message.contents)
      }
    })

  return (
    <div>
      {text}
    </div>
  )
}