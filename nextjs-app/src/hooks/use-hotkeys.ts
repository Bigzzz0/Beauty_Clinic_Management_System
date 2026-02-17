import { useEffect } from 'react'

export function useHotkeys(key: string, callback: () => void) {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === key) {
                event.preventDefault()
                callback()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [key, callback])
}
