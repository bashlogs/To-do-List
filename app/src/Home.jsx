import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // Import your CSS file

function Home() {
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [username, setUsername] = useState('');
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
  
    if (user) {
      // Add the username to the URL
      fetch(`http://localhost:5000/get-tasks/${user}`)
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTodos(data);
            console.log(setTodos(data));
          } else {
            console.error('Expected an array but got', data);
            setTodos([]);
          }
        })
        .catch(error => {
          console.error('Error fetching tasks:', error);
          setTodos([]);
        });
    }
  
  }, [navigate, username]);   

  const addTodo = () => {
    if (task && description && dueDate) {
      const newTask = {
        username,
        task,
        description,
        due_date: dueDate,
        completed: false
      };
  
      // Make a POST request to your backend to add the new task
      fetch('http://localhost:5000/add-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTask)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setTodos([...todos, data.task]);  // Add the task returned from the backend
        } else {
          console.error('Failed to add task', data.message);
        }
      })
      .catch(error => {
        console.error('Error adding task:', error);
      });
  
      setTask('');
      setDescription('');
      setDueDate('');
    }
  };
  

  const editTodo = (index) => {
    const todo = todos[index];
    const updatedTask = {
      task,
      description,
      due_date: dueDate,
    };
  
    // Make a POST request to your backend to update the task
    fetch(`http://localhost:5000/update-task/${todo.task_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedTask)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const newTodos = [...todos];
        newTodos[index] = { ...newTodos[index], task, description, dueDate };
        setTodos(newTodos);  // Update the state
        setTask('');
        setDescription('');
        setDueDate('');
        setEditingIndex(null);
      } else {
        console.error('Failed to update task', data.message);
      }
    })
    .catch(error => {
      console.error('Error updating task:', error);
    });
  };
  

  const markAsCompleted = (index) => {
    const completedTask = todos[index];
    
    // Make a POST request to update the end_date and completed status of the task
    fetch(`http://localhost:5000/complete-task/${completedTask.task_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completed: true, end_date: new Date().toISOString() })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const newTodos = [...todos];
        newTodos[index].completed = true;
        newTodos[index].end_date = new Date().toISOString();  // Update the end_date locally
        setTodos(newTodos);  // Update the state
      } else {
        console.error('Failed to complete task', data.message);
      }
    })
    .catch(error => {
      console.error('Error completing task:', error);
    });
  };  
  
  const undoTask = (index) => {
    const undoneTask = todos[index];
    
    // Make a POST request to revert the end_date and completed status
    fetch(`http://localhost:5000/undo-task/${undoneTask.task_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const newTodos = [...todos];
        newTodos[index].completed = false;
        newTodos[index].end_date = null;  // Reset end_date locally
        setTodos(newTodos);  // Update the state
      } else {
        console.error('Failed to undo task', data.message);
      }
    })
    .catch(error => {
      console.error('Error undoing task:', error);
    });
  };  
  
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleEditClick = (index) => {
    const todo = todos[index];
    console.log(todo);
    setTask(todo.task);
    setDescription(todo.description);
    setDueDate(formatDateForInput(todo.due_date));     
    setStatus(todo.status);
    setEditingIndex(index);
  };

  const goToMonthlyReport = () => {
    navigate('/monthly-report');  // Navigate to the Monthly Report page
  };

  return (
    <div className="home-container">
      <div className="welcome-message">
        Welcome, {username}!
        <button className="monthly-report-button" onClick={goToMonthlyReport}>
          Monthly Report
        </button>
      </div>
      <div className="todo-input">
        <input 
          type="text" 
          placeholder="Task" 
          value={task}
          onChange={(e) => setTask(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Description" 
          value={description}
          onChange={(e) => setDescription(e.target.value)} 
        />
        <input 
          type="datetime-local" 
          placeholder="To Complete Date" 
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)} 
        />

        <button onClick={editingIndex !== null ? () => editTodo(editingIndex) : addTodo}>
          {editingIndex !== null ? 'Update Task' : 'Add Task'}
        </button>
      </div>
      <ul className="todo-list">
        <li>
          <span>Tasks</span> <span>Description</span> <span>Schedule Date</span> <span>Due Date</span> <span>Actions</span>
        </li>
        {todos.map((todo, index) => (
          <li key={index} className={todo.completed ? 'completed' : ''}>
            <span>{todo.task}</span>
            <span>{todo.description}</span>
            <span>{todo.schedule_date}</span>
            <span>{todo.due_date}</span>
            {!todo.completed ? (
              <button onClick={() => markAsCompleted(index)}>Complete</button>
            ) : (
              <button onClick={() => undoTask(index)}>Undo</button>
            )}
            <button onClick={() => handleEditClick(index)}>Edit</button>
          </li>
        ))}
      </ul>

    </div>
  );
}

export default Home;
