const express = require('express');
const router = express.Router();
const User = require('../models/User');


const validateRegistration = (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;
    const errors = [];

    
    if (name.length > 50) {
        errors.push('Name must be less than 50 characters');
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errors.push('Invalid email format');
    }

    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,15}$/;
    if (!passwordRegex.test(password)) {
        errors.push('Password must be 6-15 characters and contain uppercase, lowercase, and special characters');
    }

    
    if (password !== confirmPassword) {
        errors.push('Passwords do not match');
    }

    if (errors.length > 0) {
        return res.render('register', { error: errors.join(', ') });
    }

    next();
};

router.get('/login', (req, res) => {
    res.render('login', { 
        title: 'Movie Search - Login',
        error: null 
    });
});

router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { error: 'Email already registered' });
        }

        
        const user = new User({ name, email, password });
        await user.save();
        
        res.redirect('/login');
    } catch (error) {
        res.render('register', { error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.render('login', { 
                title: 'Movie Search - Login',
                error: 'Invalid email or password' 
            });
        }

        
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin 
        };

        if (user.isAdmin) {
            return res.redirect('/movies/admin');
        }

        res.redirect('/movies/search');
        
    } catch (error) {
        res.render('login', { 
            title: 'Movie Search - Login',
            error: error.message 
        });
    }
});


router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router;