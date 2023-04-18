const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

const adminSchema = new mongoose.Schema({
    username: {
        type: String
    },
    password:{
        type: String
    }
})

adminSchema.pre('save', async function(next) {
    const salt = await bcrypt.genSalt();
    this.password = bcrypt.hash(this.password, salt);
    next();
});



const Admin = mongoose.model('admin', adminSchema);

module.exports = Admin;