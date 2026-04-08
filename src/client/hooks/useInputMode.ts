import { useEffect, useState } from 'react'

export function useInputMode() {
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const onKeyDown = () => setIsTyping(true)
    const onMouseMove = () => setIsTyping(false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return isTyping
}
