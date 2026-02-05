// src/components/MessageStatus.jsx
import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageStatus = ({ status, isMe }) => {
  if (!isMe) return null; // Don't show ticks on messages received from others

  if (status === "sent") {
    return <Check size={14} className="text-gray-400" />; // Single Gray
  }
  if (status === "delivered") {
    return <CheckCheck size={14} className="text-gray-400" />; // Double Gray
  }
  if (status === "read") {
    return <CheckCheck size={14} className="text-blue-500" />; // Double Blue
  }
  return <Check size={14} className="text-gray-300" />; // Default/Pending
};

export default MessageStatus;