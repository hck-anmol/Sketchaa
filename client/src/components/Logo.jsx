import React from 'react'
import paintPalette from '../assets/paintpalette.png'

const Logo = () => {
    return (
        <div>
            <img src={paintPalette} alt="" className='w-10 animate-rotate-custom' />
        </div>
    )
}

export default Logo