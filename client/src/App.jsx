import './App.css'
import { createBrowserRouter, Route, RouterProvider, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import { Toaster } from 'react-hot-toast'
import Game from './pages/Game'
import RoomPage from './pages/RoomPage'
import Room from './pages/Room'
import LeaderBoard from './pages/LeaderBoard'
// Remove: import { Router } from 'express'

function App() {
  return (
    <div>
      <Toaster />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/game/:id' element={<Game />} />
        <Route path='/room' element={<RoomPage />} />
        <Route path='/room/:id' element={<Room />} />
        <Route path='/room/:id/leaderboard' element={<LeaderBoard />} />
      </Routes>
    </div>
  )
}

export default App