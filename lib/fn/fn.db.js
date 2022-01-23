const { init } = require("express/lib/application");

module.exports = {
  errorJsonResponse: (
    errorObj,
    customMessage = undefined,
    customErrCode = undefined
  ) => {
    let response = {
      success: 0,
      error: {
        code: customErrCode
          ? customErrCode
          : errorObj
          ? errorObj.code
          : undefined,
        message: customMessage
          ? customMessage
          : errorObj && typeof errorObj === "object"
          ? errorObj.hint || errorObj.detail || errorObj.message
          : errorObj
          ? errorObj
          : undefined,
      },
    };
    console.error(errorObj ? errorObj : "Custom Error Response");
    console.error(response);
    return response;
  },

  hideSomeColumns: (
    hidden_columnsArray,
    jsonObject,
    columnsInArray = false
  ) => {
    if (jsonObject && hidden_columnsArray && hidden_columnsArray.length) {
      hidden_columnsArray.forEach((col) => {
        if (columnsInArray) {
          jsonObject.forEach((c, i) => {
            if (jsonObject[i][col]) jsonObject[i][col] = undefined;
          });
        } else {
          if (jsonObject[col]) jsonObject[col] = undefined;
        }
      });
    }
    if (hidden_columnsArray)
      console.log("Hidden columns:", hidden_columnsArray);
    return jsonObject;
  },

  queryVars2Vals: (textQuery, arrayVals) => {
    arrayVals.forEach((val, i) => {
      textQuery = textQuery.includes(`=$${i + 1}`)
        ? textQuery.replace(
            `=$${i + 1}`,
            val
              ? isNaN(val)
                ? `='${val}'`
                : val.valueOf() == 0 && val !== 0
                ? `=''`
                : `= ${val}`
              : `=''`
          )
        : textQuery.includes(` $${i + 1}`)
        ? textQuery.replace(
            ` $${i + 1}`,
            val
              ? isNaN(val)
                ? ` '${val}'`
                : val.valueOf() == 0 && val !== 0
                ? `''`
                : ` ${val}`
              : `''`
          )
        : textQuery.replace(`$${i + 1}`, isNaN(val) ? `'${val}'` : val);
    });
    return textQuery;
  },

  queryConditioner: (objData, columnsData) => {
    let query_cond = [],
      query_vals = [],
      query_endstement = [];
    columnsData.forEach((column) => {
      if (
        column &&
        typeof column === "object" &&
        column.name &&
        column.category &&
        column.type
      ) {
        let col = column.name;
        if (objData[col]) {
          const __strv = String(objData[col]);
          if (__strv.startsWith(":like:")) {
            column.cond = "LIKE";
            objData[col] = __strv.replace(":like:", "");
          } else if (__strv.startsWith(":notlike:")) {
            column.cond = "NOT LIKE";
            objData[col] = __strv.replace(":notlike:", "");
          } else if (__strv.startsWith(":is:")) {
            column.cond = "IS";
            objData[col] = __strv.replace(":is:", "");
          } else if (__strv.startsWith(":isnot:")) {
            column.cond = "IS NOT";
            objData[col] = __strv.replace(":isnot:", "");
          } else {
            column.cond = undefined;
          }
        }
        if (objData[col]) {
          colArray = {
            cond: objData[col].includes("~~") ? "AND" : "OR",
            obj: objData[col].includes("~~")
              ? objData[col].split("~~")
              : objData[col].split("||"),
          };
          let _andor_cond = [];
          let _andor_vals = [];
          colArray.obj.forEach((v) => {
            if (_andor_vals.indexOf(v) === -1) {
              if (
                column.cond &&
                ((v.valueOf() == 0 && v !== 0) ||
                  v.toLowerCase() == "null" ||
                  v == "")
              ) {
                _andor_cond.push(`${col} ${column.cond} NULL`);
              } else if (column.category != "date") {
                _andor_cond.push(
                  `${col} ${column.cond ? column.cond : "="} $${
                    query_vals.length + _andor_vals.length + 1
                  }`
                );
                _andor_vals.push(v);
              } else {
                // Between Date Range (::) as Date Separator
                const _datestr = v.split("::");
                const _nfdate = new Date();
                let from = new Date(_datestr[0]);
                let to =
                  _datestr.length > 1 ? new Date(_datestr[1]) : new Date();
                from = from.isValid()
                  ? from.getSecSinceMidnight() == 0
                    ? from.setHours(from.getUTCHours()) && from
                    : from
                  : _nfdate.setHours(0, 0, 0, 0) && _nfdate;
                to = to.isValid()
                  ? to.getSecSinceMidnight() == 0
                    ? to.setHours(to.getUTCHours()) && to
                    : to
                  : new Date();
                _andor_cond.push(
                  `${col} BETWEEN $${query_vals.length + 1} AND $${
                    query_vals.length + 2
                  }`
                );
                _andor_vals.push(from > to ? to : from, from > to ? from : to);
              }
            }
          });
          query_cond.push(_andor_cond.join(` ${colArray.cond} `));
          query_vals = query_vals.concat(_andor_vals);
        }
      }
    });
    // End Statement
    if (objData.pg_query.toLowerCase().startsWith("select")) {
      let _endKeys = ["LIMIT", "OFFSET"];
      _endKeys.forEach((val) => {
        v = val.toLowerCase().replaceAll(" ", "");
        if (objData[v]) {
          query_endstement.push(`${val.toUpperCase()} ${objData[v]}`);
        }
      });
      if (objData.groupby) {
        query_endstement.push(
          `GROUP BY ${objData.groupby.split("||").join(", ")}`
        );
      }
      if (objData.orderby) {
        query_endstement.push(
          `ORDER BY ${
            (objData.orderby.valueOf() == 0 && objData.orderby !== 0) ||
            objData.orderby == ""
              ? "id"
              : objData.orderby
          } ${
            objData.reverse == "true" ||
            (objData.orderby.valueOf() == 0 && objData.orderby !== 0) ||
            objData.reverse == ""
              ? "DESC"
              : "ASC"
          }`
        );
      }
    }
    return { query_cond, query_endstement, query_vals };
  },
};
