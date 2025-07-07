import './App.css'
import { createBrowserRouter, Route, RouterProvider, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import { Toaster } from 'react-hot-toast'
import Game from './pages/Game'
import RoomPage from './pages/RoomPage'
import Room from './pages/Room'
import LeaderBoard from './pages/LeaderBoard'
import JudgePage from './pages/Judge'

function App() {
  return (
    <div>
      <Toaster />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/game/:id' element={<Game />} />
        <Route path='/room' element={<RoomPage />} />
        <Route path='/room/:id' element={<Room />} />
        <Route path='/room/:id/results' element={<LeaderBoard />} />
        <Route path='/room/:id/judge' element={<JudgePage />} />
      </Routes>
    </div>
  )
}

export default App