from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import psycopg2
import bcrypt
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app)
app.config['JWT_SECRET_KEY'] = 'To-do-app'
jwt = JWTManager(app)

load_dotenv()
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )
    return conn

# Login route
@app.route('/login', methods=['POST'])
def login_or_register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()

    if user:
        if bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):  
            token = create_access_token(identity=username)
            return jsonify({'token': token})
        else:
            return jsonify({'message': 'Invalid username or password'}), 401
    else:
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_password.decode('utf-8')))
        conn.commit()
        cursor.close()
        conn.close()
        token = create_access_token(identity=username)
        return jsonify({'token': token})

@app.route('/verify-token', methods=['POST'])
@jwt_required()
def verify_token():
    try:
        user_id = get_jwt_identity()
        logging.debug(f"User ID: {user_id}")
        return jsonify({"valid": True}), 200
    except Exception as e:
        logging.error(f"Error verifying token: {str(e)}")
        return jsonify({"valid": False}), 401

# To add task

@app.route('/add-task', methods=['POST'])
def add_task():
    data = request.json
    username = data.get('username')
    task = data.get('task')
    description = data.get('description')
    due_date = data.get('due_date')

    schedule_date = datetime.now()

    end_date = None

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT user_id FROM Users WHERE username = %s", (username,))
        user_id = cur.fetchone()

        if user_id is None:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        user_id = user_id[0]  

        cur.execute("INSERT INTO Tasks (user_id) VALUES (%s) RETURNING task_id", (user_id,))
        task_id = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO Task_Desc (task_id, task, description, schedule_date, due_date, end_date) 
            VALUES (%s, %s, %s, %s, %s, %s)
            """, (task_id, task, description, schedule_date, due_date, end_date))

        conn.commit()

        task_data = {
            'task_id': task_id,
            'task': task,
            'description': description,
            'schedule_date': schedule_date,
            'due_date': due_date,
            'end_date': end_date
        }

        return jsonify({'success': True, 'task': task_data}), 201

    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")  
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# To get all tasks
@app.route('/get-tasks/<username>', methods=['GET'])
def get_tasks(username):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT user_id FROM Users WHERE username = %s", (username,))
        user = cur.fetchone()
        print(f"User fetched: {user}")

        if not user:
            return jsonify({'error': 'User not found'}), 404

        user_id = user[0]

        cur.execute("""
            SELECT td.task_id, td.task, td.description, td.schedule_date, td.due_date, td.end_date, td.completed
            FROM Task_Desc td
            JOIN Tasks t ON t.task_id = td.task_id
            WHERE t.user_id = %s
            """, (user_id,))
        
        tasks = cur.fetchall()
        print(f"Tasks fetched: {tasks}")

        result = []
        for task in tasks:
            result.append({
                'task_id': task[0],
                'task': task[1],
                'description': task[2],
                'schedule_date': task[3],
                'due_date': task[4],
                'end_date': task[5],
                'completed': task[6]
            })
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error occurred: {e}")  # Print the actual error to debug
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# To update task
@app.route('/update-task/<int:task_id>', methods=['POST'])
def update_task(task_id):
    data = request.json
    task = data.get('task')
    description = data.get('description')
    due_date = data.get('due_date')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            UPDATE Task_Desc
            SET task = %s, description = %s, due_date = %s
            WHERE task_id = %s
            """, (task, description, due_date, task_id))
        
        conn.commit()
        
        return jsonify({'success': True}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/undo-task/<int:task_id>', methods=['POST'])
def undo_task(task_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            UPDATE Task_Desc
            SET end_date = NULL, completed = FALSE
            WHERE task_id = %s
            """, (task_id,))
        
        conn.commit()
        
        return jsonify({'success': True}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/complete-task/<int:task_id>', methods=['POST'])
def complete_task(task_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        end_date = datetime.now().isoformat()  # Get the current date and time

        cur.execute("""
            UPDATE Task_Desc
            SET end_date = %s, completed = TRUE
            WHERE task_id = %s
            """, (end_date, task_id))
        
        conn.commit()
        
        return jsonify({'success': True}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cur.close()
        conn.close()


# Monthly Report
@app.route('/get-report/<username>/<year>/<month>', methods=['GET'])
def get_report(username, year, month):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Calculate the start and end dates of the month
    start_date = datetime(int(year), int(month), 1)
    end_date = (start_date + timedelta(days=31)).replace(day=1)
    end_date = end_date - timedelta(days=1)
    
    # Convert dates to strings in the format 'YYYY-MM-DD'
    start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')

    # Query to get user_id from username
    query_user_id = """
    SELECT user_id FROM users WHERE username = %s
    """
    cur.execute(query_user_id, (username,))
    user_id_result = cur.fetchone()
    if not user_id_result:
        cur.close()
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    user_id = user_id_result[0]

    # Query for tasks completed on time
    query_on_time = """
    Select t.task, t.schedule_date, t.due_date from task_desc as t join tasks as ta 
    on t.task_id = ta.task_id where ta.user_id = %s and t.completed = TRUE and t.end_date <= t.due_date and t.due_date between %s and %s
    """
    cur.execute(query_on_time, (user_id, start_date_str, end_date_str))
    tasks_on_time = cur.fetchall()

    # Query for tasks completed after due time
    query_after_due = """
    Select t.task, t.schedule_date, t.due_date from task_desc as t join tasks as ta 
    on t.task_id = ta.task_id
    WHERE user_id = %s AND completed = TRUE AND end_date > due_date AND due_date BETWEEN %s AND %s
    """
    cur.execute(query_after_due, (user_id, start_date_str, end_date_str))
    tasks_after_due = cur.fetchall()

    # Query for tasks completed after due date
    query_after_due_date = """
    Select t.task, t.schedule_date, t.due_date from task_desc as t join tasks as ta 
    on t.task_id = ta.task_id
    WHERE user_id = %s AND completed = TRUE AND end_date > %s AND due_date BETWEEN %s AND %s
    """
    cur.execute(query_after_due_date, (user_id, end_date_str, start_date_str, end_date_str))
    tasks_after_due_date = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify({
        'onTime': tasks_on_time,
        'afterDue': tasks_after_due,
        'afterDueDate': tasks_after_due_date
    })


if __name__ == '__main__':
    app.run(debug=True)
