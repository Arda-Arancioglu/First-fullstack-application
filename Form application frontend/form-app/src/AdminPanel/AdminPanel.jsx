// src/AdminPanel/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axios-instance'; // Ensure you use your configured axios instance
import './AdminPanelStyle.css'; // Import the CSS file for styling

function AdminPanel({ onLogout, isMainTab }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // General panel error
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility
    const [activeSection, setActiveSection] = useState('dashboard'); // Default active section is 'dashboard'

    // --- Data States ---
    const [users, setUsers] = useState([]);
    const [forms, setForms] = useState([]);

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
    const [newQuestionOptions, setNewQuestionOptions] = useState(''); // Comma-separated string
    const [newQuestionMaxSelections, setNewQuestionMaxSelections] = useState(''); // For checkbox type

    // States for user modal inputs
    const [userModalUsername, setUserModalUsername] = useState('');
    const [userModalPassword, setUserModalPassword] = useState('');
    const [userModalRoles, setUserModalRoles] = useState({ ROLE_USER: false, ROLE_ADMIN: false });
    const [userModalError, setUserModalError] = useState(null); // Specific error for user modal

    // State to hold the user object being edited (null for add new)
    const [userBeingEdited, setUserBeingEdited] = useState(null);
    // --- End Data States ---

    // --- Pagination States for Users ---
    const [currentUserPage, setCurrentUserPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(5);

    // --- Pagination States for Forms ---
    const [currentFormPage, setCurrentFormPage] = useState(1);
    const [formsPerPage, setFormsPerPage] = useState(5);

    // --- Pagination States for Questions ---
    const [currentQuestionsPage, setCurrentQuestionsPage] = useState(1);
    const [questionsPerPage, setQuestionsPerPage] = useState(5);


    // Effect for initial authentication check and setting username
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));

        if (!user || !user.username || !user.roles || !user.roles.includes('ROLE_ADMIN')) {
            onLogout();
            return;
        }
        setUsername(user.username);
        setLoading(false); // Set loading to false after user check
    }, [onLogout]);

    // Function to fetch all admin-related data (users and forms)
    const fetchAllAdminData = async () => {
        try {
            setLoading(true); // Set loading state to true
            setError(null);    // Clear any previous errors

            // Fetch users data from the backend
            const usersRes = await axiosInstance.get('/admin/users');
            setUsers(usersRes.data);
            setCurrentUserPage(1); // Reset user pagination on data fetch

            // Fetch forms data from the backend
            const formsRes = await axiosInstance.get('/admin/forms');
            setForms(formsRes.data);
            setCurrentFormPage(1); // Reset form pagination on data fetch

            setLoading(false); // Set loading state to false after successful fetch
        } catch (err) {
            console.error("AdminPanel: Error fetching admin data:", err);
            const errorMessage =
                (err.response && err.response.data && err.response.data.message) ||
                err.message ||
                err.toString();
            setError(`Failed to load admin data: ${errorMessage}`); // Set error message
            setLoading(false); // Set loading state to false on error

            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                onLogout();
            }
        }
    };

    // Function to fetch questions for a specific form
    const fetchFormQuestions = async (formId) => {
        if (!isMainTab) {
            setError("Cannot manage questions. This is not the main active tab.");
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const questionsRes = await axiosInstance.get(`/admin/forms/${formId}/questions`);
            setFormQuestions(questionsRes.data);
            const form = forms.find(f => f.id === formId);
            setSelectedFormForQuestions(form); // Set the form being managed
            setCurrentQuestionsPage(1); // Reset to first page when new form is selected
            setLoading(false);
            setActiveSection('questionManagement'); // Switch to question management view
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

    // Effect for fetching data based on isMainTab status
    useEffect(() => {
        if (isMainTab) {
            fetchAllAdminData(); // If this tab is the main tab, attempt to fetch data
        } else {
            setError("Admin Panel is inactive. Please use the main active tab.");
            setLoading(false);
        }
    }, [isMainTab]); // Depends on isMainTab to re-trigger data fetch or error state

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // --- User Management Handlers ---
    const handleAddUser = () => {
        if (!isMainTab) { setUserModalError("Cannot add user. This is not the main active tab."); return; }
        setUserBeingEdited(null);
        setUserModalUsername('');
        setUserModalPassword('');
        setUserModalRoles({ ROLE_USER: true, ROLE_ADMIN: false });
        setUserModalError(null);
        setShowUserModal(true);
    };

    const handleEditUser = (user) => {
        if (!isMainTab) { setUserModalError("Cannot edit user. This is not the main active tab."); return; }
        setUserBeingEdited(user);
        setUserModalUsername(user.username);
        setUserModalPassword('');
        setUserModalRoles({
            ROLE_USER: user.roles?.some(role => role.name === 'ROLE_USER') || false,
            ROLE_ADMIN: user.roles?.some(role => role.name === 'ROLE_ADMIN') || false
        });
        setUserModalError(null);
        setShowUserModal(true);
    };

    const handleDeleteUser = async (userId) => {
        if (!isMainTab) { setError("Cannot delete user. This is not the main active tab."); return; }
        if (!window.confirm('Are you sure you want to delete this user?')) { return; }
        try {
            await axiosInstance.delete(`/admin/users/${userId}`);
            fetchAllAdminData();
        } catch (err) {
            console.error("Error deleting user:", err);
            setError("Failed to delete user.");
        }
    };

    const handleUserModalSubmit = async (e) => {
        e.preventDefault();
        setUserModalError(null);

        if (!isMainTab) { setUserModalError("Cannot save user. This is not the main active tab."); return; }

        const selectedRoles = [];
        if (userModalRoles.ROLE_USER) selectedRoles.push({ name: 'ROLE_USER' });
        if (userModalRoles.ROLE_ADMIN) selectedRoles.push({ name: 'ROLE_ADMIN' });

        if (!userModalUsername.trim()) { setUserModalError("Username cannot be empty!"); return; }

        const payload = { username: userModalUsername, roles: selectedRoles };

        if (userBeingEdited) {
            if (userModalPassword.trim() !== '') { payload.password = userModalPassword.trim(); }
            try { await axiosInstance.put(`/admin/users/${userBeingEdited.id}`, payload); }
            catch (err) {
                console.error("Error updating user:", err);
                const errorMessage = (err.response && err.response.data) || err.message || err.toString();
                setUserModalError(`Failed to update user: ${errorMessage}`); return;
            }
        } else {
            if (userModalPassword.trim() === '') { setUserModalError("Password is required for new users."); return; }
            payload.password = userModalPassword.trim();
            try { await axiosInstance.post('/admin/users', payload); }
            catch (err) {
                console.error("Error adding user:", err);
                const errorMessage = (err.response && err.response.data) || err.message || err.toString();
                setUserModalError(`Failed to add user: ${errorMessage}`); return;
            }
        }
        setShowUserModal(false);
        fetchAllAdminData();
    };

    const handleUserModalRoleChange = (roleName, isChecked) => {
        setUserModalRoles(prevRoles => ({ ...prevRoles, [roleName]: isChecked }));
    };

    // --- Form Management Handlers ---
    const handleAddForm = () => {
        if (!isMainTab) { setError("Cannot add form. This is not the main active tab."); return; }
        setCurrentEditForm({ title: '', description: '' });
        setShowFormModal(true);
    };

    const handleEditForm = (form) => {
        if (!isMainTab) { setError("Cannot edit form. This is not the main active tab."); return; }
        setCurrentEditForm(form);
        setShowFormModal(true);
    };

    const handleDeleteForm = async (formId) => {
        if (!isMainTab) { setError("Cannot delete form. This is not the main active tab."); return; }
        if (!window.confirm('Are you sure you want to delete this form and all its associated questions?')) { return; }
        try {
            await axiosInstance.delete(`/admin/forms/${formId}`);
            fetchAllAdminData();
            if (selectedFormForQuestions && selectedFormForQuestions.id === formId) {
                setSelectedFormForQuestions(null);
                setFormQuestions([]);
            }
        } catch (err) {
            console.error("Error deleting form:", err);
            setError("Failed to delete form.");
        }
    };

    const handleFormModalSubmit = async (e) => {
        e.preventDefault();
        if (!isMainTab) { setError("Cannot save form. This is not the main active tab."); return; }
        try {
            if (currentEditForm.id) {
                await axiosInstance.put(`/admin/forms/${currentEditForm.id}`, currentEditForm);
            } else {
                await axiosInstance.post('/admin/forms', currentEditForm);
            }
            setShowFormModal(false);
            fetchAllAdminData();
        } catch (err) {
            console.error("Error saving form:", err);
            setError("Failed to save form.");
        }
    };

    // --- Question Management Handlers ---
    const handleAddQuestion = () => {
        if (!isMainTab) { setError("Cannot add question. This is not the main active tab."); return; }
        if (!selectedFormForQuestions) { alert('Please select a form first to add a question.'); return; }
        setCurrentEditQuestion({ questionText: '', type: 'text', options: [], maxSelections: null });
        setNewQuestionText('');
        setNewQuestionType('text');
        setNewQuestionOptions('');
        setNewQuestionMaxSelections('');
        setShowQuestionModal(true);
    };

    const handleEditQuestion = (question) => {
        if (!isMainTab) { setError("Cannot edit question. This is not the main active tab."); return; }
        setCurrentEditQuestion(question);
        setNewQuestionText(question.questionText);
        setNewQuestionType(question.type);
        setNewQuestionOptions(question.options ? question.options.join(', ') : '');
        setNewQuestionMaxSelections(question.maxSelections || '');
        setShowQuestionModal(true);
    };

    const handleDeleteQuestion = async (questionId) => {
        if (!isMainTab) { setError("Cannot delete question. This is not the main active tab."); return; }
        if (!selectedFormForQuestions) return;
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            await axiosInstance.delete(`/admin/forms/${selectedFormForQuestions.id}/questions/${questionId}`);
            fetchFormQuestions(selectedFormForQuestions.id);
        } catch (err) {
            console.error("Error deleting question:", err);
            setError("Failed to delete question.");
        }
    };

    const handleQuestionModalSubmit = async (e) => {
        e.preventDefault();
        if (!isMainTab) { setError("Cannot save question. This is not the main active tab."); return; }
        if (!selectedFormForQuestions) { setError("No form selected to add/edit questions."); return; }

        const questionData = {
            questionText: newQuestionText,
            type: newQuestionType,
            options: newQuestionOptions.split(',').map(s => s.trim()).filter(s => s.length > 0),
            maxSelections: newQuestionType === 'checkbox' && newQuestionMaxSelections ? parseInt(newQuestionMaxSelections) : null,
            form: { id: selectedFormForQuestions.id }
        };

        try {
            if (currentEditQuestion && currentEditQuestion.id) {
                await axiosInstance.put(`/admin/forms/${selectedFormForQuestions.id}/questions/${currentEditQuestion.id}`, questionData);
            } else {
                await axiosInstance.post(`/admin/forms/${selectedFormForQuestions.id}/questions`, questionData);
            }
            setShowQuestionModal(false);
            fetchFormQuestions(selectedFormForQuestions.id);
        } catch (err) {
            console.error("Error saving question:", err);
            setError("Failed to save question.");
        }
    };

    // --- Pagination Logic for Users ---
    const indexOfLastUser = currentUserPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
    const totalUserPages = Math.ceil(users.length / usersPerPage);
    const paginateUsers = (pageNumber) => setCurrentUserPage(pageNumber);
    const handleUsersPerPageChange = (e) => {
        setUsersPerPage(parseInt(e.target.value));
        setCurrentUserPage(1); // Reset to first page
    };

    // --- Pagination Logic for Forms ---
    const indexOfLastForm = currentFormPage * formsPerPage;
    const indexOfFirstForm = indexOfLastForm - formsPerPage;
    const currentForms = forms.slice(indexOfFirstForm, indexOfLastForm);
    const totalFormPages = Math.ceil(forms.length / formsPerPage);
    const paginateForms = (pageNumber) => setCurrentFormPage(pageNumber);
    const handleFormsPerPageChange = (e) => {
        setFormsPerPage(parseInt(e.target.value));
        setCurrentFormPage(1); // Reset to first page
    };

    // --- Pagination Logic for Questions ---
    const indexOfLastQuestion = currentQuestionsPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    const currentQuestions = formQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
    const totalQuestionPages = Math.ceil(formQuestions.length / questionsPerPage);
    const paginateQuestions = (pageNumber) => setCurrentQuestionsPage(pageNumber);
    const handleQuestionsPerPageChange = (e) => {
        setQuestionsPerPage(parseInt(e.target.value));
        setCurrentQuestionsPage(1); // Reset to first page when items per page changes
    };

    // Render loading state
    if (loading) {
        return <div className="admin-loading-message">Loading admin panel...</div>;
    }

    return (
        <div className="admin-panel-container">
            {/* Top Navigation Bar */}
            <nav className="admin-top-nav">
                {/* Hamburger Icon on the top-left */}
                <button className="hamburger-menu-button" onClick={toggleSidebar}>
                    {/* SVG for 3 stacked lines icon */}
                    <svg className="hamburger-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                {/* Optional: You can add a main title for the header here if desired */}
                <h1 className="admin-panel-header-title">Admin Dashboard</h1>
            </nav>

            {/* Main Layout: Sidebar and Content Area */}
            <div className="admin-main-layout">
                {/* Sidebar Navigation */}
                <aside className={`admin-sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                    <ul className="sidebar-nav-list">
                        <li className="sidebar-nav-item">
                            <button onClick={() => { setActiveSection('dashboard'); setIsSidebarOpen(false); }} className={`sidebar-nav-button ${activeSection === 'dashboard' ? 'active' : ''}`}>Home</button>
                        </li>
                        <li className="sidebar-nav-item">
                            <button onClick={() => { setActiveSection('userManagement'); setIsSidebarOpen(false); }} className={`sidebar-nav-button ${activeSection === 'userManagement' ? 'active' : ''}`}>User Management</button>
                        </li>
                        <li className="sidebar-nav-item">
                            <button onClick={() => { setActiveSection('formManagement'); setSelectedFormForQuestions(null); setFormQuestions([]); setIsSidebarOpen(false); }} className={`sidebar-nav-button ${activeSection === 'formManagement' ? 'active' : ''}`}>Form Management</button>
                        </li>
                        {/* Only show Question Management in sidebar if a form is selected */}
                        {selectedFormForQuestions && (
                            <li className="sidebar-nav-item">
                                <button onClick={() => { setActiveSection('questionManagement'); setIsSidebarOpen(false); }} className={`sidebar-nav-button ${activeSection === 'questionManagement' ? 'active' : ''}`}>
                                    Question Management ({selectedFormForQuestions.title})
                                </button>
                            </li>
                        )}
                        {/* Logout button at the very end of the sidebar */}
                        <li className="sidebar-logout-item">
                            <button onClick={onLogout} className="sidebar-logout-button">Logout</button>
                        </li>
                    </ul>
                </aside>

                {/* Content Area */}
                <div className={`admin-content-area ${isSidebarOpen ? 'content-pushed' : 'content-full'}`}>
                    {/* Display general error message if not main tab */}
                    {!isMainTab && (
                        <div className="admin-inactive-message">
                            Admin Panel is inactive. Please use the main active tab.
                        </div>
                    )}
                    {error && isMainTab && !showUserModal && !showFormModal && !showQuestionModal && (
                        <div className="admin-error-message">❌ {error}</div>
                    )}

                    {/* Conditional Rendering of Sections */}
                    {activeSection === 'dashboard' && (
                        <div className="dashboard-section">
                            <h3 className="dashboard-welcome-text">Welcome, {username}!</h3>
                            <p className="dashboard-instruction-text">Use the sidebar to navigate through the admin features.</p>
                        </div>
                    )}

                    {activeSection === 'userManagement' && (
                        <div className="admin-section-container user-management-section">
                            <div className="section-header-controls"> {/* New container for header elements */}
                                <h3 className="section-title">User Management</h3>
                                {users.length > 0 && ( /* Only show selector if there are users */
                                    <div className="items-per-page-selector">
                                        <label htmlFor="usersPerPage">Items per page:</label>
                                        <select
                                            id="usersPerPage"
                                            value={usersPerPage}
                                            onChange={handleUsersPerPageChange}
                                            className="pagination-select"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleAddUser}
                                className="add-button add-user-button"
                                disabled={!isMainTab}
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
                                        {currentUsers.map(user => ( // Use currentUsers for rendering
                                            <tr key={user.id}>
                                                <td>{user.id}</td>
                                                <td>{user.username}</td>
                                                <td>{user.roles.map(role => role.name).join(', ')}</td>
                                                <td className="table-actions">
                                                    <button onClick={() => handleEditUser(user)} className="action-button edit-button" disabled={!isMainTab}>
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user.id)} className="action-button delete-button" disabled={!isMainTab}>
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls for Users */}
                            {users.length > 0 && (
                                <div className="pagination-controls"> {/* This now only contains buttons */}
                                    <button
                                        onClick={() => paginateUsers(currentUserPage - 1)}
                                        disabled={currentUserPage === 1}
                                        className="pagination-button"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalUserPages).keys()].map(number => (
                                        <button
                                            key={number + 1}
                                            onClick={() => paginateUsers(number + 1)}
                                            className={`pagination-button ${currentUserPage === number + 1 ? 'active-page' : ''}`}
                                        >
                                            {number + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => paginateUsers(currentUserPage + 1)}
                                        disabled={currentUserPage === totalUserPages}
                                        className="pagination-button"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'formManagement' && (
                        <div className="admin-section-container form-management-section">
                            <div className="section-header-controls"> {/* New container for header elements */}
                                <h3 className="section-title">Form Management</h3>
                                {forms.length > 0 && ( /* Only show selector if there are forms */
                                    <div className="items-per-page-selector">
                                        <label htmlFor="formsPerPage">Items per page:</label>
                                        <select
                                            id="formsPerPage"
                                            value={formsPerPage}
                                            onChange={handleFormsPerPageChange}
                                            className="pagination-select"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <button onClick={handleAddForm} className="add-button add-form-button" disabled={!isMainTab}>
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
                                        {currentForms.map(form => ( // Use currentForms for rendering
                                            <tr key={form.id}>
                                                <td>{form.id}</td>
                                                <td>{form.title}</td>
                                                <td>{form.description}</td>
                                                <td className="table-actions">
                                                    <button onClick={() => fetchFormQuestions(form.id)} className="action-button view-questions-button" disabled={!isMainTab}>
                                                        Manage Questions
                                                    </button>
                                                    <button onClick={() => handleEditForm(form)} className="action-button edit-button" disabled={!isMainTab}>
                                                        Edit Form
                                                    </button>
                                                    <button onClick={() => handleDeleteForm(form.id)} className="action-button delete-button" disabled={!isMainTab}>
                                                        Delete Form
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls for Forms */}
                            {forms.length > 0 && (
                                <div className="pagination-controls"> {/* This now only contains buttons */}
                                    <button
                                        onClick={() => paginateForms(currentFormPage - 1)}
                                        disabled={currentFormPage === 1}
                                        className="pagination-button"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalFormPages).keys()].map(number => (
                                        <button
                                            key={number + 1}
                                            onClick={() => paginateForms(number + 1)}
                                            className={`pagination-button ${currentFormPage === number + 1 ? 'active-page' : ''}`}
                                        >
                                            {number + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => paginateForms(currentFormPage + 1)}
                                        disabled={currentFormPage === totalFormPages}
                                        className="pagination-button"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'questionManagement' && selectedFormForQuestions && (
                        <div className="admin-section-container question-management-section">
                            <div className="section-header-controls"> {/* New container for header elements */}
                                <h3 className="section-title">Questions for Form: {selectedFormForQuestions.title} (ID: {selectedFormForQuestions.id})</h3>
                                {formQuestions.length > 0 && ( /* Only show selector if there are questions */
                                    <div className="items-per-page-selector">
                                        <label htmlFor="questionsPerPage">Items per page:</label>
                                        <select
                                            id="questionsPerPage"
                                            value={questionsPerPage}
                                            onChange={handleQuestionsPerPageChange}
                                            className="pagination-select"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="section-buttons-group"> {/* Group for action buttons */}
                                <button onClick={handleAddQuestion} className="add-button add-question-button" disabled={!isMainTab}>
                                    Add New Question
                                </button>
                                <button onClick={() => { setSelectedFormForQuestions(null); setFormQuestions([]); setActiveSection('formManagement'); }} className="back-button back-to-forms-button">
                                    ← Back to Forms
                                </button>
                            </div>
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
                                        {currentQuestions.map(question => ( // Use currentQuestions for rendering
                                            <tr key={question.id}>
                                                <td>{question.id}</td>
                                                <td>{question.questionText}</td>
                                                <td>{question.type}</td>
                                                <td>{question.options && question.options.length > 0 ? question.options.join(', ') : 'N/A'}</td>
                                                <td>{question.maxSelections || 'N/A'}</td>
                                                <td className="table-actions">
                                                    <button onClick={() => handleEditQuestion(question)} className="action-button edit-button" disabled={!isMainTab}>
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDeleteQuestion(question.id)} className="action-button delete-button" disabled={!isMainTab}>
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls for Questions */}
                            {formQuestions.length > 0 && ( // Only show pagination if there are questions
                                <div className="pagination-controls"> {/* This now only contains buttons */}
                                    <button
                                        onClick={() => paginateQuestions(currentQuestionsPage - 1)}
                                        disabled={currentQuestionsPage === 1}
                                        className="pagination-button"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalQuestionPages).keys()].map(number => (
                                        <button
                                            key={number + 1}
                                            onClick={() => paginateQuestions(number + 1)}
                                            className={`pagination-button ${currentQuestionsPage === number + 1 ? 'active-page' : ''}`}
                                        >
                                            {number + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => paginateQuestions(currentQuestionsPage + 1)}
                                        disabled={currentQuestionsPage === totalQuestionPages}
                                        className="pagination-button"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* User Modal */}
            {showUserModal && (
                <div className="modal-overlay user-modal-overlay">
                    <div className="modal-content user-modal-content">
                        <h3 className="modal-title">{userBeingEdited ? 'Edit User' : 'Add User'}</h3>
                        <form onSubmit={handleUserModalSubmit} className="modal-form user-form">
                            {userModalError && (
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
                                    required={!userBeingEdited}
                                    className="modal-input"
                                />
                            </div>
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
                                    value={currentEditForm.title}
                                    onChange={(e) => setCurrentEditForm({ ...currentEditForm, title: e.target.value })}
                                    required
                                    className="modal-input"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label htmlFor="formDescription">Description:</label>
                                <textarea
                                    id="formDescription"
                                    value={currentEditForm.description}
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
                            <div className="modal-form-group">
                                <label htmlFor="questionText">Question Text:</label>
                                <textarea
                                    id="questionText"
                                    value={newQuestionText}
                                    onChange={(e) => setNewQuestionText(e.target.value)}
                                    required
                                    className="modal-textarea"
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
                                    <option value="textarea">Textarea</option>
                                    <option value="radio">Radio Button</option>
                                    <option value="checkbox">Checkbox</option>
                                    <option value="dropdown">Dropdown</option>
                                </select>
                            </div>
                            {(newQuestionType === 'radio' || newQuestionType === 'checkbox' || newQuestionType === 'dropdown') && (
                                <div className="modal-form-group">
                                    <label htmlFor="questionOptions">Options (comma-separated):</label>
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
                                    <label htmlFor="maxSelections">Max Selections (optional, for checkbox):</label>
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
