// src/AdminPanel/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axios-instance';
import { useNavigate } from 'react-router-dom';
import './AdminPanelStyle.css'; // Import the new CSS file

function AdminPanel({ onLogout }) {
    const [users, setUsers] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // State for modals
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);

    // State for current item being edited/added
    const [currentUser, setCurrentUser] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [currentAnswer, setCurrentAnswer] = useState(null);

    // Form states for adding/editing
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRoles, setNewRoles] = useState({ ROLE_USER: false, ROLE_ADMIN: false });
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionType, setNewQuestionType] = useState('text');
    const [newQuestionOptions, setNewQuestionOptions] = useState('');
    const [newMaxSelections, setNewMaxSelections] = useState('');
    const [newAnswerResponse, setNewAnswerResponse] = useState('');
    const [newAnswerQuestionId, setNewAnswerQuestionId] = useState('');
    const [newAnswerUserId, setNewAnswerUserId] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, questionsRes, answersRes] = await Promise.all([
                axiosInstance.get('/admin/users'),
                axiosInstance.get('/admin/questions'),
                axiosInstance.get('/admin/answers')
            ]);
            setUsers(usersRes.data);
            setQuestions(questionsRes.data);
            setAnswers(answersRes.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching admin data:", err);
            const errorMessage =
                (err.response && err.response.data && err.response.data.message) ||
                err.message ||
                err.toString();
            setError(`Failed to load admin data: ${errorMessage}. You might not have admin privileges.`);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                onLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [onLogout]);

    // --- User CRUD Operations ---
    const handleAddUser = () => {
        setCurrentUser(null);
        setNewUsername('');
        setNewPassword('');
        setNewRoles({ ROLE_USER: true, ROLE_ADMIN: false });
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user) => {
        setCurrentUser(user);
        setNewUsername(user.username);
        setNewPassword('');
        setNewRoles({
            ROLE_USER: user.roles.some(role => role.name === 'ROLE_USER'),
            ROLE_ADMIN: user.roles.some(role => role.name === 'ROLE_ADMIN')
        });
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await axiosInstance.delete(`/admin/users/${id}`);
                fetchData();
            } catch (err) {
                console.error("Error deleting user:", err);
                setError("Failed to delete user.");
            }
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        const selectedRoles = Object.keys(newRoles).filter(roleName => newRoles[roleName]);

        const userData = {
            username: newUsername,
            password: newPassword,
            roles: selectedRoles.map(roleName => ({ name: roleName }))
        };

        if (userData.roles.length === 0) {
            userData.roles.push({ name: 'ROLE_USER' });
        }

        try {
            if (currentUser) {
                await axiosInstance.put(`/admin/users/${currentUser.id}`, userData);
            } else {
                await axiosInstance.post('/admin/users', userData);
            }
            setIsUserModalOpen(false);
            fetchData();
        } catch (err) {
            console.error("Error saving user:", err);
            setError("Failed to save user. " + ((err.response && err.response.data && err.response.data.message) || err.message));
        }
    };

    const handleRoleChange = (roleName) => {
        setNewRoles(prevRoles => ({
            ...prevRoles,
            [roleName]: !prevRoles[roleName]
        }));
    };

    // --- Question CRUD Operations ---
    const handleAddQuestion = () => {
        setCurrentQuestion(null);
        setNewQuestionText('');
        setNewQuestionType('text');
        setNewQuestionOptions('');
        setNewMaxSelections('');
        setIsQuestionModalOpen(true);
    };

    const handleEditQuestion = (question) => {
        setCurrentQuestion(question);
        setNewQuestionText(question.questionText);
        setNewQuestionType(question.type);
        setNewQuestionOptions(question.options ? question.options.join(', ') : '');
        setNewMaxSelections(question.maxSelections || '');
        setIsQuestionModalOpen(true);
    };

    const handleDeleteQuestion = async (id) => {
        if (window.confirm("Are you sure you want to delete this question?")) {
            try {
                await axiosInstance.delete(`/admin/questions/${id}`);
                fetchData();
            } catch (err) {
                console.error("Error deleting question:", err);
                setError("Failed to delete question.");
            }
        }
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();

        const parsedMaxSelections = newMaxSelections !== '' ? parseInt(newMaxSelections, 10) : null;
        if (newQuestionType === 'checkbox' && parsedMaxSelections !== null && parsedMaxSelections <= 0) {
            setError("Max selections must be a positive number for checkbox questions.");
            return;
        }
        if (newQuestionType === 'checkbox' && parsedMaxSelections === null) {
            setError("Max selections is required for checkbox questions.");
            return;
        }


        const questionData = {
            questionText: newQuestionText,
            type: newQuestionType,
            options: (newQuestionType === 'radio' || newQuestionType === 'checkbox') && newQuestionOptions ?
                     newQuestionOptions.split(',').map(option => option.trim()).filter(option => option.length > 0) :
                     [],
            maxSelections: newQuestionType === 'checkbox' ? parsedMaxSelections : null
        };

        try {
            if (currentQuestion) {
                await axiosInstance.put(`/admin/questions/${currentQuestion.id}`, questionData);
            } else {
                await axiosInstance.post('/admin/questions', questionData);
            }
            setIsQuestionModalOpen(false);
            fetchData();
        } catch (err) {
            console.error("Error saving question:", err);
            setError("Failed to save question. " + ((err.response && err.response.data && err.response.data.message) || err.message));
        }
    };

    // --- Answer CRUD Operations ---
    const handleAddAnswer = () => {
        setCurrentAnswer(null);
        setNewAnswerResponse('');
        setNewAnswerQuestionId('');
        setNewAnswerUserId('');
        setIsAnswerModalOpen(true);
    };

    const handleEditAnswer = (answer) => {
        setCurrentAnswer(answer);
        setNewAnswerResponse(answer.response);
        setNewAnswerQuestionId(answer.question?.id || '');
        setNewAnswerUserId(answer.user?.id || '');
        setIsAnswerModalOpen(true);
    };

    const handleDeleteAnswer = async (id) => {
        if (window.confirm("Are you sure you want to delete this answer?")) {
            try {
                await axiosInstance.delete(`/admin/answers/${id}`);
                fetchData();
            } catch (err) {
                console.error("Error deleting answer:", err);
                setError("Failed to delete answer.");
            }
        }
    };

    const handleSaveAnswer = async (e) => {
        e.preventDefault();
        const answerData = {
            response: newAnswerResponse,
            question: { id: newAnswerQuestionId ? Number(newAnswerQuestionId) : null },
            user: { id: newAnswerUserId ? Number(newAnswerUserId) : null }
        };
        try {
            if (currentAnswer) {
                await axiosInstance.put(`/admin/answers/${currentAnswer.id}`, answerData);
            } else {
                await axiosInstance.post('/admin/answers', answerData);
            }
            setIsAnswerModalOpen(false);
            fetchData();
        } catch (err) {
            console.error("Error saving answer:", err);
            setError("Failed to save answer. " + ((err.response && err.response.data && err.response.data.message) || err.message));
        }
    };

    if (loading) return <div className="loading-message">Loading Admin Panel...</div>;
    if (error && !isUserModalOpen && !isQuestionModalOpen && !isAnswerModalOpen) return <div className="error-message">❌ {error}</div>;

    return (
        <div className="admin-panel-container">
            <nav className="admin-panel-nav">
                <h2 className="admin-panel-title">Admin Panel</h2>
                <button onClick={onLogout} className="logout-button">
                    Logout
                </button>
            </nav>

            <div className="admin-section-container">
                <h3 className="section-title">Users Management</h3>
                <button onClick={handleAddUser} className="add-button">Add User</button>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Roles</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>
                                        {user.roles && user.roles.length > 0
                                            ? user.roles.map(role => role.name).join(', ')
                                            : 'No Roles'}
                                    </td>
                                    <td>
                                        <button onClick={() => handleEditUser(user)} className="action-button edit-button">Edit</button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="action-button delete-button">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="admin-section-container">
                <h3 className="section-title">Questions Management</h3>
                <button onClick={handleAddQuestion} className="add-button">Add Question</button>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Question Text</th>
                                <th>Type</th>
                                <th>Options</th>
                                <th>Max Sel.</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map((question) => (
                                <tr key={question.id}>
                                    <td>{question.id}</td>
                                    <td>{question.questionText}</td>
                                    <td>{question.type}</td>
                                    <td>
                                        {question.options && question.options.length > 0
                                            ? question.options.join(', ')
                                            : 'N/A'}
                                    </td>
                                    <td>
                                        {question.maxSelections !== null ? question.maxSelections : 'N/A'}
                                    </td>
                                    <td>
                                        <button onClick={() => handleEditQuestion(question)} className="action-button edit-button">Edit</button>
                                        <button onClick={() => handleDeleteQuestion(question.id)} className="action-button delete-button">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="admin-section-container">
                <h3 className="section-title">Answers Management</h3>
                <button onClick={handleAddAnswer} className="add-button">Add Answer</button>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Response</th>
                                <th>Question ID</th>
                                <th>User ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {answers.map((answer) => (
                                <tr key={answer.id}>
                                    <td>{answer.id}</td>
                                    <td>{answer.response}</td>
                                    <td>{answer.question?.id || 'N/A'}</td>
                                    <td>{answer.user?.id || 'N/A'}</td>
                                    <td>
                                        <button onClick={() => handleEditAnswer(answer)} className="action-button edit-button">Edit</button>
                                        <button onClick={() => handleDeleteAnswer(answer.id)} className="action-button delete-button">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Modal */}
            {isUserModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">{currentUser ? 'Edit User' : 'Add User'}</h3>
                        <form onSubmit={handleSaveUser}>
                            <div className="modal-form-group">
                                <label>Username:</label>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Password: {currentUser ? '(Leave blank to keep current)' : ''}</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required={!currentUser}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Roles:</label>
                                <div className="checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newRoles.ROLE_USER}
                                            onChange={() => handleRoleChange('ROLE_USER')}
                                        />
                                        <span>User</span>
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newRoles.ROLE_ADMIN}
                                            onChange={() => handleRoleChange('ROLE_ADMIN')}
                                        />
                                        <span>Admin</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsUserModalOpen(false)} className="cancel-button">Cancel</button>
                                <button type="submit" className="save-button">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Question Modal */}
            {isQuestionModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">{currentQuestion ? 'Edit Question' : 'Add Question'}</h3>
                        <form onSubmit={handleSaveQuestion}>
                            <div className="modal-form-group">
                                <label>Question Text:</label>
                                <input
                                    type="text"
                                    value={newQuestionText}
                                    onChange={(e) => setNewQuestionText(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Type:</label>
                                <select
                                    value={newQuestionType}
                                    onChange={(e) => {
                                        setNewQuestionType(e.target.value);
                                        if (e.target.value !== 'radio' && e.target.value !== 'checkbox') {
                                            setNewQuestionOptions('');
                                            setNewMaxSelections('');
                                        } else if (e.target.value === 'radio') {
                                            setNewMaxSelections('');
                                        }
                                    }}
                                    required
                                >
                                    <option value="text">text</option>
                                    <option value="radio">radio</option>
                                    <option value="checkbox">checkbox</option>
                                </select>
                            </div>
                            {(newQuestionType === 'radio' || newQuestionType === 'checkbox') && (
                                <div className="modal-form-group">
                                    <label>Options (comma-separated):</label>
                                    <input
                                        type="text"
                                        value={newQuestionOptions}
                                        onChange={(e) => setNewQuestionOptions(e.target.value)}
                                        placeholder="e.g., Option A, Option B, Option C"
                                    />
                                </div>
                            )}
                            {newQuestionType === 'checkbox' && (
                                <div className="modal-form-group">
                                    <label>Max Selections (for checkbox):</label>
                                    <input
                                        type="number"
                                        value={newMaxSelections}
                                        onChange={(e) => setNewMaxSelections(e.target.value)}
                                        placeholder="e.g., 3"
                                        min="1"
                                        required
                                    />
                                </div>
                            )}
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="cancel-button">Cancel</button>
                                <button type="submit" className="save-button">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Answer Modal */}
            {isAnswerModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">{currentAnswer ? 'Edit Answer' : 'Add Answer'}</h3>
                        <form onSubmit={handleSaveAnswer}>
                            <div className="modal-form-group">
                                <label>Response:</label>
                                <input
                                    type="text"
                                    value={newAnswerResponse}
                                    onChange={(e) => setNewAnswerResponse(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Question ID:</label>
                                <input
                                    type="number"
                                    value={newAnswerQuestionId}
                                    onChange={(e) => setNewAnswerQuestionId(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>User ID:</label>
                                <input
                                    type="number"
                                    value={newAnswerUserId}
                                    onChange={(e) => setNewAnswerUserId(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsAnswerModalOpen(false)} className="cancel-button">Cancel</button>
                                <button type="submit" className="save-button">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPanel;
