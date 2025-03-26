from flask import Blueprint, request, jsonify
from app.models.task import Task
from app.utils.auth_middleware import require_auth
from datetime import datetime
from botocore.exceptions import ClientError
import uuid

bp = Blueprint('tasks', __name__)

@bp.route('', methods=['POST'])
@require_auth
def create_task():
    try:
        data = request.json
        print(data)
        print(request)
        task = Task(
            user_id=request.user['user_id'],
            task_id=str(uuid.uuid4()),
            title=data['title'],
            description=data.get('description'),
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%dT%H:%M:%S.%fZ') if data.get('due_date') else None,  # Updated line
            priority=data.get('priority', 'medium'),
            status='todo',
            labels=data.get('labels', [])
        )
        task.save()
        return jsonify(task.to_dict()), 201
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 400

@bp.route('', methods=['GET'])
@require_auth
def get_tasks():
    try:
        # Get query parameters
        print("This is the request: ", request)
        status = request.args.get('status')
        sort_by = request.args.get('sort_by', 'created_at')
        search = request.args.get('search', '').lower()

        # Scan tasks for the user using PynamoDB's scan operation
        tasks = Task.scan(Task.user_id == request.user['user_id'])

        # Convert to list and apply filters
        task_list = [task.to_dict() for task in tasks]
        
        # Filter by status if provided
        if status:
            task_list = [task for task in task_list if task['status'] == status]

        # Filter by search term
        if search:
            task_list = [
                task for task in task_list 
                if search in task['title'].lower() or 
                   (task['description'] and search in task['description'].lower())
            ]

        # Sort tasks
        if sort_by == 'due_date':
            task_list.sort(key=lambda x: x['due_date'] if x['due_date'] else datetime.max.isoformat())
        elif sort_by == 'priority':
            priority_order = {'high': 0, 'medium': 1, 'low': 2}
            task_list.sort(key=lambda x: priority_order.get(x['priority'], 1))
        else:  # default sort by created_at
            task_list.sort(key=lambda x: x['created_at'], reverse=True)

        return jsonify(task_list), 200
    except ClientError as err:
        print("DynamoDB Client Error:", err)
        return jsonify([]), 200
    except Exception as e: 
        print("This is the error: ", e)
        return jsonify([]), 200

@bp.route('/<task_id>', methods=['PUT'])
@require_auth
def update_task(task_id):
    try:
        data = request.json
        task = Task.get(request.user['user_id'], task_id)
        
        # Update fields if provided
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'due_date' in data:
            task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%dT%H:%M:%S.%fZ') if data.get('due_date') else None
        if 'priority' in data:
            task.priority = data['priority']
        if 'status' in data:
            task.status = data['status']
        if 'labels' in data:
            task.labels = data['labels']
        
        task.updated_at = datetime.utcnow()
        task.save()
        
        return jsonify(task.to_dict()), 200
    except Task.DoesNotExist:
        return jsonify({'error': 'Task not found'}), 404
    except Exception as e:
        print("This is the error: ", e)
        return jsonify({'error': str(e)}), 400

@bp.route('/<task_id>', methods=['DELETE'])
@require_auth
def delete_task(task_id):
    try:
        task = Task.get(request.user['user_id'], task_id)
        task.delete()
        return '', 204
    except Task.DoesNotExist:
        return jsonify({'error': 'Task not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 400 