// src/components/QuestionForm.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from '../services/axios-instance';
import './QuestionFormStyle.css'; // Import the CSS file
import { useNavigate } from 'react-router-dom';

const QuestionForm = ({ onLogout }) => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({}); // Stores current form input values
    const [userExistingAnswers, setUserExistingAnswers] = useState({}); // Stores answers fetched from backend
    const [status, setStatus] = useState(null); // null | "saving" | "success" | "error"
    const [fetchError, setFetchError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [validationErrors, setValidationErrors] = useState({}); // NEW: State for validation errors

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [myAnswers, setMyAnswers] = useState([]);
    const [myAnswersLoading, setMyAnswersLoading] = useState(false);
    const [myAnswersError, setMyAnswersError] = useState(null);

    const navigate = useNavigate();

    const fetchAllData = async () => {
        try {
            setFetchError(null);
            setStatus(null); // Clear status on new data fetch
            setLoading(true);
            setValidationErrors({}); // Clear validation errors on new fetch

            // Fetch questions
            const questionsRes = await axiosInstance.get("/questions");
            setQuestions(questionsRes.data);

            // Fetch user's existing answers
            const userAnswersRes = await axiosInstance.get("/answers/my-answers");
            const existingAnswersMap = userAnswersRes.data.reduce((acc, answer) => {
                acc[answer.question.id] = answer; // Map by question ID
                return acc;
            }, {});
            setUserExistingAnswers(existingAnswersMap);

            // Pre-fill form answers with existing ones
            const initialFormAnswers = {};
            questionsRes.data.forEach(q => {
                if (existingAnswersMap[q.id]) {
                    // For checkbox type, split the stored response string into an array
                    if (q.type === 'checkbox') {
                        initialFormAnswers[q.id] = existingAnswersMap[q.id].response ? existingAnswersMap[q.id].response.split(',').map(s => s.trim()) : [];
                    } else {
                        initialFormAnswers[q.id] = existingAnswersMap[q.id].response;
                    }
                } else {
                    // Initialize empty for new questions, empty array for checkboxes
                    initialFormAnswers[q.id] = q.type === 'checkbox' ? [] : '';
                }
            });
            setAnswers(initialFormAnswers);

        } catch (err) {
            console.error("Error fetching data:", err);
            const errorMessage =
                (err.response && err.response.data && err.response.data.message) ||
                err.message ||
                err.toString();
            setFetchError(`Failed to load data: ${errorMessage}`);
            setQuestions([]);
            setUserExistingAnswers({});
            setAnswers({}); // Clear form answers on error
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                onLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [onLogout]);

    // Fetch user's answers for sidebar when sidebar is opened
    useEffect(() => {
        if (isSidebarOpen) {
            const fetchMyAnswersForSidebar = async () => {
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
                    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                        onLogout();
                    }
                } finally {
                    setMyAnswersLoading(false);
                }
            };
            fetchMyAnswersForSidebar();
        }
    }, [isSidebarOpen, onLogout]);

    const handleChange = (questionId, value, type) => {
        // Clear validation error for this question when user types/selects
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[questionId];
            return newErrors;
        });

        if (type === 'checkbox') {
            setAnswers(prev => {
                const currentSelections = prev[questionId] || [];
                if (currentSelections.includes(value)) {
                    // Deselect if already selected
                    return { ...prev, [questionId]: currentSelections.filter(item => item !== value) };
                } else {
                    // Select if not selected, but check maxSelections
                    const question = questions.find(q => q.id === questionId);
                    if (question && question.maxSelections && currentSelections.length >= question.maxSelections) {
                        // Prevent selection if maxSelections reached
                        // Using a custom message box instead of alert()
                        const messageBox = document.createElement('div');
                        messageBox.className = 'custom-message-box';
                        messageBox.innerHTML = `
                            <p>You can select a maximum of ${question.maxSelections} options.</p>
                            <button class="custom-message-box-button">OK</button>
                        `;
                        document.body.appendChild(messageBox);
                        messageBox.querySelector('.custom-message-box-button').onclick = () => {
                            document.body.removeChild(messageBox);
                        };
                        return prev;
                    }
                    // Add to selections
                    return { ...prev, [questionId]: [...currentSelections, value] };
                }
            });
        } else {
            // For text and radio, simple update
            setAnswers((prev) => ({ ...prev, [questionId]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("saving");
        const newValidationErrors = {};
        let hasErrors = false;

        // Validate each question
        questions.forEach(q => {
            let isEmpty = false;
            if (q.type === 'text' || q.type === 'radio') {
                if (!answers[q.id] || answers[q.id].trim() === '') {
                    isEmpty = true;
                }
            } else if (q.type === 'checkbox') {
                if (!answers[q.id] || answers[q.id].length === 0) {
                    isEmpty = true;
                }
            }

            if (isEmpty) {
                newValidationErrors[q.id] = true; // Mark as error
                hasErrors = true;
            }
        });

        setValidationErrors(newValidationErrors);

        if (hasErrors) {
            setStatus("error"); // Set status to error due to validation
            setFetchError("Please fill out all required questions.");
            return; // Stop submission
        }

        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user ? user.id : null;

        if (!userId) {
            setStatus("error");
            console.error("User ID not found. Please log in again.");
            onLogout();
            return;
        }

        const payload = questions.map(q => {
            let responseValue;
            if (q.type === 'checkbox') {
                // For checkboxes, join the array of selected options into a comma-separated string
                responseValue = Array.isArray(answers[q.id]) ? answers[q.id].join(', ') : '';
            } else {
                responseValue = answers[q.id] || '';
            }

            return {
                question: { id: q.id },
                response: responseValue,
                user: { id: userId }
            };
        });

        console.log("Sending payload:", payload);

        try {
            const res = await axiosInstance.post("/answers", payload);
            setStatus("success");
            setFetchError(null); // Clear any previous fetch errors
            fetchAllData(); // Re-fetch all data to update existing answers and notes
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

    if (loading) return <div className="text-center p-4">Loading form...</div>;
    // Display fetchError only if it's not a validation error
    if (fetchError && status !== "error") return <div className="text-center p-4 text-red-500">❌ {fetchError}</div>;


    return (
        <div className="main-container">
            {/* Circular Profile Icon Button */}
            <button
                onClick={toggleSidebar}
                className="profile-button"
                aria-label="Open Profile Sidebar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </button>

            <div className="div-wrapping-container">
                <h1 className="form-title-in-box">Form</h1>
                {questions.length === 0 ? (
                    <p>No questions available.</p>
                ) : (
                    <form className="form-class" onSubmit={handleSubmit}>
                        {questions.map((q) => (
                            <div key={q.id} className="mb-4 question-item"> {/* Added question-item class */}
                                <label>{q.questionText}</label>
                                <div className="input-with-validation"> {/* Wrapper for input and error icon */}
                                    {q.type === "radio" && q.options && q.options.length > 0 ? (
                                        <div className={`radio-group ${validationErrors[q.id] ? 'input-error' : ''}`}> {/* Added input-error class */}
                                            {q.options.map((option, index) => (
                                                <label key={index} className="radio-option">
                                                    <input
                                                        type="radio"
                                                        name={`question-${q.id}`}
                                                        value={option}
                                                        checked={answers[q.id] === option}
                                                        onChange={(e) => handleChange(q.id, e.target.value, q.type)}
                                                        className="form-radio-input"
                                                    />
                                                    {option}
                                                </label>
                                            ))}
                                        </div>
                                    ) : q.type === "checkbox" && q.options && q.options.length > 0 ? (
                                        <div className={`checkbox-group ${validationErrors[q.id] ? 'input-error' : ''}`}> {/* Added input-error class */}
                                            {q.options.map((option, index) => (
                                                <label key={index} className="checkbox-option">
                                                    <input
                                                        type="checkbox"
                                                        name={`question-${q.id}`}
                                                        value={option}
                                                        checked={answers[q.id] && answers[q.id].includes(option)}
                                                        onChange={(e) => handleChange(q.id, e.target.value, q.type)}
                                                        className="form-checkbox-input"
                                                    />
                                                    {option}
                                                </label>
                                            ))}
                                            {q.maxSelections && (
                                                <p className="max-selections-note">
                                                    Select up to {q.maxSelections} options.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <input
                                            type={q.type}
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleChange(q.id, e.target.value, q.type)}
                                            className={`form-input ${validationErrors[q.id] ? 'input-error' : ''}`} // Added input-error class
                                        />
                                    )}
                                    {validationErrors[q.id] && (
                                        <span className="validation-error-icon" title="Please don't send empty.">
                                            &#9888; {/* Exclamation mark icon */}
                                        </span>
                                    )}
                                </div>
                                {userExistingAnswers[q.id] && (
                                    <p className="update-note">
                                        Note: You have already answered this question. Submitting will update your answer.
                                    </p>
                                )}
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
                    <div className="form-status-message success-message">
                        ✅ Your answers were saved/updated!
                    </div>
                )}
                {status === "error" && (
                    <div className="form-status-message error-message">
                        ❌ Oops! Something went wrong while saving. {fetchError}
                    </div>
                )}
            </div>

            {/* Profile Sidebar */}
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

            {/* Overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar}></div>
            )}
        </div>
    );
};

export default QuestionForm;
