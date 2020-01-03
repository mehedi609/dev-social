const express = require('express');
const { check, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');
const { Profile } = require('../../models/Profile');
const { User } = require('../../models/User');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (e) {
    console.error(e.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile
// @desc    Create or Update user profile
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required')
        .not()
        .isEmpty(),
      check('skills', 'Skills are required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubusername,
      youtube,
      twitter,
      facebook,
      linkedin,
      instagram
    } = req.body;

    // create bio
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (bio) profileFields.bio = bio;
    if (githubusername) profileFields.githubusername = githubusername;

    if (skills) {
      profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // create social obj
    profileFields.social = {};

    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      // Update
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // Create
      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found!' });
    }
    return res.json(profile);
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found!' });
    }
    return res.status(500).send('Server Error');
  }
});

// @route   DELETE api/profile
// @desc    Delete profile, user and posts
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    //remove posts

    //remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    // remove user
    await User.findOneAndRemove({ _id: req.user.id });
    return res.json({ msg: 'User Deleted' });
  } catch (e) {
    console.error(e.message);
    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('company', 'Company is required')
        .not()
        .isEmpty(),
      check('from', 'From is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExperience = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExperience);
      await profile.save();
      return res.json(profile);
    } catch (e) {
      console.error(e.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);
    await profile.save();

    return res.status(200).json(profile);
  } catch (e) {
    console.error(e.message);
    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required')
        .not()
        .isEmpty(),
      check('degree', 'Degree is required')
        .not()
        .isEmpty(),
      check('fieldofstudy', 'FieldOfStudy is required')
        .not()
        .isEmpty(),
      check('from', 'From is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      return res.json(profile);
    } catch (e) {
      console.error(e.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);
    await profile.save();
    return res.json(profile);
  } catch (e) {
    console.error(e.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/github/:username
// @desc    Get github repos
// @access  Public
router.get('/github/:username', (req, res) => {
  try {
    const client_id = config.get('githubClientId');
    const client_secret = config.get('githubClientSecret');
    const username = req.params.username;
    const options = {
      uri: `https://api.github.com/users/${username}/repos?per_page=5&sort=created:asc&client_id=${client_id}&client_secret=${client_secret}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    };

    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
      }

      if (response.statusCode !== 200) {
        return res.status(400).json({ msg: 'No Github profile found' });
      }

      return res.json(JSON.parse(body));
    });
  } catch (e) {
    console.error(e.message);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
