// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const { randomBytes } = require('crypto');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const commentsByPostId = {};

app.get('/posts/:id/comments', (req, res) => {
  res.json(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res) => {
  const { content } = req.body;
  const commentId = randomBytes(4).toString('hex');
  const postId = req.params.id;

  const comments = commentsByPostId[postId] || [];

  comments.push({ id: commentId, content, status: 'pending' });

  commentsByPostId[postId] = comments;

  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: { id: commentId, content, postId, status: 'pending' },
  });

  res.status(201).json(comments);
});

app.post('/events', async (req, res) => {
  console.log('Event Received', req.body.type);

  const { type, data } = req.body;

  if (type === 'CommentModerated') {
    const { id, content, postId, status } = data;
    const comments = commentsByPostId[postId];

    const comment = comments.find((comment) => comment.id === id);

    comment.status = status;

    await axios.post('http://localhost:4005/events', {
      type: 'CommentUpdated',
      data: { id, content, postId, status },
    });
  }

  res.send({});
});

app.listen(4001, () => {
  console.log('Listening on 4001');
});