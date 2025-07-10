// src/QuestionForm.jsx
import React, { useEffect, useState } from "react";
// import axios from "axios"; // We will replace this with our custom axios instance
import axiosInstance from '../services/axios-instance'; // Import the custom axios instance
import './QuestionFormStyle.css';

const QuestionForm = () => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [status, setStatus] = useState(null); // null | "saving" | "success" | "error"
    const [savedData, setSavedData] = useState(null); // store server response
    const [fetchError, setFetchError] = useState(null); // Separate state for fetch errors

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                // Use axiosInstance for protected endpoints
                // It automatically adds the Authorization header with the JWT token
                const res = await axiosInstance.get("/questions"); // Corrected endpoint
                setQuestions(res.data);
                setFetchError(null); // Clear any previous fetch errors
            } catch (err) {
                console.error("Error fetching questions:", err);
                // Handle unauthorized or other errors during fetch
                const errorMessage =
                    (err.response && err.response.data && err.response.data.message) ||
                    err.message ||
                    err.toString();
                setFetchError(`Failed to load questions: ${errorMessage}`);
                setQuestions([]); // Clear questions on error
            }
        };

        fetchQuestions();
    }, []); // Empty dependency array means this runs once on component mount

    const handleChange = (id, value) => {
        setAnswers((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("saving");
        setSavedData(null); // Clear previous saved data

        // Retrieve the user object from local storage
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user ? user.id : null; // Get the user ID from the stored object

        if (!userId) {
            setStatus("error");
            console.error("User ID not found. Please log in again.");
            // Optionally redirect to login page if userId is missing
            // navigate("/login");
            return;
        }

        const payload = Object.entries(answers).map(([id, resp]) => ({
            question: { id: +id }, // Ensure question ID is a number
            response: resp,
            user: { id: userId } // Use the retrieved userId
        }));

        console.log("Sending payload:", payload);

        try {
            // Use axiosInstance for protected endpoints (e.g., /api/answers)
            const res = await axiosInstance.post("/answers", payload); // Assuming /api/answers
            setSavedData(res.data);
            setStatus("success");
        } catch (err) {
            console.error("Save failed:", err);
            setStatus("error");
            const errorMessage =
                (err.response && err.response.data && err.response.data.message) ||
                err.message ||
                err.toString();
            setFetchError(`Failed to save answers: ${errorMessage}`); // Use fetchError for general errors
        }
    };

    return (
        <div className="div-wrapping-container">
            <h1>Form</h1>
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
                        <div key={q.id} style={{ marginBottom: "1rem" }}>
                            <label>{q.questionText}</label>
                            <br />
                            <input
                                type={q.type === "radio" ? "text" : q.type} // Assuming 'radio' type means free text for now, adjust if you have actual radio buttons
                                onChange={(e) => handleChange(q.id, e.target.value)}
                                className="border border-gray-300 rounded-md p-2 mt-1 w-full"
                            />
                        </div>
                    ))}

                    <button type="submit" disabled={status === "saving"}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition duration-200"
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
    );
};

export default QuestionForm;
