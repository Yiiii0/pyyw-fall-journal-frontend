import React from 'react';
import { Link } from 'react-router-dom';
import './ActionDashboard.css';

function ActionDashboard() {
    return (
        <div className="action-dashboard-container">
            <h2 className="action-dashboard-heading">Action Dashboard</h2>

            <div className="action-box">
                <h3 className="action-box-title">Referee Action</h3>
                <div className="action-box-content">
                    {/* Content for referee actions will go here */}
                    <p>Manage your referee tasks and responsibilities here.</p>

                    <div className="action-buttons">
                        <Link to="/manuscripts" className="action-button">View Assignments</Link>
                        <Link to="/referee/reviews" className="action-button">Submit Reviews</Link>
                    </div>
                </div>
            </div>

            <ul className="action-dashboard-links">
                <li>
                    <Link to="/actions/manuscripts" className="action-dashboard-link">
                        Manuscripts
                    </Link>
                </li>
            </ul>
        </div>
    );
}

export default ActionDashboard;
