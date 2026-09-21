import { useState } from 'react'
import Habits from './components/Habits'
import './App.css'


const modules = [
  { id: 'habits', label: 'Habits', emoji: '✅' },
  { id: 'expenses', label: 'Expenses', emoji: '💰' },
  { id: 'goals', label: 'Goals', emoji: '🎯' },
  { id: 'workouts', label: 'Workouts', emoji: '💪' },
  { id: 'food', label: 'Food', emoji: '🍎' },
]


function App() {
  const [activeModule, setActiveModule] = useState(null)

  if (activeModule === null) {
    return(
    <div className="landing">
      <h1>My Dashboard</h1>
      <div className="module-grid">
        {modules.map((module) => (
          <button
          key={module.id}
            className="module-card"
            onClick={()=> setActiveModule(module.id)}
          >
            <span className="module-emoji">{module.emoji}</span>
            <span>{module.label}</span>
            </button>
        ))}
      </div>
    </div>
    )
  }


return (
  <div className="module-content">
    <button className="back-btn" onClick={() => setActiveModule(null)}>
      ← Back to Menu
    </button>

      {activeModule === 'habits' && <Habits />}
      {activeModule === 'expenses' && <p>Expenses module coming soon.</p>}
      {activeModule === 'goals' && <p>Goals module coming soon.</p>}
      {activeModule === 'workouts' && <p>Workouts module coming soon.</p>}
      {activeModule === 'food' && <p>Food module coming soon.</p>}
  </div>
)
}

export default App