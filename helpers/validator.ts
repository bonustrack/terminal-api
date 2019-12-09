import BaseJoi from '@hapi/joi';
import JoinPhoneNumber from 'joi-phone-number';
const Joi = BaseJoi.extend(JoinPhoneNumber);

const schemas = {
  signup: Joi.object().keys({
    name: Joi.string().trim().required(),
    email: Joi.string().email({ tlds: false }).trim().required(),
    phone: Joi.string().phoneNumber({ defaultCountry: 'TH', format: 'e164' }).required()
  })
};

export default schemas;
