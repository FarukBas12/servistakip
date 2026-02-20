const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        return res.status(400).json({ message: errorMessage });
    }
    next();
};

const schemas = {
    createTask: Joi.object({
        title: Joi.string().min(3).required().messages({
            'string.empty': 'Başlık boş olamaz.',
            'string.min': 'Başlık en az 3 karakter olmalıdır.',
            'any.required': 'Başlık zorunludur.'
        }),
        description: Joi.string().allow('', null),
        address: Joi.string().required().messages({
            'any.required': 'Adres zorunludur.'
        }),
        maps_link: Joi.string().uri().allow('', null),
        due_date: Joi.date().iso().allow(null),
        assigned_to: Joi.alternatives().try(
            Joi.array().items(Joi.number()),
            Joi.number()
        ).allow(null),
        lat: Joi.number().allow(null),
        lng: Joi.number().allow(null),
        region: Joi.string().allow('', null)
    }),
    updateTask: Joi.object({
        title: Joi.string().min(3),
        description: Joi.string().allow('', null),
        address: Joi.string(),
        maps_link: Joi.string().uri().allow('', null),
        due_date: Joi.date().iso().allow(null),
        status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
        assigned_to: Joi.alternatives().try(
            Joi.array().items(Joi.number()),
            Joi.number()
        ).allow(null),
        region: Joi.string().allow('', null),
        service_form_no: Joi.string().allow('', null),
        is_quoted: Joi.boolean()
    })
};

module.exports = {
    validate,
    schemas
};
