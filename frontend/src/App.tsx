import { useState } from 'react'
import HeroPage from './pages/HeroPage'
import ChatPage from './pages/ChatPage'

export default function App() {
  const [page, setPage] = useState<'hero' | 'chat'>('hero')

  return page === 'hero'
    ? <HeroPage onStartChat={() => setPage('chat')} />
    : <ChatPage onBack={() => setPage('hero')} />
}
