const express = require('express');
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');

const User = require('../../models/User');
const router = express.Router();

// @route   POST api/users
// @desc    Register User
// @access  Public
router.post(
  '/',
  [
    check('password', 'Please enter a password with 6 or more').isLength({
      min: 6
    }),
    check('email', 'Please include a valid email').isEmail(),
    check('name', 'Name is Required')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, email, password } = req.body;

      // See if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ message: 'User already exists.' }] });
      }

      // Get users Gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: '404'
      });

      user = new User({ name, email, avatar, password });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(payload, privateKey, { expiresIn: 36000 }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (e) {
      console.error(e);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
