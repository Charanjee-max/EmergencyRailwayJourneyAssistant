const Joi = require("joi");
const mongoose = require("mongoose");


// =========================================================
// GET NOTIFICATIONS
// =========================================================

const getNotificationsValidation = (data) => {

    const schema = Joi.object({
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(50),
    }).unknown(false);


    return schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
    });
};


// =========================================================
// NOTIFICATION ID
// =========================================================

const notificationIdValidation = (id) => {

    if (
        !id ||
        !mongoose.isValidObjectId(id)
    ) {
        return {
            error: {
                message: "Invalid notification ID.",
            },
        };
    }


    return {
        value: id,
    };
};


module.exports = {
    getNotificationsValidation,
    notificationIdValidation,
};