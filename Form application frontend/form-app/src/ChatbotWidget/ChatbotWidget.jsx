// src/ChatbotWidget/ChatbotWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../services/axios-instance'; // Your authenticated axios instance
import './ChatbotWidgetStyle.css'; // We will create this CSS file next

function ChatbotWidget({ onLogout }) {
    const [isOpen, setIsOpen] = useState(false); // State to control widget visibility
    const [messages, setMessages] = useState([]); // Stores { role: 'user' | 'assistant', content: 'message' }
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null); // Ref for auto-scrolling

    // Auto-scroll to the latest message whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Initial welcome message when the widget is opened for the first time
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ role: 'assistant', content: 'Hi there! How can I help you today?' }]);
        }
    }, [isOpen, messages.length]); // Dependency on isOpen and messages.length

    // Toggle widget visibility
    const toggleWidget = () => {
        setIsOpen(prev => !prev);
        setError(null); // Clear any previous errors when opening/closing
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isSending) return;

        const newMessage = { role: 'user', content: inputMessage.trim() };
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setInputMessage('');
        setIsSending(true);
        setError(null);

        try {
            // Prepare chat history for the API call
            // Filter out the initial welcome message if it's the only assistant message
            const chatHistoryForAPI = messages
                .filter(msg => !(msg.role === 'assistant' && msg.content === 'Hi there! How can I help you today?' && messages.indexOf(msg) === 0))
                .slice(-10); // Send last 10 relevant messages as context

            const response = await axiosInstance.post('/chatbot/chat', {
                message: newMessage.content,
                chatHistory: chatHistoryForAPI
            });

            const aiResponse = { role: 'assistant', content: response.data };
            setMessages(prevMessages => [...prevMessages, aiResponse]);
        } catch (err) {
            console.error("Error sending message to chatbot:", err);
            const errorMessage =
                (err.response && err.response.data && err.response.data.message) ||
                err.message ||
                err.toString();
            setError(`Failed to get response: ${errorMessage}`);
            setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: `Error: ${errorMessage}` }]);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                onLogout(); // Log out if unauthorized
            }
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {/* Floating Chatbot Icon - Only show if the widget is NOT open */}
            {!isOpen && (
                <button
                    className="chatbot-toggle-button"
                    onClick={toggleWidget}
                    aria-label="Open Chatbot"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25V10.5m0 0l3.75-3.75M21.75 10.5l-3.75 3.75m-15 .875a.375.375 0 11-.75 0 .375.375 0 01.75 0h.375zm-.375 0h.375m7.5-10.875a.375.375 0 11-.75 0 .375.375 0 01.75 0h.375zm-.375 0h.375m7.5-10.875a.375.375 0 11-.75 0 .375.375 0 01.75 0h.375z" />
                    </svg>
                </button>
            )}

            {/* Chatbot Widget Panel */}
            <div className={`chatbot-widget-panel ${isOpen ? 'open' : ''}`}>
                <div className="widget-header">
                    <h3 className="widget-title">AI Assistant</h3>
                    <button onClick={toggleWidget} className="widget-close-button" aria-label="Close Chatbot">
                        &times;
                    </button>
                </div>
                <div className="messages-display">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message-bubble ${msg.role}`}>
                            {msg.content}
                        </div>
                    ))}
                    {isSending && (
                        <div className="message-bubble assistant typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    )}
                    <div ref={messagesEndRef} /> {/* Scroll target */}
                </div>

                {error && <div className="chat-error-message">❌ {error}</div>}

                <form onSubmit={handleSendMessage} className="message-input-form">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isSending}
                        className="message-input"
                    />
                    <button type="submit" disabled={isSending} className="send-button">
                        {isSending ? 'Sending...' : 'Send'}
                    </button>
                </form>
            </div>
        </>
    );
}

export default ChatbotWidget;
