const _ = process.env;

module.exports = {
  publicDetails: (req, res) => {
    let result = {
      name: _.COMPANY_NAME,
      short: _.COMPANY_NAME_SHORT,
      url: _.COMPANY_WEBSITE,
      brand: {
        color: {
          primary: _.COMPANY_COLOR_PRIMARY,
        },
      },
    };
    return res.json(result);
  },
};
