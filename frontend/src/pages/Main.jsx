import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import ChatSideBar from '../components/ChatSideBar'
import ChatWindow from '../components/ChatWindow'
import { getRecentConversations } from '../services/MessagesApi'
import { setRecent } from '../redux/messagesSlice'

const Main = () => {
  const selectedChat = useSelector((state) => state.selectedChat.chat);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.data);
  let myId = user?._id;

  useEffect(() => {
    if (!myId) return;
    const loadRecent = async () => {
      try {
        const res = await getRecentConversations();
        dispatch(setRecent(res.data));
      } catch (err) {
        console.error("Failed to load recent conversations", err);
      }
    };
    loadRecent();
  }, [dispatch, myId]);

  return (
   
    <div className='lg:flex h-screen overflow-hidden relative'>
      
    
      <div className='flex w-full lg:w-auto shrink-0'> 
        <Sidebar />
        <ChatSideBar />
        
      </div>

    
      <div className={`
        fixed inset-0 z-50 bg-white 
        transition-transform duration-300 ease-in-out
        lg:static lg:flex-1 lg:translate-x-0
        ${selectedChat ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <ChatWindow />
      </div>

    </div>
  )
}

export default Main