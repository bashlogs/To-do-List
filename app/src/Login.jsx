import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Import your CSS file

function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (name && password) {
      try {
        const response = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: name, password: password }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.token);  // Corrected key
          localStorage.setItem('userName', name);

          // Navigate to the home page
          navigate('/home');
        } else {
          const errorData = await response.json();
          alert(errorData.message);  // Corrected key
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during login. Please try again.');
      }
    } else {
      alert('Please enter both name and password');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <div className="login-inputs">
        <input 
          type="text" 
          placeholder="Enter your name" 
          value={name}
          onChange={(e) => setName(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Enter your password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
}

export default Login;
