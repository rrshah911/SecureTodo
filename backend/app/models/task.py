from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, UTCDateTimeAttribute, NumberAttribute, ListAttribute
from datetime import datetime
import os

class Task(Model):
    class Meta:
        table_name = os.getenv('DYNAMODB_TABLE_NAME')
        region = os.getenv('AWS_REGION')
        
    # Hash key is the user_id
    user_id = UnicodeAttribute(hash_key=True)
    # Range key is the task_id (we'll use timestamp for ordering)
    task_id = UnicodeAttribute(range_key=True)
    
    title = UnicodeAttribute()
    description = UnicodeAttribute(null=True)
    due_date = UTCDateTimeAttribute(null=True)
    priority = UnicodeAttribute(default='medium')  # low, medium, high
    status = UnicodeAttribute(default='todo')      # todo, in_progress, done
    labels = ListAttribute(default=list)
    created_at = UTCDateTimeAttribute(default=datetime.utcnow)
    updated_at = UTCDateTimeAttribute(default=datetime.utcnow)

    def to_dict(self):
        return {
            'task_id': self.task_id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'priority': self.priority,
            'status': self.status,
            'labels': self.labels,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 