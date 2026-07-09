export const getPagination = (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const getFiltering = (req, allowedFields = []) => {
  const filters = {};
  allowedFields.forEach(field => {
    if (req.query[field]) filters[field] = req.query[field];
  });
  return filters;
};

export const getSearchTerm = (req) => {
  return req.query.search ? `%${req.query.search}%` : null;
};
