// src/HomePage/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axios-instance'; // Assuming you have an axiosInstance for authenticated requests
import './HomePageStyle.css'; // Import the new CSS file

function HomePage({ onLogout }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [forms, setForms] = useState([]); // NEW: State to store fetched forms
    const [loadingForms, setLoadingForms] = useState(true); // NEW: Loading state for forms
    const [formsError, setFormsError] = useState(null); // NEW: Error state for forms

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.username) {
            setUsername(user.username);
        } else {
            onLogout(); // If no user data, redirect to login
            return; // Exit early
        }

        const fetchForms = async () => {
            try {
                setLoadingForms(true);
                setFormsError(null);
                const response = await axiosInstance.get('/forms'); // Fetch forms from the backend
                setForms(response.data);
            } catch (err) {
                console.error("Error fetching forms:", err);
                const errorMessage =
                    (err.response && err.response.data && err.response.data.message) ||
                    err.message ||
                    err.toString();
                setFormsError(`Failed to load forms: ${errorMessage}`);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    console.log("error.response", err.response)
                    // onLogout(); // Log out if unauthorized
                }
            } finally {
                setLoadingForms(false);
            }
        };

        fetchForms();
    }, [onLogout]);

    const handleGoToForm = (formId) => {
        navigate(`/forms/${formId}/questions`); // Navigate to the QuestionForm page with formId
    };

    return (
        <div className="home-page-container">
            <nav className="home-page-nav">
                <h2 className="home-page-title">Welcome, {username}!</h2>
                <button
                    onClick={onLogout}
                    className="logout-button"
                >
                    Logout
                </button>
            </nav>

            <div className="home-content-card">
                <h3 className="card-title">Available Questionnaires</h3> {/* Changed title */}
                {loadingForms ? (
                    <p className="loading-message">Loading forms...</p>
                ) : formsError ? (
                    <p className="error-message">❌ {formsError}</p>
                ) : forms.length === 0 ? (
                    <p className="no-forms-message">No forms available at the moment.</p>
                ) : (
                    <ul className="forms-list"> {/* NEW: List for forms */}
                        {forms.map(form => (
                            <li key={form.id} className="form-item">
                                <h4 className="form-item-title">{form.title}</h4>
                                <p className="form-item-description">{form.description}</p>
                                <button
                                    onClick={() => handleGoToForm(form.id)}
                                    className="go-to-form-button"
                                >
                                    Start/Continue
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default HomePage;
