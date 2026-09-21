import { useState, useEffect } from 'react'

function App() {
  const [habits, setHabits] = useState([])
  const [newHabitName, setNewHabitName] = useState('')
  const [checkedInToday, setCheckedInToday] = useState({})
  const [notification, setNotification] = useState('')
  const [editingHabitId, setEditingHabitId] = useState(null)
  const [editedName, setEditedName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if(!notification) return

    const timer = setTimeout (() => {
      setNotification('')
    }, 2500)

    return () => clearTimeout(timer)
  }, [notification])

  useEffect(() => {
    fetch('http://127.0.0.1:8000/habits')
    .then((response) => response.json())
    .then((data) => {
      setHabits(data)
      setIsLoading(false)
      data.forEach((habit) => {
        fetch(`http://127.0.0.1:8000/habits/${habit.id}/checked-in-today`)
          .then((response) => response.json())
          .then((result) => {
            setCheckedInToday((prev) => ({
            ...prev,
            [habit.id]: result.checked_in_today,
          }))
        })
      })
    })
  }, [])


  const handleAddHabit = async (event) => {
    event.preventDefault()

    const response = await fetch(`http://127.0.0.1:8000/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ name: newHabitName }),
    })

    const createdHabit = await response.json()
    setHabits([...habits, createdHabit])
    setNewHabitName('')
    setNotification(`"${createdHabit.name}" has been added.`)
  }

  const startEditing = (habit) => {
    setEditingHabitId(habit.id)
    setEditedName(habit.name)
  }

  const cancelEditing = () => {
    setEditingHabitId(null)
    setEditedName('')
  }

  const saveEdit = async (habitId) => {
    const response = await fetch(`http://127.0.0.1:8000/habits/${habitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ name: editedName}),
  })
  const updatedHabit = await response.json()

  setHabits(
    habits.map((habit) => (habit.id === habitId ? updatedHabit : habit))
  )

  setNotification(`Habit renamed to "${updatedHabit.name}".`)
  cancelEditing()

}


  const handleCheckIn = async (habitId) => {
    await fetch(`http://127.0.0.1:8000/habits/${habitId}/checkin`, {
      method: 'POST',
    })
    setCheckedInToday((prev) => ({...prev, [habitId]: true}))
  }

  const handleDeleteHabit = async (habitId, habitName) => {
  const confirmed = window.confirm(`Delete "${habitName}"? This can't be undone.`)
  if (!confirmed) {
    return
  }
  await fetch(`http://127.0.0.1:8000/habits/${habitId}/archive`, {
    method: 'PATCH',
  })

  setHabits(habits.filter((habit) => habit.id !== habitId))
  setNotification(`"${habitName}" has been deleted.`)
}
  
  return (
    <div>
      <h1> My Habits</h1>
      {notification && <div className="notification">{notification}</div>}


      <form onSubmit={handleAddHabit}>
        <div className="input-group">
        <input
          type="text"
          value={newHabitName}
            onChange={(event) => setNewHabitName(event.target.value)}
            placeholder="New habit name"
            maxLength={40}
        />
        <p className="char-count">{newHabitName.length}/40</p>
        </div>
        <button type = "submit">Add Habit</button>
      </form>
      

        {isLoading ? (
          <p className="status-message">Loading your habits...</p>
        ) : habits.length === 0 ? (
          <p className="status-message">No habits yet - add one above to get started!</p>
        ) : (
        <ul>
        {habits.map((habit) => (
          <li key={habit.id}>

            {editingHabitId === habit.id ? (
              <>
                <input
                  type="text"
                  value={editedName}
                  onChange={(event) => setEditedName(event.target.value)}
                  maxLength={40}
                />
                <div className="actions">
                  <button onClick={() => saveEdit(habit.id)}>Save</button>
                  <button className="delete-btn" onClick={cancelEditing}>Cancel</button>
                  <button className="delete-btn" onClick={() => handleDeleteHabit(habit.id, habit.name)}>
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <>
            <span className="habit-name" title={habit.name}>{habit.name}</span>
            <div className="actions">
              {checkedInToday[habit.id] ? (
                <span className="checked-badge">✅ Checked in</span>
              ) : (
                <button onClick={() => handleCheckIn(habit.id)}>Check in</button>
              )}
              <button onClick={() => startEditing(habit)}>Edit</button>
            </div>
            </>
            )}
          </li>
        ))}
      </ul>
      )}
    </div>  
  )
}

export default App