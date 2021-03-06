const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Post = require('../../models/Post')
// @route GET api/profile/me
// @desc  Get current users profile
// @access  private
router.get("/me", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate("user", ["name", "avatar"]);

        if (!profile) {
            return res
                .status(400)
                .json({ msg: "There is no profile for this user" });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route POST api/profile
// @desc  Create or update user profile
// @access  private
router.post(
    "/",
    [
        auth,
        [
            check("status", "Status is required")
                .not()
                .isEmpty(),
            check("skills", "Skills is required")
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        console.log(req.user)
        // build profile object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills.split(",").map(skill => skill.trim());
        }

        // build social object
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (facebook) profileFields.social.facebook = facebook;
        if (twitter) profileFields.social.twitter = twitter;
        if (instagram) profileFields.social.instagram = instagram;
        if (linkedin) profileFields.social.linkedin = linkedin;

        try {
            // whenever using a mongoose method we need to use await since it returns a promise /////////////////////////////////////
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                //update
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                );

                return res.json(profile);
            }

            //Create
            profile = new Profile(profileFields);

            await profile.save();
            res.json(profile);
        } catch {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

// @route GET api/profile
// @desc  Get all profiles
// @access  private
router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find().populate("user", [
            "name",
            "avatar"
        ]);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route GET api/profile/user/:user_id
// @desc  Get profile by user ID
// @access  PUBLIC
router.get("/user/:user_id", async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id
        }).populate("user", ["name", "avatar"]);
        if (!profile) return res.status(400).json({ msg: "profile not found" });
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind == "ObjectId") {
            return res.status(400).json({ msg: "profile not found" });
        }
        res.status(500).send("Server Error");
    }
});

// @route DELETE api/profile/user/:user_id
// @desc  Delete profile, user and posts
// @access  Private

router.delete("/", auth, async (req, res) => {
    try {
        //todo remove users posts
        await Post.deleteMany({ user: req.user.id })
        //remove profile
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: "User deleted" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route PUT api/profile/experience
// @desc  Add profile experience
// @access  Private
router.put(
    "/experience",
    [
        auth,
        [
            check("title", "Title is required")
                .not()
                .isEmpty(),
            check("company", "Company is required")
                .not()
                .isEmpty(),
            check("from", "From is required")
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, company, location, from, to, current, description } = req.body;

        const newExp = { title, company, location, from, to, current, description };
        

        try {
            const profile = await Profile.findOne({ user: req.user.id });

                if (profile.experience.length < 2) {
                    profile.experience.unshift(newExp);

                    await profile.save();
        
                    res.json(profile);
                } else {
                    // return res.status(400).json({ msg: "user has max amaount"});
                    // console.log('the user has the max amount')
                    return res.status(400).send("User has max amount of this type of post");
                }
                
                        
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

// @route DELETE api/profile/experience/:exp_id
// @desc  delete experience from profile
// @access  Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // get remove index
        const removeIndex = profile.experience
            .map(item => item.id)
            .indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();
        res.json(profile);
    } catch (err) { }
});

// @route PUT api/profile/education
// @desc  Add profile education
// @access  Private
router.put(
    "/education",
    [
        auth,
        [
            check("school", "School is required")
                .not()
                .isEmpty(),
            check("degree", "degree is required")
                .not()
                .isEmpty(),
            check("fieldofstudy", "Field of study is required")
                .not()
                .isEmpty(),
            check("from", "From is required")
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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
            const profile = await Profile.findOne({ user: req.user.id });

            if (profile.education.length < 2) {
                
                profile.education.unshift(newEdu);

                await profile.save();
    
                res.json(profile);
            } else { 
                return res.status(400).send("User has max amount of this type of post");
            }
            // profile.education.unshift(newEdu);

            //     await profile.save();
    
            //     res.json(profile);

        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

// @route DELETE api/profile/education/:edu_id
// @desc  delete education from profile
// @access  Private
router.delete("/education/:edu_id", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // get remove index
        const removeIndex = profile.education
            .map(item => item.id)
            .indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();
        res.json(profile);
    } catch (err) { }
});

module.exports = router;
