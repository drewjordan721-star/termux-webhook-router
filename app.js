const express = require('express');
const app = express();
app.use(express.json({ limit: '50mb' }));

// Store pending tasks
let tasks = [];

// Receive task from n8n/AI agent
app.post('/task', (req, res) => {
  const task = {
    id: Date.now().toString(),
    script: req.body.script,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  console.log(`📨 Task ${task.id} queued`);
  res.json({ status: 'queued', taskId: task.id });
});

// Termux checks for tasks
app.get('/poll/:device', (req, res) => {
  const pending = tasks.find(t => t.status === 'pending');
  if (pending) {
    pending.status = 'processing';
    console.log(`📤 Sending task ${pending.id} to ${req.params.device}`);
    res.json(pending);
  } else {
    res.json(null);
  }
});

// Termux returns result
app.post('/result/:taskId', (req, res) => {
  const task = tasks.find(t => t.id === req.params.taskId);
  if (task) {
    task.status = 'done';
    task.result = req.body;
    console.log(`✅ Task ${task.id} completed`);
  }
  res.json({ status: 'received' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'alive', 
    pending: tasks.filter(t => t.status === 'pending').length,
    total: tasks.length 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📌 Task endpoint: POST /task`);
  console.log(`📌 Poll endpoint: GET /poll/any-device`);
  console.log(`📌 Result endpoint: POST /result/{taskId}`);
  console.log(`📌 Health check: GET /health`);
});
