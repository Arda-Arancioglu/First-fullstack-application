// src/QuestionForm.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from '../services/axios-instance'; // Import the custom axios instance
import './QuestionFormStyle.css'; // Import the CSS file
import { useNavigate } from 'react-router-dom'; // Import useNavigate for logout redirect

const QuestionForm = ({ onLogout }) => { // Accept onLogout as a prop
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [status, setStatus] = useState(null); // null | "saving" | "success" | "error"
    const [savedData, setSavedData] = useState(null); // store server response
    const [fetchError, setFetchError] = useState(null); // Separate state for fetch errors

    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility
    const [myAnswers, setMyAnswers] = useState([]); // State for user's answers in sidebar
    const [myAnswersLoading, setMyAnswersLoading] = useState(false);
    const [myAnswersError, setMyAnswersError] = useState(null);

    const navigate = useNavigate(); // Initialize useNavigate for local logout handling (if needed, though onLogout prop is preferred)

    // Fetch questions on component mount
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await axiosInstance.get("/questions");
                setQuestions(res.data);
                setFetchError(null);
            } catch (err) {
                console.error("Error fetching questions:", err);
                const errorMessage =
                    (err.response && err.response.data && err.response.data.message) ||
                    err.message ||
                    err.toString();
                setFetchError(`Failed to load questions: ${errorMessage}`);
                setQuestions([]);
                // If token is invalid/expired, automatically log out
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    onLogout();
                }
            }
        };

        fetchQuestions();
    }, [onLogout]);

    // Fetch user's answers when sidebar is opened
    useEffect(() => {
        if (isSidebarOpen) {
            const fetchMyAnswers = async () => {
                try {
                    setMyAnswersLoading(true);
                    const response = await axiosInstance.get('/answers/my-answers');
                    setMyAnswers(response.data);
                    setMyAnswersError(null);
                } catch (err) {
                    console.error("Error fetching my answers for sidebar:", err);
                    const errorMessage =
                        (err.response && err.response.data && err.response.data.message) ||
                        err.message ||
                        err.toString();
                    setMyAnswersError(`Failed to load your answers: ${errorMessage}`);
                    setMyAnswers([]);
                    // If token is invalid/expired, automatically log out
                    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                        onLogout();
                    }
                } finally {
                    setMyAnswersLoading(false);
                }
            };
            fetchMyAnswers();
        }
    }, [isSidebarOpen, onLogout]);

    const handleChange = (id, value) => {
        setAnswers((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("saving");
        setSavedData(null);

        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user ? user.id : null;

        if (!userId) {
            setStatus("error");
            console.error("User ID not found. Please log in again.");
            onLogout();
            return;
        }

        const payload = Object.entries(answers).map(([id, resp]) => ({
            question: { id: +id },
            response: resp,
            user: { id: userId }
        }));

        console.log("Sending payload:", payload);

        try {
            const res = await axiosInstance.post("/answers", payload);
            setSavedData(res.data);
            setStatus("success");
            setAnswers({}); // Clear form fields by resetting answers state
            if (isSidebarOpen) {
                const response = await axiosInstance.get('/answers/my-answers');
                setMyAnswers(response.data);
            }
        } catch (err) {
            console.error("Save failed:", err);
            setStatus("error");
            const errorMessage =
                (err.response && err.response.data && err.response.data.message) ||
                err.message ||
                err.toString();
            setFetchError(`Failed to save answers: ${errorMessage}`);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                onLogout();
            }
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="main-container">
            {/* Header - Existing structure retained */}
           

            {/* Circular Profile Icon Button - NEW */}
            <button
                onClick={toggleSidebar}
                className="profile-button" // Custom class for the circular button
                aria-label="Open Profile Sidebar"
            >
                {/* User icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" className="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </button>


            {/* Main Form Content - Existing structure retained */}
            <div className="div-wrapping-container">
                <h1 className="form-title">Form</h1>
                {fetchError && (
                    <div style={{ marginTop: 20, color: "red" }}>
                        ❌ {fetchError}
                    </div>
                )}
                {questions.length === 0 && !fetchError ? (
                    <p>No questions available or still loading...</p>
                ) : (
                    <form className="form-class" onSubmit={handleSubmit}>
                        {questions.map((q) => (
                            <div key={q.id} className="mb-4">
                                <label>{q.questionText}</label>
                                <br />
                                <input
                                    type={q.type === "radio" ? "text" : q.type}
                                    value={answers[q.id] || ''} // Ensure input is controlled
                                    onChange={(e) => handleChange(q.id, e.target.value)}
                                    className="form-input"
                                />
                            </div>
                        ))}

                        <button type="submit" disabled={status === "saving"}
                            className="form-button"
                        >
                            {status === "saving" ? "Saving…" : "Submit"}
                        </button>
                    </form>
                )}

                {status === "success" && (
                    <div style={{ marginTop: 20, color: "green" }}>
                        ✅ Your answers were saved!
                        <pre>{JSON.stringify(savedData, null, 2)}</pre>
                    </div>
                )}
                {status === "error" && (
                    <div style={{ marginTop: 20, color: "red" }}>
                        ❌ Oops! Something went wrong while saving.
                    </div>
                )}
            </div>

            {/* Profile Sidebar - NEW CSS classes */}
            <div className={`profile-sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <h2 className="sidebar-title">Your Profile</h2>
                    <button onClick={toggleSidebar} className="sidebar-close-button">&times;</button>
                </div>

                <h3 className="sidebar-subtitle">Your Submitted Answers:</h3>
                {myAnswersLoading ? (
                    <p className="sidebar-loading-text">Loading answers...</p>
                ) : myAnswersError ? (
                    <p className="sidebar-error-text">Error: {myAnswersError}</p>
                ) : myAnswers.length > 0 ? (
                    <ul className="sidebar-answers-list">
                        {myAnswers.map((answer) => (
                            <li key={answer.id} className="sidebar-answer-item">
                                <strong>Q:</strong> {answer.question?.questionText || 'N/A'} <br />
                                <strong>A:</strong> {answer.response}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="sidebar-no-answers-text">You haven't submitted any answers yet.</p>
                )}

                <div className="sidebar-footer">
                    <button
                        onClick={onLogout}
                        className="sidebar-logout-button"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Overlay - NEW CSS class */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar}></div>
            )}
        </div>
    );
};

export default QuestionForm;
