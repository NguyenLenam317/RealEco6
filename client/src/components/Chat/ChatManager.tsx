import React, { useState, useEffect, FC, useCallback, ReactElement } from 'react';
import axios, { AxiosResponse } from 'axios';
import SessionStorageManager from '../../utils/sessionStorage';

// Declare global JSX namespace to resolve intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

type ChatMessage = {
  role: 'user' | 'assistant';
  sender: 'user' | 'ai';
  content: string;
  userId?: string;
};

type ChatManagerProps = {
  // Add any props if needed
};

type ChatManagerState = {
  messages: ChatMessage[];
  newMessage: string;
};

const ChatManager: FC<ChatManagerProps> = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');

  useEffect(() => {
    const fetchChatHistory = async (): Promise<void> => {
      try {
        // Assume we have a way to get the current user's ID
        // This could come from authentication context, local storage, etc.
        const userId = localStorage.getItem('userId') || '0';

        console.log('Fetching chat history for user:', userId);

        const response = await axios.get<ChatMessage[]>('/api/chat/history', {
          params: { userId },
          headers: { 'X-User-ID': userId }
        });
        const serverChatHistory = response.data || [];

        console.log('Server chat history:', serverChatHistory);

        // Merge server history with local storage history
        const localChatHistory = SessionStorageManager.getChatHistory() || [];
        const mergedHistory = [...serverChatHistory, ...localChatHistory]
          .filter((msg: ChatMessage, index: number, self: ChatMessage[]) => 
            index === self.findIndex((m: ChatMessage) => m.content === msg.content)
          );

        setMessages(mergedHistory);
        SessionStorageManager.clearChatHistory();
        mergedHistory.forEach((msg: ChatMessage) => SessionStorageManager.saveChatMessage(msg));

      } catch (error: unknown) {
        console.error('Error fetching chat history:', error);
        
        // Fallback to local storage
        const savedChatHistory = SessionStorageManager.getChatHistory() || [];
        console.log('Falling back to local chat history:', savedChatHistory);
        
        setMessages(savedChatHistory);
      }
    };

    fetchChatHistory();
  }, []);

  const sendMessage = async (): Promise<void> => {
    if (!newMessage.trim()) return;

    try {
      // Get user ID from localStorage
      const userId = localStorage.getItem('userId') || '0';

      // Send message to server and get AI response
      console.log('Sending message:', JSON.stringify({ content: newMessage, userId }));
      const response = await axios.post<{ response: string }>('/api/chat/message', 
        { content: newMessage, userId }, 
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId
          }
        }
      );

      // Create user chat message object
      const userMessage: ChatMessage = {
        role: 'user',
        sender: 'user',
        content: newMessage,
        userId: userId
      };

      // Create AI response message object
      const aiMessage: ChatMessage = {
        role: 'assistant',
        sender: 'ai',
        content: response.data.response,
        userId: userId
      };

      // Update local state and sessionStorage
      const updatedMessages = [...messages, userMessage, aiMessage];
      console.log('Updating messages:', updatedMessages);
      
      // Explicitly log each message being saved
      console.log('Saving user message:', userMessage);
      console.log('Saving AI message:', aiMessage);
      
      // Update state and save to session storage
      setMessages(updatedMessages);
      
      try {
        SessionStorageManager.saveChatMessage(userMessage);
        SessionStorageManager.saveChatMessage(aiMessage);
        
        // Verify saved messages
        const savedHistory = SessionStorageManager.getChatHistory();
        console.log('Saved chat history after update:', savedHistory);
      } catch (storageError: unknown) {
        console.error('Error saving messages to session storage:', storageError);
      }

      // Clear input
      setNewMessage('');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error sending message:', error.message);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      } else {
        console.error('Unknown error occurred:', error);
      }
      
      // Optionally, add an error message to chat
      const errorMessage: ChatMessage = {
        role: 'assistant',
        sender: 'ai',
        content: 'Sorry, there was an error processing your message.',
        userId: localStorage.getItem('userId') || '0'
      };
      setMessages([...messages, errorMessage]);
    }
  };

  const clearChat = (): void => {
    // Clear messages from local state and sessionStorage
    setMessages([]);
    SessionStorageManager.clearChatHistory();
  };

  // Debug logging for messages
  useEffect(() => {
    console.log('Current messages:', messages);
  }, [messages]);

  // Comprehensive logging function
  const logMessages = React.useCallback(() => {
    console.group('Chat Messages Debug');
    console.log('Total Messages:', messages.length);
    messages.forEach((msg, index) => {
      console.log(`Message ${index}:`, {
        role: msg.role,
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp || 'No timestamp'
      });
    });
    console.groupEnd();
  }, [messages]);

  // Log messages whenever they change
  React.useEffect(() => {
    logMessages();
  }, [messages, logMessages]);

  return (
    <div>
      <div className="chat-messages" style={{ 
        border: '1px solid #e0e0e0', 
        minHeight: '300px', 
        padding: '10px' 
      }}>
        {messages.length === 0 && (
          <div style={{ 
            color: '#888', 
            textAlign: 'center', 
            padding: '20px' 
          }}>
            No messages yet. Start a conversation!
          </div>
        )}
        {messages.map((msg: ChatMessage, index: number) => (
          <div 
            key={index} 
            className={`message ${msg.role}`}
            style={{ 
              padding: '10px', 
              margin: '5px', 
              backgroundColor: msg.role === 'user' ? '#e0f7fa' : '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column'
            }}
            >
              <div style={{ 
                fontWeight: msg.role === 'user' ? 'bold' : 'normal',
                color: msg.role === 'user' ? '#0066cc' : '#333'
              }}>
                {msg.role === 'user' ? 'You:' : 'AI:'}
              </div>
              <div>{msg.content}</div>
            </div>
          );
        })}
      </div>
      <div className="chat-input" style={{ 
        display: 'flex', 
        marginTop: '10px' 
      }}>
        <input 
          type="text" 
          value={newMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ 
            flex: 1, 
            padding: '10px', 
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <button 
          onClick={sendMessage} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
        <button 
          onClick={clearChat} 
          style={{ 
            marginLeft: '10px', 
            padding: '10px 20px', 
            backgroundColor: '#f44336', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default ChatManager;
