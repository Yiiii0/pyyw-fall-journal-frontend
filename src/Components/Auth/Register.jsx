import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { register } from '../../services/peopleAPI';
import './Auth.css';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
        affiliation: '',
        bio: '',
    });
    const [error, setError] = useState('');

    // Clear password mismatch error when passwords match
    useEffect(() => {
        if (error === 'Passwords do not match' && formData.password === formData.confirmPassword) {
            setError('');
        }
    }, [formData.password, formData.confirmPassword, error]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const userData = {
                username: formData.email,
                password: formData.password,
                name: formData.name,
            };
            if (formData.affiliation.trim()) {
                userData.affiliation = formData.affiliation;
            }
            if (formData.bio.trim()) {
                userData.bio = formData.bio;
            }
            await register(userData);
            navigate('/login');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div className="register-container">
            <h2>Create an Account</h2>
            <form onSubmit={handleSubmit} className="register-form">
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                    <label htmlFor="email">Email<span className="required">*</span></label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="name">Name<span className="required">*</span></label>
                    <input
                        type="name"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password<span className="required">*</span></label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password<span className="required">*</span></label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="affiliation">Affiliation</label>
                    <input
                        type="affiliation"
                        id="affiliation"
                        name="affiliation"
                        value={formData.affiliation}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <input
                        type="bio"
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit" className="register-button">
                    Register
                </button>
            </form>
            <div className="login-link">
                <p>Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
        </div>
    );
}

Register.propTypes = {
    onRegister: PropTypes.func.isRequired,
};

export default Register;