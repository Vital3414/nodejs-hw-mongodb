export const validateBody = (schema) => async (req, res, next) => {
  try {
    await schema.validateAsync(req.body, {
      abortEarly: false,
    });
    next();
  } catch (err) {
    const errorMessages = err.details.map((detail) => detail.message);
    return res
      .status(400)
      .json({ message: 'Validation error', errors: errorMessages });
  }
};
