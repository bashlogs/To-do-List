import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Report.css'; // Import your CSS file

function Report() {
    const [username, setUsername] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [tasksOnTime, setTasksOnTime] = useState([]);
    const [tasksAfterDue, setTasksAfterDue] = useState([]);
    const [tasksAfterDueDate, setTasksAfterDueDate] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('userName');
        setUsername(user || '');

        if (!token) {
            navigate('/login');
        } else {
            fetch('http://localhost:5000/verify-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (!data.valid) {
                        navigate('/login');
                    }
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                    navigate('/login');
                });
        }
    }, [navigate, username]);

    const generateReport = () => {
        fetch(`http://localhost:5000/get-report/${username}/${year}/${month}`)
            .then(response => response.json())
            .then(data => {
                if (data) {
                    setTasksOnTime(data.onTime);
                    setTasksAfterDue(data.afterDue);
                    setTasksAfterDueDate(data.afterDueDate);
                }
            })
            .catch(error => {
                console.error('Error fetching report:', error);
            });
    };

    return (
        <div className="report-container">
            <div className="report-header">
                Welcome {username}!
            </div>
            <div className="report-inputs">
                <input 
                    type="month" 
                    value={month ? `${year}-${month}` : ''} 
                    onChange={(e) => {
                        const [year, month] = e.target.value.split('-');
                        setYear(year);
                        setMonth(month);
                    }} 
                />
                <button onClick={generateReport}>Generate Report</button>
            </div>
            <div>
                <h3>List of Tasks Completed On Time</h3>
                <ul className="report-list">
                    {tasksOnTime.length === 0 ? (
                        <p>No tasks found</p>
                    ) : (
                        tasksOnTime.map((task, index) => (
                        <li key={index}>
                            <span>{task[0]}</span> {/* Task Name */}
                            <span>{new Date(task[1]).toLocaleString()}</span> {/* Schedule Date */}
                            <span>{new Date(task[2]).toLocaleString()}</span> {/* Due Date */}
                        </li>
                        ))
                    )}
                </ul>
            </div>
            <div>
                <h3>List of Tasks Completed After Due Time</h3>
                <ul className="report-list">
                    {tasksAfterDue.length === 0 ? (
                        <p>No tasks found</p>
                    ) : (
                        tasksAfterDue.map((task, index) => (
                        <li key={index}>
                            <span>{task[0]}</span> {/* Task Name */}
                            <span>{new Date(task[1]).toLocaleString()}</span> {/* Schedule Date */}
                            <span>{new Date(task[2]).toLocaleString()}</span> {/* Due Date */}
                        </li>
                        ))
                    )}
                    </ul>
            </div>
            <div>
                <h3>List of Tasks Completed After Due Date</h3>
                <ul className="report-list">
                    {tasksAfterDueDate.length === 0 ? (
                        <p>No tasks found</p>
                    ) : (
                        tasksAfterDueDate.map((task, index) => (
                        <li key={index}>
                            <span>{task[0]}</span> {/* Task Name */}
                            <span>{new Date(task[1]).toLocaleString()}</span> {/* Schedule Date */}
                            <span>{new Date(task[2]).toLocaleString()}</span> {/* Due Date */}
                        </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}

export default Report;
