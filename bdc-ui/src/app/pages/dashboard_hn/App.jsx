import { useState } from 'react'
import './App.css'
import Header from './Header'
import DashboardHn from './DashboardHn'

function App() {
  
  
    const [openSidebarToggle, setOpenSidebarToggle] = useState(false)
  

  const OpenSidebar = () => {
    setOpenSidebarToggle(!openSidebarToggle)
  }



  return (
    <div className='grid-container'>
      <Header OpenSidebar={OpenSidebar}/>
      
      {/* <Sidebar openSidebarToggle={openSidebarToggle} OpenSidebar={OpenSidebar}/> */}
      

      <DashboardHn />
    </div>
  )
}

export default App
