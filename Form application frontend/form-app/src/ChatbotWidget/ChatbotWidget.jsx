// src/ChatbotWidget/ChatbotWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../services/axios-instance'; // Your authenticated axios instance
import './ChatbotWidgetStyle.css'; // We will create this CSS file next

function ChatbotWidget({ onLogout, currentUser }) { // NEW: Accept currentUser prop
    const [isOpen, setIsOpen] = useState(false); // State to control widget visibility
    const [messages, setMessages] = useState([]); // Stores { id, role: 'user' | 'assistant', content: 'message', timestamp }
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null); // Current user's ID
    const [isLoadingChat, setIsLoadingChat] = useState(true); // Loading state for chat history

    const messagesEndRef = useRef(null); // Ref for auto-scrolling

    // Derive userId from currentUser prop
    useEffect(() => {
        if (currentUser && currentUser.id) {
            setUserId(currentUser.id);
            console.log("Frontend: User ID from currentUser prop:", currentUser.id); // Debugging
        } else {
            // This case should ideally be handled by App.jsx not rendering ChatbotWidget
            // if no user is logged in, but as a fallback:
            console.warn("User ID not available from currentUser prop. Chat history might not load correctly.");
            setError("Please log in to use the chat.");
            setIsLoadingChat(false);
            setUserId(null); // Ensure userId is cleared if currentUser becomes null/invalid
            setMessages([]); // Clear messages if user becomes null
        }
    }, [currentUser]); // IMPORTANT: Depend on currentUser to react to login/logout changes

    // Fetch messages from Spring Boot backend for the current user
    useEffect(() => {
        console.log("Frontend: useEffect for fetching chat history triggered. Current userId:", userId); // Debugging
        const fetchChatHistory = async () => {
            if (!userId) {
                console.log("Frontend: Waiting for userId to fetch chat history.");
                setIsLoadingChat(false); // Stop loading if no user ID
                setMessages([]); // Clear messages if no user ID
                return; // Wait for userId to be available
            }

            setIsLoadingChat(true);
            setError(null); // Clear previous errors

            try {
                // Fetch chat messages from your Spring Boot backend
                console.log(`Frontend: Attempting to fetch chat history for user ${userId}...`);
                const response = await axiosInstance.get(`/chat/messages/my-messages`);
                const fetchedMessages = response.data
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                    .map(msg => ({
                        id: msg.id,
                        role: msg.role, // 'user' or 'assistant'
                        content: msg.content,
                        timestamp: msg.timestamp // Assuming timestamp is returned
                    }));
                setMessages(fetchedMessages);
                console.log(`Frontend: Loaded ${fetchedMessages.length} messages for user ${userId}.`);

                // Add initial welcome message if chat is empty after loading
                if (fetchedMessages.length === 0) {
                    setMessages([{ id: 'welcome', role: 'assistant', content: 'Hi there! How can I help you today?', timestamp: new Date().toISOString() }]);
                }
            } catch (err) {
                console.error("Backend: Error fetching messages:", err);
                const errorMessage =
                    (err.response && err.response.data && err.response.data.message) ||
                    err.message ||
                    err.toString();
                setError(`Failed to load chat history: ${errorMessage}`); // Set error message
                setMessages([]); // Clear messages on error
                // If unauthorized, trigger logout
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    onLogout();
                }
            } finally {
                setIsLoadingChat(false);
            }
        };

        fetchChatHistory();
        // This effect runs when userId changes, ensuring history is loaded for the correct user
    }, [userId, onLogout]); // Dependencies: userId and onLogout

    // Auto-scroll to the latest message whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Toggle widget visibility
    const toggleWidget = () => {
        setIsOpen(prev => !prev);
        setError(null); // Clear any previous errors when opening/closing
    };

    // Function to clear all messages from the chat and backend
    const handleClearChat = async () => {
        if (!userId) {
            setError("Chat system not ready to clear history.");
            return;
        }

        // Using a custom confirmation box instead of window.confirm
        const confirmBox = document.createElement('div');
        confirmBox.className = 'custom-message-box';
        confirmBox.innerHTML = `
            <p>Are you sure you want to clear the entire chat history?</p>
            <button class="custom-message-box-button confirm-yes">Yes</button>
            <button class="custom-message-box-button confirm-no">No</button>
        `;
        document.body.appendChild(confirmBox);

        confirmBox.querySelector('.confirm-yes').onclick = async () => {
            document.body.removeChild(confirmBox);
            try {
                setIsSending(true); // Indicate clearing is in progress
                // Call backend endpoint to delete all messages for the current user
                // Endpoint: DELETE /api/chat/messages/my-messages
                await axiosInstance.delete(`/chat/messages/my-messages`);

                setMessages([{ id: 'welcome', role: 'assistant', content: 'Hi there! How can I help you today?', timestamp: new Date().toISOString() }]); // Reset with welcome message
                console.log("Frontend: Chat history cleared for user:", userId);
            } catch (err) {
                console.error("Frontend: Error clearing chat history:", err);
                const errorMessage =
                    (err.response && err.response.data && err.response.data.message) ||
                    err.message ||
                    err.toString();
                setError(`Failed to clear chat history: ${errorMessage}`);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    onLogout();
                }
            } finally {
                setIsSending(false);
            }
        };
        confirmBox.querySelector('.confirm-no').onclick = () => {
            document.body.removeChild(confirmBox);
        };
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isSending || !userId) {
            if (!userId) setError("Chat system not ready. Please wait.");
            return;
        }

        const userMessageContent = inputMessage.trim();
        // Optimistically add user message to UI (without an ID yet, as it's not saved to DB)
        const newUserMessage = { id: Date.now(), role: 'user', content: userMessageContent, timestamp: new Date().toISOString() };
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        setInputMessage('');
        setIsSending(true);
        setError(null);

        try {
            // Prepare chat history for the API call (excluding the welcome message)
            const chatHistoryForAPI = messages
                .filter(msg => msg.id !== 'welcome') // Filter out the welcome message by its temporary ID
                .slice(-10) // Send last 10 relevant messages as context
                .map(msg => ({ role: msg.role, content: msg.content })); // Ensure only role and content are sent

            // Add the current user's message to the history for the API call
            chatHistoryForAPI.push({ role: 'user', content: userMessageContent });

            console.log("Frontend: Sending message to backend. Payload:", { message: userMessageContent, chatHistory: chatHistoryForAPI });
            // Send the user's message and filtered history to your backend's chatbot endpoint.
            // Endpoint: POST /api/chatbot/chat
            const response = await axiosInstance.post('/chatbot/chat', {
                message: userMessageContent,
                chatHistory: chatHistoryForAPI // Pass the history to your backend for LLM context
            });

            // NEW: Directly append the AI's response from the backend to the messages
            // Assuming the backend returns the AI's response content directly in response.data
            const aiResponseContent = response.data;
            const newAiMessage = { id: Date.now() + 1, role: 'assistant', content: aiResponseContent, timestamp: new Date().toISOString() };
            setMessages(prevMessages => [...prevMessages, newAiMessage]);
            console.log("Frontend: AI response appended to chat.");

        } catch (err) {
            console.error("Frontend: Error sending message to chatbot backend:", err);
            const errorMessage =
                (err.response && err.response.data && err.response.data.message) ||
                err.message ||
                err.toString();
            setError(`Failed to get response: ${errorMessage}`);
            // If there's an error, add an error message to the chat
            setMessages(prevMessages => [...prevMessages, { id: Date.now(), role: 'assistant', content: `Error: ${errorMessage}`, timestamp: new Date().toISOString() }]);
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
                    {/* Display full userId for debugging, then can shorten */}
                    {userId && <span className="user-id-display">User ID: {userId}</span>}
                    <button onClick={handleClearChat} className="clear-chat-button" aria-label="Clear Chat">
                        Clear Chat
                    </button>
                    <button onClick={toggleWidget} className="widget-close-button" aria-label="Close Chatbot">
                        &times;
                    </button>
                </div>
                <div className="messages-display">
                    {isLoadingChat ? (
                        <div className="loading-indicator">Loading chat...</div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={msg.id || index} className={`message-bubble ${msg.role}`}>
                                {msg.content}
                            </div>
                        ))
                    )}
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
                        disabled={isSending || isLoadingChat || !userId}
                        className="message-input"
                    />
                    <button type="submit" disabled={isSending || isLoadingChat || !userId} className="send-button">
                        {isSending ? 'Sending...' : 'Send'}
                    </button>
                </form>
            </div>
        </>
    );
}

export default ChatbotWidget;
