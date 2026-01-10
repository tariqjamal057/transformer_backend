const paginate = (data, page, pageSize) => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
  
    const items = data.slice(startIndex, endIndex);
  
    return {
      items,
      totalPages,
      currentPage: page,
      totalItems,
    };
  };
  
  module.exports = { paginate };
  