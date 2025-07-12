import React, { useEffect, useState, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

interface ChatWindowProps {
  chatId: string;
  disabled?: boolean; // If swap not accepted, disable chat
}

interface Message {
  id?: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, disabled }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })));
    });
    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: currentUser.uid,
      text: input,
      timestamp: new Date()
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-xl shadow border border-gray-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`px-4 py-2 rounded-lg text-sm ${msg.senderId === currentUser?.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex p-4 border-t border-gray-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Type your message..."
          disabled={disabled}
        />
        <button
          type="submit"
          className="ml-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          disabled={!input.trim() || disabled}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
