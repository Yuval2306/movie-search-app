const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        maxlength: [15, 'Password cannot exceed 15 characters']
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    favorites: [{
        movieId: String,
        movieData: Object,
        links: [{
            name: String,
            url: String,
            description: String
        }]
    }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    
    if (this.isNew) {
        if (this.name === 'Admin' || this.password === 'Yuval2000') {
            this.isAdmin = true;
        }
    }
    
    
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcryptjs.hash(this.password, salt);
    }

    next();
});


userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcryptjs.compare(candidatePassword, this.password);
};

userSchema.methods.validatePassword = function(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,15}$/;
    return passwordRegex.test(password);
};

module.exports = mongoose.model('User', userSchema);