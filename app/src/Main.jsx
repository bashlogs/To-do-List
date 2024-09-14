import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Main.css';

function Home() {
    const navigate = useNavigate();

    return (
        <div className="container">
            <h1>Welcome to Your To-do List</h1>
            <button className="login-button" onClick={() => navigate('/login')}>
                Login
            </button>
        </div>
    );
}

export default Home;
