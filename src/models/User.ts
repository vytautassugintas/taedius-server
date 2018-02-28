import mongoose from 'mongoose';
import bcrypt from 'bcrypt-nodejs';
import crypto from 'crypto';

export type UserModel = mongoose.Document & {
    email: string,
    password: string,

    profile: {
        name: string
    }
};

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,

    profile: {
        name: String
    }
}, { timestamps: true });

userSchema.pre('save', function save(next) {
    const user = this;
    if (!user.isModified('password')) { return next(); }
        bcrypt.genSalt(10, (err, salt) => {
            if (err) { return next(err); }
            bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
                if (err) { return next(err); }
                user.password = hash;
                next();
        });
    });
});

userSchema.methods.comparePassword = function (candidatePassword: string, cb: (err: any, isMatch: any) => {}) {
    bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
        cb(err, isMatch);
    });
};

const User = mongoose.model('User', userSchema);
export default User;