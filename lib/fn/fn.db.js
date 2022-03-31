module.exports = {
  /**
   * Get all tables config from DotENV (.env)
   */
  availableTables: () => {
    let tables = []
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('DBTBL_')) {
        tables.push(process.env[key])
      }
    })
    return tables
  },

  /**
   * Generate json response format for all error
   * Log the error and reponse on console
   *
   * @param {{ code?: string | number, hint?: string,
   *          detail?: string, message?: string } | string} errorObj Error object or string
   */
  errorJsonResponse: (errorObj) => {
    let response = {
      success: 0,
      error: {
        code: errorObj ? errorObj.code : undefined,
        message:
          errorObj && typeof errorObj === 'object'
            ? errorObj.hint || errorObj.detail || errorObj.message
            : errorObj
            ? errorObj
            : undefined,
      },
    }
    console.error(JSON.stringify(response))
    return response
  },

  /**
   * Hide some keys from an object.
   * Useful for returning limited data for user with limited permission
   * or hidding passwords and other sensitive columns
   *
   * @param {string[]} hidden_columnsArray      List of keys to hide / remove
   * @param {{}} jsonObject                     Object to update
   * @param {{log?: boolean}?} options          function options
   */
  hideSomeColumns: (hidden_columnsArray, jsonObject, options = { log: false }) => {
    if (jsonObject && hidden_columnsArray && hidden_columnsArray.length) {
      hidden_columnsArray.forEach((col) => {
        if (Array.isArray(jsonObject)) {
          jsonObject.forEach((c, i) => {
            if (jsonObject[i][col]) jsonObject[i][col] = undefined
          })
        } else {
          if (jsonObject[col]) jsonObject[col] = undefined
        }
      })
    }
    if (hidden_columnsArray && options && options.log)
      console.log('Hidden columns:', JSON.stringify(hidden_columnsArray))
    return jsonObject
  },

  /**
   * Update query variables to the exact query values
   *
   * @param {string} textQuery       Query string with $1, $2, etc... to replace with query values
   * @param {string[]} arrayVals     Query values to replace query strings $1, $2, etc...
   */
  queryVars2Vals: (textQuery, arrayVals) => {
    if (!arrayVals) arrayVals = []
    arrayVals.forEach((val, i) => {
      textQuery = textQuery.includes(`=$${i + 1}`)
        ? textQuery.replace(
            `=$${i + 1}`,
            val ? (isNaN(val) ? `='${val}'` : val.valueOf() == 0 && val !== 0 ? `=''` : `= ${val}`) : `=''`
          )
        : textQuery.includes(` $${i + 1}`)
        ? textQuery.replace(
            ` $${i + 1}`,
            val ? (isNaN(val) ? ` '${val}'` : val.valueOf() == 0 && val !== 0 ? `''` : ` ${val}`) : `''`
          )
        : textQuery.replace(`$${i + 1}`, isNaN(val) ? `'${val}'` : val)
    })
    return textQuery
  },

  /**
   * SQL query conditions.
   * Generate conditions for query each column specified on `objData`
   * Make sure column name given matches from `columnsData` if not will be *ignore*
   *
   * @param {{}} objData                                                      Object for conditions
   * @param {[{name: string, category: string, type: string,
   *           notnull?: boolean, unique?: boolean, primarykey?: boolean,
   *            cond?: string }]} columnsData                                 Table columns: database structured
   */
  queryConditioner: (objData, columnsData) => {
    let query_cond = [],
      query_vals = [],
      query_endstement = []

    // Loop all columns data to match with query data
    columnsData.forEach((column) => {
      // Verify all requirements
      if (column && typeof column === 'object' && column.name && column.category && column.type) {
        /**
         * Column name of the table
         */
        let col = column.name
        // Check if column is in query
        if (objData[col]) {
          /**
           * The request query of the column
           *
           * Checking if condition is specified
           */
          const __strv = String(objData[col])
          if (__strv.startsWith(':like:')) {
            column.cond = 'LIKE'
            objData[col] = __strv.replace(':like:', '')
          } else if (__strv.startsWith(':notlike:')) {
            column.cond = 'NOT LIKE'
            objData[col] = __strv.replace(':notlike:', '')
          } else if (__strv.startsWith(':is:')) {
            column.cond = 'IS'
            objData[col] = __strv.replace(':is:', '')
          } else if (__strv.startsWith(':isnot:')) {
            column.cond = 'IS NOT'
            objData[col] = __strv.replace(':isnot:', '')
          } else {
            column.cond = undefined
          }
        }
        if (objData[col]) {
          /**
           * Columns information
           */
          const colArray = {
            /**
             * The query connector for multiple conditions
             */
            cond: String(objData[col]).includes('~~') ? 'AND' : 'OR',
            /**
             * An array list of conditions
             */
            obj: String(objData[col]).includes('~~')
              ? String(objData[col]).split('~~')
              : String(objData[col]).split('||'),
          }
          /**
           * Query Conditions for and multiple value check in a column
           */
          let _andor_cond = []
          /**
           * Query Values for and multiple value check in a column
           */
          let _andor_vals = []
          // Loop list of condition for this column
          colArray.obj.forEach((v) => {
            // Check if conditions already exist
            // No duplicate
            if (_andor_vals.indexOf(v) === -1) {
              if (column.cond && ((v.valueOf() == 0 && v !== 0) || v.toLowerCase() == 'null' || v == '')) {
                // condition is using sql keywords
                _andor_cond.push(`${col} ${column.cond} NULL`)
              } else if (column.category != 'date') {
                // column type is not a date condition is directly match
                _andor_cond.push(
                  `${col}${column.cond ? ' ' + column.cond + ' ' : '='}$${query_vals.length + _andor_vals.length + 1}`
                )
                _andor_vals.push(v)
              } else {
                // column type is a date
                // Between Date Range (::) as Date Separator
                /**
                 * Array list of date in the query
                 */
                const _datestr = v.split('::')
                /** Instance of Date Today */
                const _nfdate = new Date()
                /**
                 * Condition Date Range From
                 */
                let from = new Date(isNaN(_datestr[0]) ? _datestr[0] : Number(_datestr[0]))
                from = from.isValid() ? from : _nfdate.setHours(0, 0, 0, 0) && _nfdate
                /**
                 *  Condition Date Range to
                 */
                let to =
                  _datestr.length > 1
                    ? new Date(isNaN(_datestr[1]) ? _datestr[1] : Number(_datestr[1]))
                    : new Date(new Date(from).setHours(24, 0, 0, 0))
                to = to.isValid() ? to : new Date()
                // If same date date to should be +24 hours
                if (to.getTime() === from.getTime()) to = new Date(new Date(from).setHours(24, 0, 0, 0))
                /**
                 * Date range from
                 *
                 * Already checked if from is greater than to then from will use to value
                 */
                const res_from = from > to ? to : from
                /**
                 * Date range to
                 *
                 * Already checked if from is greater than to then from will use from value
                 */
                const res_to = from > to ? from : to
                // local push condition statement
                _andor_cond.push(
                  `${col} BETWEEN $${query_vals.length + _andor_vals.length + 1} AND $${
                    query_vals.length + _andor_vals.length + 2
                  }`
                )
                // local push condition values
                _andor_vals.push(res_from, res_to)
              }
            }
          })
          // join all conditions
          query_cond.push(
            colArray.cond == 'OR'
              ? // Isolate Or condition
                '(' + _andor_cond.join(` ${colArray.cond} `) + ')'
              : _andor_cond.join(` ${colArray.cond} `)
          )
          // join all condition values
          query_vals.push(..._andor_vals)
        }
      }
    })
    // End Statement
    if (objData.pg_query.toLowerCase().startsWith('select')) {
      if (objData.groupby) {
        query_endstement.push(`GROUP BY ${objData.groupby.split('||').join(', ')}`)
      }
      if (objData.orderby) {
        query_endstement.push(
          `ORDER BY ${
            (objData.orderby.valueOf() == 0 && objData.orderby !== 0) || objData.orderby == '' ? 'id' : objData.orderby
          } ${
            objData.reverse == 'true' ||
            (objData.orderby.valueOf() == 0 && objData.orderby !== 0) ||
            objData.reverse == ''
              ? 'DESC'
              : 'ASC'
          }`
        )
      }
      let _endKeys = ['LIMIT', 'OFFSET']
      _endKeys.forEach((val) => {
        v = val.toLowerCase().replaceAll(' ', '')
        if (objData[v]) {
          query_endstement.push(`${val.toUpperCase()} ${objData[v]}`)
        }
      })
    }
    return { query_cond, query_endstement, query_vals }
  },
}
