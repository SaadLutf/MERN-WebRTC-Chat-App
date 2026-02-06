import React, { useEffect } from 'react'
import ChatsTab from './ChatsTab'
import ProfileTab from './ProfileTab';
import Settings from './Settings';
import FriendsTab from './FriendsPage';
import { useDispatch,useSelector } from 'react-redux';

const ChatSideBar = () => {
  const activeTab=useSelector((state)=>state.tab.activeTab);
  return (
   <div className='w-full lg:block lg:w-[400px] lg:min-w-[400px] h-screen border-r-gray-300 dark:border-zinc-700 bg-[#F5F7FB] dark:bg-zinc-900'>
    {/* rendering tabs */}
  
    {activeTab==="Chats"&& <ChatsTab  /> }
    {activeTab==="Profile"&& <ProfileTab /> }
    {activeTab==="Settings"&& <Settings /> }
   
    {activeTab==="Friends"&& <FriendsTab  /> }
   </div>
  )
}

export default ChatSideBar