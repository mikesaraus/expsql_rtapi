module.exports = {
  /**
   * Number to money format with comma and decimal limiter
   * @param {number | string} num to format
   * @param {{style: 'decimal', minimumFractionDigits: number}?} params format options
   */
  formatMoney: (
    num,
    params = { style: "decimal", minimumFractionDigits: 2 }
  ) => {
    return isNaN(num)
      ? 0
      : Number(
          Number(num).toFixed(params.minimumFractionDigits)
        ).toLocaleString("en-US", params);
  },

  logFilenameFormat: (
    time,
    index = 0,
    options = { ext: "log", end: "file" }
  ) => {
    if (!time) return `${options.end || "file"}.${options.ext || "log"}`;
    const pad = (n) => String(n).padStart(2, 0);
    const yearmonth = time.getFullYear() + "" + pad(time.getMonth() + 1);
    const day = pad(time.getDate());
    const hour = pad(time.getHours());
    const minute = pad(time.getMinutes());
    return `${yearmonth}/${yearmonth}${day}-${hour}${minute}${
      !typeof index === "undefiend" || index === null ? "" : `-${index}`
    }-${options.end || "file"}.${options.ext || "log"}`;
  },
};
