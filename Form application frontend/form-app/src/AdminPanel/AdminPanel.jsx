// src/AdminPanel/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axios-instance'; // Ensure you use your configured axios instance
import './AdminPanelStyle.css'; // Import the CSS file for styling

function AdminPanel({ onLogout }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [users, setUsers] = useState([]);
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // General panel error

    // Modals state
    const [showUserModal, setShowUserModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);

    // Current item being edited/added (for forms and questions)
    const [currentEditForm, setCurrentEditForm] = useState(null);
    const [currentEditQuestion, setCurrentEditQuestion] = useState(null);

    // State for managing questions within a specific form
    const [selectedFormForQuestions, setSelectedFormForQuestions] = useState(null);
    const [formQuestions, setFormQuestions] = useState([]);

    // States for new question input fields in the modal
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionType, setNewQuestionType] = useState('text');
    // FIX: Corrected useState initialization
    const [newQuestionOptions, setNewQuestionOptions] = useState(''); // Comma-separated string
    const [newQuestionMaxSelections, setNewQuestionMaxSelections] = useState(''); // For checkbox type

    // NEW STATES FOR USER MODAL INPUTS
    const [userModalUsername, setUserModalUsername] = useState('');
    const [userModalPassword, setUserModalPassword] = useState('');
    const [userModalRoles, setUserModalRoles] = useState({ ROLE_USER: false, ROLE_ADMIN: false });
    const [userModalError, setUserModalError] = useState(null); // Specific error for user modal

    // State to hold the user object being edited (null for add new)
    const [userBeingEdited, setUserBeingEdited] = useState(null);

    // NEW: Error state specifically for the question modal
    const [questionModalError, setQuestionModalError] = useState(null);


    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        // Check if user is logged in and has ADMIN role
        if (user && user.username && user.roles && user.roles.includes('ROLE_ADMIN')) {
            setUsername(user.username);
            fetchAllAdminData();
        } else {
            // If not logged in or not admin, redirect to login page
            onLogout();
        }
    }, [onLogout]);

    // Function to fetch all admin-related data (users and forms)
    const fetchAllAdminData = async () => {
        try {
            setLoading(true); // Set loading state to true
            setError(null);    // Clear any previous errors

            // Fetch users data from the backend
            const usersRes = await axiosInstance.get('/admin/users');
            setUsers(usersRes.data);

            // Fetch forms data from the backend
            const formsRes = await axiosInstance.get('/admin/forms');
            setForms(formsRes.data);

            setLoading(false); // Set loading state to false after successful fetch
        } catch (err) {
            console.error("Error fetching admin data:", err);
            // Construct a user-friendly error message
            const errorMessage =
                (err.response && err.response.data && err.response.data.message) ||
                err.message ||
                err.toString();
            setError(`Failed to load admin data: ${errorMessage}`); // Set error message
            setLoading(false); // Set loading state to false on error

            // If the error is due to unauthorized access (401 or 403), log out the user
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                onLogout();
            }
        }
    };

    // Function to fetch questions for a specific form
    const fetchFormQuestions = async (formId) => {
        try {
            setLoading(true);
            setError(null);
            const questionsRes = await axiosInstance.get(`/admin/forms/${formId}/questions`);
            setFormQuestions(questionsRes.data);
            const form = forms.find(f => f.id === formId);
            setSelectedFormForQuestions(form); // Set the form being managed
            setLoading(false);
        } catch (err) {
            console.error("Error fetching form questions:", err);
            const errorMessage =
                (err.response && err.response.data && err.response.data.message) ||
                err.message ||
                err.toString();
            setError(`Failed to load questions for form: ${errorMessage}`);
            setLoading(false);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                onLogout();
            }
        }
    };

    // --- User Management Handlers ---

    // Handler for adding a new user
    const handleAddUser = () => {
        setUserBeingEdited(null); // Indicate add mode
        setUserModalUsername('');
        setUserModalPassword('');
        setUserModalRoles({ ROLE_USER: true, ROLE_ADMIN: false }); // Default to ROLE_USER
        setUserModalError(null); // Clear any previous errors
        setShowUserModal(true);
    };

    // Handler for editing an existing user
    const handleEditUser = (user) => {
        setUserBeingEdited(user); // Set the user being edited
        setUserModalUsername(user.username);
        setUserModalPassword(''); // Password is never pre-filled for security
        setUserModalRoles({
            ROLE_USER: user.roles?.some(role => role.name === 'ROLE_USER') || false,
            ROLE_ADMIN: user.roles?.some(role => role.name === 'ROLE_ADMIN') || false
        });
        setUserModalError(null); // Clear any previous errors
        setShowUserModal(true);
    };

    // Handler for deleting a user
    const handleDeleteUser = async (userId) => {
        // Confirm deletion with the user
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return; // If user cancels, do nothing
        }
        try {
            // Send DELETE request to the backend
            await axiosInstance.delete(`/admin/users/${userId}`);
            fetchAllAdminData(); // Refresh the user list after deletion
        } catch (err) {
            console.error("Error deleting user:", err);
            setError("Failed to delete user."); // Set error message
        }
    };

    // Handler for submitting the user add/edit form in the modal
    const handleUserModalSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        setUserModalError(null); // Clear error on new submission attempt

        // Construct roles array from checkbox states
        const selectedRoles = [];
        if (userModalRoles.ROLE_USER) selectedRoles.push({ name: 'ROLE_USER' });
        if (userModalRoles.ROLE_ADMIN) selectedRoles.push({ name: 'ROLE_ADMIN' });

        // Frontend validation
        if (!userModalUsername.trim()) {
            setUserModalError("Username cannot be empty!");
            return;
        }

        const payload = {
            username: userModalUsername,
            roles: selectedRoles
        };

        if (userBeingEdited) {
            // Edit operation (PUT)
            // Only include password if it was explicitly changed
            if (userModalPassword.trim() !== '') {
                payload.password = userModalPassword.trim(); // Ensure trimmed password is sent
            }
            try {
                await axiosInstance.put(`/admin/users/${userBeingEdited.id}`, payload);
            } catch (err) {
                console.error("Error updating user:", err);
                const errorMessage = (err.response && err.response.data) || err.message || err.toString();
                setUserModalError(`Failed to update user: ${errorMessage}`);
                return;
            }
        } else {
            // Add operation (POST)
            // Password is required for new users
            if (userModalPassword.trim() === '') {
                setUserModalError("Password is required for new users.");
                return;
            }
            payload.password = userModalPassword.trim(); // Ensure trimmed password is sent for new user
            try {
                await axiosInstance.post('/admin/users', payload);
            } catch (err) {
                console.error("Error adding user:", err);
                const errorMessage = (err.response && err.response.data) || err.message || err.toString();
                setUserModalError(`Failed to add user: ${errorMessage}`);
                return;
            }
        }

        setShowUserModal(false); // Close the modal on success
        fetchAllAdminData();     // Refresh the user list
    };

    // Handler for changing user roles via checkboxes
    const handleUserModalRoleChange = (roleName, isChecked) => {
        setUserModalRoles(prevRoles => ({
            ...prevRoles,
            [roleName]: isChecked
        }));
    };


    // --- Form Management Handlers ---

    // Handler for adding a new form
    const handleAddForm = () => {
        setCurrentEditForm({ title: '', description: '' }); // Initialize an empty form object
        setShowFormModal(true); // Open the form modal
    };

    // Handler for editing an existing form
    const handleEditForm = (form) => {
        setCurrentEditForm(form); // Set the form to be edited
        setShowFormModal(true);   // Open the form modal
    };

    // Handler for deleting a form
    const handleDeleteForm = async (formId) => {
        // Confirm deletion with the user
        if (!window.confirm('Are you sure you want to delete this form and all its associated questions?')) {
            return; // If user cancels, do nothing
        }
        try {
            // Send DELETE request to the backend
            await axiosInstance.delete(`/admin/forms/${formId}`);
            fetchAllAdminData(); // Refresh the form list after deletion
            // If the deleted form was the one selected for questions, clear it
            if (selectedFormForQuestions && selectedFormForQuestions.id === formId) {
                setSelectedFormForQuestions(null);
                setFormQuestions([]);
            }
        } catch (err) {
            console.error("Error deleting form:", err);
            setError("Failed to delete form."); // Set error message
        }
    };

    // Handler for submitting the form add/edit form in the modal
    const handleFormModalSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        try {
            if (currentEditForm.id) {
                // If form ID exists, it's an edit operation (PUT request)
                await axiosInstance.put(`/admin/forms/${currentEditForm.id}`, currentEditForm);
            } else {
                // If no form ID, it's an add operation (POST request)
                await axiosInstance.post('/admin/forms', currentEditForm);
            }
            setShowFormModal(false); // Close the modal
            fetchAllAdminData();     // Refresh the form list
        } catch (err) {
            console.error("Error saving form:", err);
            setError("Failed to save form."); // Set error message
        }
    };

    // --- Question Management Handlers ---

    // Handler for adding a new question to the selected form
    const handleAddQuestion = () => {
        if (!selectedFormForQuestions) {
            // Replaced alert with custom message box as per instructions
            const messageBox = document.createElement('div');
            messageBox.className = 'custom-message-box';
            messageBox.innerHTML = `
                <p>Please select a form first to add a question.</p>
                <button class="custom-message-box-button">OK</button>
            `;
            document.body.appendChild(messageBox);
            messageBox.querySelector('.custom-message-box-button').onclick = () => {
                document.body.removeChild(messageBox);
            };
            return;
        }
        setCurrentEditQuestion({ questionText: '', type: 'text', options: [], maxSelections: null }); // Initialize empty question
        setNewQuestionText('');
        setNewQuestionType('text');
        setNewQuestionOptions('');
        setNewQuestionMaxSelections('');
        setQuestionModalError(null); // Clear previous errors
        setShowQuestionModal(true);
    };

    // Handler for editing an existing question
    const handleEditQuestion = (question) => {
        setCurrentEditQuestion(question);
        setNewQuestionText(question.questionText);
        setNewQuestionType(question.type);
        setNewQuestionOptions(question.options ? question.options.join(', ') : '');
        setNewQuestionMaxSelections(question.maxSelections || '');
        setQuestionModalError(null); // Clear previous errors
        setShowQuestionModal(true);
    };

    // Handler for deleting a question
    const handleDeleteQuestion = async (questionId) => {
        if (!selectedFormForQuestions) return; // Should not happen if button is only shown when form is selected
        // Replaced window.confirm with custom message box
        const confirmBox = document.createElement('div');
        confirmBox.className = 'custom-message-box';
        confirmBox.innerHTML = `
            <p>Are you sure you want to delete this question?</p>
            <button class="custom-message-box-button confirm-yes">Yes</button>
            <button class="custom-message-box-button confirm-no">No</button>
        `;
        document.body.appendChild(confirmBox);

        confirmBox.querySelector('.confirm-yes').onclick = async () => {
            document.body.removeChild(confirmBox);
            try {
                await axiosInstance.delete(`/admin/forms/${selectedFormForQuestions.id}/questions/${questionId}`);
                fetchFormQuestions(selectedFormForQuestions.id); // Refresh questions for the current form
            } catch (err) {
                console.error("Error deleting question:", err);
                setError("Failed to delete question.");
            }
        };
        confirmBox.querySelector('.confirm-no').onclick = () => {
            document.body.removeChild(confirmBox);
        };
    };

    // Handler for submitting the question add/edit form in the modal
    const handleQuestionModalSubmit = async (e) => {
        e.preventDefault();
        setQuestionModalError(null); // Clear previous errors

        if (!selectedFormForQuestions) {
            setQuestionModalError("No form selected to add/edit questions.");
            return;
        }

        // Frontend validation for question text
        if (!newQuestionText.trim()) {
            setQuestionModalError("Question text cannot be empty.");
            return;
        }

        // Frontend validation for options if type is radio or checkbox
        if ((newQuestionType === 'radio' || newQuestionType === 'checkbox') && !newQuestionOptions.trim()) {
            setQuestionModalError("Options are required for radio and checkbox questions.");
            return;
        }

        // Frontend validation for maxSelections if type is checkbox
        const parsedMaxSelections = newQuestionMaxSelections !== '' ? parseInt(newQuestionMaxSelections, 10) : null;
        if (newQuestionType === 'checkbox') {
            if (parsedMaxSelections === null || isNaN(parsedMaxSelections) || parsedMaxSelections <= 0) {
                setQuestionModalError("Max selections must be a positive number for checkbox questions.");
                return;
            }
        }


        const questionData = {
            questionText: newQuestionText,
            type: newQuestionType,
            options: (newQuestionType === 'radio' || newQuestionType === 'checkbox') && newQuestionOptions.trim() ?
                     newQuestionOptions.split(',').map(s => s.trim()).filter(s => s.length > 0) :
                     [],
            maxSelections: newQuestionType === 'checkbox' ? parsedMaxSelections : null,
            form: { id: selectedFormForQuestions.id } // Link question to the current form
        };

        try {
            if (currentEditQuestion && currentEditQuestion.id) {
                // Update existing question
                await axiosInstance.put(`/admin/forms/${selectedFormForQuestions.id}/questions/${currentEditQuestion.id}`, questionData);
            } else {
                // Add new question
                await axiosInstance.post(`/admin/forms/${selectedFormForQuestions.id}/questions`, questionData);
            }
            setShowQuestionModal(false); // Close modal
            fetchFormQuestions(selectedFormForQuestions.id); // Refresh questions list
        } catch (err) {
            console.error("Error saving question:", err);
            const errorMessage = (err.response && err.response.data && err.response.data.message) || err.message || err.toString();
            setQuestionModalError(`Failed to save question: ${errorMessage}`); // Set modal-specific error
        }
    };


    // Render loading state
    if (loading) {
        return <div className="admin-loading-message">Loading admin panel...</div>;
    }

    // Render error state
    if (error) {
        return <div className="admin-error-message">❌ {error}</div>;
    }

    return (
        <div className="admin-panel-container">
            {/* Navigation Bar */}
            <nav className="admin-panel-nav">
                <h2 className="admin-panel-title">Admin Panel - Welcome, {username}!</h2>
                <button onClick={onLogout} className="logout-button">
                    Logout
                </button>
            </nav>

            <div className="admin-content-wrapper">
                {/* User Management Section */}
                <div className="admin-section-container user-management-section">
                    <h3 className="section-title">User Management</h3>
                    <button
                        onClick={handleAddUser}
                        className="add-button add-user-button"
                    >
                        Add New User
                    </button>
                    <div className="table-responsive">
                        <table className="admin-table user-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Roles</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.username}</td>
                                        <td>{user.roles.map(role => role.name).join(', ')}</td>
                                        <td className="table-actions">
                                            <button onClick={() => handleEditUser(user)} className="action-button edit-button">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="action-button delete-button">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form Management Section */}
                {!selectedFormForQuestions ? ( // Show Form Management if no form is selected for questions
                    <div className="admin-section-container form-management-section">
                        <h3 className="section-title">Form Management</h3>
                        <button onClick={handleAddForm} className="add-button add-form-button">
                            Add New Form
                        </button>
                        <div className="table-responsive">
                            <table className="admin-table form-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Description</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forms.map(form => (
                                        <tr key={form.id}>
                                            <td>{form.id}</td>
                                            <td>{form.title}</td>
                                            <td>{form.description}</td>
                                            <td className="table-actions">
                                                <button onClick={() => fetchFormQuestions(form.id)} className="action-button view-questions-button">
                                                    Manage Questions
                                                </button>
                                                <button onClick={() => handleEditForm(form)} className="action-button edit-button">
                                                    Edit Form
                                                </button>
                                                <button onClick={() => handleDeleteForm(form.id)} className="action-button delete-button">
                                                    Delete Form
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : ( // Show Question Management if a form is selected
                    <div className="admin-section-container question-management-section">
                        <h3 className="section-title">Questions for Form: {selectedFormForQuestions.title} (ID: {selectedFormForQuestions.id})</h3>
                        <button onClick={handleAddQuestion} className="add-button add-question-button">
                            Add New Question
                        </button>
                        <button onClick={() => { setSelectedFormForQuestions(null); setFormQuestions([]); }} className="back-button back-to-forms-button">
                            ← Back to Forms
                        </button>
                        <div className="table-responsive">
                            <table className="admin-table question-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Question Text</th>
                                        <th>Type</th>
                                        <th>Options</th>
                                        <th>Max Selections</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formQuestions.map(question => (
                                        <tr key={question.id}>
                                            <td>{question.id}</td>
                                            <td>{question.questionText}</td>
                                            <td>{question.type}</td>
                                            <td>{question.options && question.options.length > 0 ? question.options.join(', ') : 'N/A'}</td>
                                            <td>{question.maxSelections || 'N/A'}</td>
                                            <td className="table-actions">
                                                <button onClick={() => handleEditQuestion(question)} className="action-button edit-button">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDeleteQuestion(question.id)} className="action-button delete-button">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* User Modal */}
            {showUserModal && (
                <div className="modal-overlay user-modal-overlay">
                    <div className="modal-content user-modal-content">
                        <h3 className="modal-title">{userBeingEdited ? 'Edit User' : 'Add User'}</h3>
                        <form onSubmit={handleUserModalSubmit} className="modal-form user-form">
                            {userModalError && ( // Display user modal error
                                <div className="error-message modal-error-message">
                                    ❌ {userModalError}
                                </div>
                            )}
                            <div className="modal-form-group">
                                <label htmlFor="username">Username:</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={userModalUsername}
                                    onChange={(e) => setUserModalUsername(e.target.value)}
                                    required
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label htmlFor="password">Password {userBeingEdited ? '(leave blank to keep current)' : '(required for new user)'}:</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={userModalPassword}
                                    onChange={(e) => setUserModalPassword(e.target.value)}
                                    required={!userBeingEdited} // Required only for new users
                                    className="modal-input"
                                />
                            </div>
                            {/* Role selection using checkboxes */}
                            <div className="modal-form-group">
                                <label>Roles:</label>
                                <div className="role-checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userModalRoles.ROLE_USER}
                                            onChange={(e) => handleUserModalRoleChange('ROLE_USER', e.target.checked)}
                                            className="role-checkbox-input"
                                        />
                                        User
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userModalRoles.ROLE_ADMIN}
                                            onChange={(e) => handleUserModalRoleChange('ROLE_ADMIN', e.target.checked)}
                                            className="role-checkbox-input"
                                        />
                                        Admin
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer user-modal-footer">
                                <button type="button" onClick={() => setShowUserModal(false)} className="cancel-button">
                                    Cancel
                                </button>
                                <button type="submit" className="save-button">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showFormModal && (
                <div className="modal-overlay form-modal-overlay">
                    <div className="modal-content form-modal-content">
                        <h3 className="modal-title">{currentEditForm.id ? 'Edit Form' : 'Add Form'}</h3>
                        <form onSubmit={handleFormModalSubmit} className="modal-form form-form">
                            <div className="modal-form-group">
                                <label htmlFor="formTitle">Title:</label>
                                <input
                                    type="text"
                                    id="formTitle"
                                    value={currentEditForm.title || ''}
                                    onChange={(e) => setCurrentEditForm({ ...currentEditForm, title: e.target.value })}
                                    required
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label htmlFor="formDescription">Description:</label>
                                <textarea
                                    id="formDescription"
                                    value={currentEditForm.description || ''}
                                    onChange={(e) => setCurrentEditForm({ ...currentEditForm, description: e.target.value })}
                                    className="modal-textarea"
                                />
                            </div>
                            <div className="modal-footer form-modal-footer">
                                <button type="button" onClick={() => setShowFormModal(false)} className="cancel-button">
                                    Cancel
                                </button>
                                <button type="submit" className="save-button">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Question Modal */}
            {showQuestionModal && (
                <div className="modal-overlay question-modal-overlay">
                    <div className="modal-content question-modal-content">
                        <h3 className="modal-title">{currentEditQuestion && currentEditQuestion.id ? 'Edit Question' : 'Add Question'}</h3>
                        <form onSubmit={handleQuestionModalSubmit} className="modal-form question-form">
                            {questionModalError && ( // NEW: Display question modal error
                                <div className="error-message modal-error-message">
                                    ❌ {questionModalError}
                                </div>
                            )}
                            <div className="modal-form-group">
                                <label htmlFor="questionText">Question Text:</label>
                                <input
                                    type="text"
                                    id="questionText"
                                    value={newQuestionText}
                                    onChange={(e) => setNewQuestionText(e.target.value)}
                                    required
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label htmlFor="questionType">Type:</label>
                                <select
                                    id="questionType"
                                    value={newQuestionType}
                                    onChange={(e) => setNewQuestionType(e.target.value)}
                                    className="modal-select"
                                >
                                    <option value="text">Text</option>
                                    <option value="radio">Radio</option>
                                    <option value="checkbox">Checkbox</option>
                                </select>
                            </div>
                            {(newQuestionType === 'radio' || newQuestionType === 'checkbox') && (
                                <div className="modal-form-group">
                                    <label htmlFor="questionOptions">Options (comma separated):</label>
                                    <input
                                        type="text"
                                        id="questionOptions"
                                        value={newQuestionOptions}
                                        onChange={(e) => setNewQuestionOptions(e.target.value)}
                                        placeholder="Option1, Option2, Option3"
                                        className="modal-input"
                                    />
                                </div>
                            )}
                            {newQuestionType === 'checkbox' && (
                                <div className="modal-form-group">
                                    <label htmlFor="maxSelections">Max Selections (optional, number):</label>
                                    <input
                                        type="number"
                                        id="maxSelections"
                                        value={newQuestionMaxSelections}
                                        onChange={(e) => setNewQuestionMaxSelections(e.target.value)}
                                        min="1"
                                        className="modal-input"
                                    />
                                </div>
                            )}
                            <div className="modal-footer question-modal-footer">
                                <button type="button" onClick={() => setShowQuestionModal(false)} className="cancel-button">
                                    Cancel
                                </button>
                                <button type="submit" className="save-button">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPanel;
