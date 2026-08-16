/*
 * LEGACY — not used by the app (entry is src/main.tsx + src/App.tsx).
 * Imports missing components (leftsidebar, mainpanel, promptpanel).
 * Kept commented out after code audit.
 *
import { useState } from 'react'
import LeftSidebar from './leftsidebar'
import MainPanel from './mainpanel'
import PromptPanel from './promptpanel'

export default function App() {
  const [output, setOutput] = useState(null)
  const [activePrompt, setActivePrompt] = useState(null)

  const handlePrompt = (prompt, response) => {
    setActivePrompt(prompt)
    setOutput({ prompt, response })
  }

  return (
    <div className="flex h-screen bg-[#f8f8f7] overflow-hidden">
      <LeftSidebar />
      <MainPanel output={output} />
      <PromptPanel activePrompt={activePrompt} onSelect={handlePrompt} />
    </div>
  )
}
*/

export default function App() {
  return null;
}
