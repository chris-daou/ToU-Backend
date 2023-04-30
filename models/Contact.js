const mongoose = require('mongoose');

const ContactFromSchema = new mongoose.Schema({
    email:{
        type: String
    },
    team:{
        type: String
    },
    subject:{
        type: String
    },
    message:{
        type: String
    }


})

const ContactForm = mongoose.model('contact', ContactFromSchema);

module.exports = ContactForm;