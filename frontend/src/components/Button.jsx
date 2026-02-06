import React from 'react'

const Button = ({children,onClick}) => {
  return (
    <button onClick={()=>{onClick}} className='flex items-center text-sm bg-[#F5F7FB] rounded px-2 gap-1 cursor-pointer'>{children}</button>
  )
}

export default Button