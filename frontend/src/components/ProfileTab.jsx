import React from 'react'
import { useState } from 'react'
import { User,ChevronDown,ChevronUp } from 'lucide-react'
import { useSelector } from 'react-redux'
const ProfileTab = () => {
  const serverUrl = import.meta.env.VITE_SERVER_URL+"/uploads/";
    const [openAbout,setOpenAbout]=useState(false);
    
    const profileImg = useSelector((state) => state.user.data?.profileImage);
  return (
    <div className='w-full px-6 pt-6  h-full '>
        <h1 className="font-medium text-xl  text-gray-700 dark:text-gray-50">
          My Profile
        </h1>
        {/* Profile */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white mt-5 mx-auto">
<img src={
                profileImg
                  ? `${serverUrl}${profileImg}?t=${Date.now()}`
                  : "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
              } alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h3 className='text-xl text-center mt-5 font-medium'>Saad</h3>
        {/* status */}
       <div className='flex justify-center items-center gap-3'><span className='w-2 h-2 rounded-full border-3 border-green-300'></span>
        <p>Active</p></div>

        {/* About section */}
    <div onClick={()=>{setOpenAbout(!openAbout)}} className='flex justify-between p-3 border-gray-100 border-1 bg-[#F9FAFA] mt-5 text-[14px] font-medium'><div className='flex items-center gap-1'><User  size={14}/><p>About</p></div>
   <button> {openAbout===false? <ChevronDown size={14}/>: <ChevronUp size={14} /> }</button>
    </div>
   {openAbout&&
    <div className='bg-white w-full p-3 space-y-4 border-gray-100'>
        {/* name */}
   <div>
     <p className='text-[15px] text-[#7a7f9a]'>Name</p>
    <p className='text-[14px] font-medium'>Saad</p>
   </div>
   {/* email */}
   <div>
     <p className='text-[15px] text-[#7a7f9a]'>Email</p>
    <p className='text-[14px] font-medium'>saad@gmail.com</p>
   </div>
   {/* location */}
   <div>
     <p className='text-[15px] text-[#7a7f9a]'>Location</p>
    <p className='text-[14px] font-medium'>Faisalabad,Pakistan</p>
   </div>
  
    </div>}
    </div>
  )
}

export default ProfileTab