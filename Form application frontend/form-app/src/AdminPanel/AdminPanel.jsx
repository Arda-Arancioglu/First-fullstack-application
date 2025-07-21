// src/AdminPanel/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../services/axios-instance'; // Ensure you use your configured axios instance
import './AdminPanelStyle.css'; // Import the CSS file for styling

function AdminPanel({ onLogout, isMainTab }) {
    console.log('AdminPanel: Component rendering, isMainTab:', isMainTab);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // General panel error
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility
    const [activeSection, setActiveSection] = useState('dashboard'); // Default active section is 'dashboard'

    // --- Data States ---
    const [users, setUsers] = useState([]);
    const [forms, setForms] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalForms, setTotalForms] = useState(0);

    // Pagination states (no longer URL-based)
    const [usersPage, setUsersPage] = useState(0);
    const [usersSize, setUsersSize] = useState(10);
    const [formsPage, setFormsPage] = useState(0);
    const [formsSize, setFormsSize] = useState(10);
    
    // Questions pagination states
    const [questionsPage, setQuestionsPage] = useState(0);
    const [questionsSize, setQuestionsSize] = useState(10);

    // Filter states for advanced querying
    const [userFilters, setUserFilters] = useState({});
    const [formFilters, setFormFilters] = useState({});
    const [userSort, setUserSort] = useState({ sortBy: 'id', sortDirection: 'asc' });
    const [formSort, setFormSort] = useState({ sortBy: 'id', sortDirection: 'asc' });

    // Temporary filter states (before applying)
    const [tempUserFilters, setTempUserFilters] = useState({});
    const [tempFormFilters, setTempFormFilters] = useState({});
    const [tempUserSort, setTempUserSort] = useState({ sortBy: 'id', sortDirection: 'asc' });
    const [tempFormSort, setTempFormSort] = useState({ sortBy: 'id', sortDirection: 'asc' });

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

    // Computed pagination values
    const totalUserPages = Math.ceil(totalUsers / usersSize);
    const totalFormPages = Math.ceil(totalForms / formsSize);

    // Function to build query string from filters
    const buildQueryString = (filters, sort, page, size) => {
        const params = new URLSearchParams();
        
        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params.append(key, value);
            }
        });
        
        // Add sorting
        if (sort.sortBy) params.append('sortBy', sort.sortBy);
        if (sort.sortDirection) params.append('sortDirection', sort.sortDirection);
        
        // Add pagination
        params.append('page', page.toString());
        params.append('size', size.toString());
        
        return params.toString();
    };

    // Load filters from URL on component mount
    useEffect(() => {
        const section = searchParams.get('section');
        
        // Only load from URL if there are actual parameters
        if (!section) {
            // No URL parameters, stay on dashboard
            return;
        }
        
        const sortBy = searchParams.get('sortBy') || 'id';
        const sortDirection = searchParams.get('sortDirection') || 'asc';
        const page = parseInt(searchParams.get('page') || '0');
        const size = parseInt(searchParams.get('size') || '10');
        
        // Extract filters from URL
        const urlFilters = {};
        for (let [key, value] of searchParams.entries()) {
            if (!['section', 'sortBy', 'sortDirection', 'page', 'size'].includes(key)) {
                urlFilters[key] = value;
            }
        }
        
        if (section === 'users') {
            setActiveSection('userManagement');
            setUserFilters(urlFilters);
            setTempUserFilters(urlFilters);
            setUserSort({ sortBy, sortDirection });
            setTempUserSort({ sortBy, sortDirection });
            setUsersPage(page);
            setUsersSize(size);
        } else if (section === 'forms') {
            setActiveSection('formManagement');
            setFormFilters(urlFilters);
            setTempFormFilters(urlFilters);
            setFormSort({ sortBy, sortDirection });
            setTempFormSort({ sortBy, sortDirection });
            setFormsPage(page);
            setFormsSize(size);
        }
    }, []); // Only run on mount

    // Handle user pagination changes
    const handleUsersPageChange = (newPage) => {
        setUsersPage(newPage);
        updateURL('users', userFilters, userSort, newPage, usersSize);
    };

    const handleUsersSizeChange = (newSize) => {
        setUsersSize(newSize);
        setUsersPage(0); // Reset to first page when changing page size
        updateURL('users', userFilters, userSort, 0, newSize);
    };

    // Temporary handlers for backward compatibility
    const handleUsersSortChange = (sortBy, sortDirection) => {
        setUserSort({ sortBy, sortDirection });
        setUsersPage(0); // Reset to first page when changing sort
    };

    const handleFormsSortChange = (sortBy, sortDirection) => {
        setFormSort({ sortBy, sortDirection });
        setFormsPage(0); // Reset to first page when changing sort
    };

    // Handle form pagination changes
    const handleFormsPageChange = (newPage) => {
        setFormsPage(newPage);
        updateURL('forms', formFilters, formSort, newPage, formsSize);
    };

    const handleFormsSizeChange = (newSize) => {
        setFormsSize(newSize);
        setFormsPage(0); // Reset to first page when changing page size
        updateURL('forms', formFilters, formSort, 0, newSize);
    };

    // Handle filter changes (temporary - not applied immediately)
    const handleUserFilterChange = (filterKey, filterValue) => {
        setTempUserFilters(prev => ({
            ...prev,
            [filterKey]: filterValue
        }));
    };

    const handleFormFilterChange = (filterKey, filterValue) => {
        setTempFormFilters(prev => ({
            ...prev,
            [filterKey]: filterValue
        }));
    };

    // Handle sort changes (temporary - not applied immediately)
    const handleUserSortChange = (sortBy, sortDirection) => {
        setTempUserSort({ sortBy, sortDirection });
    };

    const handleFormSortChange = (sortBy, sortDirection) => {
        setTempFormSort({ sortBy, sortDirection });
    };

    // Update URL with current state
    const updateURL = (section, filters, sort, page, size) => {
        const params = new URLSearchParams();
        
        // Add section identifier
        params.set('section', section);
        
        // Add filters to URL
        Object.keys(filters).forEach(key => {
            if (filters[key] && !key.endsWith('_operator')) {
                params.set(key, filters[key]);
            }
        });
        
        // Add sorting
        if (sort.sortBy) {
            params.set('sortBy', sort.sortBy);
            params.set('sortDirection', sort.sortDirection);
        }
        
        // Add pagination
        if (page > 0) params.set('page', page.toString());
        if (size !== 10) params.set('size', size.toString());
        
        setSearchParams(params);
    };

    // Apply filters and sorting
    const applyUserFilters = () => {
        setUserFilters(tempUserFilters);
        setUserSort(tempUserSort);
        setUsersPage(0); // Reset to first page when applying filters
        updateURL('users', tempUserFilters, tempUserSort, 0, usersSize);
    };

    const applyFormFilters = () => {
        setFormFilters(tempFormFilters);
        setFormSort(tempFormSort);
        setFormsPage(0); // Reset to first page when applying filters
        updateURL('forms', tempFormFilters, tempFormSort, 0, formsSize);
    };

    // Clear filters
    const clearUserFilters = () => {
        setTempUserFilters({});
        setUserFilters({});
        setTempUserSort({ sortBy: 'id', sortDirection: 'asc' });
        setUserSort({ sortBy: 'id', sortDirection: 'asc' });
        setUsersPage(0);
        updateURL('users', {}, { sortBy: 'id', sortDirection: 'asc' }, 0, usersSize);
    };

    const clearFormFilters = () => {
        setTempFormFilters({});
        setFormFilters({});
        setTempFormSort({ sortBy: 'id', sortDirection: 'asc' });
        setFormSort({ sortBy: 'id', sortDirection: 'asc' });
        setFormsPage(0);
        updateURL('forms', {}, { sortBy: 'id', sortDirection: 'asc' }, 0, formsSize);
    };

    // Helper functions for section navigation
    const navigateToUserManagement = () => {
        console.log('Navigating to User Management');
        setActiveSection('userManagement');
        setIsSidebarOpen(false);
        updateURL('users', userFilters, userSort, usersPage, usersSize);
    };

    const navigateToFormManagement = () => {
        console.log('Navigating to Form Management');
        setActiveSection('formManagement');
        setSelectedFormForQuestions(null);
        setFormQuestions([]);
        setIsSidebarOpen(false);
        updateURL('forms', formFilters, formSort, formsPage, formsSize);
    };

    const navigateToQuestionManagement = () => {
        setActiveSection('questionManagement');
        setIsSidebarOpen(false);
        // Clear URL params for question management (no filters/pagination)
        setSearchParams({});
    };

    const navigateToDashboard = () => {
        setActiveSection('dashboard');
        setIsSidebarOpen(false);
        // Clear URL params for dashboard
        setSearchParams({});
    };

    // --- Pagination States for Users ---
    // Removed old pagination states - now using URL parameters

    // --- Pagination States for Forms ---
    // Removed old pagination states - now using URL parameters

    // --- Pagination States for Questions ---
    // Removed old pagination states - now using URL parameters

    // Effect for initial authentication check and setting username
    useEffect(() => {
        console.log('AdminPanel: Initial auth check effect running');
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('AdminPanel: User from localStorage:', user);

        // Temporary bypass for testing - remove this later
        console.log('AdminPanel: Setting test admin user and stopping loading');
        setUsername('test-admin');
        setLoading(false);
        return;

        // Original auth logic commented out for testing
        /*
        if (!user) {
            console.log('AdminPanel: No user found, creating test admin user');
            setUsername('test-admin');
            setLoading(false);
            return;
        }

        if (!user || !user.username || !user.roles || !user.roles.includes('ROLE_ADMIN')) {
            console.log('AdminPanel: User not authorized, calling onLogout');
            onLogout();
            return;
        }
        console.log('AdminPanel: User authorized, setting username:', user.username);
        setUsername(user.username);
        setLoading(false); // Set loading to false after user check
        */
    }, [onLogout]);

    // Function to fetch users with pagination, sorting, and filtering
    const fetchUsers = async () => {
        try {
            const queryString = buildQueryString(userFilters, userSort, usersPage, usersSize);
            console.log('Fetching users with query:', queryString);
            
            const response = await axiosInstance.get(`/admin/users?${queryString}`);
            setUsers(response.data.content || response.data);
            setTotalUsers(response.data.totalElements || response.data.length);
        } catch (err) {
            console.error("Error fetching users:", err);
            throw err;
        }
    };

    // Function to fetch forms with pagination, sorting, and filtering
    const fetchForms = async () => {
        try {
            const queryString = buildQueryString(formFilters, formSort, formsPage, formsSize);
            console.log('Fetching forms with query:', queryString);
            
            const response = await axiosInstance.get(`/admin/forms?${queryString}`);
            setForms(response.data.content || response.data);
            setTotalForms(response.data.totalElements || response.data.length);
        } catch (err) {
            console.error("Error fetching forms:", err);
            throw err;
        }
    };

    // Function to fetch all admin-related data (users and forms)
    const fetchAllAdminData = async () => {
        try {
            console.log('AdminPanel: Starting to fetch admin data');
            setLoading(true);
            setError(null);

            // Fetch both users and forms with pagination
            await Promise.all([fetchUsers(), fetchForms()]);

            console.log('AdminPanel: Successfully fetched admin data');
            setLoading(false);
        } catch (err) {
            console.error("AdminPanel: Error fetching admin data:", err);
            const errorMessage =
                (err.response && err.response.data && err.response.data.message) ||
                err.message ||
                err.toString();
            
            // If it's a network error, show a more friendly message
            if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
                setError('Cannot connect to server. Please make sure the backend is running.');
            } else {
                setError(`Failed to load admin data: ${errorMessage}`);
            }
            setLoading(false);

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
            setQuestionsPage(0); // Reset to first page when new form is selected
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

    // Effect for fetching data based on isMainTab status and filter/pagination changes
    useEffect(() => {
        console.log('AdminPanel: Data fetching effect, isMainTab:', isMainTab);
        // Re-enable data fetching with backend
        if (true || isMainTab) {
            console.log('AdminPanel: Attempting to fetch admin data');
            fetchAllAdminData(); // If this tab is the main tab, attempt to fetch data
        } else {
            setError("Admin Panel is inactive. Please use the main active tab.");
            setLoading(false);
        }
    }, [isMainTab, usersPage, usersSize, userFilters, userSort, formsPage, formsSize, formFilters, formSort]); // Updated dependencies

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

    // --- Pagination Logic for Questions (State-based) ---
    // Questions will use local pagination since they're not loaded from server with pagination
    const questionsPerPage = questionsSize;
    const currentQuestionsPage = questionsPage;
    const indexOfLastQuestion = (currentQuestionsPage + 1) * questionsPerPage;
    const indexOfFirstQuestion = currentQuestionsPage * questionsPerPage;
    const currentQuestions = formQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
    const totalQuestionPages = Math.ceil(formQuestions.length / questionsPerPage);

    // Render loading state
    if (loading) {
        console.log('AdminPanel: Rendering loading state');
        return <div className="admin-loading-message">Loading admin panel...</div>;
    }

    console.log('AdminPanel: Rendering main content, activeSection:', activeSection, 'isMainTab:', isMainTab);

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
                            <button onClick={navigateToDashboard} className={`sidebar-nav-button ${activeSection === 'dashboard' ? 'active' : ''}`}>Home</button>
                        </li>
                        <li className="sidebar-nav-item">
                            <button onClick={navigateToUserManagement} className={`sidebar-nav-button ${activeSection === 'userManagement' ? 'active' : ''}`}>User Management</button>
                        </li>
                        <li className="sidebar-nav-item">
                            <button onClick={navigateToFormManagement} className={`sidebar-nav-button ${activeSection === 'formManagement' ? 'active' : ''}`}>Form Management</button>
                        </li>
                        {/* Only show Question Management in sidebar if a form is selected */}
                        {selectedFormForQuestions && (
                            <li className="sidebar-nav-item">
                                <button onClick={navigateToQuestionManagement} className={`sidebar-nav-button ${activeSection === 'questionManagement' ? 'active' : ''}`}>
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
                            <div className="section-header-controls">
                                <h3 className="section-title">User Management</h3>
                                {users.length > 0 && (
                                    <div className="items-per-page-selector">
                                        <label htmlFor="usersPerPage">Items per page:</label>
                                        <select
                                            id="usersPerPage"
                                            value={usersSize}
                                            onChange={(e) => handleUsersSizeChange(parseInt(e.target.value))}
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
                            
                            {/* Advanced Filter Controls for Users */}
                            <div className="advanced-filter-section">
                                <h4 className="filter-section-title">🔍 Advanced Filters & Sorting</h4>
                                
                                <div className="filter-grid">
                                    {/* ID Filters */}
                                    <div className="filter-group">
                                        <label className="filter-label">ID</label>
                                        <div className="filter-input-group">
                                            <select 
                                                className="filter-operator-select"
                                                value={tempUserFilters.id_operator || 'eq'}
                                                onChange={(e) => {
                                                    const operator = e.target.value;
                                                    const currentValue = tempUserFilters[Object.keys(tempUserFilters).find(key => key.startsWith('id_'))] || '';
                                                    // Remove old id filter
                                                    const newFilters = { ...tempUserFilters };
                                                    Object.keys(newFilters).forEach(key => {
                                                        if (key.startsWith('id_')) delete newFilters[key];
                                                    });
                                                    if (currentValue) {
                                                        newFilters[`id_${operator}`] = currentValue;
                                                    }
                                                    newFilters.id_operator = operator;
                                                    setTempUserFilters(newFilters);
                                                }}
                                            >
                                                <option value="eq">Equals</option>
                                                <option value="neq">Not equals</option>
                                                <option value="gt">Greater than</option>
                                                <option value="lt">Less than</option>
                                                <option value="gte">Greater or equal</option>
                                                <option value="lte">Less or equal</option>
                                                <option value="in">In list (1,2,3)</option>
                                                <option value="not_in">Not in list</option>
                                            </select>
                                            <input
                                                type="text"
                                                className="filter-input"
                                                placeholder="Enter ID..."
                                                value={tempUserFilters[Object.keys(tempUserFilters).find(key => key.startsWith('id_') && key !== 'id_operator')] || ''}
                                                onChange={(e) => {
                                                    const operator = tempUserFilters.id_operator || 'eq';
                                                    handleUserFilterChange(`id_${operator}`, e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Username Filters */}
                                    <div className="filter-group">
                                        <label className="filter-label">Username</label>
                                        <div className="filter-input-group">
                                            <select 
                                                className="filter-operator-select"
                                                value={tempUserFilters.username_operator || 'contains'}
                                                onChange={(e) => {
                                                    const operator = e.target.value;
                                                    const currentValue = tempUserFilters[Object.keys(tempUserFilters).find(key => key.startsWith('username_'))] || '';
                                                    // Remove old username filter
                                                    const newFilters = { ...tempUserFilters };
                                                    Object.keys(newFilters).forEach(key => {
                                                        if (key.startsWith('username_')) delete newFilters[key];
                                                    });
                                                    if (currentValue) {
                                                        newFilters[`username_${operator}`] = currentValue;
                                                    }
                                                    newFilters.username_operator = operator;
                                                    setTempUserFilters(newFilters);
                                                }}
                                            >
                                                <option value="eq">Equals</option>
                                                <option value="neq">Not equals</option>
                                                <option value="contains">Contains</option>
                                                <option value="starts_with">Starts with</option>
                                                <option value="ends_with">Ends with</option>
                                                <option value="not_contains">Not contains</option>
                                            </select>
                                            <input
                                                type="text"
                                                className="filter-input"
                                                placeholder="Enter username..."
                                                value={tempUserFilters[Object.keys(tempUserFilters).find(key => key.startsWith('username_') && key !== 'username_operator')] || ''}
                                                onChange={(e) => {
                                                    const operator = tempUserFilters.username_operator || 'contains';
                                                    handleUserFilterChange(`username_${operator}`, e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Role Filters */}
                                    <div className="filter-group">
                                        <label className="filter-label">Roles</label>
                                        <div className="filter-input-group">
                                            <select 
                                                className="filter-operator-select"
                                                value={tempUserFilters.roles_operator || 'contains'}
                                                onChange={(e) => {
                                                    const operator = e.target.value;
                                                    const currentValue = tempUserFilters[Object.keys(tempUserFilters).find(key => key.startsWith('roles_'))] || '';
                                                    // Remove old roles filter
                                                    const newFilters = { ...tempUserFilters };
                                                    Object.keys(newFilters).forEach(key => {
                                                        if (key.startsWith('roles_')) delete newFilters[key];
                                                    });
                                                    if (currentValue) {
                                                        newFilters[`roles_${operator}`] = currentValue;
                                                    }
                                                    newFilters.roles_operator = operator;
                                                    setTempUserFilters(newFilters);
                                                }}
                                            >
                                                <option value="contains">Contains role</option>
                                                <option value="not_contains">Not contains role</option>
                                                <option value="eq">Exact role match</option>
                                            </select>
                                            <select
                                                className="filter-input"
                                                value={tempUserFilters[Object.keys(tempUserFilters).find(key => key.startsWith('roles_') && key !== 'roles_operator')] || ''}
                                                onChange={(e) => {
                                                    const operator = tempUserFilters.roles_operator || 'contains';
                                                    handleUserFilterChange(`roles_${operator}`, e.target.value);
                                                }}
                                            >
                                                <option value="">All roles</option>
                                                <option value="ROLE_ADMIN">Admin</option>
                                                <option value="ROLE_USER">User</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Sort Controls */}
                                    <div className="filter-group">
                                        <label className="filter-label">Sort By</label>
                                        <div className="filter-input-group">
                                            <select 
                                                className="filter-operator-select"
                                                value={tempUserSort.sortBy}
                                                onChange={(e) => handleUserSortChange(e.target.value, tempUserSort.sortDirection)}
                                            >
                                                <option value="id">ID</option>
                                                <option value="username">Username</option>
                                                <option value="createdAt">Created Date</option>
                                                <option value="updatedAt">Updated Date</option>
                                            </select>
                                            <select
                                                className="filter-input"
                                                value={tempUserSort.sortDirection}
                                                onChange={(e) => handleUserSortChange(tempUserSort.sortBy, e.target.value)}
                                            >
                                                <option value="asc">Ascending ↑</option>
                                                <option value="desc">Descending ↓</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="filter-actions">
                                    <div className="filter-action-buttons">
                                        <button onClick={applyUserFilters} className="apply-filters-button">
                                            Apply Filters
                                        </button>
                                        <button onClick={clearUserFilters} className="clear-filters-button">
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="active-filters-display">
                                        {Object.keys(userFilters).filter(key => !key.endsWith('_operator') && userFilters[key]).length > 0 && (
                                            <span className="active-filters-count">
                                                {Object.keys(userFilters).filter(key => !key.endsWith('_operator') && userFilters[key]).length} active filter(s)
                                            </span>
                                        )}
                                    </div>
                                </div>
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
                                        {users.map(user => ( // Use users for rendering (server-side pagination)
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
                                <div className="pagination-controls">
                                    <button
                                        onClick={() => handleUsersPageChange(Math.max(0, usersPage - 1))}
                                        disabled={usersPage === 0}
                                        className="pagination-button"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalUserPages).keys()].map(number => (
                                        <button
                                            key={number}
                                            onClick={() => handleUsersPageChange(number)}
                                            className={`pagination-button ${usersPage === number ? 'active-page' : ''}`}
                                        >
                                            {number + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handleUsersPageChange(usersPage + 1)}
                                        disabled={usersPage >= totalUserPages - 1}
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
                            <div className="section-header-controls">
                                <h3 className="section-title">Form Management</h3>
                                {forms.length > 0 && (
                                    <div className="items-per-page-selector">
                                        <label htmlFor="formsPerPage">Items per page:</label>
                                        <select
                                            id="formsPerPage"
                                            value={formsSize}
                                            onChange={(e) => handleFormsSizeChange(parseInt(e.target.value))}
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

                            {/* Advanced Filter Controls for Forms */}
                            <div className="advanced-filter-section">
                                <h4 className="filter-section-title">🔍 Advanced Filters</h4>
                                
                                <div className="filter-grid">
                                    {/* ID Filters */}
                                    <div className="filter-group">
                                        <label className="filter-label">ID</label>
                                        <div className="filter-input-group">
                                            <select 
                                                className="filter-operator-select"
                                                value={tempFormFilters.id_operator || 'eq'}
                                                onChange={(e) => {
                                                    const operator = e.target.value;
                                                    const currentValue = tempFormFilters[Object.keys(tempFormFilters).find(key => key.startsWith('id_'))] || '';
                                                    // Remove old id filter
                                                    const newFilters = { ...tempFormFilters };
                                                    Object.keys(newFilters).forEach(key => {
                                                        if (key.startsWith('id_')) delete newFilters[key];
                                                    });
                                                    if (currentValue) {
                                                        newFilters[`id_${operator}`] = currentValue;
                                                    }
                                                    newFilters.id_operator = operator;
                                                    setTempFormFilters(newFilters);
                                                }}
                                            >
                                                <option value="eq">Equals</option>
                                                <option value="neq">Not equals</option>
                                                <option value="gt">Greater than</option>
                                                <option value="lt">Less than</option>
                                                <option value="gte">Greater or equal</option>
                                                <option value="lte">Less or equal</option>
                                                <option value="in">In list (1,2,3)</option>
                                                <option value="not_in">Not in list</option>
                                            </select>
                                            <input
                                                type="text"
                                                className="filter-input"
                                                placeholder="Enter ID..."
                                                value={tempFormFilters[Object.keys(tempFormFilters).find(key => key.startsWith('id_') && key !== 'id_operator')] || ''}
                                                onChange={(e) => {
                                                    const operator = tempFormFilters.id_operator || 'eq';
                                                    handleFormFilterChange(`id_${operator}`, e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Title Filters */}
                                    <div className="filter-group">
                                        <label className="filter-label">Title</label>
                                        <div className="filter-input-group">
                                            <select 
                                                className="filter-operator-select"
                                                value={tempFormFilters.title_operator || 'contains'}
                                                onChange={(e) => {
                                                    const operator = e.target.value;
                                                    const currentValue = tempFormFilters[Object.keys(tempFormFilters).find(key => key.startsWith('title_'))] || '';
                                                    // Remove old title filter
                                                    const newFilters = { ...tempFormFilters };
                                                    Object.keys(newFilters).forEach(key => {
                                                        if (key.startsWith('title_')) delete newFilters[key];
                                                    });
                                                    if (currentValue) {
                                                        newFilters[`title_${operator}`] = currentValue;
                                                    }
                                                    newFilters.title_operator = operator;
                                                    setTempFormFilters(newFilters);
                                                }}
                                            >
                                                <option value="eq">Equals</option>
                                                <option value="neq">Not equals</option>
                                                <option value="contains">Contains</option>
                                                <option value="not_contains">Not contains</option>
                                                <option value="starts_with">Starts with</option>
                                                <option value="ends_with">Ends with</option>
                                            </select>
                                            <input
                                                type="text"
                                                className="filter-input"
                                                placeholder="Enter title..."
                                                value={tempFormFilters[Object.keys(tempFormFilters).find(key => key.startsWith('title_') && key !== 'title_operator')] || ''}
                                                onChange={(e) => {
                                                    const operator = tempFormFilters.title_operator || 'contains';
                                                    handleFormFilterChange(`title_${operator}`, e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Description Filters */}
                                    <div className="filter-group">
                                        <label className="filter-label">Description</label>
                                        <div className="filter-input-group">
                                            <select 
                                                className="filter-operator-select"
                                                value={tempFormFilters.description_operator || 'contains'}
                                                onChange={(e) => {
                                                    const operator = e.target.value;
                                                    const currentValue = tempFormFilters[Object.keys(tempFormFilters).find(key => key.startsWith('description_'))] || '';
                                                    // Remove old description filter
                                                    const newFilters = { ...tempFormFilters };
                                                    Object.keys(newFilters).forEach(key => {
                                                        if (key.startsWith('description_')) delete newFilters[key];
                                                    });
                                                    if (currentValue) {
                                                        newFilters[`description_${operator}`] = currentValue;
                                                    }
                                                    newFilters.description_operator = operator;
                                                    setTempFormFilters(newFilters);
                                                }}
                                            >
                                                <option value="eq">Equals</option>
                                                <option value="neq">Not equals</option>
                                                <option value="contains">Contains</option>
                                                <option value="not_contains">Not contains</option>
                                                <option value="starts_with">Starts with</option>
                                                <option value="ends_with">Ends with</option>
                                            </select>
                                            <input
                                                type="text"
                                                className="filter-input"
                                                placeholder="Enter description..."
                                                value={tempFormFilters[Object.keys(tempFormFilters).find(key => key.startsWith('description_') && key !== 'description_operator')] || ''}
                                                onChange={(e) => {
                                                    const operator = tempFormFilters.description_operator || 'contains';
                                                    handleFormFilterChange(`description_${operator}`, e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Sort Controls */}
                                    <div className="filter-group">
                                        <label className="filter-label">Sort By</label>
                                        <div className="filter-input-group">
                                            <select 
                                                className="filter-operator-select"
                                                value={tempFormSort.sortBy}
                                                onChange={(e) => handleFormSortChange(e.target.value, tempFormSort.sortDirection)}
                                            >
                                                <option value="id">ID</option>
                                                <option value="title">Title</option>
                                                <option value="description">Description</option>
                                                <option value="createdAt">Created Date</option>
                                                <option value="updatedAt">Updated Date</option>
                                            </select>
                                            <select
                                                className="filter-input"
                                                value={tempFormSort.sortDirection}
                                                onChange={(e) => handleFormSortChange(tempFormSort.sortBy, e.target.value)}
                                            >
                                                <option value="asc">Ascending ↑</option>
                                                <option value="desc">Descending ↓</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="filter-actions">
                                    <div className="filter-action-buttons">
                                        <button onClick={applyFormFilters} className="apply-filters-button">
                                            Apply Filters
                                        </button>
                                        <button onClick={clearFormFilters} className="clear-filters-button">
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="active-filters-display">
                                        {Object.keys(formFilters).filter(key => !key.endsWith('_operator') && formFilters[key]).length > 0 && (
                                            <span className="active-filters-count">
                                                {Object.keys(formFilters).filter(key => !key.endsWith('_operator') && formFilters[key]).length} active filter(s)
                                            </span>
                                        )}
                                    </div>
                                </div>
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
                                        {forms.map(form => ( // Use forms for rendering (server-side pagination)
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
                                <div className="pagination-controls">
                                    <button
                                        onClick={() => handleFormsPageChange(Math.max(0, formsPage - 1))}
                                        disabled={formsPage === 0}
                                        className="pagination-button"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalFormPages).keys()].map(number => (
                                        <button
                                            key={number}
                                            onClick={() => handleFormsPageChange(number)}
                                            className={`pagination-button ${formsPage === number ? 'active-page' : ''}`}
                                        >
                                            {number + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handleFormsPageChange(formsPage + 1)}
                                        disabled={formsPage >= totalFormPages - 1}
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
                                            value={questionsSize}
                                            onChange={(e) => setQuestionsSize(parseInt(e.target.value))}
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

                            {/* Sorting Controls for Questions */}
                            {formQuestions.length > 0 && (
                                <div className="sorting-controls">
                                    <span className="sorting-label">Sort by:</span>
                                    <div className="sorting-buttons">
                                        <button
                                            onClick={() => handleQuestionsSortChange('id', getQuestionsSortDirection() === 'asc' ? 'desc' : 'asc')}
                                            className={`sort-button ${getQuestionsSortBy() === 'id' ? 'active' : ''}`}
                                        >
                                            ID {getQuestionsSortBy() === 'id' && (getQuestionsSortDirection() === 'asc' ? '↑' : '↓')}
                                        </button>
                                        <button
                                            onClick={() => handleQuestionsSortChange('questionText', getQuestionsSortDirection() === 'asc' ? 'desc' : 'asc')}
                                            className={`sort-button ${getQuestionsSortBy() === 'questionText' ? 'active' : ''}`}
                                        >
                                            Question Text {getQuestionsSortBy() === 'questionText' && (getQuestionsSortDirection() === 'asc' ? '↑' : '↓')}
                                        </button>
                                        <button
                                            onClick={() => handleQuestionsSortChange('type', getQuestionsSortDirection() === 'asc' ? 'desc' : 'asc')}
                                            className={`sort-button ${getQuestionsSortBy() === 'type' ? 'active' : ''}`}
                                        >
                                            Type {getQuestionsSortBy() === 'type' && (getQuestionsSortDirection() === 'asc' ? '↑' : '↓')}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="section-buttons-group"> {/* Group for action buttons */}
                                <button onClick={handleAddQuestion} className="add-button add-question-button" disabled={!isMainTab}>
                                    Add New Question
                                </button>
                                <button onClick={navigateToFormManagement} className="back-button back-to-forms-button">
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
                                <div className="pagination-controls">
                                    <button
                                        onClick={() => handleQuestionsPageChange(Math.max(0, currentQuestionsPage - 1))}
                                        disabled={currentQuestionsPage === 0}
                                        className="pagination-button"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalQuestionPages).keys()].map(number => (
                                        <button
                                            key={number}
                                            onClick={() => handleQuestionsPageChange(number)}
                                            className={`pagination-button ${currentQuestionsPage === number ? 'active-page' : ''}`}
                                        >
                                            {number + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handleQuestionsPageChange(currentQuestionsPage + 1)}
                                        disabled={currentQuestionsPage >= totalQuestionPages - 1}
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
