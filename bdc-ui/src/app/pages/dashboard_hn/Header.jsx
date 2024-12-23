import React from 'react'
import 
 {BsFillBellFill, BsFillEnvelopeFill, BsPersonCircle, BsSearch, BsJustify}
 from 'react-icons/bs'

function Header({OpenSidebar}) {
  return (
    <header className='header'>
        <div className='menu-icon'>
            <BsJustify className='icon' onClick={OpenSidebar}/>
        </div>
        <div className='header-left'>
            {/* 
            <BsSearch  className='icon'/>
            */}

            {/* <span className='gridbot'>GridBot</span><span className='admin'>Admin</span> */}

            <span className='gridbot'>Digital Blade Certificate</span> <span className='admin'>Dashboard</span>

        </div>
        <div className='header-right'>
            {/* 
            <BsFillBellFill className='icon'/>
            <BsFillEnvelopeFill className='icon'/>
            <BsPersonCircle className='icon'/>
            */} 

        </div>
    </header>
  )
}

export default Header
