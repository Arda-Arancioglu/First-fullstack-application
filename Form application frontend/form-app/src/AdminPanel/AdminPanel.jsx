// src/AdminPanel/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axios-instance';
import { useNavigate } from 'react-router-dom';

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
    const [newRoles, setNewRoles] = useState({ ROLE_USER: false, ROLE_ADMIN: false }); // Object for checkbox roles
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionType, setNewQuestionType] = useState('text'); // Default type
    const [newQuestionOptions, setNewQuestionOptions] = useState(''); // State for options input (comma-separated string)
    const [newMaxSelections, setNewMaxSelections] = useState(''); // State for maxSelections input
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
            setUsers(usersRes.data); // FIXED: Correctly setting users data from usersRes
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

    if (loading) return <div className="text-center p-4">Loading Admin Panel...</div>;
    // Keep error display for general fetch errors, but handle modal-specific errors within modal forms
    if (error && !isUserModalOpen && !isQuestionModalOpen && !isAnswerModalOpen) return <div className="text-center p-4 text-red-500">❌ {error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
            <nav className="w-full max-w-4xl bg-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800">Admin Panel</h2>
                <button
                    onClick={onLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200"
                >
                    Logout
                </button>
            </nav>

            <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-700">Users Management</h3>
                <button onClick={handleAddUser} className="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Add User</button>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-md">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-200">
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">ID</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Username</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Roles</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="py-2 px-4 text-sm text-gray-700">{user.id}</td>
                                    <td className="py-2 px-4 text-sm text-gray-700">{user.username}</td>
                                    <td className="py-2 px-4 text-sm text-gray-700">
                                        {user.roles && user.roles.length > 0
                                            ? user.roles.map(role => role.name).join(', ')
                                            : 'No Roles'}
                                    </td>
                                    <td className="py-2 px-4 text-sm">
                                        <button onClick={() => handleEditUser(user)} className="px-3 py-1 bg-yellow-500 text-white rounded-md mr-2">Edit</button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="px-3 py-1 bg-red-500 text-white rounded-md">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-700">Questions Management</h3>
                <button onClick={handleAddQuestion} className="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Add Question</button>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-md">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-200">
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">ID</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Question Text</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Type</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Options</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Max Sel.</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map((question) => (
                                <tr key={question.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="py-2 px-4 text-sm text-gray-700">{question.id}</td>
                                    <td className="py-2 px-4 text-sm text-gray-700">{question.questionText}</td>
                                    <td className="py-2 px-4 text-sm text-gray-700">{question.type}</td>
                                    <td className="py-2 px-4 text-sm text-gray-700">
                                        {question.options && question.options.length > 0
                                            ? question.options.join(', ')
                                            : 'N/A'}
                                    </td>
                                    <td className="py-2 px-4 text-sm text-gray-700">
                                        {question.maxSelections !== null ? question.maxSelections : 'N/A'}
                                    </td>
                                    <td className="py-2 px-4 text-sm">
                                        <button onClick={() => handleEditQuestion(question)} className="px-3 py-1 bg-yellow-500 text-white rounded-md mr-2">Edit</button>
                                        <button onClick={() => handleDeleteQuestion(question.id)} className="px-3 py-1 bg-red-500 text-white rounded-md">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-700">Answers Management</h3>
                <button onClick={handleAddAnswer} className="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Add Answer</button>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-md">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-200">
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">ID</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Response</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Question ID</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">User ID</th>
                                <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {answers.map((answer) => (
                                <tr key={answer.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="py-2 px-4 text-sm text-gray-700">{answer.id}</td>
                                    <td className="py-2 px-4 text-sm text-gray-700">{answer.response}</td>
                                    <td className="py-2 px-4 text-sm text-gray-700">{answer.question?.id || 'N/A'}</td>
                                    <td className="py-2 px-4 text-sm text-gray-700">{answer.user?.id || 'N/A'}</td>
                                    <td className="py-2 px-4 text-sm">
                                        <button onClick={() => handleEditAnswer(answer)} className="px-3 py-1 bg-yellow-500 text-white rounded-md mr-2">Edit</button>
                                        <button onClick={() => handleDeleteAnswer(answer.id)} className="px-3 py-1 bg-red-500 text-white rounded-md">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-xl font-bold mb-4">{currentUser ? 'Edit User' : 'Add User'}</h3>
                        <form onSubmit={handleSaveUser}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Password: {currentUser ? '(Leave blank to keep current)' : ''}</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required={!currentUser}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Roles:</label>
                                <div className="flex items-center space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-5 w-5 text-blue-600"
                                            checked={newRoles.ROLE_USER}
                                            onChange={() => handleRoleChange('ROLE_USER')}
                                        />
                                        <span className="ml-2 text-gray-700">User</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-5 w-5 text-blue-600"
                                            checked={newRoles.ROLE_ADMIN}
                                            onChange={() => handleRoleChange('ROLE_ADMIN')}
                                        />
                                        <span className="ml-2 text-gray-700">Admin</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md mr-2">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Question Modal */}
            {isQuestionModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-xl font-bold mb-4">{currentQuestion ? 'Edit Question' : 'Add Question'}</h3>
                        <form onSubmit={handleSaveQuestion}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Question Text:</label>
                                <input
                                    type="text"
                                    value={newQuestionText}
                                    onChange={(e) => setNewQuestionText(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Type:</label>
                                <select
                                    value={newQuestionType}
                                    onChange={(e) => {
                                        setNewQuestionType(e.target.value);
                                        // Clear options and maxSelections if type changes
                                        if (e.target.value !== 'radio' && e.target.value !== 'checkbox') {
                                            setNewQuestionOptions('');
                                            setNewMaxSelections('');
                                        } else if (e.target.value === 'radio') {
                                            setNewMaxSelections(''); // Radio doesn't use maxSelections
                                        }
                                    }}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                >
                                    <option value="text">text</option>
                                    <option value="radio">radio</option>
                                    <option value="checkbox">checkbox</option>
                                </select>
                            </div>
                            {(newQuestionType === 'radio' || newQuestionType === 'checkbox') && (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Options (comma-separated):</label>
                                    <input
                                        type="text"
                                        value={newQuestionOptions}
                                        onChange={(e) => setNewQuestionOptions(e.target.value)}
                                        placeholder="e.g., Option A, Option B, Option C"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                            )}
                            {newQuestionType === 'checkbox' && (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Max Selections (for checkbox):</label>
                                    <input
                                        type="number"
                                        value={newMaxSelections}
                                        onChange={(e) => setNewMaxSelections(e.target.value)}
                                        placeholder="e.g., 3"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        min="1"
                                        required
                                    />
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md mr-2">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Answer Modal */}
            {isAnswerModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-xl font-bold mb-4">{currentAnswer ? 'Edit Answer' : 'Add Answer'}</h3>
                        <form onSubmit={handleSaveAnswer}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Response:</label>
                                <input
                                    type="text"
                                    value={newAnswerResponse}
                                    onChange={(e) => setNewAnswerResponse(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Question ID:</label>
                                <input
                                    type="number"
                                    value={newAnswerQuestionId}
                                    onChange={(e) => setNewAnswerQuestionId(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">User ID:</label>
                                <input
                                    type="number"
                                    value={newAnswerUserId}
                                    onChange={(e) => setNewAnswerUserId(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={() => setIsAnswerModalOpen(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md mr-2">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPanel;
