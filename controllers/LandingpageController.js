const Feedback = require('../models/Feedback');

module.exports.testimonials_get = async (req, res) => {
    try {
        const testimonials = await Feedback.find({ testimonial: true });
        if (testimonials){
            res.status(200).json({ testimonials });
        }
        else{
            res.status(404).json({ message: 'No testimonials found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}