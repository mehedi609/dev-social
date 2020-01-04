const express = require('express');
const { check, validationResult } = require('express-validator');

const { auth } = require('../../middleware/auth');
const { User } = require('../../models/User');
const { Profile } = require('../../models/Profile');
const { Post } = require('../../models/Post');

const router = express.Router();

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar
      });

      const post = await newPost.save();
      return res.json(post);
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ data: -1 });
    return res.json(posts);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/posts/:id
// @desc    Get a post by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: 'Post not found!' });

    return res.json(post);
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found!' });
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/posts/:id
// @desc    Delete a post by id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: 'Post not found!' });

    if (post.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'User not authorized!' });

    await post.remove();
    return res.json({ msg: 'Post removed' });
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found!' });
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: 'Post not found!' });

    // Check if the post has already been liked
    const likedByUser = post.likes.filter(
      like => like.user.toString() === req.user.id
    );
    if (likedByUser.length > 0)
      return res.status(400).json({ msg: 'Post already been liked' });

    post.likes.unshift({ user: req.user.id });
    await post.save();

    return res.json(post.likes);
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found!' });
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    Like a post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: 'Post not found!' });

    const likedByUser = post.likes.filter(
      like => like.user.toString() === req.user.id
    );
    if (likedByUser.length === 0)
      return res.status(400).json({ msg: 'Post has not been liked yet' });

    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();

    return res.json(post.likes);
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found!' });
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.put(
  '/comment/:id',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const post = await Post.findById(req.params.id);

      if (!post) return res.status(404).json({ msg: 'Post not found!' });

      const user = await User.findById(req.user.id).select('-password');

      const newComment = {
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar
      };

      post.comments.unshift(newComment);
      await post.save();

      return res.json(post.comments);
    } catch (e) {
      console.error(e.message);
      if (e.kind === 'ObjectId')
        return res.status(404).json({ msg: 'Post not found!' });
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete a comment on a post
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found!' });

    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    if (!comment) return res.status(404).json({ msg: 'Comment not found!' });

    if (comment.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'User not Authorized' });

    const removeIndex = post.comments
      .map(comment => comment.id)
      .indexOf(req.params.comment_id);
    post.comments.splice(removeIndex, 1);
    await post.save();

    return res.json(post.comments);
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found!' });
    res.status(500).send('Server Error');
  }
});

module.exports = router;
